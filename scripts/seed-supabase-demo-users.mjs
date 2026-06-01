import { readFile } from "node:fs/promises";
import { join } from "node:path";

const supabaseUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const authEmailDomain = process.env.INTERNAL_AUTH_EMAIL_DOMAIN || "clbv.local";
const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || "123456";
const derivedUserLimit = Number.parseInt(process.env.SEED_DERIVED_USER_LIMIT || "30", 10);

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (defaultPassword.length < 6) {
  console.error("INITIAL_ADMIN_PASSWORD phải có tối thiểu 6 ký tự để Supabase Auth chấp nhận.");
  process.exit(1);
}

const source = await loadExtractedWorkbookData();
const sourceUsers = Array.isArray(source.users) ? source.users : [];
const manualUsers = [
  {
    username: process.env.INITIAL_ADMIN_USERNAME || "admin",
    fullName: process.env.INITIAL_ADMIN_FULL_NAME || "Quản trị hệ thống",
    titleUnit: "Admin hệ thống",
    role: "admin",
    auditTeam: null,
    email: null,
    phone: null
  },
  {
    username: "khth",
    fullName: "Phòng Kế hoạch - Tổng hợp",
    titleUnit: "Phòng Kế hoạch - Tổng hợp",
    role: "phong_khth",
    auditTeam: null,
    email: null,
    phone: null
  },
  {
    username: "capa",
    fullName: "Tài khoản cập nhật CAPA",
    titleUnit: "Người được phân quyền CAPA",
    role: "capa",
    auditTeam: null,
    email: null,
    phone: null
  }
];

const derivedUsers = sourceUsers
  .slice(0, Number.isFinite(derivedUserLimit) && derivedUserLimit > 0 ? derivedUserLimit : 30)
  .map((user, index) => {
    const username = asciiUsername(user.username || user.fullName, `user-${index + 1}`);
    return {
      username,
      fullName: user.fullName || user.username || `Người dùng ${index + 1}`,
      titleUnit: user.titleUnit || user.sourceRole || "Thành viên đoàn kiểm tra",
      role: roleToDbRole(user),
      auditTeam: user.auditTeam || null,
      email: user.email || null,
      phone: user.phone || null
    };
  });

const users = dedupeByUsername([...manualUsers, ...derivedUsers]);
const authUsers = await listAllAuthUsers();
const authUserByEmail = new Map(authUsers.map((user) => [String(user.email || "").toLowerCase(), user]));
const teams = await getRows("inspection_teams", "id,name");
const teamIdByName = new Map(teams.map((team) => [team.name, team.id]));

for (const user of users) {
  const authUser = await createOrFindAuthUser(user, authUserByEmail);
  const email = user.email || internalEmail(user.username);
  const profile = {
    id: authUser.id,
    username: user.username,
    full_name: user.fullName,
    email,
    phone: user.phone || null,
    title_unit: user.titleUnit,
    role: user.role,
    inspection_team_id: user.auditTeam ? teamIdByName.get(user.auditTeam) || null : null,
    is_active: true
  };
  await upsertRows("profiles", [profile], "username");
  console.log(`Đã tạo/cập nhật: ${user.username} (${user.role})`);
}

await updateTeamLeaders();
await seedAssignmentsForFirstSession();

console.log(`Hoàn tất seed ${users.length} tài khoản. Mật khẩu mặc định: ${defaultPassword}`);

