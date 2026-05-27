import { auditPeriods, auditSchedule, formTemplates } from "../../src/lib/mock-data";
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

type DbInspectionSession = {
  id: string;
  inspection_date: string;
  block_type: string;
  form_type: string;
  status: string;
  created_at: string;
  departments?: {
    name?: string | null;
    block_type?: string | null;
  } | null;
  inspection_teams?: {
    name?: string | null;
  } | null;
  audit_periods?: {
    month?: number | null;
    quarter?: number | null;
    year?: number | null;
    status?: string | null;
  } | null;
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

export async function listPublicInspectionSessions() {
  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      weeklySchedule: auditSchedule,
      sessions: auditSchedule.flatMap((row) => [
        ...row.team1ClinicalDepartments.map((departmentName) => ({
          id: `${row.id}-team1-${departmentName}`,
          inspectionDate: row.auditDate,
          inspectionTeam: "Đoàn 01",
          departmentName,
          blockType: "Lâm sàng",
          status: "dự kiến",
          note: row.note
        })),
        {
          id: `${row.id}-team1-support`,
          inspectionDate: row.auditDate,
          inspectionTeam: "Đoàn 01",
          departmentName: row.team1SupportDepartment,
          blockType: "Hành chính/Cận lâm sàng",
          status: "dự kiến",
          note: row.note
        },
        ...row.team2ClinicalDepartments.map((departmentName) => ({
          id: `${row.id}-team2-${departmentName}`,
          inspectionDate: row.auditDate,
          inspectionTeam: "Đoàn 02",
          departmentName,
          blockType: "Lâm sàng",
          status: "dự kiến",
          note: row.note
        })),
        {
          id: `${row.id}-team2-support`,
          inspectionDate: row.auditDate,
          inspectionTeam: "Đoàn 02",
          departmentName: row.team2SupportDepartment,
          blockType: "Hành chính/Cận lâm sàng",
          status: "dự kiến",
          note: row.note
        }
      ])
    };
  }

  const rows = await supabaseRest.select<DbInspectionSession[]>("inspection_sessions", {
    select: "id,inspection_date,block_type,form_type,status,created_at,departments(name,block_type),inspection_teams(name),audit_periods(month,quarter,year,status)",
    order: "inspection_date.asc"
  });

  return {
    mode: "supabase" as const,
    sessions: rows.map((row) => ({
      id: row.id,
      inspectionDate: row.inspection_date,
      inspectionTeam: row.inspection_teams?.name ?? "",
      departmentName: row.departments?.name ?? "",
      blockType: blockLabel(row.block_type),
      formType: row.form_type,
      status: row.status,
      month: row.audit_periods?.month ?? null,
      quarter: row.audit_periods?.quarter ?? null,
      year: row.audit_periods?.year ?? null,
      periodStatus: row.audit_periods?.status ?? "",
      createdAt: row.created_at
    }))
  };
}

function blockLabel(value?: string | null) {
  if (value === "administrative") return "Hành chính";
  if (value === "paraclinical") return "Cận lâm sàng";
  return "Lâm sàng";
}
