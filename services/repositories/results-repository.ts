import { auditScores, dashboardDepartments, inspectionForms } from "../../src/lib/mock-data";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

type DbInspectionFormResult = {
  id: string;
  total_score: number | null;
  score_ratio: number | null;
  classification: string | null;
  high_risk_count: number | null;
  status: string;
  submitted_at: string | null;
  locked_at: string | null;
  inspection_sessions?: {
    inspection_date?: string | null;
    status?: string | null;
    departments?: {
      id?: string | null;
      name?: string | null;
      block_type?: string | null;
    } | null;
    inspection_teams?: {
      name?: string | null;
    } | null;
    audit_periods?: {
      month?: number | null;
      quarter?: number | null;
      year?: number | null;
      status?: string | null;
    } | null;
  } | null;
};

type DbInspectionScoreResult = {
  id: string;
  score: number;
  max_score: number;
  score_ratio: number;
  deduction_reason: string | null;
  finding: string | null;
  risk_level: string;
  correction_request: string | null;
  responsible_department: string | null;
  responsible_person: string | null;
  due_date: string | null;
  capa_status: string;
  updated_at: string;
  inspection_forms?: {
    id?: string | null;
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
  } | null;
  form_criteria_items?: {
    group_code?: string | null;
    group_name?: string | null;
    content?: string | null;
    source_sheet?: string | null;
    source_row?: number | null;
  } | null;
};

export async function listPublicResults() {
  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      departmentResults: dashboardDepartments.map((department) => ({
        departmentName: department.name,
        block: department.block,
        totalScore: department.score,
        classification: classifyScore(department.score, false)
      })),
      scoreDetails: auditScores
    };
  }

  const [forms, scores] = await Promise.all([
    selectInspectionForms(),
    selectInspectionScores()
  ]);

  return {
    mode: "supabase" as const,
    departmentResults: forms.map(mapFormResult),
    scoreDetails: scores.map(mapScoreResult)
  };
}

export async function listPublicHistory() {
  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      history: inspectionForms.map((form) => ({
        id: form.id,
        periodId: form.periodId,
        inspectionDate: form.inspectionDate,
        departmentName: form.departmentName,
        inspectionTeam: form.inspectionTeam,
        leader: form.leader,
        receptionPerson: form.receptionPerson,
        startedAt: form.startedAt,
        endedAt: form.endedAt,
        status: form.status,
        preliminaryConclusion: form.preliminaryConclusion
      }))
    };
  }

  const forms = await selectInspectionForms();
  return {
    mode: "supabase" as const,
    history: forms.map((form) => ({
      id: form.id,
      inspectionDate: form.inspection_sessions?.inspection_date ?? "",
      departmentName: form.inspection_sessions?.departments?.name ?? "",
      inspectionTeam: form.inspection_sessions?.inspection_teams?.name ?? "",
      block: blockLabel(form.inspection_sessions?.departments?.block_type),
      month: form.inspection_sessions?.audit_periods?.month ?? null,
      quarter: form.inspection_sessions?.audit_periods?.quarter ?? null,
      year: form.inspection_sessions?.audit_periods?.year ?? null,
      periodStatus: form.inspection_sessions?.audit_periods?.status ?? "",
      status: form.status,
      totalScore: Number(form.total_score ?? 0),
      scoreRatio: Number(form.score_ratio ?? 0),
      classification: form.classification ?? classifyScore(Number(form.total_score ?? 0), Number(form.high_risk_count ?? 0) > 0),
      highRiskCount: Number(form.high_risk_count ?? 0),
      submittedAt: form.submitted_at ?? "",
      lockedAt: form.locked_at ?? ""
    }))
  };
}

export async function listPublicHighRiskFindings() {
  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      items: auditScores.filter((score) => score.riskLevel === "nguy cơ cao")
    };
  }

  const scores = await selectInspectionScores();
  return {
    mode: "supabase" as const,
    items: scores
      .filter((score) => score.risk_level === "cao" || score.risk_level === "nghiem_trong")
      .map(mapScoreResult)
  };
}

function selectInspectionForms() {
  return supabaseRest.select<DbInspectionFormResult[]>("inspection_forms", {
    select: "id,total_score,score_ratio,classification,high_risk_count,status,submitted_at,locked_at,inspection_sessions(inspection_date,status,departments(id,name,block_type),inspection_teams(name),audit_periods(month,quarter,year,status))",
    order: "submitted_at.desc"
  });
}

