import { randomUUID } from "crypto";
import { importAuditWorkbook, type ImportResult, type ImportedCriteriaItem, type ImportedFormTemplate } from "../../import/excel-import";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry, toAuditLogRow } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

export type ImportWorkbookInput = {
  fileName: string;
  fileType: string;
  buffer: ArrayBuffer;
};

export type PreparedImportBatch = {
  id: string;
  fileName: string;
  fileType: string;
  status: "parsed" | "warning" | "ready_to_review";
  summary: {
    templates: number;
    criteriaItems: number;
    warnings: number;
  };
  templates: ImportedFormTemplate[];
  criteriaItems: ImportedCriteriaItem[];
  warnings: Array<{
    type: string;
    sourceFile: string;
    sourceSheet?: string;
    sourceRow?: number;
    message: string;
  }>;
};

export type CommitImportBatchInput = {
  batchId: string;
  fileName: string;
  fileType: string;
  templates: ImportedFormTemplate[];
  criteriaItems: ImportedCriteriaItem[];
  warnings?: PreparedImportBatch["warnings"];
  allowWarnings?: boolean;
  importMode?: "upsert_version" | "append_new_version";
  version?: string;
};

export async function prepareImportWorkbook(user: SessionUser | null, input: ImportWorkbookInput) {
  assertCanWrite(user, "excel:import");

  const parsed = importAuditWorkbook(input.fileName, input.buffer);
  const batch = buildImportBatch(input.fileName, input.fileType, parsed);
  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "excel:import:prepare",
    module: "Import Excel",
    entityType: "import_batches",
    entityId: batch.id,
    newValue: batch.summary
  });

  if (getSupabaseMode() === "supabase") {
    const [savedBatch] = await supabaseRest.insert<Record<string, unknown>[]>("import_batches", {
      id: batch.id,
      file_name: batch.fileName,
      file_type: batch.fileType,
      imported_by: user?.id,
      status: batch.status,
      summary_json: batch.summary,
      error_log: batch.warnings.map((warning) => warning.message).join("\n")
    });

    if (batch.warnings.length) {
      await supabaseRest.insert(
        "import_warnings",
        batch.warnings.map((warning) => ({
          import_batch_id: batch.id,
          warning_type: warning.type,
          source_file: warning.sourceFile,
          source_sheet: warning.sourceSheet ?? "",
          source_row: warning.sourceRow ?? null,
          message: warning.message
        }))
      );
    }

    await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));
    return { mode: "supabase" as const, batch: { ...batch, savedBatch }, auditLog };
  }

  return { mode: "mock" as const, batch, auditLog };
}

