import * as XLSX from "xlsx";
import type { FormCriteriaItem, FormTemplate, InspectionScore } from "../src/lib/types";

const detailHeaders = [
  "STT",
  "Mã nhóm",
  "Nhóm nội dung",
  "Nội dung kiểm tra",
  "Minh chứng cần xem",
  "Điểm tối đa",
  "Điểm đạt",
  "Tỷ lệ đạt",
  "Thành viên phụ trách Đoàn 01",
  "Thành viên phụ trách Đoàn 02",
  "Phát hiện/tồn tại",
  "Minh chứng thực tế",
  "Yêu cầu khắc phục",
  "Thời hạn",
  "Bộ phận chịu trách nhiệm",
  "Người chịu trách nhiệm",
  "Trạng thái CAPA",
  "Mức độ nguy cơ",
  "Ghi chú",
  "source_file",
  "source_sheet",
  "source_row"
];

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
  workbook.Props = {
    Title: `Báo cáo chấm điểm ${formTemplate.departmentName}`,
    Subject: "Chấm điểm kiểm tra hoạt động bệnh viện",
    Author: "Bệnh viện Sản - Nhi Cà Mau - Phòng Kế hoạch - Tổng hợp",
    Company: "Bệnh viện Sản - Nhi Cà Mau",
    CreatedDate: new Date()
  };

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

  appendFormSheet(workbook, "PHIEU_CHI_TIET", formTemplate, summary, detailRows);
  appendJsonSheet(workbook, "CHI_TIET_TIEU_CHI", detailRows);
  appendJsonSheet(workbook, "CHI_TIET_LOI", detailRows.filter((row) => {
    const achieved = Number(row["Điểm đạt"]);
    const max = Number(row["Điểm tối đa"]);
    return Number.isFinite(achieved) && Number.isFinite(max) && achieved < max;
  }));
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
  if (rows.length) {
    sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: Object.keys(rows[0]).length - 1 } }) };
  }
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function appendFormSheet(
  workbook: XLSX.WorkBook,
  name: string,
  formTemplate: FormTemplate,
  summary: ReturnType<typeof buildSummary>,
  rows: ReturnType<typeof buildDetailRows>
) {
  const headerValues = new Map(formTemplate.headerFields.map((field) => [field.label, field.value]));
  const sheetRows: unknown[][] = [
    ["BỆNH VIỆN SẢN - NHI CÀ MAU"],
    ["PHIẾU KIỂM TRA VÀ CHẤM ĐIỂM HOẠT ĐỘNG BỆNH VIỆN"],
    [formTemplate.name],
    [],
    ["Đơn vị được kiểm tra", formTemplate.departmentName, "", "Khối", formTemplate.block, "", "Đoàn kiểm tra", formTemplate.inspectionTeam],
    ["Ngày kiểm tra", headerValues.get("Ngày kiểm tra") ?? "", "", "Trưởng đoàn", headerValues.get("Trưởng đoàn") ?? "", "", "Người tiếp đoàn", headerValues.get("Người tiếp đoàn") ?? ""],
    ["Thời gian bắt đầu", headerValues.get("Thời gian bắt đầu") ?? "", "", "Thời gian kết thúc", headerValues.get("Thời gian kết thúc") ?? "", "", "Phiên bản", formTemplate.version],
    ["Tổng điểm", summary.totalScore, "", "Tỷ lệ", `${summary.ratio}%`, "", "Xếp loại", summary.classification],
    ["Số nội dung", formTemplate.criteriaCount, "", "Số nội dung đã chấm", summary.scoredCount, "", "Nguy cơ cao/nghiêm trọng", summary.highRiskCount],
    ["File nguồn", formTemplate.sourceFile, "", "Sheet nguồn", formTemplate.sourceSheet, "", "Thang điểm", formTemplate.totalScore],
    ["Kết luận sơ bộ", headerValues.get("Kết luận sơ bộ") ?? summary.classification],
    [],
    detailHeaders,
    ...rows.map((row) => detailHeaders.map((header) => (row as Record<string, unknown>)[header]))
  ];

  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: detailHeaders.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: detailHeaders.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: detailHeaders.length - 1 } },
    { s: { r: 10, c: 1 }, e: { r: 10, c: detailHeaders.length - 1 } }
  ];
  sheet["!cols"] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 24 },
    { wch: 58 },
    { wch: 42 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 28 },
    { wch: 28 },
    { wch: 36 },
    { wch: 32 },
    { wch: 36 },
    { wch: 14 },
    { wch: 26 },
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 36 },
    { wch: 22 },
    { wch: 10 }
  ];
  sheet["!rows"] = [
    { hpt: 22 },
    { hpt: 24 },
    { hpt: 22 },
    {},
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 30 },
    {},
    { hpt: 28 }
  ];
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: 12, c: 0 }, e: { r: sheetRows.length - 1, c: detailHeaders.length - 1 } })
  };
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
