# Hệ thống chấm điểm kiểm tra hoạt động bệnh viện

Prototype/MVP cho Bệnh viện Sản - Nhi Cà Mau, phục vụ số hóa công tác “Chấm điểm kiểm tra các hoạt động của bệnh viện” năm 2026 theo Kế hoạch số 32/KH-BV và Quyết định số 271/QĐ-BV.

## Nguyên tắc bắt buộc

- Ai có link website đều xem được dữ liệu đã công khai: dashboard, lịch kiểm tra, kết quả, báo cáo đã xuất, lịch sử, CAPA, khoa/phòng, bảng kiểm và tiêu chí.
- Đăng nhập chỉ dùng cho thao tác ghi: chấm/sửa điểm, lưu nháp, hoàn tất phiếu, cập nhật CAPA, chốt dữ liệu, xuất Excel, import Excel, quản trị danh mục, mở khóa kỳ.
- Giao diện chấm điểm và báo cáo mặc định bám theo các sheet phiếu kiểm tra/chấm điểm trong 04 file Excel nguồn.
- Có thể chuẩn hóa vào database chung, nhưng mỗi phiếu và tiêu chí phải giữ `source_file`, `source_sheet`, `source_row`, `department_code`, `inspection_team`, `version`.

## Công nghệ

- Frontend: Next.js, React, TypeScript.
- UI: Tailwind CSS.
- Dashboard: Recharts.
- Import/export Excel: SheetJS `xlsx`.
- Database/Auth/Storage đề xuất: Supabase.
- Bảo mật: Supabase Auth, Row Level Security, service kiểm quyền backend, audit log.
- Deploy: Vercel.

## Cấu trúc chính

- `app/`: giao diện Next.js.
- `src/lib/`: types, dữ liệu mẫu đã trích từ PDF/Excel, quyền thao tác.
- `scripts/extract-source-data.py`: trích dữ liệu nguồn từ PDF và 04 file Excel.
- `database/supabase-schema.sql`: schema Supabase và RLS public-read/protected-write.
- `services/access-control.ts`: service kiểm quyền mẫu cho backend/API.
- `import/excel-import.ts`: parser import Excel ưu tiên sheet phiếu theo khoa/phòng.
- `export/report-export.ts`: builder export Excel bám phiếu nguồn.
- `public/`: logo và banner bệnh viện.

## Dữ liệu nguồn đã nhận diện

- `KH, QĐ KIỂM TRA HOẠT ĐỘNG BỆNH VIỆN NĂM 2026.pdf`
- `1805_V03_ĐOÀN 1_LS-CLS.xlsx`
- `1805_V03_ĐOÀN 2_LS-CLS.xlsx`
- `1805_V03_ĐOÀN 1_HÀNH CHÍNH.xlsx`
- `1805_V03_ĐOÀN 2_HÀNH CHÍNH.xlsx`
- Logo bệnh viện.
- Banner thương hiệu/chân trang.

Kết quả trích xuất hiện có:

- 29 khoa/phòng.
- 20 người dùng mẫu, gồm thành viên từ Quyết định 271/QĐ-BV và tài khoản mẫu `admin`, `khth`, `capa`.
- 04 workbook Excel.
- 58 sheet phiếu theo khoa/phòng: 42 sheet LS/CLS và 16 sheet hành chính tính theo Đoàn 01/Đoàn 02.
- 1.580 dòng tiêu chí theo sheet phiếu nguồn.
- 32 dòng lịch kiểm tra thứ Tư từ `27/05/2026` đến `30/12/2026`.

## Quy tắc điểm

- Mỗi khoa/phòng chấm theo thang 100 điểm.
- Phiếu LS/CLS: 30 nội dung, tổng 100 điểm.
- Phiếu hành chính: 20 nội dung, mỗi nội dung tối đa 5 điểm, tổng 100 điểm.
- Điểm đạt không âm và không vượt điểm tối đa.
- Nếu điểm đạt thấp hơn điểm tối đa, bắt buộc nhập phát hiện/tồn tại hoặc lý do trừ điểm.
- Nếu mức độ nguy cơ là `Cao` hoặc `Nghiêm trọng`, bắt buộc nhập yêu cầu khắc phục, thời hạn và người/bộ phận chịu trách nhiệm.
- Xếp loại:
  - `90-100`: Đạt tốt.
  - `80 đến dưới 90`: Đạt.
  - `65 đến dưới 80`: Cần cải tiến.
  - `Dưới 65`: Không đạt.
  - Có lỗi nghiêm trọng ảnh hưởng an toàn người bệnh/an toàn bệnh viện thì cảnh báo đỏ và có thể hạ xếp loại.

## Chạy thử local

```bash
npm install
npm.cmd run dev
```

Mở:

```text
http://localhost:3000
```

Kiểm tra build:

```bash
npm.cmd run build
```

Nếu dùng môi trường không chặn PowerShell script, có thể dùng `npm run dev` và `npm run build`.

## Git và GitHub

Hướng dẫn cài Git, khởi tạo repository, commit và đẩy source lên GitHub nằm tại:

```text
docs/git-guide.md
```

Nếu không dùng Git local và chỉ upload bằng giao diện GitHub web, xem:

```text
docs/github-web-upload.md
```

## Tiến độ hiện tại

Tiến độ chi tiết được cập nhật ở:

```text
docs/progress.md
```

Trên giao diện web cũng có mục `Tiến độ hoàn thành` để theo dõi nhanh.

## API MVP hiện có

Public, không cần đăng nhập:

- `GET /api/public/dashboard`
- `GET /api/public/forms`
- `GET /api/public/progress`

Protected, cần đăng nhập/đúng quyền khi triển khai thật. Ở prototype có thể mô phỏng bằng header `x-demo-role`:

