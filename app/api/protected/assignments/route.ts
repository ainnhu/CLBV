import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api-json";
import { validateAssignmentPayload } from "@/lib/validation";
import { assertCanWrite } from "../../../../services/access-control";
import { createInspectionAssignments } from "../../../../services/repositories/assignments-repository";

export async function POST(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "assignment:manage");
    const payload = await readJsonBody(request);
    if (!payload.ok) {
      return payload.response;
    }
    const validated = validateAssignmentPayload(payload.data);
    if (!validated.ok) {
      return NextResponse.json({ error: "Dữ liệu phân công không hợp lệ.", details: validated.errors }, { status: 422 });
    }
    const result = await createInspectionAssignments(user, validated.data);

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
