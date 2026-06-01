import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api-json";
import { assertCanWrite } from "../../../../services/access-control";
import { updatePeriodStatus } from "../../../../services/repositories/periods-repository";

type PeriodAction = "close" | "lock" | "unlock";

type PeriodActionPayload = {
  periodId?: unknown;
  action?: unknown;
  reason?: unknown;
};

const periodActions = new Set<PeriodAction>(["close", "lock", "unlock"]);

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "period:close");

    const payload = await readJsonBody(request);
    if (!payload.ok) {
      return payload.response;
    }

    const validated = validatePeriodActionPayload(payload.data as PeriodActionPayload);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.errors.join(" ") }, { status: 422 });
    }

    const result = await updatePeriodStatus(user, validated.data);

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

function validatePeriodActionPayload(payload: PeriodActionPayload): {
  ok: true;
  data: { periodId: string; action: PeriodAction; reason?: string };
} | {
  ok: false;
  errors: string[];
} {
  const errors: string[] = [];
  const periodId = textValue(payload.periodId);
  const action = textValue(payload.action);
  const reason = textValue(payload.reason);

  if (!periodId) {
    errors.push("Kỳ kiểm tra không được để trống.");
  }
  if (!periodActions.has(action as PeriodAction)) {
    errors.push("Hành động kỳ kiểm tra không hợp lệ.");
  }
  if (action === "unlock" && !reason) {
    errors.push("Mở khóa kỳ kiểm tra phải nhập lý do.");
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      periodId,
      action: action as PeriodAction,
      reason
    }
  };
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}
