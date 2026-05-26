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

    const result = await prepareImportWorkbook(user, {
      fileName: file.name,
      fileType: detectFileType(file.name),
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
  const key = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (key.includes("LS-CLS") && key.includes("DOAN 1")) return "DOAN_1_LS_CLS";
  if (key.includes("LS-CLS") && key.includes("DOAN 2")) return "DOAN_2_LS_CLS";
  if (key.includes("HANH") && key.includes("DOAN 1")) return "DOAN_1_HANH_CHINH";
  if (key.includes("HANH") && key.includes("DOAN 2")) return "DOAN_2_HANH_CHINH";
  return "UNKNOWN";
}
