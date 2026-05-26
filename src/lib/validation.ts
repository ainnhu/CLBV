export type ValidationResult<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  errors: string[];
};

export type ScoreValidationInput = {
  inspectionFormId?: string;
  formCriteriaItemId?: string;
  score?: unknown;
  maxScore?: unknown;
  deductionReason?: string;
  finding?: string;
  evidenceText?: string;
  riskLevel?: string;
  correctionRequest?: string;
  dueDate?: string;
  responsibleDepartment?: string;
  responsiblePerson?: string;
  note?: string;
};

export type ValidatedScoreInput = {
  inspectionFormId?: string;
  formCriteriaItemId: string;
  score: number;
  maxScore: number;
  deductionReason?: string;
  finding?: string;
  evidenceText?: string;
  riskLevel?: string;
  correctionRequest?: string;
  dueDate?: string;
  responsibleDepartment?: string;
  responsiblePerson?: string;
  note?: string;
};

export function validateScorePayload(input: ScoreValidationInput): ValidationResult<ValidatedScoreInput> {
  const errors: string[] = [];
  const score = Number(input.score);
  const maxScore = Number(input.maxScore);
  const riskLevel = input.riskLevel?.trim() || "Không";

  if (!input.formCriteriaItemId?.trim()) {
    errors.push("Thiếu mã tiêu chí cần chấm.");
  }
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    errors.push("Điểm đạt và điểm tối đa phải là số hợp lệ.");
  }
  if (Number.isFinite(score) && Number.isFinite(maxScore) && (score < 0 || score > maxScore)) {
    errors.push("Điểm đạt phải từ 0 đến điểm tối đa.");
  }
  if (Number.isFinite(score) && Number.isFinite(maxScore) && score < maxScore && !hasText(input.deductionReason) && !hasText(input.finding)) {
    errors.push("Điểm thấp hơn điểm tối đa phải nhập phát hiện/tồn tại hoặc lý do trừ điểm.");
  }
  if ((riskLevel === "Cao" || riskLevel === "Nghiêm trọng") && (!hasText(input.correctionRequest) || !hasText(input.dueDate) || (!hasText(input.responsiblePerson) && !hasText(input.responsibleDepartment)))) {
    errors.push("Nguy cơ cao/nghiêm trọng phải có yêu cầu khắc phục, thời hạn và người/bộ phận chịu trách nhiệm.");
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      formCriteriaItemId: input.formCriteriaItemId!.trim(),
      inspectionFormId: clean(input.inspectionFormId),
      score,
      maxScore,
      deductionReason: clean(input.deductionReason),
      finding: clean(input.finding),
      evidenceText: clean(input.evidenceText),
      riskLevel,
      correctionRequest: clean(input.correctionRequest),
      dueDate: clean(input.dueDate),
      responsibleDepartment: clean(input.responsibleDepartment),
      responsiblePerson: clean(input.responsiblePerson),
      note: clean(input.note)
    }
  };
}

export function validateRequiredText(value: unknown, label: string): string | null {
  return hasText(value) ? null : `${label} không được để trống.`;
}

function hasText(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : value != null && String(value).trim().length > 0;
}

function clean(value?: string) {
  const text = value?.trim();
  return text || undefined;
}
