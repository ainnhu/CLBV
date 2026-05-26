-- Seed danh mục nền cho Bệnh viện Sản - Nhi Cà Mau.
-- Chạy sau `database/supabase-schema.sql`.
-- Tài khoản người dùng thật cần tạo qua Supabase Auth trước, sau đó liên kết vào bảng `profiles`.

with seed_departments(name, short_name, block_type) as (
  values
    ('Khám bệnh', 'KHAM_BENH', 'clinical'::block_type),
    ('Cấp cứu Nhi', 'CAP_CUU_NHI', 'clinical'::block_type),
    ('Hồi sức tích cực - Chống độc Nhi', 'HSTC_CD_NHI', 'clinical'::block_type),
    ('Cấp cứu - Chống độc Sản', 'CAP_CUU_CD_SAN', 'clinical'::block_type),
    ('Sanh', 'SANH', 'clinical'::block_type),
    ('Sản thường', 'SAN_THUONG', 'clinical'::block_type),
    ('Phụ', 'PHU', 'clinical'::block_type),
    ('Sản bệnh', 'SAN_BENH', 'clinical'::block_type),
    ('Hậu phẫu', 'HAU_PHAU', 'clinical'::block_type),
    ('Gây mê hồi sức', 'GMHS', 'clinical'::block_type),
    ('Sơ sinh', 'SO_SINH', 'clinical'::block_type),
    ('Nội tổng hợp', 'NOI_TONG_HOP', 'clinical'::block_type),
    ('Truyền nhiễm', 'TRUYEN_NHIEM', 'clinical'::block_type),
    ('Ngoại nhi', 'NGOAI_NHI', 'clinical'::block_type),
    ('Liên chuyên khoa', 'LIEN_CHUYEN_KHOA', 'clinical'::block_type),
    ('Hiếm muộn', 'HIEM_MUON', 'clinical'::block_type),
    ('Dược', 'DUOC', 'paraclinical'::block_type),
    ('Xét nghiệm', 'XET_NGHIEM', 'paraclinical'::block_type),
    ('Kiểm soát nhiễm khuẩn', 'KSNK', 'paraclinical'::block_type),
    ('Chẩn đoán hình ảnh', 'CDHA', 'paraclinical'::block_type),
    ('Dinh dưỡng', 'DINH_DUONG', 'paraclinical'::block_type),
    ('Kế hoạch tổng hợp', 'KHTH', 'administrative'::block_type),
    ('Quản lý chất lượng', 'QLCL', 'administrative'::block_type),
    ('Tổ chức cán bộ', 'TCCB', 'administrative'::block_type),
    ('Hành chính quản trị', 'HCQT', 'administrative'::block_type),
    ('Điều dưỡng', 'DIEU_DUONG', 'administrative'::block_type),
    ('Tài chính kế toán', 'TCKT', 'administrative'::block_type),
    ('Vật tư thiết bị y tế', 'VTTBYT', 'administrative'::block_type),
    ('Công tác xã hội', 'CTXH', 'administrative'::block_type)
)
insert into departments (name, short_name, block_type, source_file, source_sheet)
select name, short_name, block_type, 'KH, QĐ KIỂM TRA HOẠT ĐỘNG BỆNH VIỆN NĂM 2026.pdf', 'Kế hoạch 32/KH-BV'
from seed_departments sd
where not exists (
  select 1 from departments d where lower(d.name) = lower(sd.name)
);

with seed_teams(name, description) as (
  values
    ('Đoàn 01', 'Đoàn kiểm tra theo Quyết định 271/QĐ-BV; thành viên chi tiết import từ phụ lục/phân công.'),
    ('Đoàn 02', 'Đoàn kiểm tra theo Quyết định 271/QĐ-BV; thành viên chi tiết import từ phụ lục/phân công.')
)
insert into inspection_teams (name, description)
select name, description
from seed_teams st
where not exists (
  select 1 from inspection_teams it where it.name = st.name
);

with seed_periods(month, quarter, year, start_date, end_date, status) as (
  values
    (5, 2, 2026, '2026-05-27'::date, '2026-05-31'::date, 'open'::period_status),
    (6, 2, 2026, '2026-06-01'::date, '2026-06-30'::date, 'open'::period_status),
    (7, 3, 2026, '2026-07-01'::date, '2026-07-31'::date, 'open'::period_status),
    (8, 3, 2026, '2026-08-01'::date, '2026-08-31'::date, 'open'::period_status),
    (9, 3, 2026, '2026-09-01'::date, '2026-09-30'::date, 'open'::period_status),
    (10, 4, 2026, '2026-10-01'::date, '2026-10-31'::date, 'open'::period_status),
    (11, 4, 2026, '2026-11-01'::date, '2026-11-30'::date, 'open'::period_status),
    (12, 4, 2026, '2026-12-01'::date, '2026-12-30'::date, 'open'::period_status)
)
insert into audit_periods (month, quarter, year, start_date, end_date, status)
select month, quarter, year, start_date, end_date, status
from seed_periods sp
where not exists (
  select 1 from audit_periods ap where ap.month = sp.month and ap.year = sp.year
);
