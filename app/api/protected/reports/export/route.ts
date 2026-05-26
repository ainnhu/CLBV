import { demoUserFromRequest } from "@/lib/api-auth";
import { assertCanWrite } from "../../../../../services/access-control";
import { exportFormReport } from "../../../../../services/repositories/reports-repository";

export async function POST(request: Request) {
  try {
    const user = demoUserFromRequest(request);
    assertCanWrite(user, "report:export");
    const body = (await request.json().catch(() => ({}))) as { formTemplateId?: string };
    const result = await exportFormReport(user, body.formTemplateId);

    return new Response(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "x-audit-action": result.auditLog.action
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền xuất báo cáo.";
    return Response.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
