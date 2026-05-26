import { formCriteriaItems, formTemplates } from "../../src/lib/mock-data";
import type { FormCriteriaItem, FormTemplate } from "../../src/lib/types";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

type DbFormTemplate = {
  id: string;
  name: string;
  source_file: string;
  source_sheet: string;
  source_row: number | null;
  form_type: "LS_CLS" | "HANH_CHINH";
  department_id: string;
  department_code: string;
  department_name: string;
  block_type: string;
  inspection_team_name: string;
  version: string;
  total_score: number;
  criteria_count: number;
};

type DbCriteriaItem = {
  id: string;
  form_template_id: string;
  source_file: string;
  source_sheet: string;
  source_row: number;
  form_type: "LS_CLS" | "HANH_CHINH";
  department_code: string;
  department_name: string;
  inspection_team_name: string;
  version: string;
  order_index: number;
  group_code: string;
  group_name: string;
  content: string;
  evidence_required: string;
  max_score: number;
  team1_assignee: string;
  team2_assignee: string;
  is_high_risk_related: boolean;
};

type DbHeaderField = {
  id: string;
  form_template_id: string;
  field_key: string;
  field_label: string;
  default_value: string | null;
  source_cell: string | null;
  order_index: number;
};

function mapHeaderField(row: DbHeaderField) {
  return {
    key: row.field_key,
    label: row.field_label,
    value: row.default_value ?? "",
    sourceCell: row.source_cell ?? undefined
  };
}

function mapTemplate(row: DbFormTemplate, headerFields: DbHeaderField[] = []): FormTemplate {
  return {
    id: row.id,
    name: row.name,
    sourceFile: row.source_file,
    sourceSheet: row.source_sheet,
    sourceRow: row.source_row ?? undefined,
    formType: row.form_type,
    departmentId: row.department_id,
    departmentCode: row.department_code,
    departmentName: row.department_name,
    block: row.block_type === "administrative" ? "Hành chính" : row.block_type === "paraclinical" ? "Cận lâm sàng" : "Lâm sàng",
    inspectionTeam: row.inspection_team_name,
    version: row.version,
    totalScore: Number(row.total_score),
    criteriaCount: Number(row.criteria_count),
    headerFields: headerFields.sort((a, b) => a.order_index - b.order_index).map(mapHeaderField)
  };
}

function mapCriteria(row: DbCriteriaItem): FormCriteriaItem {
  return {
    id: row.id,
    formTemplateId: row.form_template_id,
    criteriaId: row.id,
    sourceFile: row.source_file,
    sourceSheet: row.source_sheet,
    sourceRow: row.source_row,
    formType: row.form_type,
    departmentCode: row.department_code,
    departmentName: row.department_name,
    inspectionTeam: row.inspection_team_name,
    version: row.version,
    order: row.order_index,
    groupCode: row.group_code,
    groupName: row.group_name,
    content: row.content,
    evidenceRequired: row.evidence_required,
    maxScore: Number(row.max_score),
    team1Assignee: row.team1_assignee,
    team2Assignee: row.team2_assignee,
    isHighRiskRelated: row.is_high_risk_related
  };
}

export async function listFormTemplates() {
  if (getSupabaseMode() === "mock") {
    return { mode: "mock" as const, templates: formTemplates };
  }

  const rows = await supabaseRest.select<DbFormTemplate[]>("form_templates", {
    select: "*",
    is_active: "eq.true",
    order: "department_name.asc"
  });

  const headerFields = rows.length
    ? await supabaseRest.select<DbHeaderField[]>("form_header_fields", {
        select: "*",
        form_template_id: `in.(${rows.map((row) => row.id).join(",")})`,
        order: "order_index.asc"
      })
    : [];
  const headerFieldsByTemplate = groupHeaderFields(headerFields);

  return {
    mode: "supabase" as const,
    templates: rows.map((row) => mapTemplate(row, headerFieldsByTemplate.get(row.id) ?? []))
  };
}

export async function getFormTemplateWithCriteria(templateId: string) {
  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      template: formTemplates.find((template) => template.id === templateId) ?? null,
      criteria: formCriteriaItems.filter((item) => item.formTemplateId === templateId)
    };
  }

  const [template] = await supabaseRest.select<DbFormTemplate[]>("form_templates", {
    select: "*",
    id: `eq.${templateId}`,
    limit: 1
  });
  const criteria = await supabaseRest.select<DbCriteriaItem[]>("form_criteria_items", {
    select: "*",
    form_template_id: `eq.${templateId}`,
    order: "order_index.asc"
  });
  const headerFields = await supabaseRest.select<DbHeaderField[]>("form_header_fields", {
    select: "*",
    form_template_id: `eq.${templateId}`,
    order: "order_index.asc"
  });

  return {
    mode: "supabase" as const,
    template: template ? mapTemplate(template, headerFields) : null,
    criteria: criteria.map(mapCriteria)
  };
}

function groupHeaderFields(rows: DbHeaderField[]) {
  return rows.reduce((map, row) => {
    const current = map.get(row.form_template_id) ?? [];
    current.push(row);
    map.set(row.form_template_id, current);
    return map;
  }, new Map<string, DbHeaderField[]>());
}
