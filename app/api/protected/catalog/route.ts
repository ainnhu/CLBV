import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { readJsonBody } from "@/lib/api-json";
import { validateCatalogPayload } from "@/lib/validation";
import { assertCanWrite } from "../../../../services/access-control";
import { archiveCatalogItem, createCatalogItem, updateCatalogItem } from "../../../../services/repositories/catalog-repository";

export async function POST(request: Request) {
  return handleCatalogMutation(request, "create");
}

export async function PATCH(request: Request) {
  return handleCatalogMutation(request, "update");
}

export async function DELETE(request: Request) {
  return handleCatalogMutation(request, "archive");
}

async function handleCatalogMutation(request: Request, mode: "create" | "update" | "archive") {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "catalog:manage");
    const json = await readJsonBody(request);
    if (!json.ok) return json.response;

    const validation = validateCatalogPayload(json.data, mode);
    if (!validation.ok) {
      return NextResponse.json({ error: "Dữ liệu danh mục không hợp lệ.", details: validation.errors }, { status: 422 });
    }

    const result =
      mode === "create"
        ? await createCatalogItem(user, validation.data)
        : mode === "update"
          ? await updateCatalogItem(user, validation.data)
          : await archiveCatalogItem(user, validation.data);

    return NextResponse.json({
      status: mode === "archive" ? "archived" : "ok",
      mode: result.mode,
      item: result.item,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thao tác được danh mục.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
