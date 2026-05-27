import { NextResponse } from "next/server";
import { getPublicCatalog } from "../../../../services/repositories/catalog-repository";

export async function GET() {
  try {
    const catalog = await getPublicCatalog();
    return NextResponse.json({
      status: "ok",
      publicRead: true,
      ...catalog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đọc được danh mục công khai.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
