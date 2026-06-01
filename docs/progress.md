# Tiến độ hoàn thành web

Ngày cập nhật: 01/06/2026.

## Tổng quan

Trọng tâm hiện tại là hoàn thiện phần lõi trước khi chỉnh sâu giao diện. Website vẫn theo nguyên tắc: ai có link đều xem được dữ liệu công khai; mọi thao tác ghi, import, export, chốt, mở khóa và quản trị đều phải đăng nhập và được kiểm tra quyền ở backend/API.

| Nhóm việc | Tiến độ | Trạng thái |
| --- | ---: | --- |
| Nguồn dữ liệu | 85% | Đã phân tích PDF và 04 file Excel; dữ liệu đang bám theo sheet phiếu nguồn, giữ `source_file`, `source_sheet`, `source_row`, loại phiếu, khoa/phòng, đoàn và phiên bản. |
| Database và bảo mật | 85% | Đã có schema Supabase theo hướng public-read/protected-write, RLS, migration lõi, bảng profile public, phân công, report file, audit log và API health protected không lộ khóa bí mật. |
| Auth/API quyền | 95% | API protected hỗ trợ demo role và Bearer token Supabase khi cấu hình thật; request ghi kiểm tra quyền backend trước khi xử lý body/file; JSON hỏng trả `400`, dữ liệu sai nghiệp vụ trả `422`, không đủ quyền trả `403`. |
| API nghiệp vụ | 99% | Đã có API public/protected cho dashboard, forms, catalog, results, history, high-risk, reports, CAPA, sessions, assignments, scores, attachments, import, export, periods và system health. |
| Storage | 82% | Upload lên Supabase Storage đã hỗ trợ public URL và signed URL tùy chọn qua `SUPABASE_STORAGE_SIGNED_URL_SECONDS`; system health đã kiểm tra đúng `SCORE_ATTACHMENT_BUCKET`, `REPORT_EXPORT_BUCKET`, `CAPA_EVIDENCE_BUCKET`. |
| Import Excel | 84% | Parser ưu tiên sheet phiếu kiểm tra/chấm điểm theo khoa/phòng, nhận diện loại file, cảnh báo lệch tổng điểm/số tiêu chí, có commit import theo quyền Admin/Phòng KHTH. |
| Excel báo cáo | 78% | Export đã tạo workbook nhiều sheet: dashboard thống kê, tổng hợp điểm, phiếu chi tiết, chi tiết tiêu chí, lỗi/điểm trừ, phát hiện/khắc phục, CAPA, lỗi nguy cơ cao, phân công thành viên và căn cứ. |
| Giao diện | 52% | Đã đủ màn hình chính và điều hướng dạng tab động. Giao diện còn cần tinh giản sau khi lõi ổn định. |
| Deploy Vercel | 100% | Đã deploy tại `https://clbv.vercel.app/`; GitHub `main` tự kích hoạt Vercel deploy. |

## Kiểm thử gần nhất

- `npm.cmd run build`: đạt.
- Vercel `node scripts/smoke-test.mjs https://clbv.vercel.app`: đạt `46/46`.
- Public read API trên Vercel: dashboard, reports, CAPA, sessions, catalog, assignments, results, history, high-risk đều trả `200` khi không đăng nhập.
- Protected API trên Vercel: không đăng nhập trả `403` cho thao tác ghi/export/import/upload; JSON hỏng trả `400`; payload sai nghiệp vụ trả `422`; payload hợp lệ đúng quyền trả `200`.
- Import commit protected: kiểm tra đủ các trường hợp không đăng nhập, JSON hỏng, payload thiếu template/criteria, cảnh báo chưa cho phép và commit hợp lệ bằng Admin.
- System health protected: không đăng nhập trả `403`; Admin trả `200`, có `summary`, `supabase`, `checks`, `storage.scoreAttachmentBucket`, không còn field cấu hình sai `scoreEvidenceBucket`.
- Scores protected: không đăng nhập trả `403`; thiếu lý do/phát hiện khi bị trừ điểm trả `422`; Admin ghi hợp lệ trả `200`.
- CAPA protected: không đăng nhập trả `403`; thiếu nội dung cập nhật trả `422`; vai trò CAPA cập nhật hợp lệ trả `200`.
- Periods protected: không đăng nhập trả `403`; JSON hỏng trả `400`; payload sai trả `422`; mở khóa không có lý do trả `422`; Admin chốt/mở khóa hợp lệ trả `200`.
- Upload minh chứng điểm và minh chứng CAPA: không đăng nhập trả `403`; đúng quyền trả `200` và có `data:image/png;base64,...` trong chế độ dữ liệu mẫu.
- Export Excel protected bằng vai trò Admin: trả `200` và đúng MIME `.xlsx`.
- Catalog, sessions, assignments protected: kiểm tra đủ không đăng nhập, JSON hỏng hoặc payload sai, và payload hợp lệ bằng Admin.

## Việc tiếp theo

1. Kết nối Supabase thật trên Vercel bằng biến môi trường, chạy schema/migration và seed tài khoản quản trị.
2. Kiểm thử RLS với tài khoản thật: Admin, Phòng KHTH, Thư ký đoàn, Thành viên đoàn, CAPA, Khoa/phòng.
3. Chạy import 04 file Excel thật qua API/import UI và đối chiếu số sheet, số tiêu chí, tổng điểm, đoàn, khoa/phòng.
4. Kiểm thử luồng chấm điểm thật: tạo phiên, phân công, nhập điểm, bắt lỗi thiếu lý do trừ điểm, lưu nháp, hoàn tất, khóa/mở khóa.
5. Kiểm thử export Excel sau khi có dữ liệu Supabase thật và lưu thông tin file báo cáo.
6. Sau khi lõi đạt, chỉnh lại giao diện mobile-first và dashboard cho gọn, dễ thao tác hơn.
