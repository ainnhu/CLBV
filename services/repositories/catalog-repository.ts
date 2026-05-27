import { auditPeriods, auditTeams, departments } from "../../src/lib/mock-data";
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
      select: "id,name,description",
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
      description: row.description ?? ""
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
