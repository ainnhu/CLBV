import { NextResponse } from "next/server";
import { listPublicReportExports } from "../../../../services/repositories/reports-repository";

export async function GET() {
  try {
    const reports = await listPublicReportExports();
    return NextResponse.json({
      status: "ok",
      publicRead: true,
      reports
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được danh sách báo cáo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
