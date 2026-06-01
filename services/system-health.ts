import { getSupabaseConfigStatus, supabaseRest } from "./supabase-rest";
import { getStorageConfigStatus } from "./supabase-storage";

export async function getProtectedSystemHealth() {
  const supabase = getSupabaseConfigStatus();
  const storage = getStorageConfigStatus();

  const checks = [
    {
      key: "public_read_policy",
      ok: true,
      message: "Dữ liệu công khai được thiết kế cho phép đọc không cần đăng nhập."
    },
    {
      key: "protected_write_policy",
      ok: supabase.mode === "mock" || supabase.protectedWriteReady,
      message: supabase.protectedWriteReady
        ? "Đã có cấu hình service role cho thao tác ghi backend."
        : "Chưa có SUPABASE_SERVICE_ROLE_KEY; protected write đang chỉ chạy an toàn ở chế độ mock."
    },
    {
      key: "supabase_public_read_config",
      ok: supabase.mode === "mock" || supabase.publicReadReady,
      message: supabase.publicReadReady
        ? "Đã có cấu hình đọc Supabase public."
        : "Chưa đủ NEXT_PUBLIC_SUPABASE_URL và key đọc Supabase."
    },
    {
      key: "storage_bucket_names",
      ok: Boolean(storage.reportExportBucket && storage.scoreAttachmentBucket && storage.capaEvidenceBucket),
      message: "Tên bucket Storage đã có giá trị mặc định, có thể thay bằng biến môi trường trên Vercel."
    },
    {
      key: "storage_signed_url_policy",
      ok: true,
      message: storage.signedUrlEnabled
        ? `Đã bật signed URL cho Storage, thời hạn ${storage.signedUrlExpiresInSeconds} giây.`
        : "Storage đang dùng public object URL. Bật SUPABASE_STORAGE_SIGNED_URL_SECONDS nếu dùng bucket private."
    }
  ];

  let departmentsProbe: { ok: boolean; message: string } = {
    ok: supabase.mode === "mock",
    message: supabase.mode === "mock" ? "Đang dùng dữ liệu mẫu, chưa gọi Supabase." : "Chưa kiểm tra kết nối Supabase."
  };

  if (supabase.mode === "supabase" && supabase.publicReadReady) {
    try {
      await supabaseRest.select("departments", { select: "id", limit: 1 });
      departmentsProbe = { ok: true, message: "Đọc thử bảng departments thành công." };
    } catch (error) {
      departmentsProbe = {
        ok: false,
        message: error instanceof Error ? error.message : "Không đọc được bảng departments."
      };
    }
  }

  checks.push({
    key: "departments_read_probe",
    ok: departmentsProbe.ok,
    message: departmentsProbe.message
  });

  return {
    checkedAt: new Date().toISOString(),
    runtimeMode: supabase.mode,
    supabase,
    storage,
    checks,
    summary: {
      ok: checks.every((check) => check.ok),
      publicRead: true,
      protectedWrite: supabase.mode === "mock" || supabase.protectedWriteReady
    }
  };
}
