const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  return {
    storagePath: `${bucket}/${path}`,
    downloadUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`
  };
}
