import * as XLSX from "xlsx";
import type { FormCriteriaItem, FormTemplate, InspectionScore } from "../src/lib/types";

export function buildFormBasedReportWorkbook({
  formTemplate,
  criteriaItems,
  scores
}: {
  formTemplate: FormTemplate;
  criteriaItems: FormCriteriaItem[];
  scores: InspectionScore[];
}) {
  const workbook = XLSX.utils.book_new();
  const scoreByCriteria = new Map(scores.map((score) => [score.formCriteriaItemId, score]));

  const detailRows = criteriaItems.map((criteria) => {
    const score = scoreByCriteria.get(criteria.id);
    return {
      STT: criteria.order,
      "Mã nhóm": criteria.groupCode,
      "Nhóm nội dung": criteria.groupName,
      "Nội dung kiểm tra": criteria.content,
      "Minh chứng cần xem": criteria.evidenceRequired,
      "Điểm tối đa": criteria.maxScore,
      "Điểm đạt": score?.score ?? "",
      "Tỷ lệ đạt": score ? `${score.ratio}%` : "",
      "Phát hiện/tồn tại": score?.finding ?? score?.deductionReason ?? "",
      "Yêu cầu khắc phục": score?.correctionRequest ?? "",
      "Thời hạn": score?.dueDate ?? "",
      "Bộ phận chịu trách nhiệm": score?.responsibleDepartment ?? "",
      "Người chịu trách nhiệm": score?.responsiblePerson ?? "",
      "Trạng thái CAPA": score?.capaStatus ?? "",
      "Mức độ nguy cơ": score?.riskLevel ?? "",
      "Ghi chú": score?.note ?? ""
    };
  });

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        "Tên phiếu": formTemplate.name,
        "Đơn vị được kiểm tra": formTemplate.departmentName,
        "Đoàn kiểm tra": formTemplate.inspectionTeam,
        "File nguồn": formTemplate.sourceFile,
        "Sheet nguồn": formTemplate.sourceSheet,
        "Phiên bản": formTemplate.version
      }
    ]),
    "PHIEU_CHI_TIET"
  );
  XLSX.utils.sheet_add_json(workbook.Sheets.PHIEU_CHI_TIET, detailRows, { origin: "A4" });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows), "CHI_TIET_TIEU_CHI");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(detailRows.filter((row) => Number(row["Điểm đạt"]) < Number(row["Điểm tối đa"]))),
    "CHI_TIET_LOI"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(detailRows.filter((row) => ["Cao", "Nghiêm trọng"].includes(String(row["Mức độ nguy cơ"])))),
    "LOI_NGUY_CO_CAO"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(detailRows.filter((row) => row["Yêu cầu khắc phục"])),
    "CAPA"
  );

  return workbook;
}
