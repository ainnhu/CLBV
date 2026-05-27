import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api-json";
import { createInspectionSession } from "../../../../services/repositories/sessions-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    const payload = await readJsonBody(request);
    if (!payload.ok) {
      return payload.response;
    }
    const result = await createInspectionSession(user, payload.data as Parameters<typeof createInspectionSession>[1]);

    return NextResponse.json({
      status: "accepted",
      mode: result.mode,
      message: "Đã tạo phiên kiểm tra và phiếu chấm từ mẫu phiếu nguồn.",
      session: result.session,
      form: result.form,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tạo được phiên kiểm tra.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
