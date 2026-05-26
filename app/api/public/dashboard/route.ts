import { NextResponse } from "next/server";
import { getPublicDashboard } from "../../../../services/repositories/dashboard-repository";

export async function GET() {
  return NextResponse.json(await getPublicDashboard());
}
