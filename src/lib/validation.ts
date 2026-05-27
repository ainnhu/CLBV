import { z } from "zod";

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

export type CapaUpdateValidationInput = {
  inspectionScoreId?: unknown;
  status?: unknown;
  updateContent?: unknown;
  evidenceUrl?: unknown;
};

export type ValidatedCapaUpdateInput = {
  inspectionScoreId: string;
  status: "Chưa thực hiện" | "Đang thực hiện" | "Đã hoàn thành" | "Quá hạn" | "Không áp dụng";
  updateContent: string;
  evidenceUrl?: string;
};

const optionalText = z.preprocess((value) => {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}, z.string().optional());

const requiredText = (label: string) => z.preprocess((value) => {
  if (value == null) return "";
  return String(value).trim();
}, z.string().min(1, `${label} không được để trống.`));

const numberFromInput = (label: string) => z.preprocess((value) => Number(value), z.number({
  error: `${label} phải là số hợp lệ.`
}));

const scorePayloadSchema = z.object({
  inspectionFormId: optionalText,
  formCriteriaItemId: requiredText("Mã tiêu chí"),
  score: numberFromInput("Điểm đạt"),
  maxScore: numberFromInput("Điểm tối đa"),
  deductionReason: optionalText,
  finding: optionalText,
  evidenceText: optionalText,
  riskLevel: z.preprocess((value) => String(value ?? "Không").trim() || "Không", z.string()),
  correctionRequest: optionalText,
  dueDate: optionalText,
  responsibleDepartment: optionalText,
  responsiblePerson: optionalText,
  note: optionalText
}).superRefine((data, context) => {
  if (data.maxScore <= 0) {
    context.addIssue({ code: "custom", path: ["maxScore"], message: "Điểm tối đa phải lớn hơn 0." });
  }
  if (data.score < 0 || data.score > data.maxScore) {
    context.addIssue({ code: "custom", path: ["score"], message: "Điểm đạt phải từ 0 đến điểm tối đa." });
  }
  if (data.score < data.maxScore && !data.deductionReason && !data.finding) {
    context.addIssue({ code: "custom", path: ["deductionReason"], message: "Điểm thấp hơn điểm tối đa phải nhập phát hiện/tồn tại hoặc lý do trừ điểm." });
  }
  if ((data.riskLevel === "Cao" || data.riskLevel === "Nghiêm trọng") && (!data.correctionRequest || !data.dueDate || (!data.responsiblePerson && !data.responsibleDepartment))) {
    context.addIssue({ code: "custom", path: ["riskLevel"], message: "Nguy cơ cao/nghiêm trọng phải có yêu cầu khắc phục, thời hạn và người/bộ phận chịu trách nhiệm." });
  }
});

const capaUpdateSchema = z.object({
  inspectionScoreId: requiredText("Mã phát hiện/CAPA"),
  status: z.enum(["Chưa thực hiện", "Đang thực hiện", "Đã hoàn thành", "Quá hạn", "Không áp dụng"], {
    error: "Trạng thái CAPA không hợp lệ."
  }),
  updateContent: requiredText("Nội dung cập nhật khắc phục"),
  evidenceUrl: optionalText
});

export function validateScorePayload(input: unknown): ValidationResult<ValidatedScoreInput> {
  const parsed = scorePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  return {
    ok: true,
    data: parsed.data
  };
}

export function validateCapaUpdatePayload(input: unknown): ValidationResult<ValidatedCapaUpdateInput> {
  const parsed = capaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }
  return { ok: true, data: parsed.data };
}

export function validateRequiredText(value: unknown, label: string): string | null {
  return hasText(value) ? null : `${label} không được để trống.`;
}

function hasText(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : value != null && String(value).trim().length > 0;
}
