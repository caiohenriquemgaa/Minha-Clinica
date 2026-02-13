-- =========================================================
-- JM Estética - SaaS Multi-clínica
-- Executar no console SQL do Supabase
-- =========================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========================================
-- Limpeza para reexecução segura
-- Remove objetos antigos que impedem a criação das colunas
-- ========================================
drop view if exists public.v_user_memberships;
drop function if exists public.get_current_membership();
drop function if exists public.current_organization_ids();
drop function if exists public.create_organization_with_owner(text, text, text);
drop table if exists public.anamnesis_templates cascade;
drop table if exists public.equipment cascade;
drop table if exists public.sessions cascade;
drop table if exists public.procedures cascade;
drop table if exists public.patients cascade;
drop table if exists public.organization_members cascade;

-- ========================================
-- Organizações e perfis
-- ========================================

create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_email text not null,
  contact_phone text,
  plan_status text not null default 'trial', -- trial | active | blocked
  trial_end_at timestamp with time zone not null default (now() + interval '7 days'),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  default_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'professional', -- owner | admin | professional
  status text not null default 'active', -- active | invited | revoked
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (organization_id, user_id)
);

-- Helper: atualiza updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_org_updated_at before update on public.organizations
  for each row execute procedure public.touch_updated_at();

create trigger touch_profile_updated_at before update on public.profiles
  for each row execute procedure public.touch_updated_at();

create trigger touch_member_updated_at before update on public.organization_members
  for each row execute procedure public.touch_updated_at();

-- ========================================
-- Função para criar clínica + owner
-- ========================================
create or replace function public.create_organization_with_owner(
  p_name text,
  p_contact_email text,
  p_contact_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  insert into public.organizations (name, contact_email, contact_phone)
    values (p_name, p_contact_email, p_contact_phone)
    returning id into v_org_id;

  insert into public.profiles (id, full_name, default_organization_id)
    values (auth.uid(), coalesce(auth.jwt()->>'full_name', ''), v_org_id)
    on conflict (id) do update set default_organization_id = excluded.default_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
    values (v_org_id, auth.uid(), 'owner')
    on conflict (organization_id, user_id) do update set role = excluded.role, status = 'active';

  return v_org_id;
end;
$$;

-- ========================================
-- View para verificar status do usuário
-- ========================================
create or replace view public.v_user_memberships as
select
  om.user_id,
  om.organization_id,
  om.role,
  om.status,
  org.plan_status,
  org.trial_end_at,
  org.name as organization_name
from public.organization_members om
join public.organizations org on org.id = om.organization_id;

-- ========================================
-- Tabelas de domínio (pacientes, etc.)
-- ========================================

create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  birth_date date,
  gender text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create trigger touch_patients_updated before update on public.patients
  for each row execute procedure public.touch_updated_at();

create table if not exists public.procedures (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  duration_minutes integer not null default 60,
  price numeric(10,2) default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create trigger touch_procedures_updated before update on public.procedures
  for each row execute procedure public.touch_updated_at();

create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  professional_id uuid,
  professional_name text,
  scheduled_date timestamp with time zone not null,
  duration_minutes integer not null default 60,
  status text not null default 'scheduled',
  notes text,
  price numeric(10,2),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create trigger touch_sessions_updated before update on public.sessions
  for each row execute procedure public.touch_updated_at();

create table if not exists public.equipment (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  brand text,
  stock numeric not null default 0,
  unit text not null default 'un',
  minimum_stock numeric default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create trigger touch_equipment_updated before update on public.equipment
  for each row execute procedure public.touch_updated_at();

create table if not exists public.anamnesis_templates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  category text,
  questions jsonb not null,
  is_active boolean default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create trigger touch_anamnesis_templates before update on public.anamnesis_templates
  for each row execute procedure public.touch_updated_at();

-- ========================================
-- RLS Policies
-- ========================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.patients enable row level security;
alter table public.procedures enable row level security;
alter table public.sessions enable row level security;
alter table public.equipment enable row level security;
alter table public.anamnesis_templates enable row level security;

-- Helpers
create or replace function public.current_organization_ids()
returns setof uuid
language sql
security definer
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid() and status = 'active';
$$;

-- Policies
create policy "Users see own profile"
on public.profiles
for select using (id = auth.uid());

create policy "Members manage own organizations"
on public.organizations
for select using (
  id in (select organization_id from public.organization_members where user_id = auth.uid() and status = 'active')
);

create policy "Members manage organization members"
on public.organization_members
for all using (
  organization_id in (select * from public.current_organization_ids())
);

create policy "Tenant isolation for patients"
on public.patients
for all using (
  organization_id in (select * from public.current_organization_ids())
);

create policy "Tenant isolation for procedures"
on public.procedures
for all using (
  organization_id in (select * from public.current_organization_ids())
);

create policy "Tenant isolation for sessions"
on public.sessions
for all using (
  organization_id in (select * from public.current_organization_ids())
);

create policy "Tenant isolation for equipment"
on public.equipment
for all using (
  organization_id in (select * from public.current_organization_ids())
);

create policy "Tenant isolation for templates"
on public.anamnesis_templates
for all using (
  organization_id in (select * from public.current_organization_ids())
);

-- ========================================
-- RPC para verificar situação do plano
-- ========================================
create or replace function public.get_current_membership()
returns table (
  organization_id uuid,
  organization_name text,
  plan_status text,
  trial_end_at timestamp with time zone,
  role text
)
language sql
security definer
as $$
  select
    m.organization_id,
    o.name,
    o.plan_status,
    o.trial_end_at,
    m.role
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = auth.uid()
    and m.status = 'active'
  order by o.created_at
  limit 1;
$$;
