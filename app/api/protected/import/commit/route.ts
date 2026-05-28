import { userFromRequest } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api-json";
import { validateCommitImportPayload } from "@/lib/validation";
import { assertCanWrite } from "../../../../../services/access-control";
import { commitImportBatch } from "../../../../../services/repositories/import-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "excel:import");
    const json = await readJsonBody(request);
    if (!json.ok) return json.response;
    const validated = validateCommitImportPayload(json.data);
    if (!validated.ok) {
      return Response.json({ error: "Dữ liệu commit import không hợp lệ.", details: validated.errors }, { status: 422 });
    }

    const result = await commitImportBatch(user, validated.data);

    return Response.json({
      status: "committed",
      mode: result.mode,
      message: "Import batch đã sẵn sàng ghi chính thức.",
      committed: result.committed,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền commit import batch.";
    const status = message.includes("403") ? 403 : message.includes("còn cảnh báo") ? 422 : 500;
    return Response.json({ error: message }, { status });
  }
}