function selectInspectionScores() {
  return supabaseRest.select<DbInspectionScoreResult[]>("inspection_scores", {
    select: "id,score,max_score,score_ratio,deduction_reason,finding,risk_level,correction_request,responsible_department,responsible_person,due_date,capa_status,updated_at,inspection_forms(id,inspection_sessions(inspection_date,departments(name,block_type),inspection_teams(name))),form_criteria_items(group_code,group_name,content,source_sheet,source_row)",
    order: "updated_at.desc"
  });
}

function mapFormResult(form: DbInspectionFormResult) {
  const totalScore = Number(form.total_score ?? 0);
  const highRiskCount = Number(form.high_risk_count ?? 0);
  return {
    id: form.id,
    inspectionDate: form.inspection_sessions?.inspection_date ?? "",
    departmentId: form.inspection_sessions?.departments?.id ?? "",
    departmentName: form.inspection_sessions?.departments?.name ?? "",
    block: blockLabel(form.inspection_sessions?.departments?.block_type),
    inspectionTeam: form.inspection_sessions?.inspection_teams?.name ?? "",
    status: form.status,
    totalScore,
    scoreRatio: Number(form.score_ratio ?? 0),
    classification: form.classification ?? classifyScore(totalScore, highRiskCount > 0),
    highRiskCount,
    month: form.inspection_sessions?.audit_periods?.month ?? null,
    quarter: form.inspection_sessions?.audit_periods?.quarter ?? null,
    year: form.inspection_sessions?.audit_periods?.year ?? null
  };
}

function mapScoreResult(score: DbInspectionScoreResult) {
  return {
    id: score.id,
    inspectionFormId: score.inspection_forms?.id ?? "",
    inspectionDate: score.inspection_forms?.inspection_sessions?.inspection_date ?? "",
    departmentName: score.inspection_forms?.inspection_sessions?.departments?.name ?? "",
    block: blockLabel(score.inspection_forms?.inspection_sessions?.departments?.block_type),
    inspectionTeam: score.inspection_forms?.inspection_sessions?.inspection_teams?.name ?? "",
    criteriaGroupCode: score.form_criteria_items?.group_code ?? "",
    criteriaGroupName: score.form_criteria_items?.group_name ?? "",
    criteriaContent: score.form_criteria_items?.content ?? "",
    sourceSheet: score.form_criteria_items?.source_sheet ?? "",
    sourceRow: score.form_criteria_items?.source_row ?? null,
    score: Number(score.score),
    maxScore: Number(score.max_score),
    scoreRatio: Number(score.score_ratio),
    deductionReason: score.deduction_reason ?? "",
    finding: score.finding ?? "",
    riskLevel: riskLabel(score.risk_level),
    correctionRequest: score.correction_request ?? "",
    responsibleDepartment: score.responsible_department ?? "",
    responsiblePerson: score.responsible_person ?? "",
    dueDate: score.due_date ?? "",
    capaStatus: capaStatusLabel(score.capa_status),
    updatedAt: score.updated_at
  };
}

function classifyScore(score: number, hasHighRisk: boolean) {
  if (hasHighRisk && score < 80) return "Không đạt";
  if (score >= 90) return "Đạt tốt";
  if (score >= 80) return "Đạt";
  if (score >= 65) return "Cần cải tiến";
  return "Không đạt";
}

function blockLabel(value?: string | null) {
  if (value === "administrative") return "Hành chính";
  if (value === "paraclinical") return "Cận lâm sàng";
  return "Lâm sàng";
}

function riskLabel(value: string) {
  if (value === "cao") return "Cao";
  if (value === "nghiem_trong") return "Nghiêm trọng";
  if (value === "trung_binh") return "Trung bình";
  if (value === "thap") return "Thấp";
  return "Không";
}

function capaStatusLabel(value: string) {
  if (value === "chua_thuc_hien") return "Chưa thực hiện";
  if (value === "dang_thuc_hien") return "Đang thực hiện";
  if (value === "da_hoan_thanh") return "Đã hoàn thành";
  if (value === "qua_han") return "Quá hạn";
  return "Không áp dụng";
}
