import { auditPeriods, auditTeams, departments } from "../../src/lib/mock-data";
import type { DepartmentBlock } from "../../src/lib/types";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry, toAuditLogRow } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

type DbDepartment = {
  id: string;
  name: string;
  short_name: string | null;
  block_type: string;
  is_active: boolean;
};

type DbInspectionTeam = {
  id: string;
  name: string;
  description: string | null;
  is_active?: boolean | null;
};

type DbAuditPeriod = {
  id: string;
  month: number;
  quarter: number;
  year: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

export async function getPublicCatalog() {
  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      departments,
      auditTeams,
      auditPeriods
    };
  }

  const [departmentRows, teamRows, periodRows] = await Promise.all([
    supabaseRest.select<DbDepartment[]>("departments", {
      select: "id,name,short_name,block_type,is_active",
      order: "block_type.asc,name.asc"
    }),
    supabaseRest.select<DbInspectionTeam[]>("inspection_teams", {
      select: "id,name,description,is_active",
      order: "name.asc"
    }),
    supabaseRest.select<DbAuditPeriod[]>("audit_periods", {
      select: "id,month,quarter,year,start_date,end_date,status,created_at",
      order: "year.asc,month.asc"
    })
  ]);

  return {
    mode: "supabase" as const,
    departments: departmentRows.map((row) => ({
      id: row.id,
      name: row.name,
      shortName: row.short_name ?? "",
      block: blockLabel(row.block_type),
      active: row.is_active
    })),
    auditTeams: teamRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      active: row.is_active ?? true
    })),
    auditPeriods: periodRows.map((row) => ({
      id: row.id,
      month: row.month,
      quarter: row.quarter,
      year: row.year,
      startDate: row.start_date,
      endDate: row.end_date,
      status: periodStatusLabel(row.status),
      createdAt: row.created_at
    }))
  };
}

export type CatalogEntity = "department" | "inspection_team";

export type ManageCatalogInput = {
  entity: CatalogEntity;
  id?: string;
  name?: string;
  shortName?: string;
  block?: DepartmentBlock;
  description?: string;
  active?: boolean;
};

export async function createCatalogItem(user: SessionUser | null, input: ManageCatalogInput) {
  assertCanWrite(user, "catalog:manage");
  const row = toCatalogRow(input, "create");
  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: `catalog:${input.entity}:create`,
    module: "Quản trị danh mục",
    entityType: input.entity,
    newValue: row
  });

  if (getSupabaseMode() === "supabase") {
    const [saved] = await supabaseRest.insert<Array<Record<string, unknown>>>(tableName(input.entity), row);
    await supabaseRest.insert("audit_logs", toAuditLogRow({ ...auditLog, entityId: String(saved?.id ?? "") }));
    return { mode: "supabase" as const, item: saved, auditLog: { ...auditLog, entityId: String(saved?.id ?? "") } };
  }

  return {
    mode: "mock" as const,
    item: { id: `mock-${input.entity}-${Date.now()}`, ...row },
    auditLog
  };
}

export async function updateCatalogItem(user: SessionUser | null, input: ManageCatalogInput) {
  assertCanWrite(user, "catalog:manage");
  if (!input.id) {
    throw new Error("Thiếu mã danh mục cần cập nhật.");
  }
  const row = toCatalogRow(input, "update");
  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: `catalog:${input.entity}:update`,
    module: "Quản trị danh mục",
    entityType: input.entity,
    entityId: input.id,
    newValue: row
  });

  if (getSupabaseMode() === "supabase") {
    const [saved] = await supabaseRest.update<Array<Record<string, unknown>>>(tableName(input.entity), { id: `eq.${input.id}` }, row);
    if (!saved) {
      throw new Error("Không tìm thấy danh mục cần cập nhật.");
    }
    await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));
    return { mode: "supabase" as const, item: saved, auditLog };
  }

  return {
    mode: "mock" as const,
    item: { id: input.id, ...row },
    auditLog
  };
}

export async function archiveCatalogItem(user: SessionUser | null, input: ManageCatalogInput) {
  assertCanWrite(user, "catalog:manage");
  if (!input.id) {
    throw new Error("Thiếu mã danh mục cần ngưng sử dụng.");
  }
  const archiveInput = { ...input, active: false };
  const row = toCatalogRow(archiveInput, "archive");
  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: `catalog:${input.entity}:archive`,
    module: "Quản trị danh mục",
    entityType: input.entity,
    entityId: input.id,
    newValue: row
  });

  if (getSupabaseMode() === "supabase") {
    const [saved] = await supabaseRest.update<Array<Record<string, unknown>>>(tableName(input.entity), { id: `eq.${input.id}` }, row);
    if (!saved) {
      throw new Error("Không tìm thấy danh mục cần ngưng sử dụng.");
    }
    await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));
    return { mode: "supabase" as const, item: saved, auditLog };
  }

  return {
    mode: "mock" as const,
    item: { id: input.id, ...row },
    auditLog
  };
}

function blockLabel(value: string) {
  if (value === "administrative") return "Hành chính";
  if (value === "paraclinical") return "Cận lâm sàng";
  return "Lâm sàng";
}

function periodStatusLabel(value: string) {
  if (value === "closed") return "đã chốt";
  if (value === "locked") return "đã khóa";
  return "đang mở";
}

function tableName(entity: CatalogEntity) {
  return entity === "department" ? "departments" : "inspection_teams";
}

function toCatalogRow(input: ManageCatalogInput, mode: "create" | "update" | "archive") {
  if (input.entity === "department") {
    const row: Record<string, unknown> = {};
    if (mode === "create" || input.name !== undefined) row.name = String(input.name ?? "").trim();
    if (input.shortName !== undefined) row.short_name = String(input.shortName ?? "").trim();
    if (mode === "create" || input.block !== undefined) row.block_type = blockValue(input.block);
    if (input.active !== undefined || mode === "archive") row.is_active = input.active ?? false;
    return row;
  }

  const row: Record<string, unknown> = {};
  if (mode === "create" || input.name !== undefined) row.name = String(input.name ?? "").trim();
  if (input.description !== undefined) row.description = String(input.description ?? "").trim();
  if (input.active !== undefined || mode === "archive") row.is_active = input.active ?? false;
  return row;
}

function blockValue(value?: DepartmentBlock) {
  if (value === "Hành chính") return "administrative";
  if (value === "Cận lâm sàng") return "paraclinical";
  return "clinical";
}
