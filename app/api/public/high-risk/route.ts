import { NextResponse } from "next/server";
import { listPublicHighRiskFindings } from "../../../../services/repositories/results-repository";

export async function GET() {
  try {
    const data = await listPublicHighRiskFindings();
    return NextResponse.json({
      status: "ok",
      publicRead: true,
      ...data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được danh sách lỗi nguy cơ cao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
