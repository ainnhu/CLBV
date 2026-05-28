import { auditAssignments } from "../../src/lib/mock-data";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry, toAuditLogRow } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

type AssignmentInput = {
  inspectionSessionId: string;
  inspectionTeamId?: string;
  userId: string;
  formCriteriaItemIds: string[];
  departmentId?: string;
  blockType: "clinical" | "paraclinical" | "administrative";
  note?: string;
};

type DbInspectionAssignment = {
  id: string;
  block_type: string;
  note: string | null;
  inspection_sessions?: {
    inspection_date?: string | null;
    status?: string | null;
    departments?: {
      name?: string | null;
    } | null;
  } | null;
  inspection_teams?: {
    name?: string | null;
  } | null;
  profiles?: {
    full_name?: string | null;
    role?: string | null;
  } | null;
  form_criteria_items?: {
    group_code?: string | null;
    group_name?: string | null;
    source_sheet?: string | null;
  } | null;
};

function validateAssignment(input: AssignmentInput) {
  if (!input.inspectionSessionId) throw new Error("Thiếu phiên kiểm tra.");
  if (!input.userId) throw new Error("Thiếu người được phân công.");
  if (!input.formCriteriaItemIds?.length) throw new Error("Thiếu tiêu chí được phân công.");
  if (!["clinical", "paraclinical", "administrative"].includes(input.blockType)) {
    throw new Error("Khối khoa/phòng không hợp lệ.");
  }
}

export async function createInspectionAssignments(user: SessionUser | null, input: AssignmentInput) {
  assertCanWrite(user, "assignment:manage");
  validateAssignment(input);

  const rows = input.formCriteriaItemIds.map((criteriaId) => ({
    inspection_session_id: input.inspectionSessionId,
    inspection_team_id: input.inspectionTeamId ?? null,
    user_id: input.userId,
    form_criteria_item_id: criteriaId,
    department_id: input.departmentId ?? null,
    block_type: input.blockType,
    note: input.note ?? null
  }));

  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "assignment:create",
    module: "Phân công",
    entityType: "inspection_assignments",
    entityId: input.inspectionSessionId,
    oldValue: null,
    newValue: {
      inspectionSessionId: input.inspectionSessionId,
      userId: input.userId,
      criteriaCount: input.formCriteriaItemIds.length,
      note: input.note ?? ""
    }
  });

  if (getSupabaseMode() === "supabase") {
    const saved = await supabaseRest.upsert(
      "inspection_assignments",
      rows,
      "inspection_session_id,user_id,form_criteria_item_id"
    );
    await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));
    return { mode: "supabase" as const, saved, auditLog };
  }

  return {
    mode: "mock" as const,
    saved: {
      existingAssignments: auditAssignments.length,
      insertedOrUpdated: rows.length,
      inspectionSessionId: input.inspectionSessionId,
      userId: input.userId
    },
    auditLog
  };
}

export async function listPublicAssignments() {
  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      assignments: auditAssignments
    };
  }

  const rows = await supabaseRest.select<DbInspectionAssignment[]>("inspection_assignments", {
    select: "id,block_type,note,inspection_sessions(inspection_date,status,departments(name)),inspection_teams(name),profiles(full_name,role),form_criteria_items(group_code,group_name,source_sheet)",
    order: "created_at.desc"
  });

  return {
    mode: "supabase" as const,
    assignments: rows.map((row) => ({
      id: row.id,
      inspectionDate: row.inspection_sessions?.inspection_date ?? "",
      sessionStatus: row.inspection_sessions?.status ?? "",
      inspectionTeam: row.inspection_teams?.name ?? "",
      departmentName: row.inspection_sessions?.departments?.name ?? "",
      assigneeName: row.profiles?.full_name ?? "",
      assigneeRole: row.profiles?.role ?? "",
      blockType: blockLabel(row.block_type),
      criteriaGroupCode: row.form_criteria_items?.group_code ?? "",
      criteriaGroupName: row.form_criteria_items?.group_name ?? "",
      sourceSheet: row.form_criteria_items?.source_sheet ?? "",
      note: row.note ?? ""
    }))
  };
}

function blockLabel(value?: string | null) {
  if (value === "administrative") return "Hành chính";
  if (value === "paraclinical") return "Cận lâm sàng";
  return "Lâm sàng";
}
