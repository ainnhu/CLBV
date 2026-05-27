import { NextResponse } from "next/server";
import { listPublicAssignments } from "../../../../services/repositories/assignments-repository";

export async function GET() {
  try {
    const data = await listPublicAssignments();
    return NextResponse.json({
      status: "ok",
      publicRead: true,
      ...data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được phân công kiểm tra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
