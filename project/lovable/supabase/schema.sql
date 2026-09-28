-- ===========================================================
-- نظام السراكي — الشروق للمقاولات العمومية والتوريدات
-- مخطط قاعدة البيانات (Supabase / PostgreSQL)
-- ===========================================================

create extension if not exists "pgcrypto";

-- ---------- المراجع الأساسية ----------
create table if not exists departments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  allowance_eligible boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists sectors (
  id    uuid primary key default gen_random_uuid(),
  code  text not null unique,
  name  text not null
);

create table if not exists sites (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  sector_code  text not null references sectors(code) on update cascade
);

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  sector_code text references sectors(code) on update cascade,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- المهن مرتبطة بالقسم + الفئة (A..E) + القيمة اليومية
create table if not exists professions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  grade        text not null check (grade in ('A','B','C','D','E')),
  daily_value  numeric(10,2) not null default 0,
  department   text not null references departments(name) on update cascade,
  stopped      boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (name, grade)
);
create index if not exists professions_dept_idx on professions(department);

-- سجل تغيّر فئة/سعر المهنة (يتطلب تأكيد في الواجهة)
create table if not exists profession_rate_history (
  id            uuid primary key default gen_random_uuid(),
  profession_id uuid not null references professions(id) on delete cascade,
  old_grade     text,
  new_grade     text,
  old_value     numeric(10,2),
  new_value     numeric(10,2),
  effective_date date not null,
  changed_by    uuid,
  changed_at    timestamptz not null default now()
);

create table if not exists contractors (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  project_code  text references projects(code) on update cascade,
  national_id   text,
  active        boolean not null default true,
  housing_allowance   numeric(10,2) not null default 0,
  transport_allowance numeric(10,2) not null default 0,
  documents     jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  constraint contractors_nid_len check (national_id is null or national_id ~ '^[0-9]{14}$')
);

-- ---------- العمال ----------
create table if not exists workers (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  name           text not null,
  national_id    text,
  profession     text,
  department     text references departments(name) on update cascade,
  project_code   text references projects(code) on update cascade,
  contractor_code text references contractors(code) on update cascade,
  source         text not null default 'ذاتى' check (source in ('ذاتى','باطن')),
  category       text,
  manager        text,
  start_date     date,
  allowance      numeric(10,2) not null default 0,
  housing_allowance   numeric(10,2) not null default 0,
  transport_allowance numeric(10,2) not null default 0,
  fingerprint_id text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint workers_nid_unique unique (national_id),
  constraint workers_nid_len check (national_id is null or national_id ~ '^[0-9]{14}$')
);
create index if not exists workers_project_idx on workers(project_code);
create index if not exists workers_dept_idx on workers(department);
create index if not exists workers_name_idx on workers using gin (to_tsvector('simple', name));

-- سجل النقل: قطاع ← مشروع ← عامل، مع كود جديد وفصل مالي
create table if not exists worker_transfers (
  id             uuid primary key default gen_random_uuid(),
  worker_id      uuid not null references workers(id) on delete cascade,
  old_code       text not null,
  new_code       text not null,
  from_project   text,
  to_project     text not null,
  to_sector      text,
  transfer_date  date not null,
  reason         text,
  created_by     uuid,
  created_at     timestamptz not null default now()
);

-- ---------- بيان أعمال سركي ----------
create table if not exists sarak_entries (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  work_date     date not null,
  worker_code   text references workers(code) on update cascade,
  worker_name   text,
  profession    text,
  department    text references departments(name) on update cascade,
  category      text,
  national_id   text,
  project_code  text references projects(code) on update cascade,
  project_name  text,
  contractor_code text references contractors(code) on update cascade,
  source        text,
  work_description text,
  note          text,
  region        text,
  shift         text,
  overtime_hours numeric(6,2) not null default 0,
  deduction_hours numeric(6,2) not null default 0,
  in_time       time,
  out_time      time,
  hours         numeric(6,2) not null default 0,
  night_shift   boolean not null default false,
  match_status  text,
  approved      boolean not null default false,
  approved_by   uuid,
  approved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists sarak_date_idx on sarak_entries(work_date);
create index if not exists sarak_worker_idx on sarak_entries(worker_code);
create index if not exists sarak_project_idx on sarak_entries(project_code);

-- بصمات الحضور الخام (دخول/خروج)
create table if not exists attendance_logs (
  id           uuid primary key default gen_random_uuid(),
  worker_code  text references workers(code) on update cascade,
  log_date     date not null,
  log_time     time not null,
  direction    text not null check (direction in ('in','out')),
  device       text,
  project_code text,
  created_at   timestamptz not null default now()
);
create index if not exists attendance_date_idx on attendance_logs(log_date);

-- ---------- المستخدمون والصلاحيات ----------
create table if not exists app_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'viewer'
             check (role in ('admin','sector_manager','project_manager','hr','accountant','viewer')),
  sector_code text,
  project_code text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  role       text not null,
  permission text not null,
  allowed    boolean not null default false,
  primary key (role, permission)
);

