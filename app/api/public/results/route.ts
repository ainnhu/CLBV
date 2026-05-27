import { NextResponse } from "next/server";
import { listPublicResults } from "../../../../services/repositories/results-repository";

export async function GET() {
  try {
    const data = await listPublicResults();
    return NextResponse.json({
      status: "ok",
      publicRead: true,
      ...data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được kết quả chấm điểm.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
