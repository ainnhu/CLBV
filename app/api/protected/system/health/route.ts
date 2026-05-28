import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/api-auth";
import { assertCanWrite } from "../../../../../services/access-control";
import { getProtectedSystemHealth } from "../../../../../services/system-health";

export async function GET(request: Request) {
  try {
    const user = await userFromRequest(request);
    assertCanWrite(user, "catalog:manage");
    const health = await getProtectedSystemHealth();
    return NextResponse.json(health);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không kiểm tra được cấu hình hệ thống.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
