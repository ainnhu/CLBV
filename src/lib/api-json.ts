import { NextResponse } from "next/server";

export type JsonBodyResult = { ok: true; data: unknown } | { ok: false; response: NextResponse };

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return invalidJsonResponse();
  }
}

export async function readOptionalJsonBody(request: Request): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = request.headers.get("content-length");

  if (!contentType.includes("application/json") && (!contentLength || contentLength === "0")) {
    return { ok: true, data: {} };
  }

  try {
    const text = await request.text();
    if (!text.trim()) {
      return { ok: true, data: {} };
    }
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return invalidJsonResponse();
  }
}

function invalidJsonResponse(): JsonBodyResult {
  return {
    ok: false,
    response: NextResponse.json(
      { error: "JSON không hợp lệ. Vui lòng gửi dữ liệu dạng application/json." },
      { status: 400 }
    )
  };
}
