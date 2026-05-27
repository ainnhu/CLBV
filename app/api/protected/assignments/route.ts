import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api-json";
import { createInspectionAssignments } from "../../../../services/repositories/assignments-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    const payload = await readJsonBody(request);
    if (!payload.ok) {
      return payload.response;
    }
    const result = await createInspectionAssignments(user, payload.data as Parameters<typeof createInspectionAssignments>[1]);

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
