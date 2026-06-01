# Rà soát lõi hệ thống và điểm nghẽn hiện tại

Ngày rà soát: 01/06/2026.

## Kết luận ngắn

Phần kiểm tra tự động quanh dữ liệu mẫu/demo đã đủ cho giai đoạn hiện tại. Nếu tiếp tục chỉ thêm smoke test tương tự thì sẽ lặp lại cùng một vấn đề và không làm hệ thống gần vận hành thật hơn.

Điểm nghẽn chính hiện nay là chuyển từ chế độ dữ liệu mẫu sang Supabase thật:

- Cấu hình biến môi trường Supabase trên Vercel.
- Chạy schema và seed.
- Import 04 file Excel thật vào database.
- Kiểm thử quyền bằng tài khoản thật thay vì header demo.
- Kiểm thử chấm điểm, CAPA, export Excel trên dữ liệu Supabase.

## Những phần đã ổn định

### Quyền truy cập

- Public route không bắt đăng nhập.
- Protected route kiểm tra `userFromRequest`.
- Protected route kiểm quyền trước khi đọc JSON body hoặc file upload.
- Không đăng nhập gọi thao tác ghi trả `403`.
- Payload sai nghiệp vụ trả `422`.
- JSON hỏng trả `400`.

Lệnh kiểm tra:

```powershell
npm.cmd run api:check
```

Kết quả gần nhất: `81/81`.

### Schema Supabase

- Có đủ bảng lõi.
- Có RLS.
- Có public-read cho dữ liệu công khai.
- Không grant quyền ghi cho `anon`.
- Có protected-write cho `authenticated` kết hợp policy.
- Có constraint điểm: không âm, không vượt tối đa, thiếu lý do trừ điểm bị chặn, nguy cơ cao phải có khắc phục.

Lệnh kiểm tra:

```powershell
npm.cmd run schema:check
```

Kết quả gần nhất: `106/106`.

### Excel nguồn

- Đọc được 04 workbook nguồn.
- Nhận diện 58 sheet phiếu.
- Đọc được 1.580 dòng tiêu chí.
- Đúng cấu trúc:
  - Đoàn 1 LS-CLS: 21 phiếu, 630 tiêu chí.
  - Đoàn 2 LS-CLS: 21 phiếu, 630 tiêu chí.
  - Đoàn 1 hành chính: 8 phiếu, 160 tiêu chí.
  - Đoàn 2 hành chính: 8 phiếu, 160 tiêu chí.

Lệnh kiểm tra:

```powershell
npm.cmd run excel:check
```

### Export Excel

- API export trả đúng MIME `.xlsx`.
- Workbook có 10 sheet nghiệp vụ:
  - `DASHBOARD_THONG_KE`
  - `TONG_HOP_DIEM`
  - `PHIEU_CHI_TIET`
  - `CHI_TIET_TIEU_CHI`
  - `CHI_TIET_LOI`
  - `PHAT_HIEN_VA_KHAC_PHUC`
  - `CAPA`
  - `LOI_NGUY_CO_CAO`
  - `PHAN_CONG_THANH_VIEN`
  - `CAN_CU`
- Phiếu chi tiết và chi tiết tiêu chí có dấu nguồn `source_file`, `source_sheet`, `source_row`.

Lệnh kiểm tra:

```powershell
npm.cmd run export:check
```

### Production smoke test

Production tại `https://clbv.vercel.app` đạt `46/46` trước khi bổ sung API đăng nhập thật. Bộ smoke mới có thêm kiểm tra `/api/auth/login` và dự kiến đạt `49/49` sau khi Vercel deploy xong commit mới.

Lệnh kiểm tra:

```powershell
node scripts\smoke-test.mjs https://clbv.vercel.app
```

## Phần chưa hoàn thành thật sự

### Supabase thật

