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
  const detailRows = buildDetailRows(criteriaItems, scores);
  const summary = buildSummary(formTemplate, detailRows);

  appendSheet(workbook, "DASHBOARD_THONG_KE", [
    ["BỆNH VIỆN SẢN - NHI CÀ MAU"],
    ["PHIẾU KIỂM TRA VÀ CHẤM ĐIỂM HOẠT ĐỘNG BỆNH VIỆN"],
    [],
    ["Đơn vị được kiểm tra", formTemplate.departmentName],
    ["Đoàn kiểm tra", formTemplate.inspectionTeam],
    ["Loại phiếu", formTemplate.formType === "HANH_CHINH" ? "Hành chính" : "Lâm sàng/Cận lâm sàng"],
    ["File nguồn", formTemplate.sourceFile],
    ["Sheet nguồn", formTemplate.sourceSheet],
    ["Phiên bản", formTemplate.version],
    ["Số tiêu chí", formTemplate.criteriaCount],
    ["Tổng điểm tối đa", formTemplate.totalScore],
    ["Tổng điểm đạt", summary.totalScore],
    ["Tỷ lệ", `${summary.ratio}%`],
    ["Xếp loại", summary.classification],
    ["Số lỗi nguy cơ cao/nghiêm trọng", summary.highRiskCount]
  ]);

  appendJsonSheet(workbook, "TONG_HOP_DIEM", [{
    "Đơn vị": formTemplate.departmentName,
    "Khối": formTemplate.block,
    "Đoàn kiểm tra": formTemplate.inspectionTeam,
    "Tổng điểm tối đa": formTemplate.totalScore,
    "Tổng điểm đạt": summary.totalScore,
    "Tỷ lệ": `${summary.ratio}%`,
    "Xếp loại": summary.classification,
    "Số tiêu chí": formTemplate.criteriaCount,
    "Tiêu chí đã chấm": summary.scoredCount,
    "Lỗi nguy cơ cao/nghiêm trọng": summary.highRiskCount,
    "File nguồn": formTemplate.sourceFile,
    "Sheet nguồn": formTemplate.sourceSheet
  }]);

  appendJsonSheet(workbook, "PHIEU_CHI_TIET", detailRows);
  appendJsonSheet(workbook, "CHI_TIET_TIEU_CHI", detailRows);
  appendJsonSheet(workbook, "PHAT_HIEN_VA_KHAC_PHUC", detailRows.filter((row) => row["Phát hiện/tồn tại"] || row["Yêu cầu khắc phục"]));
  appendJsonSheet(workbook, "CAPA", detailRows.filter((row) => row["Yêu cầu khắc phục"] || row["Trạng thái CAPA"]));
  appendJsonSheet(workbook, "LOI_NGUY_CO_CAO", detailRows.filter((row) => ["Cao", "Nghiêm trọng"].includes(String(row["Mức độ nguy cơ"]))));
  appendJsonSheet(workbook, "PHAN_CONG_THANH_VIEN", buildAssignmentRows(criteriaItems));
  appendSheet(workbook, "CAN_CU", [
    ["Nguồn dữ liệu"],
    ["File kế hoạch/quyết định", "KH, QĐ KIỂM TRA HOẠT ĐỘNG BỆNH VIỆN NĂM 2026.pdf"],
    ["File Excel nguồn", formTemplate.sourceFile],
    ["Sheet phiếu", formTemplate.sourceSheet],
    ["Nguyên tắc", "Mẫu báo cáo bám theo sheet phiếu kiểm tra/chấm điểm nguồn; không tự bịa tiêu chí."]
  ]);

  return workbook;
}

