import * as XLSX from "xlsx";

const baseUrl = (process.argv[2] || process.env.EXPORT_CHECK_BASE_URL || "https://clbv.vercel.app").replace(/\/+$/, "");
const expectedSheets = [
  "DASHBOARD_THONG_KE",
  "TONG_HOP_DIEM",
  "PHIEU_CHI_TIET",
  "CHI_TIET_TIEU_CHI",
  "CHI_TIET_LOI",
  "PHAT_HIEN_VA_KHAC_PHUC",
  "CAPA",
  "LOI_NGUY_CO_CAO",
  "PHAN_CONG_THANH_VIEN",
  "CAN_CU"
];

const response = await fetch(`${baseUrl}/api/protected/reports/export`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-demo-role": "Admin"
  },
  body: "{}"
});

if (response.status !== 200) {
  const body = await response.text().catch(() => "");
  throw new Error(`Export API returned HTTP ${response.status}. ${body}`);
}

const contentType = response.headers.get("content-type") || "";
if (!contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
  throw new Error(`Export API returned invalid content-type: ${contentType}`);
}

const disposition = response.headers.get("content-disposition") || "";
if (!disposition.toLowerCase().includes(".xlsx")) {
  throw new Error(`Export API did not return an .xlsx filename: ${disposition}`);
}

const buffer = Buffer.from(await response.arrayBuffer());
if (buffer.length < 1024) {
  throw new Error(`Export workbook is unexpectedly small: ${buffer.length} bytes`);
}

const workbook = XLSX.read(buffer, { type: "buffer" });
const missingSheets = expectedSheets.filter((sheetName) => !workbook.SheetNames.includes(sheetName));
if (missingSheets.length > 0) {
  throw new Error(`Export workbook is missing sheet(s): ${missingSheets.join(", ")}`);
}

const summaryRows = XLSX.utils.sheet_to_json(workbook.Sheets.TONG_HOP_DIEM, { defval: "" });
if (summaryRows.length < 1) {
  throw new Error("TONG_HOP_DIEM sheet has no data rows");
}

const criteriaRows = XLSX.utils.sheet_to_json(workbook.Sheets.CHI_TIET_TIEU_CHI, { defval: "" });
if (criteriaRows.length < 1) {
  throw new Error("CHI_TIET_TIEU_CHI sheet has no data rows");
}

const detailSheet = workbook.Sheets.PHIEU_CHI_TIET;
const detailMatrix = XLSX.utils.sheet_to_json(detailSheet, { header: 1, defval: "" });
const flattenedDetail = detailMatrix.flat().map((cell) => String(cell));
for (const requiredText of ["source_file", "source_sheet", "source_row"]) {
  if (!flattenedDetail.includes(requiredText)) {
    throw new Error(`PHIEU_CHI_TIET sheet is missing ${requiredText}`);
  }
}

const sourceRows = criteriaRows.filter((row) => row.source_file && row.source_sheet && row.source_row);
if (sourceRows.length !== criteriaRows.length) {
  throw new Error(`CHI_TIET_TIEU_CHI source trace mismatch: ${sourceRows.length}/${criteriaRows.length}`);
}

console.log(`Export workbook check: ${baseUrl}`);
console.log(`File: ${disposition}`);
console.log(`Size: ${buffer.length} bytes`);
console.log(`Sheets: ${workbook.SheetNames.join(", ")}`);
console.log(`Criteria rows: ${criteriaRows.length}`);
console.log("Export workbook check passed");
