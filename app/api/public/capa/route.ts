import { NextResponse } from "next/server";
import { listPublicCapaItems } from "../../../../services/repositories/capa-repository";

export async function GET() {
  try {
    const items = await listPublicCapaItems();
    return NextResponse.json({
      status: "ok",
      publicRead: true,
      items
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được danh sách CAPA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
