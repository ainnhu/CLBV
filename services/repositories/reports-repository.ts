import * as XLSX from "xlsx";
import { formCriteriaItems, formTemplates, inspectionScores, sampleFormTemplate } from "../../src/lib/mock-data";
import type { FormCriteriaItem, FormTemplate, InspectionScore } from "../../src/lib/types";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry, toAuditLogRow } from "../audit-log";
import { buildFormBasedReportWorkbook } from "../../export/report-export";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";
import { getFormTemplateWithCriteria } from "./forms-repository";

type DbInspectionScore = {
  id: string;
  inspection_form_id: string;
  form_criteria_item_id: string;
  assigned_user_id: string | null;
  max_score: number;
  score: number;
  score_ratio: number;
  deduction_reason: string | null;
  finding: string | null;
  evidence_text: string | null;
  risk_level: string;
  correction_request: string | null;
  responsible_department: string | null;
  responsible_person: string | null;
  due_date: string | null;
  capa_status: string;
  note: string | null;
  updated_at: string;
};

export async function exportFormReport(user: SessionUser | null, formTemplateId?: string) {
  assertCanWrite(user, "report:export");

  const { formTemplate, criteriaItems, scores, mode } = await loadReportData(formTemplateId);
  const workbook = buildFormBasedReportWorkbook({ formTemplate, criteriaItems, scores });
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  const fileName = `bao-cao-${formTemplate.departmentCode}-${formTemplate.inspectionTeam}.xlsx`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .toLowerCase();

  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "report:export",
    module: "Báo cáo Excel",
    entityType: "form_templates",
    entityId: formTemplate.id,
    newValue: {
      fileName,
      sourceFile: formTemplate.sourceFile,
      sourceSheet: formTemplate.sourceSheet,
      sheetCount: workbook.SheetNames.length,
      criteriaItems: criteriaItems.length,
      scores: scores.length
    }
  });

  if (getSupabaseMode() === "supabase") {
    const [report] = await supabaseRest.insert<Array<{ id: string }>>("report_exports", {
      report_scope: "form_template",
      status: "exported",
      file_name: fileName,
      storage_path: `report-exports/${fileName}`,
      download_url: "",
      exported_by: user?.id,
      exported_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      summary_json: auditLog.newValue ?? {}
    });

    if (report?.id) {
      await supabaseRest.insert("report_files", {
        report_export_id: report.id,
        file_name: fileName,
        storage_path: `report-exports/${fileName}`,
        download_url: "",
        created_by: user?.id
      });
    }

    await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));
  }

  return { buffer, fileName, auditLog, mode };
}

async function loadReportData(formTemplateId?: string): Promise<{
  mode: "mock" | "supabase";
  formTemplate: FormTemplate;
  criteriaItems: FormCriteriaItem[];
  scores: InspectionScore[];
}> {
  if (getSupabaseMode() === "mock") {
    const formTemplate = (formTemplates.find((template) => template.id === formTemplateId) ?? sampleFormTemplate) as FormTemplate;
    return {
      mode: "mock",
      formTemplate,
      criteriaItems: formCriteriaItems.filter((item) => item.formTemplateId === formTemplate.id),
      scores: inspectionScores
    };
  }

  const forms = await getFormTemplateWithCriteria(formTemplateId ?? "");
  if (!forms.template) {
    throw new Error("Không tìm thấy mẫu phiếu để xuất báo cáo.");
  }

  const criteriaIds = forms.criteria.map((item) => item.id);
  const rows = criteriaIds.length
    ? await supabaseRest.select<DbInspectionScore[]>("inspection_scores", {
        select: "*",
        form_criteria_item_id: `in.(${criteriaIds.join(",")})`
      }).catch(() => [] as DbInspectionScore[])
    : [];

  return {
    mode: "supabase",
    formTemplate: forms.template,
    criteriaItems: forms.criteria,
    scores: rows.map(mapScore)
  };
}

function mapScore(row: DbInspectionScore): InspectionScore {
  return {
    id: row.id,
    inspectionFormId: row.inspection_form_id,
    formCriteriaItemId: row.form_criteria_item_id,
    assignedUserId: row.assigned_user_id ?? "",
    maxScore: Number(row.max_score),
    score: Number(row.score),
    ratio: Number(row.score_ratio),
    deductionReason: row.deduction_reason ?? "",
    finding: row.finding ?? "",
    evidenceText: row.evidence_text ?? "",
    riskLevel: mapRiskLevel(row.risk_level),
    correctionRequest: row.correction_request ?? "",
    responsibleDepartment: row.responsible_department ?? "",
    responsiblePerson: row.responsible_person ?? "",
    dueDate: row.due_date ?? "",
    capaStatus: mapCapaStatus(row.capa_status),
    note: row.note ?? "",
    updatedAt: row.updated_at
  };
}

function mapRiskLevel(value: string): InspectionScore["riskLevel"] {
  if (value === "cao") return "Cao";
  if (value === "nghiem_trong") return "Nghiêm trọng";
  if (value === "trung_binh") return "Trung bình";
  if (value === "thap") return "Thấp";
  return "Không";
}

function mapCapaStatus(value: string): InspectionScore["capaStatus"] {
  if (value === "chua_thuc_hien") return "Chưa thực hiện";
  if (value === "dang_thuc_hien") return "Đang thực hiện";
  if (value === "da_hoan_thanh") return "Đã hoàn thành";
  if (value === "qua_han") return "Quá hạn";
  return "Không áp dụng";
}
