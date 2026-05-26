import * as XLSX from "xlsx";
import { formCriteriaItems, formTemplates, inspectionScores, sampleFormTemplate } from "../../src/lib/mock-data";
import type { FormTemplate } from "../../src/lib/types";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry } from "../audit-log";
import { buildFormBasedReportWorkbook } from "../../export/report-export";

export async function exportFormReport(user: SessionUser | null, formTemplateId?: string) {
  assertCanWrite(user, "report:export");

  const formTemplate = (formTemplates.find((template) => template.id === formTemplateId) ?? sampleFormTemplate) as FormTemplate;
  const criteriaItems = formCriteriaItems.filter((item) => item.formTemplateId === formTemplate.id);
  const workbook = buildFormBasedReportWorkbook({
    formTemplate,
    criteriaItems,
    scores: inspectionScores
  });
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
      sheetCount: workbook.SheetNames.length
    }
  });

  return { buffer, fileName, auditLog };
}