export async function commitImportBatch(user: SessionUser | null, input: CommitImportBatchInput) {
  assertCanWrite(user, "excel:import");

  const warningCount = input.warnings?.length ?? 0;
  if (warningCount > 0 && !input.allowWarnings) {
    throw new Error("Import batch còn cảnh báo, cần rà soát hoặc bật allowWarnings trước khi ghi chính thức.");
  }

  const version = input.version ?? "V03-1805";
  const importMode = input.importMode ?? "upsert_version";
  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "excel:import:commit",
    module: "Import Excel",
    entityType: "import_batches",
    entityId: input.batchId,
    newValue: {
      importMode,
      version,
      templates: input.templates.length,
      criteriaItems: input.criteriaItems.length,
      warnings: warningCount
    }
  });

  if (getSupabaseMode() === "supabase") {
    const departments = await supabaseRest.select<Array<{ id: string; name: string; block_type: string }>>("departments", {
      select: "id,name,block_type"
    });
    const departmentByName = new Map(departments.map((department) => [normalizeLookup(department.name), department]));

    const templateRows = input.templates.map((template) => {
      const department = departmentByName.get(normalizeLookup(template.departmentName));
      if (!department) {
        throw new Error(`Không tìm thấy khoa/phòng trong Supabase: ${template.departmentName}`);
      }
      return {
        name: `Phiếu kiểm tra và chấm điểm - ${template.departmentName}`,
        source_file: template.sourceFile,
        source_sheet: template.sourceSheet,
        source_row: 1,
        form_type: template.formType,
        department_id: department.id,
        department_code: template.departmentCode,
        department_name: template.departmentName,
        block_type: department.block_type,
        inspection_team_name: template.inspectionTeam,
        version,
        total_score: template.totalScore,
        criteria_count: template.criteriaCount,
        is_active: true
      };
    });

    const savedTemplates =
      importMode === "upsert_version"
        ? await supabaseRest.upsert<Array<{ id: string; source_file: string; source_sheet: string; inspection_team_name: string }>>(
            "form_templates",
            templateRows,
            "source_file,source_sheet,inspection_team_name,version"
          )
        : await supabaseRest.insert<Array<{ id: string; source_file: string; source_sheet: string; inspection_team_name: string }>>(
            "form_templates",
            templateRows
          );

    const templateIdBySource = new Map(
      savedTemplates.map((template) => [templateSourceKey(template.source_file, template.source_sheet, template.inspection_team_name), template.id])
    );

    const headerRows = input.templates.flatMap((template) => {
      const templateId = templateIdBySource.get(templateSourceKey(template.sourceFile, template.sourceSheet, template.inspectionTeam));
      if (!templateId) {
        throw new Error(`Không tìm thấy form_template để lưu đầu phiếu ${template.sourceFile}/${template.sourceSheet}`);
      }
      return template.headerFields.map((field) => ({
        form_template_id: templateId,
        field_key: field.key,
        field_label: field.label,
        default_value: field.value,
        source_cell: field.sourceCell,
        order_index: field.orderIndex
      }));
    });
    const savedHeaderFields = headerRows.length
      ? await supabaseRest.upsert<Array<{ id: string }>>("form_header_fields", headerRows, "form_template_id,field_key")
      : [];

    const criteriaRows = input.criteriaItems.map((item) => {
      const template = input.templates.find((candidate) => candidate.sourceFile === item.sourceFile && candidate.sourceSheet === item.sourceSheet);
      const templateId = template ? templateIdBySource.get(templateSourceKey(template.sourceFile, template.sourceSheet, template.inspectionTeam)) : undefined;
      if (!template || !templateId) {
        throw new Error(`Không tìm thấy form_template cho tiêu chí ${item.sourceFile}/${item.sourceSheet}/${item.sourceRow}`);
      }

      return {
        form_template_id: templateId,
        source_file: item.sourceFile,
        source_sheet: item.sourceSheet,
        source_row: item.sourceRow,
        form_type: template.formType,
        department_code: template.departmentCode,
        department_name: template.departmentName,
        inspection_team_name: template.inspectionTeam,
        version,
        order_index: item.order,
        group_code: item.groupCode,
        group_name: item.groupName,
        content: item.content,
        evidence_required: item.evidenceRequired,
        max_score: item.maxScore,
        team1_assignee: item.team1Assignee,
        team2_assignee: item.team2Assignee,
        is_high_risk_related: isHighRiskContent(item.content)
      };
    });

    const savedCriteria =
      importMode === "upsert_version"
        ? await supabaseRest.upsert<Array<{ id: string }>>("form_criteria_items", criteriaRows, "form_template_id,source_row")
        : await supabaseRest.insert<Array<{ id: string }>>("form_criteria_items", criteriaRows);

    await supabaseRest.update("import_batches", { id: `eq.${input.batchId}` }, { status: "committed" });
    await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));

    return {
      mode: "supabase" as const,
      committed: {
        batchId: input.batchId,
        importMode,
        version,
        templates: savedTemplates.length,
        headerFields: savedHeaderFields.length,
        criteriaItems: savedCriteria.length,
        warnings: warningCount
      },
      auditLog
    };
  }

  return {
    mode: "mock" as const,
    committed: {
      batchId: input.batchId,
      importMode,
      version,
      templates: input.templates.length,
      headerFields: input.templates.reduce((sum, template) => sum + template.headerFields.length, 0),
      criteriaItems: input.criteriaItems.length,
      warnings: warningCount
    },
    auditLog
  };
}

function buildImportBatch(fileName: string, fileType: string, parsed: ImportResult): PreparedImportBatch {
  const warnings = parsed.warnings.map((message) => {
    const [source, ...rest] = message.split(":");
    const [sourceFile, sourceSheet] = source.includes("/") ? source.split("/") : [fileName, undefined];
    return {
      type: "validation",
      sourceFile: sourceFile || fileName,
      sourceSheet,
      message: rest.length ? rest.join(":").trim() : message
    };
  });

  return {
    id: createBatchId(),
    fileName,
    fileType,
    status: warnings.length ? "warning" : "ready_to_review",
    summary: {
      templates: parsed.templates.length,
      criteriaItems: parsed.criteriaItems.length,
      warnings: warnings.length
    },
    templates: parsed.templates,
    criteriaItems: parsed.criteriaItems,
    warnings
  };
}

function createBatchId() {
  return randomUUID();
}

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function templateSourceKey(file: string, sheet: string, team: string) {
  return `${file}::${sheet}::${team}`;
}

function isHighRiskContent(content: string) {
  const key = normalizeLookup(content);
  return ["cap cuu", "thuoc", "nhiem khuan", "an toan", "ho so", "bao mat", "an ninh", "tai san"].some((keyword) =>
    key.includes(keyword)
  );
}
