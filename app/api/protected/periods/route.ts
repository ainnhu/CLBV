import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { assertCanWrite } from "../../../../services/access-control";
import { updatePeriodStatus } from "../../../../services/repositories/periods-repository";

type PeriodActionPayload = {
  periodId?: string;
  action?: "close" | "lock" | "unlock";
  reason?: string;
};

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "period:close");
    const payload = (await request.json()) as PeriodActionPayload;

    if (!payload.periodId) {
      return NextResponse.json({ error: "Không tìm thấy kỳ kiểm tra." }, { status: 400 });
    }
    if (!payload.action || !["close", "lock", "unlock"].includes(payload.action)) {
      return NextResponse.json({ error: "Hành động kỳ kiểm tra không hợp lệ." }, { status: 422 });
    }

    const result = await updatePeriodStatus(user, {
      periodId: payload.periodId,
      action: payload.action,
      reason: payload.reason
    });

    return NextResponse.json({
      status: "accepted",
      mode: result.mode,
      message: "Thao tác kỳ kiểm tra hợp lệ.",
      period: result.saved,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền thao tác kỳ kiểm tra.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
