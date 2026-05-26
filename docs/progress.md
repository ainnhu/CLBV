# Tiến độ hoàn thành web

Ngày cập nhật: 26/05/2026.

## Tổng quan

Mục tiêu hiện tại là hoàn thiện nền dữ liệu, API nghiệp vụ, import/export Excel và kiểm quyền trước; giao diện sẽ tiếp tục tinh giản sau khi các luồng chính ổn định.

| Nhóm việc | Tiến độ | Trạng thái |
| --- | ---: | --- |
| Nguồn dữ liệu | 85% | Đã phân tích PDF và 04 file Excel; đã tạo dữ liệu theo sheet phiếu nguồn, giữ `source_file`, `source_sheet`, `source_row`, loại phiếu, khoa/phòng, đoàn và phiên bản. |
| Database và bảo mật | 68% | Đã có schema Supabase, RLS theo hướng public-read/protected-write, unique key phục vụ import lại cùng phiên bản và service kiểm quyền backend. |
| API nghiệp vụ | 82% | Đã có repository layer mock/Supabase, API public/protected cho dashboard, form, chấm điểm, CAPA, chốt/mở khóa kỳ, import prepare/commit, upsert theo phiên bản và export Excel. |
| Giao diện | 40% | Có đủ màn hình chính để thao tác thử; chưa chốt thẩm mỹ theo nhận xét mới, sẽ tinh giản sau khi nền nghiệp vụ ổn hơn. |
| Excel báo cáo | 52% | Đã có export mẫu theo phiếu nguồn; cần hoàn thiện định dạng gần workbook gốc hơn và bổ sung nhiều biến thể báo cáo. |

## Nguyên tắc quyền đã áp dụng

- Ai có link web đều xem được dữ liệu công khai.
- Dashboard public, danh sách phiếu và tiến độ public không yêu cầu đăng nhập.
- Các thao tác ghi như chấm điểm, cập nhật CAPA, chốt/mở khóa kỳ, import Excel, commit import và export báo cáo đều kiểm quyền ở API/backend.
- Request protected không có quyền hiện trả `403 Forbidden` trước khi xử lý body hoặc file.

## API đã có

Public, không cần đăng nhập:

- `GET /api/public/dashboard`
- `GET /api/public/forms`
- `GET /api/public/progress`

Protected, cần header demo `x-demo-role` ở giai đoạn prototype:

- `POST /api/protected/scores`
- `POST /api/protected/import`
- `POST /api/protected/import/commit`
- `POST /api/protected/reports/export`
- `POST /api/protected/capa`
- `POST /api/protected/periods`

Ví dụ role demo:

```text
x-demo-role: Admin
x-demo-role: Phòng KHTH
x-demo-role: Thành viên đoàn
```

## Kiểm thử gần nhất

- `npm.cmd run build`: đạt.
- Public dashboard không đăng nhập: trả `200`.
- Protected chấm điểm không đăng nhập: trả `403`.
- Protected import không đăng nhập: trả `403`.
- Import workbook `1805_V03_ĐOÀN 1_LS-CLS.xlsx`: 21 phiếu, 630 tiêu chí, 231 trường đầu phiếu, commit `upsert_version` phiên bản `V03-1805`.
- Import workbook `1805_V03_ĐOÀN 1_HÀNH CHÍNH.xlsx`: 8 phiếu, 160 tiêu chí, 88 trường đầu phiếu, commit `upsert_version` phiên bản `V03-1805`.

## Việc tiếp theo

1. Kết nối Supabase thật và chạy schema/RLS.
2. Chuyển repository sang ghi/đọc database thật khi có Supabase env.
3. Tạo màn hình rà soát import Excel trước khi ghi chính thức.
4. Hoàn thiện export Excel có định dạng gần sheet gốc hơn.
5. Bổ sung audit log thật cho mọi thao tác protected khi chạy Supabase.
6. Hoàn thiện giao diện chấm điểm mobile-first bám đầu phiếu và nhóm tiêu chí.
7. Sau đó tinh giản lại giao diện theo hướng gọn, ít rối, dùng dropdown tối đa.
