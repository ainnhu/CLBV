import { NextResponse } from "next/server";
import { listPublicInspectionSessions } from "../../../../services/repositories/sessions-repository";

export async function GET() {
  try {
    const data = await listPublicInspectionSessions();
    return NextResponse.json({
      status: "ok",
      publicRead: true,
      ...data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được lịch/phiên kiểm tra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
