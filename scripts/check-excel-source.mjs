import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";

const expectedFiles = [
  {
    fileName: "1805_V03_ĐOÀN 1_LS-CLS.xlsx",
    type: "LS_CLS",
    team: "Doan 01",
    expectedForms: 21,
    expectedCriteriaPerForm: 30
  },
  {
    fileName: "1805_V03_ĐOÀN 2_LS-CLS.xlsx",
    type: "LS_CLS",
    team: "Doan 02",
    expectedForms: 21,
    expectedCriteriaPerForm: 30
  },
  {
    fileName: "1805_V03_ĐOÀN 1_HÀNH CHÍNH.xlsx",
    type: "HANH_CHINH",
    team: "Doan 01",
    expectedForms: 8,
    expectedCriteriaPerForm: 20
  },
  {
    fileName: "1805_V03_ĐOÀN 2_HÀNH CHÍNH.xlsx",
    type: "HANH_CHINH",
    team: "Doan 02",
    expectedForms: 8,
    expectedCriteriaPerForm: 20
  }
];

const administrativeSheets = new Set([
  "P_KHTH",
  "P_QLCL",
  "P_TCCB",
  "P_HCQT",
  "P_DIEU_DUONG",
  "P_TCKT",
  "P_VTTBYT",
  "P_CTXH"
]);

const requiredHeaderKeys = [
  "ten_phieu",
  "don_vi_duoc_kiem_tra",
  "doan_kiem_tra",
  "thang_diem",
  "so_noi_dung"
];

const workbookSummaries = [];
const errors = [];
const warnings = [];

for (const expectedFile of expectedFiles) {
  const filePath = resolve(process.cwd(), expectedFile.fileName);
  if (!existsSync(filePath)) {
    errors.push(`Missing source workbook: ${expectedFile.fileName}`);
    continue;
  }

  const workbook = XLSX.read(readFileSync(filePath), { type: "buffer", cellDates: true });
  const forms = [];

  for (const sheetName of workbook.SheetNames) {
    const formType = detectFormSheet(sheetName);
    if (!formType) continue;

    if (formType !== expectedFile.type) {
      errors.push(`${expectedFile.fileName}/${sheetName}: detected ${formType}, expected ${expectedFile.type}`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, blankrows: true, defval: "" });
    const parsed = parseFormSheet(expectedFile.fileName, sheetName, formType, rows);
    forms.push(parsed);

    if (!parsed.departmentName) {
      errors.push(`${expectedFile.fileName}/${sheetName}: missing department name`);
    }
    if (parsed.criteriaCount !== expectedFile.expectedCriteriaPerForm) {
      errors.push(`${expectedFile.fileName}/${sheetName}: criteria count ${parsed.criteriaCount}, expected ${expectedFile.expectedCriteriaPerForm}`);
    }
    if (Math.round(parsed.totalScore) !== 100) {
      errors.push(`${expectedFile.fileName}/${sheetName}: total score ${parsed.totalScore}, expected 100`);
    }
    for (const key of requiredHeaderKeys) {
      if (!parsed.headerFields.some((field) => field.key === key && field.value)) {
        errors.push(`${expectedFile.fileName}/${sheetName}: missing header field ${key}`);
      }
    }
    for (const item of parsed.criteriaItems) {
      if (!item.content) {
        errors.push(`${expectedFile.fileName}/${sheetName}/row ${item.sourceRow}: missing criteria content`);
      }
      if (item.maxScore <= 0) {
        errors.push(`${expectedFile.fileName}/${sheetName}/row ${item.sourceRow}: max score must be greater than 0`);
      }
      if (!item.groupName && !item.groupCode) {
        warnings.push(`${expectedFile.fileName}/${sheetName}/row ${item.sourceRow}: missing group code and group name`);
      }
    }
  }

  if (forms.length !== expectedFile.expectedForms) {
    errors.push(`${expectedFile.fileName}: form sheet count ${forms.length}, expected ${expectedFile.expectedForms}`);
  }

  workbookSummaries.push({
    fileName: expectedFile.fileName,
    type: expectedFile.type,
    team: expectedFile.team,
    sheetCount: workbook.SheetNames.length,
    formCount: forms.length,
    criteriaCount: forms.reduce((sum, form) => sum + form.criteriaCount, 0),
    warningCount: warnings.length,
    forms
  });
}

