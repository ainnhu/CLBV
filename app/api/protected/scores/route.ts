import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { validateScorePayload } from "@/lib/validation";
import { assertCanWrite } from "../../../../services/access-control";
import { saveInspectionScore } from "../../../../services/repositories/scores-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "score:update");

    const payload = await readJsonBody(request);
    if (!payload.ok) {
      return NextResponse.json({ error: payload.error }, { status: 400 });
    }

    const validated = validateScorePayload(payload.data);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.errors.join(" ") }, { status: 422 });
    }

    const result = await saveInspectionScore(user, validated.data);

    return NextResponse.json({
      status: "accepted",
      mode: result.mode,
      message: "Dữ liệu chấm điểm hợp lệ.",
      savedPreview: result.saved,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền thao tác.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}

async function readJsonBody(request: Request): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return { ok: false, error: "JSON không hợp lệ. Vui lòng gửi dữ liệu dạng application/json." };
  }
}
