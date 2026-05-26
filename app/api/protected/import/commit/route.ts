import { userFromRequest } from "@/lib/api-auth";
import { assertCanWrite } from "../../../../../services/access-control";
import { commitImportBatch, type CommitImportBatchInput } from "../../../../../services/repositories/import-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "excel:import");
    const payload = (await request.json()) as Partial<CommitImportBatchInput>;

    if (!payload.batchId || !payload.fileName || !payload.fileType) {
      return Response.json({ error: "Thiếu thông tin import batch." }, { status: 400 });
    }
    if (!Array.isArray(payload.templates) || !Array.isArray(payload.criteriaItems)) {
      return Response.json({ error: "Thiếu dữ liệu phiếu hoặc tiêu chí cần ghi." }, { status: 400 });
    }

    const result = await commitImportBatch(user, {
      batchId: payload.batchId,
      fileName: payload.fileName,
      fileType: payload.fileType,
      templates: payload.templates,
      criteriaItems: payload.criteriaItems,
      warnings: payload.warnings ?? [],
      allowWarnings: payload.allowWarnings,
      importMode: payload.importMode,
      version: payload.version
    });

    return Response.json({
      status: "committed",
      mode: result.mode,
      message: "Import batch đã sẵn sàng ghi chính thức.",
      committed: result.committed,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền commit import batch.";
    return Response.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
