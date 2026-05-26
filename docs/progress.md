# Tiến độ hoàn thành web

Ngày cập nhật: 26/05/2026.

## Tổng quan

Hiện tại ưu tiên đã chuyển sang hoàn thành phần lõi trước khi chỉnh sâu giao diện. Giao diện vẫn giữ ở mức đủ thao tác để kiểm thử, còn trọng tâm là Supabase schema, RLS, API quyền, import Excel, lưu điểm, CAPA, audit log và export Excel.

| Nhóm việc | Tiến độ | Trạng thái |
| --- | ---: | --- |
| Nguồn dữ liệu | 85% | Đã phân tích PDF và 04 file Excel; đã tạo dữ liệu theo sheet phiếu nguồn, giữ `source_file`, `source_sheet`, `source_row`, loại phiếu, khoa/phòng, đoàn và phiên bản. |
| Database và bảo mật | 80% | Đã bổ sung schema Supabase theo hướng public-read/protected-write, thêm `report_files`, `public_profiles`, index, grant cho `anon/authenticated`, RLS cho hồ sơ cá nhân, phân công, report file và thao tác quản trị. |
| Auth/API quyền | 88% | API protected đã hỗ trợ demo header và có thể đọc Supabase Bearer token khi cấu hình thật; request ghi vẫn kiểm tra quyền backend trước khi xử lý body/file. |
| API nghiệp vụ | 89% | Đã có API public/protected cho dashboard, form, chấm điểm, CAPA, chốt/mở khóa kỳ, tạo phiên kiểm tra, import prepare/commit và export Excel; audit log đã được map đúng cột database. |
| Import Excel | 75% | Parser ưu tiên sheet phiếu kiểm tra/chấm điểm theo khoa/phòng, tạo import batch UUID, cảnh báo lệch số tiêu chí/tổng điểm và commit `upsert_version`. Còn cần màn hình rà soát import hoàn chỉnh. |
| Excel báo cáo | 64% | Export đã có các sheet `DASHBOARD_THONG_KE`, `TONG_HOP_DIEM`, `PHIEU_CHI_TIET`, `CHI_TIET_TIEU_CHI`, `PHAT_HIEN_VA_KHAC_PHUC`, `CAPA`, `LOI_NGUY_CO_CAO`, `PHAN_CONG_THANH_VIEN`, `CAN_CU`. Còn cần làm định dạng gần workbook gốc hơn. |
| Giao diện | 52% | Đã có đủ màn hình chính và điều hướng dạng tab động. Giao diện còn cần tinh giản lại sau khi phần lõi chạy ổn. |
| Deploy Vercel | 100% | Đã deploy thành công tại `https://clbv.vercel.app/`; bản cập nhật tiếp theo sẽ tự deploy khi source được cập nhật lên GitHub. |

## Nguyên tắc quyền đang áp dụng

- Ai có link web đều xem được dữ liệu công khai.
- Dashboard, danh sách phiếu, lịch, CAPA, báo cáo đã xuất và tiến độ public không yêu cầu đăng nhập.
- Thao tác ghi như chấm điểm, cập nhật CAPA, chốt/mở khóa kỳ, import Excel, commit import và export báo cáo đều kiểm tra quyền ở API/backend.
- Khi có Supabase thật, API protected có thể nhận `Authorization: Bearer <access_token>` để lấy role từ bảng `profiles`.
- Ở prototype, vẫn dùng được header `x-demo-role` để test nhanh quyền thao tác.

## Kiểm thử gần nhất

- `npm.cmd run build`: đạt.
- Build đã kiểm tra TypeScript sau khi bổ sung schema, auth request, validation điểm, audit log row mapping và export Excel nhiều sheet.

## Việc tiếp theo

1. Bổ sung seed tài khoản mẫu và phân công mẫu cho Supabase.
2. Hoàn thiện API tạo phân công thành viên theo tiêu chí/khoa/phòng.
3. Hoàn thiện màn hình rà soát import Excel trước khi commit chính thức.
4. Hoàn thiện export Excel lưu file vào Supabase Storage, rồi ghi metadata vào `report_exports` và `report_files`.
5. Viết hướng dẫn chạy Supabase từng bước cho người không chuyên CNTT.
6. Sau khi lõi ổn, quay lại tinh giản giao diện chấm điểm mobile-first và dashboard.