Chưa có bằng chứng hệ thống đã chạy với database Supabase thật. Hiện repository có code path cho Supabase, nhưng production vẫn có thể vận hành bằng dữ liệu mẫu nếu chưa cấu hình env.

Cần thực hiện:

1. Tạo Supabase project.
2. Chạy `database/supabase-schema.sql`.
3. Nếu từng chạy schema cũ, chạy thêm `database/migrations/20260527_core_fixes.sql`.
4. Chạy `seed/initial-catalog.sql`.
5. Tạo Storage buckets:
   - `report-exports`
   - `score-attachments`
   - `capa-evidence`
6. Cấu hình biến môi trường trên Vercel.
7. Redeploy.
8. Kiểm tra `/api/protected/system/health` bằng vai trò Admin hoặc token thật.

### Auth thật

Đã bổ sung API `POST /api/auth/login` để đăng nhập username/password nội bộ qua Supabase Auth theo mapping `username@clbv.local` hoặc domain cấu hình bởi `INTERNAL_AUTH_EMAIL_DOMAIN`.

Còn cần làm tiếp:

- Seed user thật trong Supabase Auth.
- Tạo profile tương ứng trong bảng `profiles`.
- Nối màn hình đăng nhập hiện tại với `/api/auth/login`.
- Lưu access token phía client và gửi `Authorization: Bearer <token>` khi gọi protected API.

### Import thật vào Supabase

Parser đã đọc được Excel nguồn, API import/commit đã có, nhưng cần chạy trên Supabase thật để xác nhận:

- `form_templates` được ghi đúng.
- `form_header_fields` được ghi đúng.
- `form_criteria_items` được ghi đúng.
- `import_batches` và `import_warnings` được ghi đúng.
- Dấu nguồn không mất.

### Kiểm thử RLS thật

Các script hiện kiểm schema tĩnh và API demo role. Chưa kiểm được RLS bằng user thật cho từng vai trò vì cần Supabase project và tài khoản thật.

Cần kiểm:

- Anonymous đọc được public data.
- Anonymous không ghi được.
- Thành viên đoàn chỉ ghi tiêu chí được phân công.
- CAPA chỉ cập nhật CAPA.
- Phòng KHTH/Admin import, export, chốt, mở khóa, quản trị được.

### Giao diện

Giao diện hiện chưa phải trọng tâm. Đã đủ màn hình để thao tác mẫu, nhưng chưa đạt mức gọn, thuận tay, giống quy trình thực tế trên điện thoại.

Không nên chỉnh giao diện sâu trước khi Supabase thật và import thật ổn định.

## Việc có thể làm tiếp ngay trong code

1. Nối màn hình đăng nhập với API `POST /api/auth/login`.
2. Tạo script seed Supabase Auth/profile cho tài khoản mẫu.
3. Thêm kiểm tra cấu hình Vercel/Supabase ở mức env.
4. Hoàn thiện tài liệu thao tác Supabase từng bước.
5. Rà lại export Excel để định dạng gần sheet nguồn hơn.

## Việc không nên tiếp tục làm lặp lại

Không nên tiếp tục chỉ thêm các smoke test mới cho cùng các endpoint demo-role nếu chưa có mục tiêu mới. Bộ kiểm hiện đã bao phủ đủ các nguyên tắc chính:

- Public read.
- Protected write.
- Import.
- Export.
- Scores.
- CAPA.
- Periods.
- Catalog.
- Sessions.
- Assignments.
- Storage mock.
- Excel nguồn.
- Excel xuất.
- Schema/RLS tĩnh.

## Thứ tự tiếp theo được khuyến nghị

1. Tạo Supabase thật và cấu hình Vercel.
2. Chạy schema, migration, seed.
3. Chạy seed user demo vào Supabase.
4. Import 04 Excel thật vào Supabase.
5. Kiểm thử RLS bằng token thật.
6. Sau khi dữ liệu thật ổn, chỉnh giao diện mobile-first và dashboard.
