import { NextResponse } from "next/server";
import { auditScores, dashboardDepartments, formTemplates, implementationProgress, monthlyTrend, reports } from "@/lib/mock-data";

export function GET() {
  const checkedDepartments = dashboardDepartments.length;
  const averageScore = Math.round(dashboardDepartments.reduce((sum, item) => sum + item.score, 0) / checkedDepartments);
  const highRiskCount = auditScores.filter((score) => score.riskLevel === "nguy cơ cao").length;
  const overdueCapaCount = auditScores.filter((score) => score.capaStatus === "Quá hạn").length;

  return NextResponse.json({
    visibility: "public",
    rule: "Ai có link web đều xem được dữ liệu công khai.",
    summary: {
      checkedDepartments,
      averageScore,
      highRiskCount,
      overdueCapaCount,
      formTemplateCount: formTemplates.length,
      exportedReportCount: reports.filter((report) => report.status === "đã xuất Excel").length
    },
    charts: {
      departmentScores: dashboardDepartments,
      monthlyTrend
    },
    progress: implementationProgress
  });
}
