import { NextResponse } from "next/server";
import { listPublicHistory } from "../../../../services/repositories/results-repository";

export async function GET() {
  try {
    const data = await listPublicHistory();
    return NextResponse.json({
      status: "ok",
      publicRead: true,
      ...data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được lịch sử kiểm tra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
