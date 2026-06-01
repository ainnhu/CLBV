Vai trò của bạn:
Bạn là Chuyên gia Quản trị Bệnh viện cấp cao, đồng thời là Lập trình viên Full-stack xuất sắc, am hiểu xây dựng Web App nội bộ/công khai xem dữ liệu cho bệnh viện, có khả năng thiết kế hệ thống dữ liệu, phân quyền thao tác, dashboard, xuất báo cáo Excel và triển khai qua Vercel.

Bối cảnh:
Tôi cần xây dựng một Ứng dụng Web số hóa phục vụ công tác “Chấm điểm kiểm tra các mặt hoạt động của các khoa, phòng tại Bệnh viện Sản - Nhi Cà Mau năm 2026”, căn cứ theo Kế hoạch số 32/KH-BV và Quyết định số 271/QĐ-BV.

Tài liệu đầu vào gồm:
1. Kế hoạch số 32/KH-BV và Quyết định số 271/QĐ-BV.
2. Các file Excel bảng kiểm:
   - Đoàn 1 - Lâm sàng/Cận lâm sàng.
   - Đoàn 2 - Lâm sàng/Cận lâm sàng.
   - Đoàn 1 - Hành chính.
   - Đoàn 2 - Hành chính.
3. Hình ảnh nhận diện thương hiệu của Bệnh viện Sản - Nhi Cà Mau gồm logo và banner màu xanh.

Yêu cầu quan trọng:
Không tạo website tĩnh. Không hard-code dữ liệu bảng kiểm vào giao diện. Website phải được xây dựng theo hướng có thể bảo trì, mở rộng và chỉnh sửa về sau.

Toàn bộ dữ liệu bảng kiểm, khoa/phòng, đoàn kiểm tra, người chấm, kỳ kiểm tra, điểm số, nhận xét, minh chứng, báo cáo tháng phải được quản lý bằng cơ sở dữ liệu.

Bắt buộc xây dựng trang Quản trị dữ liệu để Admin/Phòng KHTH có thể tự thêm, sửa, xóa các danh mục trên giao diện web mà không cần sửa code, gồm:
- Khoa/phòng.
- Người dùng.
- Đoàn kiểm tra.
- Lịch kiểm tra.
- Bảng kiểm.
- Tiêu chí.
- Phân công.
- Kỳ kiểm tra.
- Trạng thái CAPA.

Lưu ý bắt buộc về quyền truy cập:
Đây là website cho phép xem dữ liệu không cần đăng nhập. Không được thiết kế kiểu bắt buộc đăng nhập mới vào được dashboard.

Ai có link website đều có thể xem:
- Trang chủ.
- Dashboard tổng quan.
- Lịch kiểm tra.
- Kết quả chấm điểm.
- Báo cáo tháng đã xuất.
- Lịch sử kiểm tra.
- Danh sách lỗi nguy cơ cao.
- Theo dõi CAPA/khắc phục.
- Dữ liệu các khoa/phòng.
- Bảng kiểm/tiêu chí kiểm tra.

Đăng nhập chỉ áp dụng cho người được phân quyền thao tác, bao gồm:
- Thành viên đoàn kiểm tra cần nhập điểm.
- Thư ký đoàn cần rà soát, tổng hợp.
- Trưởng đoàn/Phó trưởng đoàn cần xác nhận dữ liệu.
- Phòng Kế hoạch tổng hợp cần quản lý kỳ kiểm tra, chốt dữ liệu, xuất báo cáo.
- Admin cần quản trị người dùng, bảng kiểm, phân công, danh mục.
- Người được giao cập nhật trạng thái CAPA.

Nguyên tắc:
- Không đăng nhập vẫn xem được toàn bộ dữ liệu hiển thị công khai trên web.
- Đăng nhập chỉ để mở quyền thao tác.
- Người dùng đã đăng nhập cũng chỉ được chỉnh sửa đúng phạm vi được phân quyền.
- Người không đăng nhập không được nhập điểm, sửa điểm, xóa dữ liệu, chốt báo cáo, xuất Excel, mở khóa kỳ kiểm tra hoặc quản trị hệ thống.