insert into role_permissions (role, permission, allowed) values
  ('admin','addWorker',true),('admin','fp',true),('admin','editWorker',true),
  ('admin','sarakWork',true),('admin','approve',true),('admin','reports',true),
  ('hr','addWorker',true),('hr','fp',true),('hr','editWorker',true),('hr','sarakWork',true),('hr','approve',false),('hr','reports',true),
  ('project_manager','addWorker',false),('project_manager','fp',false),('project_manager','editWorker',false),
  ('project_manager','sarakWork',true),('project_manager','approve',true),('project_manager','reports',true),
  ('accountant','addWorker',false),('accountant','fp',false),('accountant','editWorker',false),
  ('accountant','sarakWork',false),('accountant','approve',false),('accountant','reports',true),
  ('viewer','reports',true)
on conflict (role, permission) do nothing;

-- سجل العمليات
create table if not exists audit_log (
  id         bigserial primary key,
  actor      uuid,
  action     text not null,
  entity     text,
  entity_id  text,
  details    jsonb,
  created_at timestamptz not null default now()
);

-- ---------- دوال مساعدة ----------
create or replace function current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from app_users where id = auth.uid()), 'viewer');
$$;

create or replace function has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select allowed from role_permissions
    where role = current_role_name() and permission = p), false);
$$;

-- ---------- التسوية المالية ----------
-- كل كود عامل يُحسب مستقلًا، فينفصل الكود القديم عن الجديد بعد النقل تلقائيًا
create or replace view v_settlement as
select
  s.project_code,
  s.worker_code,
  s.worker_name,
  s.department,
  date_trunc('month', s.work_date)::date as period,
  count(*)                               as days,
  sum(s.hours)                           as total_hours,
  sum(s.overtime_hours)                  as overtime_hours,
  sum(s.deduction_hours)                 as deduction_hours,
  max(p.daily_value)                     as daily_rate,
  round(max(p.daily_value) / 8.0, 2)     as hour_rate,
  round(count(*) * max(p.daily_value)
      + sum(s.overtime_hours) * (max(p.daily_value) / 8.0)
      - sum(s.deduction_hours) * (max(p.daily_value) / 8.0), 2) as gross,
  round(coalesce(max(w.housing_allowance),0) * count(*), 2)   as housing_total,
  round(coalesce(max(w.transport_allowance),0) * count(*), 2) as transport_total
from sarak_entries s
left join workers w on w.code = s.worker_code
left join professions p
  on p.name = regexp_replace(s.profession, '\s+[A-E]$', '')
 and p.grade = coalesce(nullif(s.category,''), 'C')
group by s.project_code, s.worker_code, s.worker_name, s.department, date_trunc('month', s.work_date);

-- ---------- RLS ----------
alter table departments enable row level security;
alter table sectors enable row level security;
alter table sites enable row level security;
alter table projects enable row level security;
alter table professions enable row level security;
alter table profession_rate_history enable row level security;
alter table contractors enable row level security;
alter table workers enable row level security;
alter table worker_transfers enable row level security;
alter table sarak_entries enable row level security;
alter table attendance_logs enable row level security;
alter table app_users enable row level security;
alter table role_permissions enable row level security;
alter table audit_log enable row level security;

do $$
declare t text;
begin
  foreach t in array array['departments','sectors','sites','projects','professions',
    'profession_rate_history','contractors','workers','worker_transfers',
    'sarak_entries','attendance_logs','role_permissions']
  loop
    execute format('create policy %I on %I for select to authenticated using (true)', t||'_read', t);
  end loop;
end $$;

create policy workers_write on workers for all to authenticated
  using (has_perm('editWorker')) with check (has_perm('addWorker') or has_perm('editWorker'));

create policy sarak_insert on sarak_entries for insert to authenticated
  with check (has_perm('sarakWork'));
create policy sarak_update on sarak_entries for update to authenticated
  using (has_perm('sarakWork') or has_perm('approve'));

create policy refs_write on professions for all to authenticated
  using (current_role_name() in ('admin','hr')) with check (current_role_name() in ('admin','hr'));
create policy projects_write on projects for all to authenticated
  using (current_role_name() in ('admin','hr')) with check (current_role_name() in ('admin','hr'));
create policy contractors_write on contractors for all to authenticated
  using (current_role_name() in ('admin','hr')) with check (current_role_name() in ('admin','hr'));
create policy transfers_write on worker_transfers for all to authenticated
  using (has_perm('editWorker')) with check (has_perm('editWorker'));

create policy me_read on app_users for select to authenticated using (id = auth.uid() or current_role_name() = 'admin');
create policy me_write on app_users for all to authenticated using (current_role_name() = 'admin') with check (current_role_name() = 'admin');
create policy audit_read on audit_log for select to authenticated using (current_role_name() = 'admin');
create policy audit_insert on audit_log for insert to authenticated with check (true);

-- عند تسجيل مستخدم جديد أنشئ له صفًا في app_users
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into app_users (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
