import { auditPeriods } from "../../src/lib/mock-data";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

export type PeriodActionInput = {
  periodId: string;
  action: "close" | "lock" | "unlock";
  reason?: string;
};

const nextStatusByAction = {
  close: "đã chốt",
  lock: "đã khóa",
  unlock: "đang mở"
} as const;

const dbStatusByAction = {
  close: "closed",
  lock: "locked",
  unlock: "open"
} as const;

export async function updatePeriodStatus(user: SessionUser | null, input: PeriodActionInput) {
  assertCanWrite(user, input.action === "unlock" ? "period:unlock" : "period:close");

  const period = auditPeriods.find((item) => item.id === input.periodId);
  if (!period) {
    throw new Error("Không tìm thấy kỳ kiểm tra.");
  }
  if (input.action === "unlock" && !input.reason?.trim()) {
    throw new Error("Mở khóa kỳ kiểm tra phải nhập lý do.");
  }

  const nextStatus = nextStatusByAction[input.action];
  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: `period:${input.action}`,
    module: "Kỳ kiểm tra",
    entityType: "audit_periods",
    entityId: input.periodId,
    oldValue: { status: period.status },
    newValue: { status: nextStatus, reason: input.reason ?? "" }
  });

  if (getSupabaseMode() === "supabase") {
    const [saved] = await supabaseRest.update<Record<string, unknown>[]>(
      "audit_periods",
      { id: `eq.${input.periodId}` },
      { status: dbStatusByAction[input.action] }
    );
    await supabaseRest.insert("audit_logs", auditLog);
    return { mode: "supabase" as const, saved, auditLog };
  }

  return {
    mode: "mock" as const,
    saved: {
      id: period.id,
      month: period.month,
      year: period.year,
      previousStatus: period.status,
      nextStatus
    },
    auditLog
  };
}
