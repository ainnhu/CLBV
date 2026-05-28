import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { assertCanWrite } from "../../../../services/access-control";
import { uploadScoreAttachment } from "../../../../services/repositories/attachments-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "score:update");
    const formData = await request.formData();
    const inspectionScoreId = String(formData.get("inspectionScoreId") ?? "");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Chưa chọn file minh chứng." }, { status: 422 });
    }

    const result = await uploadScoreAttachment({ user, inspectionScoreId, file });
    return NextResponse.json({
      status: "accepted",
      mode: result.mode,
      attachment: result.attachment,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không upload được minh chứng.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