function buildDetailRows(criteriaItems: FormCriteriaItem[], scores: InspectionScore[]) {
  const scoreByCriteria = new Map(scores.map((score) => [score.formCriteriaItemId, score]));
  return criteriaItems.map((criteria) => {
    const score = scoreByCriteria.get(criteria.id);
    const achievedScore = score?.score ?? "";
    const maxScore = criteria.maxScore;
    const ratio = typeof achievedScore === "number" && maxScore > 0 ? Math.round((achievedScore / maxScore) * 10000) / 100 : "";

    return {
      "STT": criteria.order,
      "Mã nhóm": criteria.groupCode,
      "Nhóm nội dung": criteria.groupName,
      "Nội dung kiểm tra": criteria.content,
      "Minh chứng cần xem": criteria.evidenceRequired,
      "Điểm tối đa": maxScore,
      "Điểm đạt": achievedScore,
      "Tỷ lệ đạt": ratio === "" ? "" : `${ratio}%`,
      "Thành viên phụ trách Đoàn 01": criteria.team1Assignee,
      "Thành viên phụ trách Đoàn 02": criteria.team2Assignee,
      "Phát hiện/tồn tại": score?.finding || score?.deductionReason || "",
      "Minh chứng thực tế": score?.evidenceText ?? "",
      "Yêu cầu khắc phục": score?.correctionRequest ?? "",
      "Thời hạn": score?.dueDate ?? "",
      "Bộ phận chịu trách nhiệm": score?.responsibleDepartment ?? "",
      "Người chịu trách nhiệm": score?.responsiblePerson ?? "",
      "Trạng thái CAPA": score?.capaStatus ?? "",
      "Mức độ nguy cơ": score?.riskLevel ?? "",
      "Ghi chú": score?.note ?? "",
      "source_file": criteria.sourceFile,
      "source_sheet": criteria.sourceSheet,
      "source_row": criteria.sourceRow
    };
  });
}

function buildSummary(formTemplate: FormTemplate, rows: ReturnType<typeof buildDetailRows>) {
  const totalScore = rows.reduce((sum, row) => sum + (typeof row["Điểm đạt"] === "number" ? row["Điểm đạt"] : 0), 0);
  const ratio = formTemplate.totalScore > 0 ? Math.round((totalScore / formTemplate.totalScore) * 10000) / 100 : 0;
  const highRiskCount = rows.filter((row) => ["Cao", "Nghiêm trọng"].includes(String(row["Mức độ nguy cơ"]))).length;
  return {
    totalScore,
    ratio,
    highRiskCount,
    scoredCount: rows.filter((row) => row["Điểm đạt"] !== "").length,
    classification: classifyScore(totalScore, highRiskCount > 0)
  };
}

function buildAssignmentRows(criteriaItems: FormCriteriaItem[]) {
  return criteriaItems.map((criteria) => ({
    "STT": criteria.order,
    "Mã nhóm": criteria.groupCode,
    "Nhóm nội dung": criteria.groupName,
    "Nội dung kiểm tra": criteria.content,
    "Thành viên phụ trách Đoàn 01": criteria.team1Assignee,
    "Thành viên phụ trách Đoàn 02": criteria.team2Assignee,
    "File nguồn": criteria.sourceFile,
    "Sheet nguồn": criteria.sourceSheet,
    "Dòng nguồn": criteria.sourceRow
  }));
}

function classifyScore(totalScore: number, hasSeriousRisk: boolean) {
  if (hasSeriousRisk) return "Không đạt";
  if (totalScore >= 90) return "Đạt tốt";
  if (totalScore >= 80) return "Đạt";
  if (totalScore >= 65) return "Cần cải tiến";
  return "Không đạt";
}

function appendJsonSheet(workbook: XLSX.WorkBook, name: string, rows: Record<string, unknown>[]) {
  const sheet = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([["Không có dữ liệu"]]);
  sheet["!cols"] = estimateColumns(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function appendSheet(workbook: XLSX.WorkBook, name: string, rows: unknown[][]) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [{ wch: 32 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function estimateColumns(rows: Record<string, unknown>[]) {
  if (!rows.length) return [{ wch: 20 }];
  return Object.keys(rows[0]).map((key) => ({
    wch: Math.min(70, Math.max(12, key.length + 4))
  }));
}
