import { userFromRequest } from "@/lib/api-auth";
import { readOptionalJsonBody } from "@/lib/api-json";
import { assertCanWrite } from "../../../../../services/access-control";
import { exportFormReport } from "../../../../../services/repositories/reports-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "report:export");
    const json = await readOptionalJsonBody(request);
    if (!json.ok) return json.response;
    const body = json.data as { formTemplateId?: string };
    const result = await exportFormReport(user, body.formTemplateId);

    return new Response(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "x-audit-action": result.auditLog.action,
        "x-report-download-url": result.downloadUrl ?? ""
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền xuất báo cáo.";
    return Response.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