Mục tiêu hệ thống:
Xây dựng một Web App tiếng Việt, dùng được trên điện thoại thông minh và máy tính, phục vụ:
- Người xem thông thường có thể xem toàn bộ dữ liệu công khai trên web mà không cần đăng nhập.
- Thành viên đoàn kiểm tra chấm điểm trực tiếp trên điện thoại sau khi đăng nhập.
- Thư ký đoàn rà soát dữ liệu sau kiểm tra sau khi đăng nhập.
- Phòng Kế hoạch tổng hợp quản lý, tổng hợp, chốt dữ liệu và xuất báo cáo sau khi đăng nhập.
- Ban Giám đốc xem dashboard, cảnh báo nguy cơ cao và xu hướng cải tiến mà không bắt buộc đăng nhập.
- Khoa/phòng được kiểm tra xem kết quả, nội dung cần khắc phục và trạng thái CAPA.
- Người được phân quyền CAPA có thể cập nhật tình trạng khắc phục sau khi đăng nhập.

Công nghệ đề xuất:
- Frontend: Next.js + React + TypeScript.
- Giao diện: Tailwind CSS, ưu tiên thiết kế sạch, rõ, dễ thao tác.
- Biểu đồ: Recharts.
- Xuất Excel: thư viện xlsx hoặc ExcelJS.
- Đăng nhập cho người thao tác: tài khoản nội bộ username/password.
- Cơ sở dữ liệu: Firebase Firestore hoặc phương án database phù hợp.
- Lưu file báo cáo đã xuất: Firebase Storage hoặc storage tương đương.
- Deploy: Vercel.
- Repository lưu trên GitHub.

Yêu cầu đăng nhập:
Không bắt buộc đăng nhập để xem website.

Trên giao diện cần có nút:
“Đăng nhập để chấm điểm / quản trị”

Người xem thông thường:
- Có thể bỏ qua đăng nhập.
- Có thể xem dữ liệu công khai trên web.
- Không thấy hoặc không sử dụng được các nút thao tác dữ liệu.

Người được phân quyền:
Đăng nhập bằng tài khoản nội bộ username/password.

Mỗi người dùng có:
- Tên đăng nhập.
- Mật khẩu.
- Họ tên.
- Chức vụ/đơn vị.
- Vai trò.
- Đoàn kiểm tra nếu có.
- Nhóm nội dung được phân công nếu có.
- Email: tùy chọn, không bắt buộc.
- Số điện thoại: tùy chọn.
- Trạng thái hoạt động.

Email chỉ là trường tùy chọn, không dùng làm điều kiện bắt buộc để tạo tài khoản hoặc đăng nhập.

Ở giai đoạn prototype, có thể dùng dữ liệu tài khoản mẫu để đăng nhập. Khi triển khai thật, xây dựng cơ chế đăng nhập bằng username/password nội bộ, đảm bảo bảo mật mật khẩu và không lưu mật khẩu dạng văn bản thường.

Yêu cầu nhận diện giao diện:
Thiết kế giao diện theo màu nhận diện của Bệnh viện Sản - Nhi Cà Mau:
- Màu xanh lá chủ đạo.
- Màu xanh đậm dùng cho header, sidebar, nút chính.
- Màu đỏ dùng cho cảnh báo, lỗi nguy cơ cao và điểm không đạt.
- Sử dụng logo bệnh viện ở màn hình đăng nhập, thanh tiêu đề và báo cáo.
- Có thể dùng slogan “Niềm tin của mẹ - Sức khỏe của bé” ở màn hình trang chủ, đăng nhập hoặc footer.

