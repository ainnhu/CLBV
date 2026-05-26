import { auditScores, dashboardDepartments, formTemplates, implementationProgress, monthlyTrend, reports } from "../../src/lib/mock-data";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

type DbInspectionForm = {
  id: string;
  total_score: number | null;
  high_risk_count: number | null;
  classification: string | null;
  status: string;
  inspection_sessions?: {
    inspection_date?: string | null;
    departments?: {
      name?: string | null;
      block_type?: string | null;
    } | null;
    inspection_teams?: {
      name?: string | null;
    } | null;
  } | null;
};

type DbInspectionScore = {
  id: string;
  risk_level: string;
  capa_status: string;
  due_date: string | null;
};

type DbReportExport = {
  id: string;
  status: string;
};

function blockLabel(value?: string | null) {
  if (value === "administrative") return "Hành chính";
  if (value === "paraclinical") return "Cận lâm sàng";
  return "Lâm sàng";
}

function classifyScore(score: number, highRiskCount = 0) {
  if (highRiskCount > 0 && score < 80) return "Không đạt";
  if (score >= 90) return "Đạt tốt";
  if (score >= 80) return "Đạt";
  if (score >= 65) return "Cần cải tiến";
  return "Không đạt";
}

function buildMockDashboard() {
  const checkedDepartments = dashboardDepartments.length;
  const averageScore = Math.round(dashboardDepartments.reduce((sum, item) => sum + item.score, 0) / checkedDepartments);
  const highRiskCount = auditScores.filter((score) => score.riskLevel === "nguy cơ cao").length;
  const overdueCapaCount = auditScores.filter((score) => score.capaStatus === "Quá hạn").length;

  return {
    mode: "mock" as const,
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
  };
}

function monthLabel(date?: string | null) {
  if (!date) return "Chưa có ngày";
  const month = new Date(date).getMonth() + 1;
  return Number.isFinite(month) ? `T${month}` : "Chưa có ngày";
}

export async function getPublicDashboard() {
  const mockDashboard = buildMockDashboard();

  if (getSupabaseMode() === "mock") {
    return mockDashboard;
  }

  try {
    const [forms, scores, templates, exports] = await Promise.all([
      supabaseRest.select<DbInspectionForm[]>("inspection_forms", {
        select: "id,total_score,high_risk_count,classification,status,inspection_sessions(inspection_date,departments(name,block_type),inspection_teams(name))",
        order: "submitted_at.desc"
      }),
      supabaseRest.select<DbInspectionScore[]>("inspection_scores", {
        select: "id,risk_level,capa_status,due_date"
      }),
      supabaseRest.select<Array<{ id: string }>>("form_templates", {
        select: "id",
        is_active: "eq.true"
      }),
      supabaseRest.select<DbReportExport[]>("report_exports", {
        select: "id,status"
      })
    ]);

    const checkedDepartments = forms.length;
    const averageScore = checkedDepartments
      ? Math.round(forms.reduce((sum, form) => sum + Number(form.total_score ?? 0), 0) / checkedDepartments)
      : 0;
    const highRiskCount = scores.filter((score) => score.risk_level === "cao" || score.risk_level === "nghiem_trong").length;
    const overdueCapaCount = scores.filter((score) => score.capa_status === "qua_han").length;

    const departmentScores = forms.map((form) => {
      const session = form.inspection_sessions;
      const score = Number(form.total_score ?? 0);
      return {
        name: session?.departments?.name ?? "Chưa xác định",
        score,
        block: blockLabel(session?.departments?.block_type),
        team: session?.inspection_teams?.name ?? "Chưa xác định",
        classification: form.classification ?? classifyScore(score, Number(form.high_risk_count ?? 0))
      };
    });

    const trendMap = new Map<string, { month: string; average: number; highRisk: number; count: number }>();
    for (const form of forms) {
      const label = monthLabel(form.inspection_sessions?.inspection_date);
      const current = trendMap.get(label) ?? { month: label, average: 0, highRisk: 0, count: 0 };
      current.average += Number(form.total_score ?? 0);
      current.highRisk += Number(form.high_risk_count ?? 0);
      current.count += 1;
      trendMap.set(label, current);
    }

    return {
      mode: "supabase" as const,
      visibility: "public",
      rule: "Ai có link web đều xem được dữ liệu công khai.",
      summary: {
        checkedDepartments,
        averageScore,
        highRiskCount,
        overdueCapaCount,
        formTemplateCount: templates.length,
        exportedReportCount: exports.filter((report) => report.status === "published" || report.status === "exported").length
      },
      charts: {
        departmentScores,
        monthlyTrend: Array.from(trendMap.values()).map((item) => ({
          month: item.month,
          average: item.count ? Math.round(item.average / item.count) : 0,
          highRisk: item.highRisk
        }))
      },
      progress: implementationProgress
    };
  } catch (error) {
    return {
      ...mockDashboard,
      mode: "mock" as const,
      warning: error instanceof Error ? `Chưa đọc được Supabase, đang dùng dữ liệu mẫu: ${error.message}` : "Chưa đọc được Supabase, đang dùng dữ liệu mẫu."
    };
  }
}
