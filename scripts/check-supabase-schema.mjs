import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve(process.cwd(), "database", "supabase-schema.sql");
const schema = readFileSync(schemaPath, "utf8");
const compactSchema = schema.toLowerCase().replace(/\s+/g, " ");

const requiredTables = [
  "profiles",
  "departments",
  "inspection_teams",
  "form_templates",
  "form_header_fields",
  "criteria_groups",
  "form_criteria_items",
  "audit_periods",
  "inspection_sessions",
  "inspection_forms",
  "inspection_assignments",
  "inspection_scores",
  "score_attachments",
  "capa_updates",
  "report_exports",
  "report_files",
  "import_batches",
  "import_warnings",
  "audit_logs"
];

const publicReadTables = [
  "departments",
  "inspection_teams",
  "form_templates",
  "form_header_fields",
  "criteria_groups",
  "form_criteria_items",
  "audit_periods",
  "inspection_sessions",
  "inspection_forms",
  "inspection_assignments",
  "inspection_scores",
  "score_attachments",
  "capa_updates",
  "report_exports",
  "report_files"
];

const requiredTypes = [
  "app_role",
  "block_type",
  "form_type",
  "period_status",
  "form_status",
  "risk_level",
  "capa_status"
];

const requiredFunctions = [
  "set_updated_at",
  "current_app_role",
  "can_manage_system",
  "can_score_item"
];

const requiredPolicies = [
  "public_read_departments",
  "public_read_teams",
  "public_read_templates",
  "public_read_header_fields",
  "public_read_groups",
  "public_read_criteria",
  "public_read_periods",
  "public_read_sessions",
  "public_read_forms",
  "public_read_assignments",
  "public_read_scores",
  "public_read_score_attachments",
  "public_read_capa",
  "public_read_reports",
  "public_read_report_files",
  "manage_departments",
  "manage_teams",
  "manage_templates",
  "manage_header_fields",
  "manage_criteria_groups",
  "manage_criteria_items",
  "manage_periods",
  "manage_sessions",
  "manage_assignments",
  "import_by_admin_khth",
  "import_warning_by_admin_khth",
  "export_by_admin_khth",
  "export_files_by_admin_khth",
  "insert_score_by_assignment",
  "update_score_by_assignment",
  "update_capa_by_allowed_roles",
  "attachments_by_authenticated",
  "insert_audit_logs_authenticated",
  "read_audit_logs_admin_khth"
];

const requiredChecks = [
  "score_bounds",
  "deduction_requires_reason",
  "high_risk_requires_correction"
];

const checks = [
  ...requiredTypes.map((typeName) => ({
    name: `type ${typeName} exists`,
    pass: compactSchema.includes(`create type ${typeName} as enum`)
  })),
  ...requiredTables.map((tableName) => ({
    name: `table ${tableName} exists`,
    pass: compactSchema.includes(`create table ${tableName} `)
  })),
  ...requiredTables.map((tableName) => ({
    name: `RLS enabled on ${tableName}`,
    pass: compactSchema.includes(`alter table ${tableName} enable row level security`)
  })),
  ...requiredFunctions.map((functionName) => ({
    name: `function ${functionName} exists`,
    pass: compactSchema.includes(`function ${functionName}(`)
  })),
  ...requiredPolicies.map((policyName) => ({
    name: `policy ${policyName} exists`,
    pass: compactSchema.includes(`create policy ${policyName} `)
  })),
  ...requiredChecks.map((checkName) => ({
    name: `constraint ${checkName} exists`,
    pass: compactSchema.includes(`constraint ${checkName} check`)
  })),
  ...publicReadTables.map((tableName) => ({
    name: `anon select grant covers ${tableName}`,
    pass: compactSchema.includes(`${tableName},`) || compactSchema.includes(`${tableName} to anon`)
  })),
  {
    name: "no anonymous write grant",
    pass: !/\bgrant\s+(insert|update|delete|all)\b[\s\S]*?\bto\s+anon\b/i.test(schema)
  },
  {
    name: "authenticated write grant exists",
    pass: /\bgrant\s+insert,\s*update\b[\s\S]*?\bto\s+authenticated\b/i.test(schema)
  },
  {
    name: "score assignment function is used by score insert policy",
    pass: /create policy insert_score_by_assignment[\s\S]*?can_score_item/i.test(schema)
  },
  {
    name: "score assignment function is used by score update policy",
    pass: /create policy update_score_by_assignment[\s\S]*?can_score_item/i.test(schema)
  },
  {
    name: "report exports public read is limited to published/exported",
    pass: /create policy public_read_reports[\s\S]*?status in \('published', 'exported'\)/i.test(schema)
  }
];

let failed = 0;
console.log(`Supabase schema check: ${schemaPath}`);

for (const check of checks) {
  if (check.pass) {
    console.log(`PASS ${check.name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${check.name}`);
  }
}

if (failed > 0) {
  console.error(`Supabase schema check failed: ${failed}/${checks.length}`);
  process.exit(1);
}

console.log(`Supabase schema check passed: ${checks.length}/${checks.length}`);
