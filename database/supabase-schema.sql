-- Schema MVP cho hệ thống chấm điểm kiểm tra hoạt động bệnh viện.
-- Nguyên tắc: ai có link web xem được dữ liệu đã công khai; mọi thao tác ghi phải đăng nhập và đúng quyền.

create extension if not exists "pgcrypto";

create type app_role as enum (
  'admin',
  'ban_giam_doc',
  'phong_khth',
  'truong_doan',
  'pho_truong_doan',
  'thu_ky_doan',
  'thanh_vien_doan',
  'capa',
  'khoa_phong'
);

create type block_type as enum ('clinical', 'paraclinical', 'administrative');
create type form_type as enum ('LS_CLS', 'HANH_CHINH');
create type period_status as enum ('open', 'closed', 'locked');
create type form_status as enum ('draft', 'open', 'submitted', 'locked', 'published');
create type risk_level as enum ('khong', 'thap', 'trung_binh', 'cao', 'nghiem_trong');
create type capa_status as enum ('chua_thuc_hien', 'dang_thuc_hien', 'da_hoan_thanh', 'qua_han', 'khong_ap_dung');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  email text,
  phone text,
  title_unit text,
  role app_role not null default 'thanh_vien_doan',
  department_id uuid,
  inspection_team_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  block_type block_type not null,
  is_active boolean not null default true,
  source_file text,
  source_sheet text,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_department_fk foreign key (department_id) references departments(id);

create table inspection_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader_user_id uuid references profiles(id),
  deputy_user_id uuid references profiles(id),
  secretary_user_id uuid references profiles(id),
  description text
);

alter table profiles
  add constraint profiles_team_fk foreign key (inspection_team_id) references inspection_teams(id);

create table form_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_file text not null,
  source_sheet text not null,
  source_row integer,
  form_type form_type not null,
  department_id uuid not null references departments(id),
  department_code text not null,
  department_name text not null,
  block_type block_type not null,
  inspection_team_id uuid references inspection_teams(id),
  inspection_team_name text not null,
  version text not null default 'V03-1805',
  total_score numeric not null default 100,
  criteria_count integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (source_file, source_sheet, inspection_team_name, version)
);

create table form_header_fields (
  id uuid primary key default gen_random_uuid(),
  form_template_id uuid not null references form_templates(id) on delete cascade,
  field_key text not null,
  field_label text not null,
  default_value text,
  source_cell text,
  order_index integer not null default 0,
  unique (form_template_id, field_key)
);

create table criteria_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  applicable_block_type block_type,
  description text,
  order_index integer not null default 0,
  unique (code, name, applicable_block_type)
);

create table form_criteria_items (
  id uuid primary key default gen_random_uuid(),
  form_template_id uuid not null references form_templates(id) on delete cascade,
  criteria_group_id uuid references criteria_groups(id),
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  form_type form_type not null,
  department_code text not null,
  department_name text not null,
  inspection_team_name text not null,
  version text not null default 'V03-1805',
  order_index integer not null,
  group_code text,
  group_name text,
  content text not null,
  evidence_required text,
  max_score numeric not null,
  team1_assignee text,
  team2_assignee text,
  is_high_risk_related boolean not null default false,
  is_active boolean not null default true,
  unique (form_template_id, source_row)
);

