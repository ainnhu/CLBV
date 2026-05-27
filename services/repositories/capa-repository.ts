import { inspectionScores } from "../../src/lib/mock-data";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry, toAuditLogRow } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

export type UpdateCapaInput = {
  inspectionScoreId: string;
  status: string;
  updateContent: string;
  evidenceUrl?: string;
};

type DbInspectionScoreCapa = {
  id: string;
  finding: string | null;
  correction_request: string | null;
  responsible_department: string | null;
  responsible_person: string | null;
  due_date: string | null;
  capa_status: string;
  risk_level: string;
  updated_at: string;
  form_criteria_items?: {
    group_name?: string | null;
    content?: string | null;
    department_name?: string | null;
    inspection_team_name?: string | null;
    source_sheet?: string | null;
  } | null;
};

const allowedStatuses = ["Chưa thực hiện", "Đang thực hiện", "Đã hoàn thành", "Quá hạn", "Không áp dụng"];

export async function updateCapa(user: SessionUser | null, input: UpdateCapaInput) {
  assertCanWrite(user, "capa:update");
  const score = inspectionScores.find((item) => item.id === input.inspectionScoreId);

  if (!allowedStatuses.includes(input.status)) {
    throw new Error("Trạng thái CAPA không hợp lệ.");
  }
  if (!input.updateContent.trim()) {
    throw new Error("Vui lòng nhập nội dung cập nhật khắc phục.");
  }

  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "capa:update",
    module: "CAPA",
    entityType: "inspection_scores",
    entityId: input.inspectionScoreId,
    oldValue: { capaStatus: score?.capaStatus ?? "" },
    newValue: input
  });

  if (getSupabaseMode() === "supabase") {
    const [saved] = await supabaseRest.insert<Record<string, unknown>[]>("capa_updates", {
      inspection_score_id: input.inspectionScoreId,
      status: mapCapaStatus(input.status),
      update_content: input.updateContent,
      evidence_url: input.evidenceUrl ?? "",
      updated_by: user?.id
    });
    await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));
    return { mode: "supabase" as const, saved, auditLog };
  }

  return {
    mode: "mock" as const,
    saved: {
      inspectionScoreId: input.inspectionScoreId,
      previousStatus: score?.capaStatus ?? "",
      nextStatus: input.status,
      updateContent: input.updateContent,
      evidenceUrl: input.evidenceUrl ?? ""
    },
    auditLog
  };
}

export async function listPublicCapaItems() {
  if (getSupabaseMode() === "mock") {
    return inspectionScores
      .filter((score) => score.capaStatus !== "Không áp dụng" || score.correctionRequest || score.finding)
      .map((score) => ({
        id: score.id,
        inspectionScoreId: score.id,
        finding: score.finding,
        correctionRequest: score.correctionRequest,
        responsibleDepartment: score.responsibleDepartment,
        responsiblePerson: score.responsiblePerson,
        dueDate: score.dueDate,
        capaStatus: score.capaStatus,
        riskLevel: score.riskLevel,
        updatedAt: score.updatedAt,
        dataSource: "mock"
      }));
  }

  const rows = await supabaseRest.select<DbInspectionScoreCapa[]>("inspection_scores", {
    select: "id,finding,correction_request,responsible_department,responsible_person,due_date,capa_status,risk_level,updated_at,form_criteria_items(group_name,content,department_name,inspection_team_name,source_sheet)",
    order: "due_date.asc"
  });

  return rows
    .filter((row) => row.capa_status !== "khong_ap_dung" || Boolean(row.correction_request) || Boolean(row.finding))
    .map((row) => ({
      id: row.id,
      inspectionScoreId: row.id,
      departmentName: row.form_criteria_items?.department_name ?? "",
      inspectionTeam: row.form_criteria_items?.inspection_team_name ?? "",
      sourceSheet: row.form_criteria_items?.source_sheet ?? "",
      criteriaGroup: row.form_criteria_items?.group_name ?? "",
      criteriaContent: row.form_criteria_items?.content ?? "",
      finding: row.finding ?? "",
      correctionRequest: row.correction_request ?? "",
      responsibleDepartment: row.responsible_department ?? "",
      responsiblePerson: row.responsible_person ?? "",
      dueDate: row.due_date ?? "",
      capaStatus: unmapCapaStatus(row.capa_status),
      riskLevel: unmapRiskLevel(row.risk_level),
      updatedAt: row.updated_at,
      dataSource: "supabase"
    }));
}

function mapCapaStatus(status: string) {
  if (status === "Chưa thực hiện") return "chua_thuc_hien";
  if (status === "Đang thực hiện") return "dang_thuc_hien";
  if (status === "Đã hoàn thành") return "da_hoan_thanh";
  if (status === "Quá hạn") return "qua_han";
  return "khong_ap_dung";
}

function unmapCapaStatus(status: string) {
  if (status === "chua_thuc_hien") return "Chưa thực hiện";
  if (status === "dang_thuc_hien") return "Đang thực hiện";
  if (status === "da_hoan_thanh") return "Đã hoàn thành";
  if (status === "qua_han") return "Quá hạn";
  return "Không áp dụng";
}

function unmapRiskLevel(value: string) {
  if (value === "cao") return "Cao";
  if (value === "nghiem_trong") return "Nghiêm trọng";
  if (value === "trung_binh") return "Trung bình";
  if (value === "thap") return "Thấp";
  return "Không";
}
