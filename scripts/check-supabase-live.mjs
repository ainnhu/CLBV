const supabaseUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const authEmailDomain = process.env.INTERNAL_AUTH_EMAIL_DOMAIN || "clbv.local";
const adminUsername = process.env.INITIAL_ADMIN_USERNAME || "admin";
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "";

const checks = [];

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY hoặc SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

checks.push(
  check("REST anon đọc departments", () => restGet("departments", "id,name,block_type", anonHeaders(), 200)),
  check("REST anon đọc form_templates", () => restGet("form_templates", "id,name,source_file,source_sheet", anonHeaders(), 200)),
  check("REST anon đọc form_criteria_items", () => restGet("form_criteria_items", "id,content,max_score", anonHeaders(), 200)),
  check("REST anon đọc inspection_sessions", () => restGet("inspection_sessions", "id,inspection_date,status", anonHeaders(), 200)),
  check("REST anon không được ghi departments", () => expectStatus(restPost("departments", anonHeaders(), {
    name: "Kiem tra RLS anonymous",
    short_name: "ANON_RLS",
    block_type: "administrative",
    is_active: true
  }), [401, 403])),
  check("Service role đọc profiles", () => restGet("profiles", "id,username,role,is_active", serviceHeaders(), 200)),
  check("Service role đọc inspection_assignments", () => restGet("inspection_assignments", "id,inspection_session_id,user_id,form_criteria_item_id", serviceHeaders(), 200)),
  check("Storage có bucket report-exports", () => expectBucket("report-exports")),
  check("Storage có bucket score-attachments", () => expectBucket("score-attachments")),
  check("Storage có bucket capa-evidence", () => expectBucket("capa-evidence"))
);

if (adminPassword) {
  checks.push(check("Supabase Auth đăng nhập tài khoản admin mẫu", () => loginWithPassword(adminUsername, adminPassword)));
} else {
  console.log("SKIP Supabase Auth đăng nhập tài khoản admin mẫu: chưa cấu hình INITIAL_ADMIN_PASSWORD.");
}

let failed = 0;
console.log(`Supabase live check: ${supabaseUrl}`);

for (const item of checks) {
  try {
    await item.run();
    console.log(`PASS ${item.name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${item.name}: ${message}`);
  }
}

if (failed > 0) {
  console.error(`Supabase live check failed: ${failed}/${checks.length}`);
  process.exit(1);
}

console.log(`Supabase live check passed: ${checks.length}/${checks.length}`);

function check(name, run) {
  return { name, run };
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function anonHeaders() {
  return {
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`
  };
}

function serviceHeaders() {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`
  };
}

async function restGet(table, select, headers, expectedStatus) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", select);
  url.searchParams.set("limit", "5");
  const response = await fetch(url, { headers, cache: "no-store" });
  await expectStatus(response, expectedStatus);
  await response.json();
}

async function restPost(table, headers, body) {
  return fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify(body)
  });
}

async function expectBucket(bucketName) {
  const response = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucketName}`, {
    headers: serviceHeaders(),
    cache: "no-store"
  });
  await expectStatus(response, 200);
  const data = await response.json();
  if (data.name !== bucketName && data.id !== bucketName) {
    throw new Error(`Bucket trả về không khớp: ${JSON.stringify(data)}`);
  }
}

async function loginWithPassword(username, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email: `${username}@${authEmailDomain}`,
      password
    })
  });
  await expectStatus(response, 200);
  const data = await response.json();
  if (!data.access_token || !data.user?.id) {
    throw new Error("Auth không trả access_token hoặc user.id.");
  }
}

async function expectStatus(responseOrPromise, expectedStatus) {
  const response = await responseOrPromise;
  const allowedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  if (!allowedStatuses.includes(response.status)) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}, expected ${allowedStatuses.join(" or ")}. ${body}`.trim());
  }
}