Yêu cầu responsive:
1. Trên điện thoại:
   - Giao diện dọc.
   - Nút bấm lớn, dễ bấm bằng một ngón tay.
   - Mỗi tiêu chí hiển thị dạng thẻ/card.
   - Có thanh tiến độ số tiêu chí đã chấm.
   - Có nút lưu nháp và nút hoàn tất phiếu.
   - Tối ưu cho thành viên đoàn đi kiểm tra thực tế.
   - Người không đăng nhập vẫn xem được dữ liệu, nhưng các ô nhập liệu ở trạng thái chỉ xem.

2. Trên máy tính:
   - Có dashboard tổng quan.
   - Có bảng dữ liệu dễ lọc, tìm kiếm, xem chi tiết.
   - Có biểu đồ so sánh điểm giữa các khoa/phòng theo tuần, tháng, quý.
   - Có khu vực cảnh báo lỗi nguy cơ cao.
   - Các nút thao tác như thêm/sửa/xóa/chốt/xuất báo cáo chỉ hiển thị hoặc chỉ hoạt động sau khi đăng nhập tài khoản có quyền.

Cơ cấu dữ liệu cần quản lý:
Thiết kế database tối thiểu gồm các collection/bảng sau:

1. users
   - id
   - username
   - passwordHash
   - họ tên
   - chức vụ/đơn vị
   - vai trò
   - đoàn kiểm tra
   - nhóm nội dung được phân công
   - email: tùy chọn, không bắt buộc
   - số điện thoại: tùy chọn
   - trạng thái hoạt động
   - thời gian tạo
   - thời gian cập nhật

2. departments
   - id
   - tên khoa/phòng
   - khối: Lâm sàng / Cận lâm sàng / Hành chính
   - trạng thái hoạt động

3. auditTeams
   - id
   - tên đoàn: Đoàn 01 / Đoàn 02
   - trưởng đoàn
   - phó trưởng đoàn
   - thư ký
   - thành viên

4. criteriaSets
   - id
   - loại phiếu: LS-CLS hoặc Hành chính
   - đoàn áp dụng
   - tổng điểm: 100
   - số nội dung: 30 đối với LS-CLS, 20 đối với Hành chính
   - phiên bản
   - trạng thái hiệu lực

5. criteriaItems
   - id
   - criteriaSetId
   - số thứ tự
   - nhóm tiêu chí
   - nội dung kiểm tra
   - điểm tối đa
   - loại chấm điểm: đạt/không đạt, điểm trừ, nhập điểm
   - có phải tiêu chí nguy cơ cao không
   - gợi ý minh chứng
   - người/nhóm được phân công chấm

6. auditPeriods
   - id
   - tháng
   - quý
   - năm
   - ngày bắt đầu
   - ngày kết thúc
   - trạng thái: đang mở / đã chốt / đã khóa
   - người tạo
   - ngày tạo

7. auditAssignments
   - id
   - kỳ kiểm tra
   - ngày kiểm tra
   - đoàn kiểm tra
   - khoa/phòng được kiểm tra
   - thành viên được phân công
   - nhóm tiêu chí được phân công
   - trạng thái

8. auditScores
   - id
   - kỳ kiểm tra
   - ngày kiểm tra
   - khoa/phòng
   - đoàn kiểm tra
   - người chấm
   - tiêu chí
   - điểm tối đa
   - điểm đạt
   - điểm trừ
   - kết quả: đạt / không đạt / không áp dụng
   - nhận xét
   - minh chứng
   - yêu cầu khắc phục
   - thời hạn hoàn thành
   - người chịu trách nhiệm
   - trạng thái CAPA
   - mức độ nguy cơ: bình thường / cần theo dõi / nguy cơ cao
   - thời gian tạo
   - thời gian cập nhật

9. reports
   - id
   - kỳ báo cáo
   - tháng
   - năm
   - trạng thái: nháp / đã chốt / đã xuất Excel
   - người chốt
   - thời gian chốt
   - tổng số khoa/phòng đã kiểm tra
   - tổng số lỗi nguy cơ cao
   - link file Excel

10. reportFiles
   - id
   - reportId
   - tên file
   - đường dẫn lưu trữ
   - downloadURL
   - thời gian tạo
   - người tạo