- `POST /api/protected/scores`
- `POST /api/protected/import`
- `POST /api/protected/import/commit`
- `POST /api/protected/reports/export`
- `POST /api/protected/capa`
- `POST /api/protected/periods`

Các API hiện đi qua repository layer trong `services/repositories/`. Khi chưa cấu hình Supabase, hệ thống chạy bằng dữ liệu mẫu. Khi có Supabase env, repository có thể chuyển sang đọc/ghi qua Supabase REST.

`POST /api/protected/import` hiện tạo import batch chờ rà soát, gồm:

- `summary`: số phiếu, số tiêu chí, số cảnh báo.
- `templatesPreview`: các phiếu đọc từ sheet nguồn.
- `criteriaPreview`: dòng tiêu chí mẫu.
- `warnings`: cảnh báo số tiêu chí/tổng điểm/tên khoa phòng.
- `auditLog`: log thao tác import ở mức prototype.

`POST /api/protected/import/commit` nhận `commitPayload` từ bước import để ghi chính thức. Ở chế độ mock, API trả số phiếu/đầu phiếu/tiêu chí sẽ ghi. Khi cấu hình Supabase, repository sẽ ghi hoặc cập nhật `form_templates`, `form_header_fields`, `form_criteria_items` theo `importMode: "upsert_version"` và `version`, sau đó cập nhật `import_batches` và ghi `audit_logs`.

Các API protected hiện kiểm quyền ngay ở đầu request. Nếu chưa đăng nhập hoặc không có quyền, API trả `403 Forbidden` trước khi xử lý dữ liệu body hoặc file upload.

## Tài khoản demo

Prototype có màn hình chọn vai trò demo. Mật khẩu mặc định: `123456`.

- `admin`: Admin hệ thống.
- `khth`: Phòng KHTH.
- Các tài khoản thành viên đoàn được tạo mẫu từ họ tên trong Quyết định 271/QĐ-BV.
- `capa`: tài khoản mẫu cập nhật khắc phục.

Khi triển khai thật, tạo tài khoản bằng Supabase Auth, không lưu mật khẩu dạng văn bản thường.

## Cấu hình Supabase

1. Tạo Supabase project.
2. Mở SQL Editor.
3. Chạy file `database/supabase-schema.sql`.
4. Tạo bucket Storage cho:
   - `report-exports`
   - `score-attachments`
   - `capa-evidence`
5. Tạo `.env.local` từ `.env.example`.
6. Điền URL/key Supabase.
7. Tạo tài khoản admin đầu tiên.
8. Import 04 file Excel.
9. Kiểm tra dữ liệu import, cảnh báo lệch số tiêu chí/tổng điểm.

## Import Excel

Import ưu tiên sheet phiếu thực tế:

1. Nhận diện loại file: Đoàn 1 LS/CLS, Đoàn 2 LS/CLS, Đoàn 1 hành chính, Đoàn 2 hành chính.
2. Đọc trực tiếp các sheet như `LS_KHAM_BENH`, `CLS_DUOC`, `P_KHTH`.
3. Tạo `form_templates`.
4. Tạo `form_header_fields`.
5. Tạo `form_criteria_items`.
6. Đối chiếu `DU_LIEU_TIEU_CHI` nếu cần.
7. Ghi `import_batches` và `import_warnings`.

## Xuất Excel

Mẫu mặc định xuất theo sheet phiếu nguồn, tối thiểu gồm:

- `PHIEU_CHI_TIET`
- `TONG_HOP_DIEM`
- `CHI_TIET_LOI`
- `LOI_NGUY_CO_CAO`
- `CAPA`

Khi triển khai thật, file xuất lưu vào Supabase Storage và metadata lưu ở `report_exports`.

## Deploy Vercel

1. Đưa source lên GitHub.
2. Tạo Vercel project từ repository.
3. Cấu hình biến môi trường Supabase.
4. Build command: `npm run build`.
5. Deploy.
6. Kiểm tra dashboard công khai trước.
7. Kiểm tra đăng nhập và quyền thao tác sau.

## Việc còn lại sau prototype

- Kết nối Supabase thật.
- API routes/server actions cho import, chấm điểm, CAPA, chốt kỳ, mở khóa, export.
- Màn hình rà soát import Excel trước khi ghi database.
- Upload minh chứng file/ảnh.
- Render Excel có định dạng gần sheet gốc hơn, gồm logo, tiêu đề, vùng chữ ký nếu cần.
## Cập nhật lõi ngày 26/05/2026

- `database/supabase-schema.sql` đã bổ sung RLS public-read/protected-write rõ hơn, `public_profiles`, `report_files`, index và grant cho `anon/authenticated`.
- `seed/initial-catalog.sql` dùng để nạp danh mục khoa/phòng, đoàn kiểm tra và kỳ kiểm tra 2026 sau khi chạy schema.
- API protected hiện hỗ trợ 02 cách xác định người dùng:
  - Prototype: header `x-demo-role`.
  - Triển khai thật: `Authorization: Bearer <Supabase access token>`.
- `src/lib/validation.ts` gom validation nghiệp vụ chấm điểm: điểm không âm, không vượt tối đa, điểm thấp phải có lý do, nguy cơ cao/nghiêm trọng phải có yêu cầu khắc phục/thời hạn/người hoặc bộ phận chịu trách nhiệm.
- Export Excel đã có các sheet nghiệp vụ chính: `DASHBOARD_THONG_KE`, `TONG_HOP_DIEM`, `PHIEU_CHI_TIET`, `CHI_TIET_TIEU_CHI`, `PHAT_HIEN_VA_KHAC_PHUC`, `CAPA`, `LOI_NGUY_CO_CAO`, `PHAN_CONG_THANH_VIEN`, `CAN_CU`.