const totalForms = workbookSummaries.reduce((sum, workbook) => sum + workbook.formCount, 0);
const totalCriteria = workbookSummaries.reduce((sum, workbook) => sum + workbook.criteriaCount, 0);

if (totalForms !== 58) {
  errors.push(`Total form templates ${totalForms}, expected 58`);
}
if (totalCriteria !== 1580) {
  errors.push(`Total criteria rows ${totalCriteria}, expected 1580`);
}

console.log("Excel source check");
for (const summary of workbookSummaries) {
  console.log(`${summary.fileName}: ${summary.formCount} form sheets, ${summary.criteriaCount} criteria rows, ${summary.sheetCount} total sheets`);
}
console.log(`Total: ${totalForms} form sheets, ${totalCriteria} criteria rows`);

if (warnings.length > 0) {
  console.log(`Warnings: ${warnings.length}`);
  for (const warning of warnings.slice(0, 20)) {
    console.log(`WARN ${warning}`);
  }
}

if (errors.length > 0) {
  console.error(`Excel source check failed: ${errors.length} error(s)`);
  for (const error of errors) {
    console.error(`FAIL ${error}`);
  }
  process.exit(1);
}

console.log("Excel source check passed: 4/4 workbooks, 58/58 form sheets, 1580/1580 criteria rows");

function parseFormSheet(fileName, sheetName, formType, rows) {
  const headerRowIndex = formType === "HANH_CHINH" ? 5 : 8;
  const departmentName = formType === "HANH_CHINH" ? text(rows[3]?.[1]) : text(rows[3]?.[7]);
  const column = formType === "HANH_CHINH"
    ? { stt: 0, groupCode: 1, groupName: 2, content: 3, evidence: 4, maxScore: 5, team1: 12, team2: 13 }
    : { stt: 0, groupCode: 1, groupName: 2, content: 3, maxScore: 4, evidence: 7, team1: 8, team2: 9 };

  const criteriaItems = rows
    .map((row, index) => ({ row, sourceRow: index + 1 }))
    .slice(headerRowIndex + 1)
    .filter(({ row }) => {
      const order = numeric(row[column.stt]);
      return text(row[column.stt]) !== "" && Number.isFinite(order) && order > 0;
    })
    .map(({ row, sourceRow }) => ({
      sourceFile: fileName,
      sourceSheet: sheetName,
      sourceRow,
      order: numeric(row[column.stt]),
      groupCode: text(row[column.groupCode]),
      groupName: text(row[column.groupName]),
      content: text(row[column.content]),
      evidenceRequired: text(row[column.evidence]),
      maxScore: numeric(row[column.maxScore]),
      team1Assignee: text(row[column.team1]),
      team2Assignee: text(row[column.team2])
    }));

  const totalScore = criteriaItems.reduce((sum, item) => sum + item.maxScore, 0);
  const headerFields = [
    { key: "ten_phieu", value: detectSheetTitle(rows, departmentName) },
    { key: "don_vi_duoc_kiem_tra", value: departmentName },
    { key: "doan_kiem_tra", value: detectTeam(fileName) },
    { key: "thang_diem", value: String(Math.round(totalScore)) },
    { key: "so_noi_dung", value: String(criteriaItems.length) }
  ];

  return {
    sourceFile: fileName,
    sourceSheet: sheetName,
    formType,
    departmentName,
    criteriaCount: criteriaItems.length,
    totalScore,
    headerFields,
    criteriaItems
  };
}

function detectFormSheet(sheetName) {
  if (sheetName.startsWith("LS_") || sheetName.startsWith("CLS_")) return "LS_CLS";
  if (administrativeSheets.has(sheetName)) return "HANH_CHINH";
  return null;
}

function detectTeam(fileName) {
  return asciiKey(fileName).includes("DOAN 2") ? "Doan 02" : "Doan 01";
}

function detectSheetTitle(rows, departmentName) {
  const firstRows = rows.slice(0, 3).flat().map(text).filter(Boolean);
  return firstRows.find((cell) => asciiKey(cell).includes("PHIEU")) || `Phieu kiem tra va cham diem - ${departmentName}`;
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asciiKey(value) {
  return text(value)
    .replace(/[Đđ]/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}
