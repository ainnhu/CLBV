import * as XLSX from "xlsx";

export type ImportedFormTemplate = {
  sourceFile: string;
  sourceSheet: string;
  formType: "LS_CLS" | "HANH_CHINH";
  departmentCode: string;
  departmentName: string;
  inspectionTeam: "Đoàn 01" | "Đoàn 02";
  totalScore: number;
  criteriaCount: number;
  headerFields: ImportedHeaderField[];
};

export type ImportedHeaderField = {
  key: string;
  label: string;
  value: string;
  sourceCell: string;
  orderIndex: number;
};

export type ImportedCriteriaItem = {
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  order: number;
  groupCode: string;
  groupName: string;
  content: string;
  evidenceRequired: string;
  maxScore: number;
  team1Assignee: string;
  team2Assignee: string;
};

export type ImportResult = {
  templates: ImportedFormTemplate[];
  criteriaItems: ImportedCriteriaItem[];
  warnings: string[];
};

const administrativeSheets = new Set(["P_KHTH", "P_QLCL", "P_TCCB", "P_HCQT", "P_DIEU_DUONG", "P_TCKT", "P_VTTBYT", "P_CTXH"]);

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asciiKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function detectFormSheet(sheetName: string) {
  if (sheetName.startsWith("LS_") || sheetName.startsWith("CLS_")) return "LS_CLS" as const;
  if (administrativeSheets.has(sheetName)) return "HANH_CHINH" as const;
  return null;
}

function detectTeam(fileName: string) {
  const key = asciiKey(fileName);
  return key.includes("DOAN 2") ? "Đoàn 02" : "Đoàn 01";
}

export function importAuditWorkbook(fileName: string, buffer: ArrayBuffer): ImportResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const result: ImportResult = { templates: [], criteriaItems: [], warnings: [] };
  const inspectionTeam = detectTeam(fileName);

  workbook.SheetNames.forEach((sheetName) => {
    const formType = detectFormSheet(sheetName);
    if (!formType) return;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, blankrows: true, defval: "" });
    const headerRowIndex = formType === "HANH_CHINH" ? 5 : 8;
    const departmentName = formType === "HANH_CHINH" ? text(rows[3]?.[1]) : text(rows[3]?.[7]);
    const column = formType === "HANH_CHINH"
      ? { stt: 0, groupCode: 1, groupName: 2, content: 3, evidence: 4, maxScore: 5, team1: 12, team2: 13 }
      : { stt: 0, groupCode: 1, groupName: 2, content: 3, maxScore: 4, evidence: 7, team1: 8, team2: 9 };

    const criteriaRows = rows
      .map((row, index) => ({ row, sourceRow: index + 1 }))
      .slice(headerRowIndex + 1)
      .filter(({ row }) => {
        const order = number(row[column.stt]);
        return text(row[column.stt]) !== "" && Number.isFinite(order) && order > 0;
      });
    const totalScore = criteriaRows.reduce((sum, { row }) => sum + number(row[column.maxScore]), 0);
    const expectedCriteriaCount = formType === "HANH_CHINH" ? 20 : 30;

    if (!departmentName) result.warnings.push(`${fileName}/${sheetName}: chưa đọc được tên khoa/phòng ở đầu phiếu.`);
    if (criteriaRows.length !== expectedCriteriaCount) {
      result.warnings.push(`${fileName}/${sheetName}: số tiêu chí ${criteriaRows.length}, dự kiến ${expectedCriteriaCount}.`);
    }
    if (Math.round(totalScore) !== 100) result.warnings.push(`${fileName}/${sheetName}: tổng điểm ${totalScore}, dự kiến 100.`);

    result.templates.push({
      sourceFile: fileName,
      sourceSheet: sheetName,
      formType,
      departmentCode: sheetName,
      departmentName,
      inspectionTeam,
      totalScore,
      criteriaCount: criteriaRows.length,
      headerFields: buildHeaderFields({
        rows,
        formType,
        departmentName,
        sourceSheet: sheetName,
        inspectionTeam,
        totalScore,
        criteriaCount: criteriaRows.length
      })
    });

    criteriaRows.forEach(({ row, sourceRow }) => {
      result.criteriaItems.push({
        sourceFile: fileName,
        sourceSheet: sheetName,
        sourceRow,
        order: number(row[column.stt]),
        groupCode: text(row[column.groupCode]),
        groupName: text(row[column.groupName]),
        content: text(row[column.content]),
        evidenceRequired: text(row[column.evidence]),
        maxScore: number(row[column.maxScore]),
        team1Assignee: text(row[column.team1]),
        team2Assignee: text(row[column.team2])
      });
    });
  });

  return result;
}

function buildHeaderFields({
  rows,
  formType,
  departmentName,
  sourceSheet,
  inspectionTeam,
  totalScore,
  criteriaCount
}: {
  rows: unknown[][];
  formType: "LS_CLS" | "HANH_CHINH";
  departmentName: string;
  sourceSheet: string;
  inspectionTeam: "Đoàn 01" | "Đoàn 02";
  totalScore: number;
  criteriaCount: number;
}): ImportedHeaderField[] {
  const sheetTitle = text(rows[0]?.find((cell) => text(cell).toLowerCase().includes("phiếu")) ?? "");
  return [
    {
      key: "ten_phieu",
      label: "Tên phiếu",
      value: sheetTitle || `Phiếu kiểm tra và chấm điểm - ${departmentName}`,
      sourceCell: "A1",
      orderIndex: 1
    },
    {
      key: "source_sheet",
      label: "Sheet nguồn",
      value: sourceSheet,
      sourceCell: "workbook",
      orderIndex: 2
    },
    {
      key: "form_type",
      label: "Loại phiếu",
      value: formType === "HANH_CHINH" ? "Hành chính" : "Lâm sàng/Cận lâm sàng",
      sourceCell: "derived",
      orderIndex: 3
    },
    {
      key: "don_vi_duoc_kiem_tra",
      label: "Đơn vị được kiểm tra",
      value: departmentName,
      sourceCell: formType === "HANH_CHINH" ? "B4" : "H4",
      orderIndex: 4
    },
    {
      key: "doan_kiem_tra",
      label: "Đoàn kiểm tra",
      value: inspectionTeam,
      sourceCell: "file_name",
      orderIndex: 5
    },
    {
      key: "thang_diem",
      label: "Thang điểm",
      value: String(Math.round(totalScore)),
      sourceCell: "sum(max_score)",
      orderIndex: 6
    },
    {
      key: "so_noi_dung",
      label: "Số nội dung kiểm tra",
      value: String(criteriaCount),
      sourceCell: "count(criteria_rows)",
      orderIndex: 7
    },
    {
      key: "ngay_kiem_tra",
      label: "Ngày kiểm tra",
      value: "Nhập theo phiên kiểm tra",
      sourceCell: "runtime",
      orderIndex: 8
    },
    {
      key: "nguoi_tiep_doan",
      label: "Người tiếp đoàn",
      value: "Nhập khi tạo phiếu",
      sourceCell: "runtime",
      orderIndex: 9
    },
    {
      key: "thoi_gian_bat_dau_ket_thuc",
      label: "Thời gian bắt đầu/kết thúc",
      value: "Nhập khi tạo phiếu",
      sourceCell: "runtime",
      orderIndex: 10
    },
    {
      key: "ket_luan_so_bo",
      label: "Kết luận sơ bộ",
      value: "Nhập sau kiểm tra",
      sourceCell: "runtime",
      orderIndex: 11
    }
  ];
}