11. activityLogs
   - id
   - userId
   - username
   - họ tên
   - vai trò
   - thao tác
   - module
   - dữ liệu trước khi sửa
   - dữ liệu sau khi sửa
   - thời gian thao tác

Phân quyền người dùng:

Nguyên tắc chung:
- Toàn bộ website cho phép xem công khai khi có link, không cần đăng nhập.
- Phân quyền chỉ áp dụng cho thao tác thay đổi dữ liệu.
- Người không đăng nhập chỉ có quyền xem.
- Người đăng nhập chỉ được thao tác trong phạm vi được phân quyền.
- Các nút chức năng làm thay đổi dữ liệu phải được ẩn hoặc vô hiệu hóa nếu người dùng chưa đăng nhập hoặc không có quyền.

1. Khách xem / người chưa đăng nhập
   - Xem trang chủ.
   - Xem dashboard tổng quan.
   - Xem lịch kiểm tra.
   - Xem kết quả chấm điểm.
   - Xem báo cáo tháng đã xuất.
   - Xem lịch sử kiểm tra.
   - Xem CAPA/khắc phục.
   - Xem bảng kiểm/tiêu chí kiểm tra.
   - Không được nhập điểm.
   - Không được sửa dữ liệu.
   - Không được xóa dữ liệu.
   - Không được chốt báo cáo.
   - Không được xuất Excel mới.
   - Không được mở khóa kỳ kiểm tra.
   - Không được quản trị danh mục.

2. Thành viên đoàn kiểm tra
   - Sau khi đăng nhập, được nhập điểm và sửa điểm trong phạm vi được phân công.
   - Chỉ được chỉnh sửa nhóm tiêu chí/khoa/phòng được phân công.
   - Không được chỉnh sửa nội dung của người khác nếu không có quyền.
   - Không được chốt dữ liệu tháng.
   - Không được xóa dữ liệu.

3. Thư ký đoàn
   - Sau khi đăng nhập, được rà soát dữ liệu của đoàn.
   - Tổng hợp điểm của đoàn.
   - Đề xuất hoàn tất hoặc xuất báo cáo nháp nếu được phân quyền.
   - Không được chốt dữ liệu tháng nếu không có quyền Phòng KHTH/Admin.

4. Trưởng đoàn / Phó trưởng đoàn
   - Sau khi đăng nhập, được xác nhận hoàn tất dữ liệu của đoàn mình.
   - Theo dõi tiến độ chấm điểm.
   - Rà soát lỗi nguy cơ cao.
   - Không được sửa dữ liệu của đoàn khác nếu không được phân quyền.

5. Phòng KHTH
   - Sau khi đăng nhập, được tạo kỳ kiểm tra.
   - Quản lý lịch kiểm tra.
   - Quản lý phân công.
   - Rà soát dữ liệu toàn viện.
   - Chốt dữ liệu tháng.
   - Xuất báo cáo Excel.
   - Mở khóa kỳ kiểm tra khi cần theo quyền được cấp.

6. Admin hệ thống
   - Quản trị toàn bộ hệ thống.
   - Quản lý người dùng.
   - Quản lý khoa/phòng.
   - Quản lý bảng kiểm.
   - Quản lý đoàn kiểm tra.
   - Quản lý phân công.
   - Mở khóa dữ liệu đã chốt.
   - Cấu hình hệ thống.

7. Khoa/phòng được kiểm tra
   - Xem toàn bộ dữ liệu như người xem thông thường.
   - Nếu được cấp tài khoản, có thể cập nhật phản hồi hoặc trạng thái khắc phục của đơn vị mình.
   - Không được sửa điểm chấm của đoàn kiểm tra.

8. Ban Giám đốc
   - Xem toàn bộ dữ liệu mà không bắt buộc đăng nhập.
   - Nếu có tài khoản riêng, có thể truy cập các chế độ xem/tổng hợp nâng cao nếu hệ thống cấu hình thêm.
   - Không nhập điểm hoặc sửa dữ liệu nếu không được phân quyền.

