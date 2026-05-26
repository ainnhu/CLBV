import type { Role } from "./types";

type AuthUser = {
  id: string;
  role: Role;
  inspectionTeamId?: string;
  departmentId?: string;
  assignedCriteriaItemIds?: string[];
};

type SupabaseUserResponse = {
  id: string;
};

type ProfileRow = {
  id: string;
  role: string;
  inspection_team_id?: string | null;
  department_id?: string | null;
  is_active: boolean;
};

const roleByDbValue: Record<string, Role> = {
  admin: "Admin",
  ban_giam_doc: "Ban Giám đốc",
  phong_khth: "Phòng KHTH",
  truong_doan: "Trưởng đoàn",
  pho_truong_doan: "Phó trưởng đoàn",
  thu_ky_doan: "Thư ký đoàn",
  thanh_vien_doan: "Thành viên đoàn",
  capa: "CAPA",
  khoa_phong: "Khách xem"
};

export function getDemoRole(request: Request): Role | null {
  const role = request.headers.get("x-demo-role")?.trim();
  if (!role) return null;
  return role as Role;
}

export function demoUserFromRequest(request: Request): AuthUser | null {
  const role = getDemoRole(request);
  if (!role) return null;
  return {
    id: `demo-${role.toLowerCase().replace(/\s+/g, "-")}`,
    role,
    assignedCriteriaItemIds: request.headers
      .get("x-demo-assigned-criteria")
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

export async function userFromRequest(request: Request): Promise<AuthUser | null> {
  const demoUser = demoUserFromRequest(request);
  if (demoUser) return demoUser;

  const token = getBearerToken(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !anonKey) return null;

  const authResponse = await fetch(new URL("/auth/v1/user", supabaseUrl), {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });
  if (!authResponse.ok) return null;

  const authUser = (await authResponse.json()) as SupabaseUserResponse;
  const profileUrl = new URL("/rest/v1/profiles", supabaseUrl);
  profileUrl.searchParams.set("select", "id,role,inspection_team_id,department_id,is_active");
  profileUrl.searchParams.set("id", `eq.${authUser.id}`);
  profileUrl.searchParams.set("limit", "1");

  const profileResponse = await fetch(profileUrl, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });
  if (!profileResponse.ok) return null;

  const [profile] = (await profileResponse.json()) as ProfileRow[];
  if (!profile?.is_active) return null;

  return {
    id: profile.id,
    role: roleByDbValue[profile.role] ?? "Khách xem",
    inspectionTeamId: profile.inspection_team_id ?? undefined,
    departmentId: profile.department_id ?? undefined,
    assignedCriteriaItemIds: await loadAssignedCriteriaIds(supabaseUrl, anonKey, token, profile.id)
  };
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/);
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

async function loadAssignedCriteriaIds(supabaseUrl: string, anonKey: string, token: string, userId: string) {
  const url = new URL("/rest/v1/inspection_assignments", supabaseUrl);
  url.searchParams.set("select", "form_criteria_item_id");
  url.searchParams.set("user_id", `eq.${userId}`);

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });
  if (!response.ok) return [];

  const rows = (await response.json()) as Array<{ form_criteria_item_id?: string | null }>;
  return rows.map((row) => row.form_criteria_item_id).filter(Boolean) as string[];
}
