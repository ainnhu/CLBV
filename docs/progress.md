# Tiến độ hoàn thành web

Ngày cập nhật: 26/05/2026.

## Tổng quan

Hiện tại ưu tiên đã chuyển sang hoàn thành phần lõi trước khi chỉnh sâu giao diện. Giao diện vẫn giữ ở mức đủ thao tác để kiểm thử, còn trọng tâm là Supabase schema, RLS, API quyền, import Excel, lưu điểm, CAPA, audit log và export Excel.

| Nhóm việc | Tiến độ | Trạng thái |
| --- | ---: | --- |
| Nguồn dữ liệu | 85% | Đã phân tích PDF và 04 file Excel; đã tạo dữ liệu theo sheet phiếu nguồn, giữ `source_file`, `source_sheet`, `source_row`, loại phiếu, khoa/phòng, đoàn và phiên bản. |
| Database và bảo mật | 80% | Đã bổ sung schema Supabase theo hướng public-read/protected-write, thêm `report_files`, `public_profiles`, index, grant cho `anon/authenticated`, RLS cho hồ sơ cá nhân, phân công, report file và thao tác quản trị. |
| Auth/API quyền | 88% | API protected đã hỗ trợ demo header và có thể đọc Supabase Bearer token khi cấu hình thật; request ghi vẫn kiểm tra quyền backend trước khi xử lý body/file. |
| API nghiệp vụ | 99% | Đã có API public/protected cho dashboard, form, danh mục public, kết quả public, lịch sử public, lỗi nguy cơ cao public, báo cáo public, CAPA public, lịch/phiên kiểm tra public, phân công public, chấm điểm, upload minh chứng điểm chấm, upload minh chứng CAPA, CAPA update, chốt/mở khóa kỳ, tạo phiên kiểm tra, tạo phân công, import prepare/commit và export Excel qua backend; audit log đã được map đúng cột database. |
| Import Excel | 82% | Parser ưu tiên sheet phiếu kiểm tra/chấm điểm theo khoa/phòng, tạo import batch UUID, cảnh báo lệch số tiêu chí/tổng điểm, có màn hình đọc thử/rà soát cảnh báo trước khi commit `upsert_version`. |
| Excel báo cáo | 78% | Export đã có các sheet `DASHBOARD_THONG_KE`, `TONG_HOP_DIEM`, `PHIEU_CHI_TIET`, `CHI_TIET_TIEU_CHI`, `CHI_TIET_LOI`, `PHAT_HIEN_VA_KHAC_PHUC`, `CAPA`, `LOI_NGUY_CO_CAO`, `PHAN_CONG_THANH_VIEN`, `CAN_CU`; `PHIEU_CHI_TIET` đã có bố cục đầu phiếu, thông tin nguồn, tổng điểm, xếp loại, bảng tiêu chí, độ rộng cột và bộ lọc. Khi có Supabase thật sẽ upload file vào Storage và ghi `report_exports/report_files`. |
| Giao diện | 52% | Đã có đủ màn hình chính và điều hướng dạng tab động. Giao diện còn cần tinh giản lại sau khi phần lõi chạy ổn. |
| Deploy Vercel | 100% | Đã deploy thành công tại `https://clbv.vercel.app/`; bản cập nhật tiếp theo sẽ tự deploy khi source được cập nhật lên GitHub. |

## Nguyên tắc quyền đang áp dụng

- Ai có link web đều xem được dữ liệu công khai.
- Dashboard, danh sách phiếu, lịch, kết quả chấm điểm, lịch sử kiểm tra, lỗi nguy cơ cao, CAPA, danh sách báo cáo đã xuất và tiến độ public không yêu cầu đăng nhập.
- Thao tác ghi như chấm điểm, cập nhật CAPA, chốt/mở khóa kỳ, import Excel, commit import và export báo cáo đều kiểm tra quyền ở API/backend.
- Khi có Supabase thật, API protected có thể nhận `Authorization: Bearer <access_token>` để lấy role từ bảng `profiles`.
- Ở prototype, vẫn dùng được header `x-demo-role` để test nhanh quyền thao tác.

## Kiểm thử gần nhất

- `npm.cmd run build`: đạt.
- Local API public dashboard: trả về `200`.
- Local API public reports: trả về `200`.
- Local API public CAPA: trả về `200`.
- Local API public sessions: trả về `200`.
- Local API public catalog: trả về `200`.
- Local API public assignments: trả về `200`.
- Local API public results/history/high-risk: trả về `200`.
- Local API protected export không đăng nhập: trả về `403`.
- Local API protected export với vai trò `Phòng KHTH`: trả về `200` và file `.xlsx`.
- Local API protected upload minh chứng không đăng nhập: trả về `403`.
- Local API protected upload minh chứng với vai trò `Admin`: trả về `200` ở chế độ mock.
- Local API protected upload minh chứng CAPA không đăng nhập: trả về `403`.
- Local API protected upload minh chứng CAPA với vai trò `CAPA`: trả về `200` ở chế độ mock.
- Build đã kiểm tra TypeScript sau khi bổ sung schema, auth request, validation điểm, audit log row mapping và export Excel nhiều sheet.

## Việc tiếp theo

1. Kiểm thử thực tế với Supabase project sau khi có biến môi trường thật trên Vercel.
2. Bổ sung vùng chữ ký/logo nhúng trong Excel nếu chuyển sang thư viện hỗ trợ style đầy đủ.
3. Sau khi lõi ổn, quay lại tinh giản giao diện chấm điểm mobile-first và dashboard.