Màn hình chức năng cần thiết kế:

1. Trang chủ công khai
   - Khi mở link website, người dùng vào thẳng trang chủ/dashboard mà không cần đăng nhập.
   - Logo Bệnh viện Sản - Nhi Cà Mau.
   - Tên hệ thống: “Hệ thống chấm điểm kiểm tra hoạt động bệnh viện”.
   - Slogan: “Niềm tin của mẹ - Sức khỏe của bé”.
   - Có nút “Đăng nhập để chấm điểm / quản trị”.
   - Hiển thị các module xem dữ liệu:
     + Dashboard tổng quan.
     + Lịch kiểm tra.
     + Kết quả chấm điểm.
     + Báo cáo tháng.
     + CAPA/khắc phục.
     + Bảng kiểm.
     + Lịch sử dữ liệu các tháng.

2. Màn hình đăng nhập
   - Không bắt buộc đăng nhập để vào website.
   - Chỉ dùng cho người cần thao tác dữ liệu.
   - Đăng nhập bằng tên đăng nhập và mật khẩu.
   - Không yêu cầu email.
   - Email chỉ là trường tùy chọn nếu cần lưu thông tin liên hệ.

3. Trang làm việc sau đăng nhập
   - Hiển thị thông tin người dùng đang đăng nhập.
   - Hiển thị vai trò và quyền thao tác.
   - Các module xem dữ liệu vẫn giống giao diện công khai.
   - Bổ sung các nút thao tác theo quyền:
     + Nhập điểm.
     + Sửa điểm.
     + Lưu nháp.
     + Hoàn tất phiếu.
     + Chốt dữ liệu.
     + Xuất báo cáo.
     + Quản trị danh mục.
     + Mở khóa kỳ kiểm tra.

4. Màn hình chấm điểm trên điện thoại
   - Người không đăng nhập có thể xem phiếu và dữ liệu đã chấm ở trạng thái chỉ xem.
   - Người đăng nhập có quyền mới được nhập/sửa điểm.

   Quy trình:
   - Bước 1: Chọn kỳ kiểm tra.
   - Bước 2: Chọn ngày kiểm tra.
   - Bước 3: Chọn khoa/phòng được kiểm tra.

   Danh sách khoa/phòng chia 3 khối:

   Khối Lâm sàng:
   Khám bệnh, Cấp cứu Nhi, Hồi sức tích cực - Chống độc Nhi, Cấp cứu - Chống độc Sản, Sanh, Sản thường, Phụ, Sản bệnh, Hậu phẫu, Gây mê hồi sức, Sơ sinh, Nội tổng hợp, Truyền nhiễm, Ngoại nhi, Liên chuyên khoa, Hiếm muộn.

   Khối Cận lâm sàng:
   Dược, Xét nghiệm, Kiểm soát nhiễm khuẩn, Chẩn đoán hình ảnh, Dinh dưỡng.

   Khối Hành chính:
   Kế hoạch tổng hợp, Quản lý chất lượng, Tổ chức cán bộ, Hành chính quản trị, Điều dưỡng, Tài chính kế toán, Vật tư thiết bị y tế, Công tác xã hội.

   Hệ thống tự động mở đúng bộ tiêu chí:
   - Phiếu Lâm sàng/Cận lâm sàng: 30 nội dung, thang điểm 100.
   - Phiếu Hành chính: 20 nội dung, thang điểm 100.

   Mỗi tiêu chí hiển thị dạng card:
   - STT.
   - Nhóm tiêu chí.
   - Nội dung kiểm tra.
   - Điểm tối đa.
   - Nút Đạt.
   - Nút Không đạt.
   - Ô nhập điểm trừ nếu có.
   - Công tắc “Lỗi nguy cơ cao”.
   - Ô “Minh chứng”.
   - Ô “Yêu cầu khắc phục”.
   - Ô “Thời hạn hoàn thành”.
   - Ô “Người chịu trách nhiệm”.
   - Trạng thái CAPA.

   Nếu chọn Không đạt, có điểm trừ hoặc bật “Lỗi nguy cơ cao” thì bắt buộc nhập:
   - Minh chứng.
   - Yêu cầu khắc phục.
   - Thời hạn hoàn thành.
   - Người chịu trách nhiệm.

   Có nút:
   - Lưu nháp.
   - Hoàn tất phiếu.
   - Quay lại.

   Có cảnh báo nếu chưa chấm đủ tiêu chí.
   Các nút Lưu nháp / Hoàn tất phiếu / Sửa điểm chỉ hoạt động khi người dùng đã đăng nhập và có quyền.

