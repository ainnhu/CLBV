import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api-json";

type LoginPayload = {
  username?: unknown;
  password?: unknown;
};

type SupabaseTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: {
    id?: string;
    email?: string;
  };
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  role: string;
  title_unit: string | null;
  department_id: string | null;
  inspection_team_id: string | null;
  is_active: boolean;
};

const roleLabels: Record<string, string> = {
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

export async function POST(request: Request) {
  const json = await readJsonBody(request);
  if (!json.ok) return json.response;

  const parsed = validateLoginPayload(json.data as LoginPayload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: "Chưa cấu hình Supabase Auth. Vui lòng cấu hình NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      { status: 503 }
    );
  }

  const email = usernameToInternalEmail(parsed.username);
  const tokenResponse = await fetch(new URL("/auth/v1/token?grant_type=password", supabaseUrl), {
    method: "POST",
    headers: {
      apikey: anonKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email,
      password: parsed.password
    }),
    cache: "no-store"
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng." }, { status: 401 });
  }

  const token = (await tokenResponse.json()) as SupabaseTokenResponse;
  if (!token.access_token || !token.user?.id) {
    return NextResponse.json({ error: "Supabase Auth không trả token hợp lệ." }, { status: 502 });
  }

  const profile = await loadProfile(supabaseUrl, anonKey, token.access_token, token.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Tài khoản chưa có hồ sơ phân quyền trong hệ thống." }, { status: 403 });
  }
  if (!profile.is_active) {
    return NextResponse.json({ error: "Tài khoản đã bị khóa hoặc ngưng sử dụng." }, { status: 403 });
  }

  return NextResponse.json({
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? "",
    expiresIn: token.expires_in ?? 0,
    tokenType: token.token_type ?? "bearer",
    user: {
      id: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      titleUnit: profile.title_unit ?? "",
      role: roleLabels[profile.role] ?? "Khách xem",
      roleCode: profile.role,
      departmentId: profile.department_id ?? "",
      inspectionTeamId: profile.inspection_team_id ?? ""
    }
  });
}

function validateLoginPayload(payload: LoginPayload): { ok: true; username: string; password: string } | { ok: false; error: string } {
  const username = typeof payload.username === "string" ? payload.username.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!username) {
    return { ok: false, error: "Vui lòng nhập tên đăng nhập." };
  }
  if (!/^[a-z0-9._-]{2,40}$/.test(username)) {
    return { ok: false, error: "Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch nối." };
  }
  if (!password) {
    return { ok: false, error: "Vui lòng nhập mật khẩu." };
  }
  if (password.length < 6 || password.length > 128) {
    return { ok: false, error: "Mật khẩu phải từ 6 đến 128 ký tự." };
  }

  return { ok: true, username, password };
}

function usernameToInternalEmail(username: string) {
  const domain = process.env.INTERNAL_AUTH_EMAIL_DOMAIN || "clbv.local";
  return `${username}@${domain}`;
}

async function loadProfile(supabaseUrl: string, anonKey: string, accessToken: string, userId: string) {
  const profileUrl = new URL("/rest/v1/profiles", supabaseUrl);
  profileUrl.searchParams.set("select", "id,username,full_name,role,title_unit,department_id,inspection_team_id,is_active");
  profileUrl.searchParams.set("id", `eq.${userId}`);
  profileUrl.searchParams.set("limit", "1");

  const response = await fetch(profileUrl, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as ProfileRow[];
  return rows[0] ?? null;
}
