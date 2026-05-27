-- Migration bổ sung cho các project Supabase đã chạy schema trước ngày 27/05/2026.
-- Dùng khi không muốn xóa database để chạy lại toàn bộ database/supabase-schema.sql.

alter table if exists inspection_assignments
  add column if not exists created_at timestamptz not null default now();

drop policy if exists public_read_score_attachments on score_attachments;
create policy public_read_score_attachments on score_attachments
  for select
  using (true);

create index if not exists idx_inspection_assignments_public_lookup
  on inspection_assignments (inspection_session_id, user_id, created_at desc);
