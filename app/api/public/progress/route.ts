import { NextResponse } from "next/server";
import { implementationProgress } from "@/lib/mock-data";

export function GET() {
  const overall = Math.round(
    implementationProgress.reduce((sum, item) => sum + item.percent, 0) / implementationProgress.length
  );

  return NextResponse.json({
    overall,
    updatedAt: new Date().toISOString(),
    items: implementationProgress
  });
}
