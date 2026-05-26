import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { createInspectionSession } from "../../../../services/repositories/sessions-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    const payload = await request.json();
    const result = await createInspectionSession(user, payload);

    return NextResponse.json({
      status: "accepted",
      mode: result.mode,
      message: "Đã tạo phiên kiểm tra và phiếu chấm từ mẫu phiếu nguồn.",
      session: result.session,
      form: result.form,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tạo được phiên kiểm tra.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