5. Màn hình quản lý kỳ kiểm tra
   - Mọi người dùng được xem danh sách kỳ kiểm tra.
   - Xem tháng, quý, năm.
   - Xem trạng thái kỳ: đang mở / đã chốt / đã khóa.
   - Cho phép xem lại dữ liệu các kỳ cũ.
   - Chỉ Admin hoặc Phòng KHTH được tạo/sửa/chốt/mở khóa kỳ kiểm tra.
   - Không cho sửa dữ liệu điểm khi kỳ đã khóa, trừ khi Admin hoặc Phòng KHTH mở khóa theo quyền.

6. Màn hình quản lý phân công
   - Mọi người dùng được xem phân công.
   - Xem thành viên theo đoàn.
   - Xem người chấm theo nhóm tiêu chí.
   - Xem khoa/phòng được kiểm tra theo lịch.
   - Chỉ Admin hoặc Phòng KHTH được chỉnh sửa phân công.
   - Thành viên chỉ được nhập điểm trong phạm vi được phân công.

7. Màn hình Report Management
   - Mọi người dùng được xem báo cáo.
   - Mọi người dùng được tải báo cáo đã xuất nếu đã có link.
   - Chọn tháng/năm để xem dữ liệu.
   - Hiển thị danh sách báo cáo đã tạo.
   - Hiển thị trạng thái: nháp / đã chốt / đã xuất Excel.
   - Chỉ Phòng KHTH hoặc Admin được bấm nút “Chốt dữ liệu & Xuất Báo Cáo Tháng”.

   Khi bấm nút “Chốt dữ liệu & Xuất Báo Cáo Tháng”, hệ thống phải:
   1. Tổng hợp toàn bộ điểm số, lỗi vi phạm, minh chứng, nội dung khắc phục của tất cả khoa/phòng trong tháng.
   2. Tính tổng điểm theo từng khoa/phòng.
   3. Tính điểm trừ.
   4. Xếp loại:
      - Tốt: 90-100 điểm.
      - Đạt: 80 đến dưới 90 điểm.
      - Cần cải tiến: 65 đến dưới 80 điểm.
      - Không đạt: dưới 65 điểm hoặc có lỗi nghiêm trọng ảnh hưởng an toàn người bệnh/an toàn bệnh viện.
   5. Tạo file Excel định dạng .xlsx.
   6. Lưu file Excel vào storage.
   7. Lưu thông tin file vào collection reportFiles.
   8. Trả về downloadURL để người dùng tải về ngay trên giao diện.

8. Cấu trúc file Excel xuất ra
   File Excel cần có các sheet:
   - Sheet 1: Tổng hợp điểm theo khoa/phòng.
   - Sheet 2: Chi tiết lỗi và điểm trừ.
   - Sheet 3: Danh sách lỗi nguy cơ cao.
   - Sheet 4: Theo dõi CAPA/khắc phục.
   - Sheet 5: Thông tin kỳ kiểm tra và người chốt.

   Các cột tối thiểu:
   - Ngày kiểm tra.
   - Tháng.
   - Năm.
   - Đơn vị.
   - Khối.
   - Đoàn kiểm tra.
   - Người chấm.
   - Nhóm tiêu chí.
   - Nội dung tiêu chí.
   - Điểm tối đa.
   - Điểm đạt.
   - Điểm trừ.
   - Tổng điểm.
   - Xếp loại.
   - Minh chứng.
   - Nội dung khắc phục.
   - Người chịu trách nhiệm.
   - Thời hạn hoàn thành.
   - Trạng thái CAPA.
   - Mức độ nguy cơ.

