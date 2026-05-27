import { NextResponse } from "next/server";

export type JsonBodyResult = { ok: true; data: unknown } | { ok: false; response: NextResponse };

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "JSON không hợp lệ. Vui lòng gửi dữ liệu dạng application/json." },
        { status: 400 }
      )
    };
  }
}
