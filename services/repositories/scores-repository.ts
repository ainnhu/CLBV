import { formCriteriaItems } from "../../src/lib/mock-data";
import { assertCanScoreCriteria, type SessionUser } from "../access-control";
import { createAuditLogEntry } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

export type SaveScoreInput = {
  inspectionFormId?: string;
  formCriteriaItemId: string;
  score: number;
  maxScore: number;
  deductionReason?: string;
  finding?: string;
  evidenceText?: string;
  riskLevel?: string;
  correctionRequest?: string;
  responsibleDepartment?: string;
  responsiblePerson?: string;
  dueDate?: string;
  note?: string;
};

export async function saveInspectionScore(user: SessionUser | null, input: SaveScoreInput) {
  const criteria = formCriteriaItems.find((item) => item.id === input.formCriteriaItemId);
  assertCanScoreCriteria(user, input.formCriteriaItemId);

  if (input.score < 0 || input.score > input.maxScore) {
    throw new Error("Điểm đạt phải từ 0 đến điểm tối đa.");
  }
  if (input.score < input.maxScore && !input.deductionReason && !input.finding) {
    throw new Error("Điểm thấp hơn điểm tối đa phải nhập phát hiện/tồn tại hoặc lý do trừ điểm.");
  }
  if (
    (input.riskLevel === "Cao" || input.riskLevel === "Nghiêm trọng") &&
    (!input.correctionRequest || !input.dueDate || !input.responsiblePerson)
  ) {
    throw new Error("Nguy cơ cao/nghiêm trọng phải có yêu cầu khắc phục, thời hạn và người chịu trách nhiệm.");
  }

  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "score:update",
    module: "Chấm điểm",
    entityType: "inspection_scores",
    entityId: input.formCriteriaItemId,
    newValue: input
  });

  if (getSupabaseMode() === "supabase") {
    const [saved] = await supabaseRest.insert<Record<string, unknown>[]>("inspection_scores", {
      inspection_form_id: input.inspectionFormId,
      form_criteria_item_id: input.formCriteriaItemId,
      assigned_user_id: user?.id,
      score: input.score,
      max_score: input.maxScore,
      deduction_reason: input.deductionReason ?? "",
      finding: input.finding ?? "",
      evidence_text: input.evidenceText ?? "",
      risk_level: mapRiskLevel(input.riskLevel),
      correction_request: input.correctionRequest ?? "",
      responsible_department: input.responsibleDepartment ?? "",
      responsible_person: input.responsiblePerson ?? "",
      due_date: input.dueDate || null,
      note: input.note ?? ""
    });
    await supabaseRest.insert("audit_logs", auditLog);
    return { mode: "supabase" as const, saved, auditLog };
  }

  return {
    mode: "mock" as const,
    saved: {
      criteria: criteria?.content ?? input.formCriteriaItemId,
      score: input.score,
      maxScore: input.maxScore,
      ratio: input.maxScore ? Math.round((input.score / input.maxScore) * 100) : 0
    },
    auditLog
  };
}

function mapRiskLevel(value?: string) {
  if (value === "Cao") return "cao";
  if (value === "Nghiêm trọng") return "nghiem_trong";
  if (value === "Trung bình") return "trung_binh";
  if (value === "Thấp") return "thap";
  return "khong";
}