create table audit_periods (
  id uuid primary key default gen_random_uuid(),
  month integer not null check (month between 1 and 12),
  quarter integer not null check (quarter between 1 and 4),
  year integer not null,
  start_date date not null,
  end_date date not null,
  status period_status not null default 'open',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table inspection_sessions (
  id uuid primary key default gen_random_uuid(),
  audit_period_id uuid not null references audit_periods(id),
  inspection_date date not null,
  inspection_team_id uuid references inspection_teams(id),
  department_id uuid not null references departments(id),
  block_type block_type not null,
  form_type form_type not null,
  status form_status not null default 'open',
  created_by uuid references profiles(id),
  opened_at timestamptz,
  locked_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inspection_forms (
  id uuid primary key default gen_random_uuid(),
  inspection_session_id uuid not null references inspection_sessions(id) on delete cascade,
  form_template_id uuid not null references form_templates(id),
  reception_person text,
  leader_name text,
  started_at time,
  ended_at time,
  preliminary_conclusion text,
  total_score numeric not null default 0,
  score_ratio numeric not null default 0,
  classification text,
  high_risk_count integer not null default 0,
  status form_status not null default 'open',
  submitted_by uuid references profiles(id),
  submitted_at timestamptz,
  locked_by uuid references profiles(id),
  locked_at timestamptz
);

create table inspection_assignments (
  id uuid primary key default gen_random_uuid(),
  inspection_session_id uuid not null references inspection_sessions(id) on delete cascade,
  inspection_team_id uuid references inspection_teams(id),
  user_id uuid not null references profiles(id),
  form_criteria_item_id uuid references form_criteria_items(id),
  department_id uuid references departments(id),
  block_type block_type not null,
  note text,
  unique (inspection_session_id, user_id, form_criteria_item_id)
);

create table inspection_scores (
  id uuid primary key default gen_random_uuid(),
  inspection_form_id uuid not null references inspection_forms(id) on delete cascade,
  form_criteria_item_id uuid not null references form_criteria_items(id),
  assigned_user_id uuid references profiles(id),
  score numeric not null,
  max_score numeric not null,
  score_ratio numeric generated always as (
    case when max_score > 0 then round((score / max_score) * 100, 2) else 0 end
  ) stored,
  deduction_reason text,
  finding text,
  evidence_text text,
  risk_level risk_level not null default 'khong',
  correction_request text,
  responsible_department text,
  responsible_person text,
  due_date date,
  capa_status capa_status not null default 'khong_ap_dung',
  note text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint score_bounds check (score >= 0 and score <= max_score),
  constraint deduction_requires_reason check (score = max_score or coalesce(deduction_reason, finding, '') <> ''),
  constraint high_risk_requires_correction check (
    risk_level not in ('cao', 'nghiem_trong')
    or (coalesce(correction_request, '') <> '' and due_date is not null and coalesce(responsible_person, responsible_department, '') <> '')
  ),
  unique (inspection_form_id, form_criteria_item_id)
);

create table score_attachments (
  id uuid primary key default gen_random_uuid(),
  inspection_score_id uuid not null references inspection_scores(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_type text,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

create table capa_updates (
  id uuid primary key default gen_random_uuid(),
  inspection_score_id uuid not null references inspection_scores(id) on delete cascade,
  update_content text not null,
  status capa_status not null,
  evidence_url text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table report_exports (
  id uuid primary key default gen_random_uuid(),
  audit_period_id uuid references audit_periods(id),
  report_scope text not null,
  status text not null default 'draft',
  file_name text,
  storage_path text,
  download_url text,
  exported_by uuid references profiles(id),
  exported_at timestamptz,
  summary_json jsonb not null default '{}'::jsonb
);

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type text not null,
  imported_by uuid references profiles(id),
  imported_at timestamptz not null default now(),
  status text not null,
  summary_json jsonb not null default '{}'::jsonb,
  error_log text
);

create table import_warnings (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references import_batches(id) on delete cascade,
  warning_type text not null,
  source_file text,
  source_sheet text,
  source_row integer,
  message text not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value_json jsonb,
  new_value_json jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create or replace function current_app_role()
returns app_role
language sql
stable
as $$
  select role from profiles where id = auth.uid() and is_active = true
$$;

create or replace function can_manage_system()
returns boolean
language sql
stable
as $$
  select current_app_role() in ('admin', 'phong_khth')
$$;

create or replace function can_score_item(session_id uuid, criteria_item_id uuid)
returns boolean
language sql
stable
as $$
  select current_app_role() = 'admin'
    or exists (
      select 1
      from inspection_assignments ia
      where ia.inspection_session_id = session_id
        and ia.form_criteria_item_id = criteria_item_id
        and ia.user_id = auth.uid()
    )
$$;

alter table profiles enable row level security;
alter table departments enable row level security;
alter table inspection_teams enable row level security;
alter table form_templates enable row level security;
alter table form_header_fields enable row level security;
alter table criteria_groups enable row level security;
alter table form_criteria_items enable row level security;
alter table audit_periods enable row level security;
alter table inspection_sessions enable row level security;
alter table inspection_forms enable row level security;
alter table inspection_assignments enable row level security;
alter table inspection_scores enable row level security;
alter table score_attachments enable row level security;
alter table capa_updates enable row level security;
alter table report_exports enable row level security;
alter table import_batches enable row level security;
alter table import_warnings enable row level security;
alter table audit_logs enable row level security;

-- Public read: anonymous users can read published/catalog data.
create policy public_read_departments on departments for select using (true);
create policy public_read_teams on inspection_teams for select using (true);
create policy public_read_templates on form_templates for select using (true);
create policy public_read_header_fields on form_header_fields for select using (true);
create policy public_read_groups on criteria_groups for select using (true);
create policy public_read_criteria on form_criteria_items for select using (true);
create policy public_read_periods on audit_periods for select using (true);
create policy public_read_sessions on inspection_sessions for select using (true);
create policy public_read_forms on inspection_forms for select using (true);
create policy public_read_scores on inspection_scores for select using (true);
create policy public_read_capa on capa_updates for select using (true);
create policy public_read_reports on report_exports for select using (status in ('published', 'exported'));

-- Protected write.
create policy manage_departments on departments for all using (can_manage_system()) with check (can_manage_system());
create policy manage_teams on inspection_teams for all using (can_manage_system()) with check (can_manage_system());
create policy manage_templates on form_templates for all using (can_manage_system()) with check (can_manage_system());
create policy manage_header_fields on form_header_fields for all using (can_manage_system()) with check (can_manage_system());
create policy manage_criteria_groups on criteria_groups for all using (can_manage_system()) with check (can_manage_system());
create policy manage_criteria_items on form_criteria_items for all using (can_manage_system()) with check (can_manage_system());
create policy manage_periods on audit_periods for all using (can_manage_system()) with check (can_manage_system());
create policy manage_sessions on inspection_sessions for all using (can_manage_system()) with check (can_manage_system());
create policy manage_assignments on inspection_assignments for all using (can_manage_system()) with check (can_manage_system());
create policy import_by_admin_khth on import_batches for all using (can_manage_system()) with check (can_manage_system());
create policy import_warning_by_admin_khth on import_warnings for all using (can_manage_system()) with check (can_manage_system());
create policy export_by_admin_khth on report_exports for all using (can_manage_system()) with check (can_manage_system());

create policy insert_score_by_assignment on inspection_scores
  for insert
  with check (
    can_score_item(
      (select s.id from inspection_sessions s join inspection_forms f on f.inspection_session_id = s.id where f.id = inspection_form_id),
      form_criteria_item_id
    )
  );

create policy update_score_by_assignment on inspection_scores
  for update
  using (
    can_score_item(
      (select s.id from inspection_sessions s join inspection_forms f on f.inspection_session_id = s.id where f.id = inspection_form_id),
      form_criteria_item_id
    )
  )
  with check (
    can_score_item(
      (select s.id from inspection_sessions s join inspection_forms f on f.inspection_session_id = s.id where f.id = inspection_form_id),
      form_criteria_item_id
    )
  );

create policy update_capa_by_allowed_roles on capa_updates
  for all
  using (current_app_role() in ('admin', 'phong_khth', 'capa'))
  with check (current_app_role() in ('admin', 'phong_khth', 'capa'));

create policy attachments_by_authenticated on score_attachments
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy insert_audit_logs_authenticated on audit_logs
  for insert
  with check (auth.uid() is not null);

create policy read_audit_logs_admin_khth on audit_logs
  for select
  using (can_manage_system());