9. Dashboard máy tính
   - Không cần đăng nhập vẫn xem được dashboard.
   - Tổng số khoa/phòng đã kiểm tra trong tháng.
   - Điểm trung bình toàn viện.
   - Top khoa/phòng điểm cao.
   - Khoa/phòng cần cải tiến.
   - Số lỗi nguy cơ cao.
   - Số CAPA quá hạn.
   - Biểu đồ cột so sánh điểm giữa các khoa/phòng.
   - Biểu đồ đường theo dõi xu hướng điểm theo tháng.
   - Biểu đồ radar theo nhóm tiêu chí nếu phù hợp.
   - Khu vực Alert màu đỏ cho lỗi nguy cơ cao liên quan đến:
     + Cấp cứu.
     + Thuốc.
     + Kiểm soát nhiễm khuẩn.
     + An toàn người bệnh.
     + Hồ sơ bệnh án.
     + An toàn thông tin.
     + An ninh trật tự.
     + Tài sản công.

10. Màn hình CAPA / theo dõi khắc phục
   - Không cần đăng nhập vẫn xem được.
   - Hiển thị danh sách tồn tại, lỗi, yêu cầu khắc phục.
   - Có bộ lọc theo tháng, khoa/phòng, đoàn kiểm tra, mức độ nguy cơ, trạng thái CAPA.
   - Trạng thái CAPA gồm:
     + Chưa thực hiện.
     + Đang thực hiện.
     + Đã hoàn thành.
     + Quá hạn.
   - Chỉ người được phân quyền mới cập nhật trạng thái hoặc phản hồi khắc phục.

11. Quản lý lịch kiểm tra
   - Không cần đăng nhập vẫn xem được lịch kiểm tra.
   - Cho phép nhập hoặc cấu hình lịch kiểm tra từ ngày 27/5/2026 đến 30/12/2026.
   - Kiểm tra định kỳ hằng tuần vào thứ Tư.
   - Mỗi đoàn mỗi tuần kiểm tra tối thiểu 02 khoa lâm sàng và 01 khoa/phòng hành chính hoặc cận lâm sàng.
   - Cho phép điều chỉnh lịch khi có chỉ đạo hoặc phát sinh đột xuất.
   - Chỉ Admin hoặc Phòng KHTH được chỉnh sửa lịch.

Nguyên tắc xử lý dữ liệu:
- Dữ liệu từng tháng phải được lưu riêng, không ghi đè tháng cũ.
- Khi chốt tháng, dữ liệu được khóa.
- Dữ liệu các tháng cũ vẫn xem được công khai trên website.
- Chỉ Admin hoặc Phòng KHTH mới có quyền mở khóa khi cần hiệu chỉnh.
- Tất cả thao tác quan trọng cần lưu log:
  + Ai nhập điểm.
  + Ai sửa điểm.
  + Ai xóa dữ liệu.
  + Ai chốt báo cáo.
  + Ai mở khóa dữ liệu.
  + Ai xuất Excel.
  + Thời gian thao tác.
  + Dữ liệu trước khi sửa.
  + Dữ liệu sau khi sửa.

