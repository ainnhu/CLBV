import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { createInspectionAssignments } from "../../../../services/repositories/assignments-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    const payload = await request.json();
    const result = await createInspectionAssignments(user, payload);

    return NextResponse.json({
      status: "accepted",
      mode: result.mode,
      message: "Đã tạo/cập nhật phân công chấm điểm.",
      saved: result.saved,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tạo được phân công.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
