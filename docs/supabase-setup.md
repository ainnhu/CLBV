# Hướng dẫn cấu hình Supabase

Tài liệu này dành cho người không chuyên CNTT, đi từng bước để nối web với database/auth/storage thật.

## 1. Tạo project Supabase

1. Vào `https://supabase.com`.
2. Đăng nhập.
3. Chọn `New project`.
4. Đặt tên project, ví dụ `CLBV`.
5. Lưu lại mật khẩu database ở nơi an toàn.

## 2. Lấy thông tin cấu hình

Trong Supabase, mở `Project Settings` → `API`, lấy:

- `Project URL` → điền vào `NEXT_PUBLIC_SUPABASE_URL`.
- `anon public key` → điền vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `service_role key` → điền vào `SUPABASE_SERVICE_ROLE_KEY`.

Lưu ý: `service_role key` là khóa bí mật, chỉ đưa vào Vercel Environment Variables, không đưa công khai lên web.

## 3. Chạy schema database

1. Mở `SQL Editor`.
2. Tạo query mới.
3. Mở file `database/supabase-schema.sql`.
4. Sao chép toàn bộ nội dung file vào SQL Editor.
5. Bấm `Run`.

Nếu bạn đã từng chạy schema cũ trước ngày `27/05/2026`, chạy thêm file migration này trong SQL Editor để bổ sung cột/policy còn thiếu mà không cần xóa database:

```text
database/migrations/20260527_core_fixes.sql
```

Schema này tạo các bảng chính:

- `profiles`
- `departments`
- `inspection_teams`
- `form_templates`
- `form_header_fields`
- `form_criteria_items`
- `audit_periods`
- `inspection_sessions`
- `inspection_forms`
- `inspection_assignments`
- `inspection_scores`
- `score_attachments`
- `capa_updates`
- `report_exports`
- `report_files`
- `import_batches`
- `import_warnings`
- `audit_logs`

Nguyên tắc đã cấu hình:

- Người chưa đăng nhập được đọc dữ liệu công khai.
- Người chưa đăng nhập không được ghi/sửa/xóa/chốt/import/export.
- API ghi vẫn kiểm tra quyền ở backend.

## 4. Seed danh mục nền

Sau khi chạy schema:

1. Mở file `seed/initial-catalog.sql`.
2. Sao chép vào SQL Editor.
3. Bấm `Run`.

File này tạo:

- Danh mục khoa/phòng.
- Đoàn 01, Đoàn 02.
- Kỳ kiểm tra từ tháng 05/2026 đến tháng 12/2026.

## 5. Tạo Storage bucket

Vào `Storage` → `New bucket`, tạo 03 bucket:

- `report-exports`
- `score-attachments`
- `capa-evidence`

Với giai đoạn MVP:

- `report-exports` nên đặt public để người xem có link tải báo cáo đã xuất.
- `score-attachments` và `capa-evidence` có thể để private nếu sau này cần bảo mật minh chứng.

## 6. Tạo file `.env.local`

Tại máy local, tạo file `.env.local` theo `.env.example`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

AUTH_SECRET=chuoi-bi-mat-tu-dat

REPORT_EXPORT_BUCKET=report-exports
SCORE_ATTACHMENT_BUCKET=score-attachments
CAPA_EVIDENCE_BUCKET=capa-evidence

INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=123456
INITIAL_ADMIN_FULL_NAME=Quản trị hệ thống
```

## 7. Seed tài khoản demo

Chạy lệnh:

```powershell
npm.cmd run seed:supabase
```

Script này sẽ:

- Tạo Supabase Auth users bằng email nội bộ dạng `username@clbv.local`.
- Tạo/cập nhật `profiles.username`.
- Gán vai trò mẫu: Admin, Phòng KHTH, CAPA, thành viên đoàn.
- Liên kết thành viên với Đoàn 01/Đoàn 02 nếu dữ liệu nguồn có.
- Nếu đã có phiên kiểm tra và tiêu chí, script sẽ tạo phân công mẫu cho phiên đầu tiên.

Mật khẩu mặc định lấy từ `INITIAL_ADMIN_PASSWORD`. Nếu không đặt biến này, script dùng `123456`.

## 8. Import 04 file Excel

Giai đoạn hiện tại có API import:

- `POST /api/protected/import`
- `POST /api/protected/import/commit`

Nguyên tắc import:

- Ưu tiên đọc các sheet phiếu kiểm tra/chấm điểm theo từng khoa/phòng.
- Giữ `source_file`, `source_sheet`, `source_row`.
- Không tự bịa tiêu chí nếu Excel đã có tiêu chí.
- Nếu phát hiện lệch số tiêu chí/tổng điểm, ghi cảnh báo để rà soát.

Màn hình rà soát import sẽ hoàn thiện ở bước tiếp theo.

## 9. Kiểm tra quyền nhanh

Không đăng nhập:

- Vào dashboard public: xem được.
- Gọi API ghi: phải bị chặn `403`.

Ví dụ:

```powershell
Invoke-WebRequest -Uri "https://clbv.vercel.app/api/protected/sessions" -Method POST -ContentType "application/json" -Body "{}"
```

Kết quả đúng là lỗi `403`.

Đăng nhập đúng quyền:

- Admin/Phòng KHTH được tạo kỳ, tạo phiên, phân công, import, export.
- Thành viên đoàn chỉ được chấm tiêu chí được phân công.
- CAPA chỉ cập nhật trạng thái khắc phục.

## 10. Cấu hình Vercel

Trong Vercel project:

1. Mở `Settings` → `Environment Variables`.
2. Thêm các biến giống `.env.local`.
3. Redeploy project.

Sau mỗi lần cập nhật GitHub, Vercel sẽ tự deploy lại.
