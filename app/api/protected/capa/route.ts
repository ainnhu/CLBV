import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { assertCanWrite } from "../../../../services/access-control";
import { updateCapa } from "../../../../services/repositories/capa-repository";

type CapaPayload = {
  inspectionScoreId?: string;
  status?: string;
  updateContent?: string;
  evidenceUrl?: string;
};

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "capa:update");
    const payload = (await request.json()) as CapaPayload;

    if (!payload.inspectionScoreId) {
      return NextResponse.json({ error: "Không tìm thấy phát hiện/CAPA cần cập nhật." }, { status: 400 });
    }
    if (!payload.status || !payload.updateContent?.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập trạng thái và nội dung cập nhật khắc phục." }, { status: 422 });
    }

    const result = await updateCapa(user, {
      inspectionScoreId: payload.inspectionScoreId,
      status: payload.status,
      updateContent: payload.updateContent,
      evidenceUrl: payload.evidenceUrl
    });

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
