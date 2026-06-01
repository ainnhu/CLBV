const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const signedUrlExpiresInSeconds = parseSignedUrlExpiresIn(process.env.SUPABASE_STORAGE_SIGNED_URL_SECONDS);

export function getStorageConfigStatus() {
  return {
    reportExportBucket: process.env.REPORT_EXPORT_BUCKET || "report-exports",
    scoreAttachmentBucket: process.env.SCORE_ATTACHMENT_BUCKET || "score-attachments",
    capaEvidenceBucket: process.env.CAPA_EVIDENCE_BUCKET || "capa-evidence",
    signedUrlEnabled: signedUrlExpiresInSeconds > 0,
    signedUrlExpiresInSeconds
  };
}

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export async function uploadBufferToSupabaseStorage({
  bucket,
  path,
  buffer,
  contentType
}: {
  bucket: string;
  path: string;
  buffer: Buffer;
  contentType: string;
}) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Chưa cấu hình Supabase Storage.");
  }

  const encodedPath = encodeStoragePath(path);
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
    method: "PUT",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": contentType,
      "x-upsert": "true"
    },
    body: new Uint8Array(buffer),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Không upload được file lên Supabase Storage: ${await response.text()}`);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
  const signedUrl = signedUrlExpiresInSeconds > 0
    ? await createSignedDownloadUrl(bucket, path, signedUrlExpiresInSeconds)
    : "";

  return {
    storagePath: `${bucket}/${path}`,
    publicUrl,
    signedUrl,
    signedUrlExpiresInSeconds,
    downloadUrl: signedUrl || publicUrl
  };
}

async function createSignedDownloadUrl(bucket: string, path: string, expiresIn: number) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Chưa cấu hình Supabase Storage.");
  }

  const encodedPath = encodeStoragePath(path);
  const response = await fetch(`${supabaseUrl}/storage/v1/object/sign/${bucket}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ expiresIn }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Không tạo được signed URL cho file Storage: ${await response.text()}`);
  }

  const data = await response.json() as { signedURL?: string; signedUrl?: string };
  const signedPath = data.signedURL || data.signedUrl;
  if (!signedPath) {
    throw new Error("Supabase Storage không trả signed URL hợp lệ.");
  }

  return signedPath.startsWith("http") ? signedPath : `${supabaseUrl}${signedPath}`;
}

function parseSignedUrlExpiresIn(value?: string) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}
