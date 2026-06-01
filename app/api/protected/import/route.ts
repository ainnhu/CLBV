import { userFromRequest } from "@/lib/api-auth";
import { assertCanWrite } from "../../../../services/access-control";
import { prepareImportWorkbook } from "../../../../services/repositories/import-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "excel:import");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Vui lòng gửi file Excel ở field `file`." }, { status: 400 });
    }
    const fileType = detectFileType(file.name);
    const invalidFileMessage = validateImportFile(file, fileType);
    if (invalidFileMessage) {
      return Response.json({ error: invalidFileMessage }, { status: 422 });
    }

    const result = await prepareImportWorkbook(user, {
      fileName: file.name,
      fileType,
      buffer: await file.arrayBuffer()
    });

    return Response.json({
      status: result.batch.status,
      mode: result.mode,
      message: "Đã đọc workbook và tạo import batch chờ rà soát.",
      batchId: result.batch.id,
      summary: result.batch.summary,
      templatesPreview: result.batch.templates.slice(0, 5),
      criteriaPreview: result.batch.criteriaItems.slice(0, 5),
      warnings: result.batch.warnings.slice(0, 30),
      commitPayload: {
        batchId: result.batch.id,
        fileName: result.batch.fileName,
        fileType: result.batch.fileType,
        templates: result.batch.templates,
        criteriaItems: result.batch.criteriaItems,
        warnings: result.batch.warnings,
        allowWarnings: false,
        importMode: "upsert_version",
        version: "V03-1805"
      },
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền import Excel.";
    return Response.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}

function detectFileType(fileName: string) {
  const key = normalizeVietnameseKey(fileName);
  if (key.includes("LS-CLS") && key.includes("DOAN 1")) return "DOAN_1_LS_CLS";
  if (key.includes("LS-CLS") && key.includes("DOAN 2")) return "DOAN_2_LS_CLS";
  if (key.includes("HANH") && key.includes("DOAN 1")) return "DOAN_1_HANH_CHINH";
  if (key.includes("HANH") && key.includes("DOAN 2")) return "DOAN_2_HANH_CHINH";
  return "UNKNOWN";
}

function normalizeVietnameseKey(value: string) {
  return value
    .replace(/\u0110|\u0111/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function validateImportFile(file: File, fileType: string) {
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
    return "Chỉ cho phép import file Excel định dạng .xlsx hoặc .xls.";
  }
  if (file.size > 30 * 1024 * 1024) {
    return "File Excel import tối đa 30MB.";
  }
  if (fileType === "UNKNOWN") {
    return "Không nhận diện được loại file. Tên file cần thể hiện Đoàn 1/Đoàn 2 và LS-CLS/Hành chính.";
  }
  return "";
}