async function loadExtractedWorkbookData() {
  const filePath = join(process.cwd(), "src/lib/extracted-workbook-data.json");
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function asciiUsername(value, fallback) {
  const cleaned = String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
  return cleaned || fallback;
}

function roleToDbRole(user) {
  const raw = `${user.role || ""} ${user.sourceRole || ""}`.toLowerCase();
  if (raw.includes("trưởng đoàn")) return "truong_doan";
  if (raw.includes("phó")) return "pho_truong_doan";
  if (raw.includes("thư ký")) return "thu_ky_doan";
  if (raw.includes("ban giám đốc")) return "ban_giam_doc";
  if (raw.includes("khth") || raw.includes("kế hoạch")) return "phong_khth";
  if (raw.includes("capa")) return "capa";
  return "thanh_vien_doan";
}

function dedupeByUsername(items) {
  const map = new Map();
  for (const item of items) {
    const username = asciiUsername(item.username, "");
    if (!username) continue;
    map.set(username, { ...item, username });
  }
  return Array.from(map.values());
}

function internalEmail(username) {
  return `${username}@${authEmailDomain}`;
}

async function createOrFindAuthUser(user, authUserByEmail) {
  const email = user.email || internalEmail(user.username);
  const found = authUserByEmail.get(email.toLowerCase());
  if (found) return found;

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        username: user.username,
        full_name: user.fullName
      }
    })
  });
  if (!response.ok) throw new Error(`Không tạo được Auth user ${user.username}: ${await response.text()}`);
  const created = await response.json();
  authUserByEmail.set(email.toLowerCase(), created);
  return created;
}

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error(`Không đọc được danh sách Auth users: ${await response.text()}`);
    const data = await response.json();
    const pageUsers = Array.isArray(data.users) ? data.users : [];
    users.push(...pageUsers);
    if (pageUsers.length < perPage) break;
    page += 1;
  }

  return users;
}

async function getRows(table, select, query = "") {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}${query}`, {
    headers: restHeaders()
  });
  if (!response.ok) throw new Error(`Không đọc được ${table}: ${await response.text()}`);
  return response.json();
}

async function upsertRows(table, rows, onConflict) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: {
      ...restHeaders(),
      prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(rows)
  });
  if (!response.ok) throw new Error(`Không upsert được ${table}: ${await response.text()}`);
  return response.json();
}

async function patchRows(table, filter, body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      ...restHeaders(),
      prefer: "return=representation"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Không cập nhật được ${table}: ${await response.text()}`);
  return response.json();
}

async function updateTeamLeaders() {
  const profiles = await getRows("profiles", "id,role,inspection_team_id");
  for (const team of teams) {
    const teamProfiles = profiles.filter((profile) => profile.inspection_team_id === team.id);
    const leader = teamProfiles.find((profile) => profile.role === "truong_doan");
    const deputy = teamProfiles.find((profile) => profile.role === "pho_truong_doan");
    const secretary = teamProfiles.find((profile) => profile.role === "thu_ky_doan");
    await patchRows(
      "inspection_teams",
      `id=eq.${team.id}`,
      {
        leader_user_id: leader?.id || null,
        deputy_user_id: deputy?.id || null,
        secretary_user_id: secretary?.id || null
      }
    );
  }
}

async function seedAssignmentsForFirstSession() {
  const sessions = await getRows("inspection_sessions", "id,inspection_team_id,department_id,block_type", "&order=inspection_date.asc&limit=1");
  const session = sessions[0];
  if (!session) {
    console.log("Chưa có inspection_sessions, bỏ qua seed phân công mẫu.");
    return;
  }

  const criteria = await getRows("form_criteria_items", "id,inspection_team_name,department_name,order_index", "&order=order_index.asc&limit=30");
  const profiles = await getRows("profiles", "id,role,inspection_team_id");
  const members = profiles.filter(
    (profile) =>
      profile.inspection_team_id === session.inspection_team_id &&
      ["thanh_vien_doan", "thu_ky_doan", "truong_doan", "pho_truong_doan"].includes(profile.role)
  );
  if (!criteria.length || !members.length) {
    console.log("Chưa đủ tiêu chí hoặc thành viên đoàn để seed phân công mẫu.");
    return;
  }

  const rows = criteria.map((item, index) => ({
    inspection_session_id: session.id,
    inspection_team_id: session.inspection_team_id,
    user_id: members[index % members.length].id,
    form_criteria_item_id: item.id,
    department_id: session.department_id,
    block_type: session.block_type,
    note: "Phân công mẫu tạo bằng scripts/seed-supabase-demo-users.mjs"
  }));
  await upsertRows("inspection_assignments", rows, "inspection_session_id,user_id,form_criteria_item_id");
  console.log(`Đã seed ${rows.length} phân công mẫu cho phiên đầu tiên.`);
}

function authHeaders() {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json"
  };
}

function restHeaders() {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json"
  };
}
