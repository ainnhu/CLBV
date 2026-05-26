type QueryValue = string | number | boolean | null | undefined;

export type SupabaseMode = "mock" | "supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseMode(): SupabaseMode {
  return supabaseUrl && (serviceRoleKey || anonKey) ? "supabase" : "mock";
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  if (!supabaseUrl) {
    throw new Error("Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL.");
  }

  const url = new URL(`/rest/v1/${path.replace(/^\/+/, "")}`, supabaseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

async function request<T>({
  path,
  method = "GET",
  query,
  body,
  prefer,
  useServiceRole = false
}: {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  prefer?: string;
  useServiceRole?: boolean;
}): Promise<T> {
  const key = useServiceRole ? serviceRoleKey : anonKey ?? serviceRoleKey;
  if (!key) {
    throw new Error("Chưa cấu hình Supabase key.");
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(prefer ? { prefer } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const supabaseRest = {
  select<T>(path: string, query?: Record<string, QueryValue>) {
    return request<T>({ path, query, method: "GET" });
  },
  insert<T>(path: string, body: unknown, useServiceRole = true) {
    return request<T>({ path, body, method: "POST", prefer: "return=representation", useServiceRole });
  },
  upsert<T>(path: string, body: unknown, onConflict: string, useServiceRole = true) {
    return request<T>({
      path,
      query: { on_conflict: onConflict },
      body,
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      useServiceRole
    });
  },
  update<T>(path: string, query: Record<string, QueryValue>, body: unknown, useServiceRole = true) {
    return request<T>({ path, query, body, method: "PATCH", prefer: "return=representation", useServiceRole });
  }
};
