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

export type ValidatedCommitImportInput = {
  batchId: string;
  fileName: string;
  fileType: string;
  templates: Array<{
    sourceFile: string;
    sourceSheet: string;
    formType: "LS_CLS" | "HANH_CHINH";
    departmentCode: string;
    departmentName: string;
    inspectionTeam: "Đoàn 01" | "Đoàn 02";
    totalScore: number;
    criteriaCount: number;
    headerFields: Array<{
      key: string;
      label: string;
      value: string;
      sourceCell: string;
      orderIndex: number;
    }>;
  }>;
  criteriaItems: Array<{
    sourceFile: string;
    sourceSheet: string;
    sourceRow: number;
    order: number;
    groupCode: string;
    groupName: string;
    content: string;
    evidenceRequired: string;
    maxScore: number;
    team1Assignee: string;
    team2Assignee: string;
  }>;
  warnings?: Array<{
    type: string;
    sourceFile: string;
    sourceSheet?: string;
    sourceRow?: number;
    message: string;
  }>;
  allowWarnings?: boolean;
  importMode?: "upsert_version" | "append_new_version";
  version?: string;
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

const positiveNumberFromInput = (label: string) => numberFromInput(label).pipe(z.number().positive(`${label} phải lớn hơn 0.`));
const nonNegativeNumberFromInput = (label: string) => numberFromInput(label).pipe(z.number().nonnegative(`${label} không được âm.`));

const importHeaderFieldSchema = z.object({
  key: requiredText("Mã trường đầu phiếu"),
  label: requiredText("Tên trường đầu phiếu"),
  value: z.preprocess((value) => String(value ?? "").trim(), z.string()),
  sourceCell: z.preprocess((value) => String(value ?? "").trim(), z.string()),
  orderIndex: nonNegativeNumberFromInput("Thứ tự trường đầu phiếu")
}).passthrough();

const importTemplateSchema = z.object({
  sourceFile: requiredText("Tên file nguồn"),
  sourceSheet: requiredText("Sheet nguồn"),
  formType: z.enum(["LS_CLS", "HANH_CHINH"], {
    error: "Loại phiếu import không hợp lệ."
  }),
  departmentCode: requiredText("Mã khoa/phòng"),
  departmentName: requiredText("Tên khoa/phòng"),
  inspectionTeam: z.enum(["Đoàn 01", "Đoàn 02"], {
    error: "Đoàn kiểm tra import không hợp lệ."
  }),
  totalScore: positiveNumberFromInput("Tổng điểm phiếu"),
  criteriaCount: positiveNumberFromInput("Số tiêu chí"),
  headerFields: z.preprocess((value) => Array.isArray(value) ? value : [], z.array(importHeaderFieldSchema))
}).passthrough();

const importCriteriaItemSchema = z.object({
  sourceFile: requiredText("Tên file nguồn của tiêu chí"),
  sourceSheet: requiredText("Sheet nguồn của tiêu chí"),
  sourceRow: positiveNumberFromInput("Dòng nguồn của tiêu chí"),
  order: positiveNumberFromInput("STT tiêu chí"),
  groupCode: optionalText.transform((value) => value ?? ""),
  groupName: optionalText.transform((value) => value ?? ""),
  content: requiredText("Nội dung tiêu chí"),
  evidenceRequired: optionalText.transform((value) => value ?? ""),
  maxScore: positiveNumberFromInput("Điểm tối đa tiêu chí"),
  team1Assignee: optionalText.transform((value) => value ?? ""),
  team2Assignee: optionalText.transform((value) => value ?? "")
}).passthrough();

const importWarningSchema = z.object({
  type: optionalText.transform((value) => value ?? "validation"),
  sourceFile: requiredText("File nguồn của cảnh báo"),
  sourceSheet: optionalText,
  sourceRow: z.preprocess((value) => value == null || value === "" ? undefined : Number(value), z.number().positive().optional()),
  message: requiredText("Nội dung cảnh báo")
}).passthrough();

const commitImportSchema = z.object({
  batchId: requiredText("Mã import batch"),
  fileName: requiredText("Tên file import"),
  fileType: requiredText("Loại file import"),
  templates: z.preprocess((value) => Array.isArray(value) ? value : [], z.array(importTemplateSchema).min(1, "Import batch phải có ít nhất 01 phiếu.")),
  criteriaItems: z.preprocess((value) => Array.isArray(value) ? value : [], z.array(importCriteriaItemSchema).min(1, "Import batch phải có ít nhất 01 tiêu chí.")),
  warnings: z.preprocess((value) => Array.isArray(value) ? value : [], z.array(importWarningSchema)).optional(),
  allowWarnings: z.boolean().optional(),
  importMode: z.enum(["upsert_version", "append_new_version"]).optional(),
  version: optionalText
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

export function validateCommitImportPayload(input: unknown): ValidationResult<ValidatedCommitImportInput> {
  const parsed = commitImportSchema.safeParse(input);
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
