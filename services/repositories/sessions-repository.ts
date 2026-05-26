import { auditPeriods, formTemplates } from "../../src/lib/mock-data";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry, toAuditLogRow } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

type CreateInspectionSessionInput = {
  periodId: string;
  inspectionDate: string;
  inspectionTeamId?: string;
  departmentId?: string;
  formTemplateId: string;
  receptionPerson?: string;
  leaderName?: string;
  startedAt?: string;
  endedAt?: string;
  preliminaryConclusion?: string;
};

type DbFormTemplate = {
  id: string;
  department_id: string;
  block_type: "clinical" | "paraclinical" | "administrative";
  form_type: "LS_CLS" | "HANH_CHINH";
  department_name: string;
  inspection_team_id?: string | null;
  inspection_team_name: string;
};

function validateInput(input: CreateInspectionSessionInput) {
  if (!input.periodId) throw new Error("Thiếu kỳ kiểm tra.");
  if (!input.inspectionDate) throw new Error("Thiếu ngày kiểm tra.");
  if (!input.formTemplateId) throw new Error("Thiếu mẫu phiếu kiểm tra.");
}

export async function createInspectionSession(user: SessionUser | null, input: CreateInspectionSessionInput) {
  assertCanWrite(user, "session:create");
  validateInput(input);

  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "session:create",
    module: "Phiên kiểm tra",
    entityType: "inspection_sessions",
    entityId: input.formTemplateId,
    oldValue: null,
    newValue: input
  });

  if (getSupabaseMode() === "supabase") {
    const [template] = await supabaseRest.select<DbFormTemplate[]>("form_templates", {
      select: "id,department_id,block_type,form_type,department_name,inspection_team_id,inspection_team_name",
      id: `eq.${input.formTemplateId}`,
      is_active: "eq.true",
      limit: 1
    });

    if (!template) {
      throw new Error("Không tìm thấy mẫu phiếu kiểm tra trong Supabase.");
    }

    const [session] = await supabaseRest.insert<Array<{ id: string }>>("inspection_sessions", {
      audit_period_id: input.periodId,
      inspection_date: input.inspectionDate,
      inspection_team_id: input.inspectionTeamId ?? template.inspection_team_id ?? null,
      department_id: input.departmentId ?? template.department_id,
      block_type: template.block_type,
      form_type: template.form_type,
      status: "open",
      created_by: user?.id,
      opened_at: new Date().toISOString()
    });

    const [form] = await supabaseRest.insert<Array<{ id: string }>>("inspection_forms", {
      inspection_session_id: session.id,
      form_template_id: template.id,
      reception_person: input.receptionPerson ?? null,
      leader_name: input.leaderName ?? null,
      started_at: input.startedAt ?? null,
      ended_at: input.endedAt ?? null,
      preliminary_conclusion: input.preliminaryConclusion ?? null,
      status: "open"
    });

    await supabaseRest.insert("audit_logs", toAuditLogRow({ ...auditLog, entityId: session.id }));

    return {
      mode: "supabase" as const,
      session,
      form,
      auditLog: { ...auditLog, entityId: session.id }
    };
  }

  const template = formTemplates.find((item) => item.id === input.formTemplateId) ?? formTemplates[0];
  const period = auditPeriods.find((item) => item.id === input.periodId) ?? auditPeriods[0];

  return {
    mode: "mock" as const,
    session: {
      id: `session-${Date.now()}`,
      periodId: period?.id ?? input.periodId,
      inspectionDate: input.inspectionDate,
      departmentId: input.departmentId ?? template?.departmentId,
      departmentName: template?.departmentName,
      inspectionTeam: template?.inspectionTeam,
      status: "đang mở"
    },
    form: {
      id: `form-${Date.now()}`,
      formTemplateId: template?.id ?? input.formTemplateId,
      status: "đang mở"
    },
    auditLog
  };
}
