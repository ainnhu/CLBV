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

export type CatalogValidationInput = {
  entity?: unknown;
  id?: unknown;
  name?: unknown;
  shortName?: unknown;
  block?: unknown;
  description?: unknown;
  active?: unknown;
};

export type ValidatedCatalogInput = {
  entity: "department" | "inspection_team";
  id?: string;
  name?: string;
  shortName?: string;
  block?: "Lâm sàng" | "Cận lâm sàng" | "Hành chính";
  description?: string;
  active?: boolean;
};

export type InspectionSessionValidationInput = {
  periodId?: unknown;
  inspectionDate?: unknown;
  inspectionTeamId?: unknown;
  departmentId?: unknown;
  formTemplateId?: unknown;
  receptionPerson?: unknown;
  leaderName?: unknown;
  startedAt?: unknown;
  endedAt?: unknown;
  preliminaryConclusion?: unknown;
};

export type ValidatedInspectionSessionInput = {
  periodId: string;
  inspectionDate: string;
  inspectionTeamId?: string;
  departmentId?: string;
  formTemplateId: string;
  receptionPerson?: string;
  leaderName?: string;
  startedAt?: string;
  endedAt?: string;
  preliminaryConclusion?: string;
};

export type AssignmentValidationInput = {
  inspectionSessionId?: unknown;
  inspectionTeamId?: unknown;
  userId?: unknown;
  formCriteriaItemIds?: unknown;
  departmentId?: unknown;
  blockType?: unknown;
  note?: unknown;
};

export type ValidatedAssignmentInput = {
  inspectionSessionId: string;
  inspectionTeamId?: string;
  userId: string;
  formCriteriaItemIds: string[];
  departmentId?: string;
  blockType: "clinical" | "paraclinical" | "administrative";
  note?: string;
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

const catalogSchema = z.object({
  entity: z.enum(["department", "inspection_team"], {
    error: "Loại danh mục không hợp lệ."
  }),
  id: optionalText,
  name: optionalText,
  shortName: optionalText,
  block: z.enum(["Lâm sàng", "Cận lâm sàng", "Hành chính"], {
    error: "Khối khoa/phòng không hợp lệ."
  }).optional(),
  description: optionalText,
  active: z.boolean().optional()
});

const catalogCreateSchema = catalogSchema.superRefine((data, context) => {
  if (!data.name) {
    context.addIssue({ code: "custom", path: ["name"], message: "Tên danh mục không được để trống." });
  }
  if (data.entity === "department" && !data.block) {
    context.addIssue({ code: "custom", path: ["block"], message: "Khoa/phòng phải chọn khối." });
  }
});

const catalogUpdateSchema = catalogSchema.superRefine((data, context) => {
  if (!data.id) {
    context.addIssue({ code: "custom", path: ["id"], message: "Thiếu mã danh mục cần cập nhật." });
  }
  if (data.entity === "department" && data.block === undefined && data.name === undefined && data.shortName === undefined && data.active === undefined) {
    context.addIssue({ code: "custom", message: "Chưa có nội dung khoa/phòng cần cập nhật." });
  }
  if (data.entity === "inspection_team" && data.name === undefined && data.description === undefined && data.active === undefined) {
    context.addIssue({ code: "custom", message: "Chưa có nội dung đoàn kiểm tra cần cập nhật." });
  }
});

const catalogArchiveSchema = catalogSchema.superRefine((data, context) => {
  if (!data.id) {
    context.addIssue({ code: "custom", path: ["id"], message: "Thiếu mã danh mục cần ngưng sử dụng." });
  }
});

const isoDateText = (label: string) => requiredText(label).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} phải có dạng YYYY-MM-DD.`));

const optionalTimeText = z.preprocess((value) => {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}, z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Thời gian phải có dạng HH:mm hoặc HH:mm:ss.").optional());

const inspectionSessionSchema = z.object({
  periodId: requiredText("Kỳ kiểm tra"),
  inspectionDate: isoDateText("Ngày kiểm tra"),
  inspectionTeamId: optionalText,
  departmentId: optionalText,
  formTemplateId: requiredText("Mẫu phiếu kiểm tra"),
  receptionPerson: optionalText,
  leaderName: optionalText,
  startedAt: optionalTimeText,
  endedAt: optionalTimeText,
  preliminaryConclusion: optionalText
});

const assignmentSchema = z.object({
  inspectionSessionId: requiredText("Phiên kiểm tra"),
  inspectionTeamId: optionalText,
  userId: requiredText("Người được phân công"),
  formCriteriaItemIds: z.preprocess((value) => Array.isArray(value) ? value : [], z.array(requiredText("Tiêu chí được phân công")).min(1, "Phải chọn ít nhất 01 tiêu chí.")),
  departmentId: optionalText,
  blockType: z.enum(["clinical", "paraclinical", "administrative"], {
    error: "Khối khoa/phòng không hợp lệ."
  }),
  note: optionalText
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

export function validateCatalogPayload(input: unknown, mode: "create" | "update" | "archive"): ValidationResult<ValidatedCatalogInput> {
  const schema = mode === "create" ? catalogCreateSchema : mode === "archive" ? catalogArchiveSchema : catalogUpdateSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }
  return { ok: true, data: parsed.data };
}

export function validateInspectionSessionPayload(input: unknown): ValidationResult<ValidatedInspectionSessionInput> {
  const parsed = inspectionSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }
  return { ok: true, data: parsed.data };
}

export function validateAssignmentPayload(input: unknown): ValidationResult<ValidatedAssignmentInput> {
  const parsed = assignmentSchema.safeParse(input);
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