Yêu cầu bảo mật:
- Website cho phép xem dữ liệu khi có link.
- Không yêu cầu đăng nhập đối với chức năng xem.
- Chỉ yêu cầu đăng nhập đối với chức năng thao tác dữ liệu.
- Đăng nhập bằng username/password nội bộ, không bắt buộc email.
- Mật khẩu phải được mã hóa/hash, không lưu mật khẩu dạng văn bản thường.
- Người không đăng nhập chỉ được quyền xem, không được thay đổi dữ liệu.
- Các API hoặc server action liên quan đến thêm/sửa/xóa/chốt/xuất báo cáo phải kiểm tra quyền ở backend, không chỉ kiểm tra trên giao diện.
- Các nút thao tác không thuộc quyền phải bị ẩn hoặc vô hiệu hóa.
- Tất cả thao tác thêm/sửa/xóa/chốt/xuất báo cáo/mở khóa phải lưu log.
- Không đưa khóa bí mật vào code công khai.
- Sử dụng biến môi trường khi deploy Vercel.

Yêu cầu triển khai:
- Tạo cấu trúc project rõ ràng.
- Có file README.md hướng dẫn:
  + Cài đặt project.
  + Cấu hình database/storage.
  + Cấu hình Vercel.
  + Tạo tài khoản admin đầu tiên.
  + Import dữ liệu bảng kiểm từ Excel.
  + Phân quyền người dùng.
  + Xuất báo cáo Excel.
- Có file .env.example.
- Có dữ liệu mẫu để test nếu chưa kết nối database thật.
- Có hướng dẫn từng bước cho người không chuyên CNTT.

Yêu cầu giai đoạn đầu tiên:
Trước khi code toàn bộ hệ thống, hãy thực hiện giai đoạn 1:
- Phân tích các file Excel bảng kiểm đính kèm.
- Đề xuất cấu trúc dữ liệu chuẩn.
- Tạo prototype giao diện chính bằng dữ liệu mẫu:
  1. Trang chủ công khai.
  2. Dashboard tổng quan không cần đăng nhập.
  3. Màn hình đăng nhập cho người cần thao tác.
  4. Trang làm việc sau đăng nhập.
  5. Màn hình chấm điểm trên điện thoại.
  6. Màn hình quản lý kỳ kiểm tra.
  7. Màn hình quản lý phân công.
  8. Màn hình quản lý báo cáo tháng.
  9. Màn hình CAPA / theo dõi khắc phục.
  10. Trang quản trị dữ liệu/danh mục.
- Tạo giao diện có thể chạy thử trên local và deploy Vercel.
- Chưa cần tích hợp Google Drive API ở giai đoạn đầu.
- Ưu tiên lưu file Excel đã xuất vào storage và hiển thị link tải về.
- Sau khi tôi duyệt giao diện, mới triển khai đầy đủ đăng nhập, database, storage, phân quyền thao tác và xuất báo cáo thật.

Yêu cầu kết quả sau khi hoàn thành giai đoạn 1:
- Mô tả kiến trúc hệ thống.
- Danh sách màn hình đã tạo.
- Cấu trúc database đề xuất.
- Các bước chạy thử.
- Các bước deploy lên Vercel.
- Những phần đã hoàn thành.
- Những phần cần tôi cung cấp thêm.
- Các câu lệnh cần chạy nếu có.
- Giao diện phải ưu tiên tiếng Việt hoàn toàn.

Yêu cầu bắt đầu thực hiện:
Hãy bắt đầu bằng việc tạo prototype giao diện trước, chưa cần hoàn thiện toàn bộ backend. Ưu tiên:
1. Trang chủ/dashboard công khai không cần đăng nhập.
2. Giao diện điện thoại cho thành viên đoàn kiểm tra.
3. Giao diện quản lý báo cáo tháng cho Phòng KHTH.
4. Giao diện CAPA/theo dõi khắc phục.
5. Trang quản trị dữ liệu để về sau có thể chỉnh sửa danh mục, bảng kiểm, tiêu chí, lịch kiểm tra, phân công ngay trên web.

Tóm tắt nguyên tắc vận hành:
Ai có link web → xem được.
Ai muốn chấm/sửa/chốt/xuất/quản trị → phải đăng nhập và có quyền.
Các thay đổi nghiệp vụ thông thường như sửa khoa/phòng, tiêu chí, lịch, phân công phải thực hiện được trên giao diện web, không cần sửa code.