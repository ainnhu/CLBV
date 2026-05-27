import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api-json";
import { validateCapaUpdatePayload } from "@/lib/validation";
import { assertCanWrite } from "../../../../services/access-control";
import { updateCapa } from "../../../../services/repositories/capa-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "capa:update");
    const payload = await readJsonBody(request);
    if (!payload.ok) {
      return payload.response;
    }

    const validated = validateCapaUpdatePayload(payload.data);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.errors.join(" ") }, { status: 422 });
    }

    const result = await updateCapa(user, validated.data);

    return NextResponse.json({
      status: "accepted",
      mode: result.mode,
      message: "Cập nhật CAPA hợp lệ.",
      capaUpdate: result.saved,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền cập nhật CAPA.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
