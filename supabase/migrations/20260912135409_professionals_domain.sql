-- ============================================================
-- COURTLY - Professionals domain
-- ============================================================

do $$ begin
  create type public.professional_access_status as enum ('NO_ACCESS','INVITED','ACTIVE','SUSPENDED');
exception when duplicate_object then null; end $$;

alter table public.professionals
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists preferred_name text,
  add column if not exists job_title text,
  add column if not exists birth_date date,
  add column if not exists country_code varchar(2),
  add column if not exists document_type text,
  add column if not exists document_number text,
  add column if not exists avatar_path text,
  add column if not exists notes text,
  add column if not exists access_status public.professional_access_status not null default 'NO_ACCESS';

update public.professionals
set first_name = coalesce(nullif(trim(first_name), ''), name),
    last_name = coalesce(last_name, '')
where first_name is null or last_name is null;

alter table public.professionals
  alter column first_name set not null,
  alter column last_name set not null;

create index if not exists idx_professionals_org_active on public.professionals(organization_id, active);
create index if not exists idx_professionals_org_document on public.professionals(organization_id, document_type, document_number);

create table if not exists public.professional_specialties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_specialties_name_not_blank check (length(trim(name)) > 0),
  constraint professional_specialties_org_name_unique unique(organization_id, name),
  constraint professional_specialties_id_org_unique unique(id, organization_id)
);

create table if not exists public.professional_specialty_assignments (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid not null,
  specialty_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(professional_id, specialty_id),
  foreign key(professional_id, organization_id) references public.professionals(id, organization_id) on delete cascade,
  foreign key(specialty_id, organization_id) references public.professional_specialties(id, organization_id) on delete cascade
);

create table if not exists public.professional_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid not null,
  authority text not null,
  registration_number text not null,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(professional_id, organization_id) references public.professionals(id, organization_id) on delete cascade,
  constraint professional_registrations_authority_not_blank check(length(trim(authority)) > 0),
  constraint professional_registrations_number_not_blank check(length(trim(registration_number)) > 0)
);

create table if not exists public.professional_availability_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid not null,
  weekday smallint not null check(weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(professional_id, organization_id) references public.professionals(id, organization_id) on delete cascade,
  constraint professional_availability_time_valid check(end_time > start_time)
);

create table if not exists public.professional_unavailability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  foreign key(professional_id, organization_id) references public.professionals(id, organization_id) on delete cascade,
  constraint professional_unavailability_time_valid check(ends_at > starts_at)
);

create table if not exists public.permission_definitions (
  code text primary key,
  domain text not null,
  sort_order int not null default 0
);

create table if not exists public.role_permissions (
  role public.organization_role not null,
  permission_code text not null references public.permission_definitions(code) on delete cascade,
  allowed boolean not null default true,
  primary key(role, permission_code)
);

create table if not exists public.membership_permission_overrides (
  membership_id uuid not null references public.memberships(id) on delete cascade,
  permission_code text not null references public.permission_definitions(code) on delete cascade,
  allowed boolean not null,
  updated_at timestamptz not null default now(),
  primary key(membership_id, permission_code)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

insert into public.permission_definitions(code,domain,sort_order) values
('DASHBOARD_VIEW','dashboard',10),
('CUSTOMERS_VIEW','customers',20),('CUSTOMERS_CREATE','customers',21),('CUSTOMERS_EDIT','customers',22),('CUSTOMERS_DEACTIVATE','customers',23),
('SERVICES_VIEW','services',30),('SERVICES_CREATE','services',31),('SERVICES_EDIT','services',32),('SERVICES_DEACTIVATE','services',33),
('PROFESSIONALS_VIEW','professionals',40),('PROFESSIONALS_CREATE','professionals',41),('PROFESSIONALS_EDIT','professionals',42),('PROFESSIONALS_DISABLE','professionals',43),('PROFESSIONALS_MANAGE_ACCESS','professionals',44),
('SCHEDULING_VIEW_ALL','scheduling',50),('SCHEDULING_VIEW_OWN','scheduling',51),('SCHEDULING_CREATE','scheduling',52),('SCHEDULING_EDIT','scheduling',53),('SCHEDULING_CANCEL','scheduling',54),('SCHEDULING_RESCHEDULE','scheduling',55),
('ATTENDANCE_VIEW','attendance',60),('ATTENDANCE_MANAGE','attendance',61),
('MAKEUPS_VIEW','makeups',70),('MAKEUPS_MANAGE','makeups',71),
('FINANCIAL_VIEW','financial',80),('FINANCIAL_MANAGE','financial',81),
('ORGANIZATION_SETTINGS_VIEW','settings',90),('ORGANIZATION_SETTINGS_EDIT','settings',91)
on conflict(code) do nothing;

insert into public.role_permissions(role,permission_code,allowed)
select 'ADMIN'::public.organization_role, code, true from public.permission_definitions
where code in ('DASHBOARD_VIEW','CUSTOMERS_VIEW','CUSTOMERS_CREATE','CUSTOMERS_EDIT','CUSTOMERS_DEACTIVATE','SERVICES_VIEW','SERVICES_CREATE','SERVICES_EDIT','PROFESSIONALS_VIEW','SCHEDULING_VIEW_ALL','SCHEDULING_CREATE','SCHEDULING_EDIT','SCHEDULING_CANCEL','SCHEDULING_RESCHEDULE','ATTENDANCE_VIEW','ATTENDANCE_MANAGE','MAKEUPS_VIEW','MAKEUPS_MANAGE')
on conflict(role,permission_code) do nothing;

insert into public.role_permissions(role,permission_code,allowed)
select 'PROFESSIONAL'::public.organization_role, code, true from public.permission_definitions
where code in ('DASHBOARD_VIEW','SCHEDULING_VIEW_OWN','ATTENDANCE_VIEW')
on conflict(role,permission_code) do nothing;

create or replace function public.user_has_permission(target_organization_id uuid, target_permission text)
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((
    select case
      when m.role = 'OWNER' then true
      when exists(select 1 from public.professionals p where p.organization_id=m.organization_id and p.user_id=m.user_id and p.active=false) then false
      when mpo.allowed is not null then mpo.allowed
      else coalesce(rp.allowed,false)
    end
    from public.memberships m
    left join public.membership_permission_overrides mpo
      on mpo.membership_id=m.id and mpo.permission_code=target_permission
    left join public.role_permissions rp
      on rp.role=m.role and rp.permission_code=target_permission
    where m.organization_id=target_organization_id and m.user_id=auth.uid()
    limit 1
  ), false);
$$;

create or replace function public.get_my_permissions()
returns table(permission_code text, allowed boolean)
language sql stable security definer set search_path='' as $$
  select p.code,
    case when m.role='OWNER' then true
         when exists(select 1 from public.professionals pr where pr.organization_id=m.organization_id and pr.user_id=m.user_id and pr.active=false) then false
         when mpo.allowed is not null then mpo.allowed
         else coalesce(rp.allowed,false) end
  from public.memberships m
  cross join public.permission_definitions p
  left join public.membership_permission_overrides mpo on mpo.membership_id=m.id and mpo.permission_code=p.code
  left join public.role_permissions rp on rp.role=m.role and rp.permission_code=p.code
  where m.user_id=auth.uid();
$$;

alter table public.professional_specialties enable row level security;
alter table public.professional_specialty_assignments enable row level security;
alter table public.professional_registrations enable row level security;
alter table public.professional_availability_rules enable row level security;
alter table public.professional_unavailability enable row level security;
alter table public.membership_permission_overrides enable row level security;
alter table public.audit_logs enable row level security;

-- Replace the broad legacy professional read policy with permission-aware access.
drop policy if exists "members_can_read_professionals" on public.professionals;
create policy "professionals permission read" on public.professionals for select to authenticated
using (public.user_has_permission(organization_id,'PROFESSIONALS_VIEW') or user_id=auth.uid());
create policy "professionals permission insert" on public.professionals for insert to authenticated
with check (public.user_has_permission(organization_id,'PROFESSIONALS_CREATE'));
create policy "professionals permission update" on public.professionals for update to authenticated
using (public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'))
with check (public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'));

create policy "specialties read" on public.professional_specialties for select to authenticated using(public.is_organization_member(organization_id));
create policy "specialties manage" on public.professional_specialties for all to authenticated using(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT')) with check(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'));
create policy "specialty assignments read" on public.professional_specialty_assignments for select to authenticated using(public.is_organization_member(organization_id));
create policy "specialty assignments manage" on public.professional_specialty_assignments for all to authenticated using(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT')) with check(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'));
create policy "registrations read" on public.professional_registrations for select to authenticated using(public.is_organization_member(organization_id));
create policy "registrations manage" on public.professional_registrations for all to authenticated using(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT')) with check(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'));
create policy "availability read" on public.professional_availability_rules for select to authenticated using(public.is_organization_member(organization_id));
create policy "availability manage" on public.professional_availability_rules for all to authenticated using(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT')) with check(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'));
create policy "unavailability read" on public.professional_unavailability for select to authenticated using(public.is_organization_member(organization_id));
create policy "unavailability manage" on public.professional_unavailability for all to authenticated using(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT')) with check(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'));
create policy "permission overrides read" on public.membership_permission_overrides for select to authenticated using(exists(select 1 from public.memberships m where m.id=membership_id and public.user_has_permission(m.organization_id,'PROFESSIONALS_MANAGE_ACCESS')));
create policy "permission overrides manage" on public.membership_permission_overrides for all to authenticated using(exists(select 1 from public.memberships m where m.id=membership_id and public.user_has_permission(m.organization_id,'PROFESSIONALS_MANAGE_ACCESS'))) with check(exists(select 1 from public.memberships m where m.id=membership_id and public.user_has_permission(m.organization_id,'PROFESSIONALS_MANAGE_ACCESS')));
create policy "audit read" on public.audit_logs for select to authenticated using(public.user_has_permission(organization_id,'PROFESSIONALS_MANAGE_ACCESS'));
create policy "audit insert" on public.audit_logs for insert to authenticated with check(public.is_organization_member(organization_id));

-- Professional avatar paths: professionals/{organization_id}/{professional_id}/avatar-*.ext
create policy "managers upload professional avatars" on storage.objects for insert to authenticated
with check(bucket_id='avatars' and (storage.foldername(name))[1]='professionals' and public.user_has_permission(((storage.foldername(name))[2])::uuid,'PROFESSIONALS_EDIT'));
create policy "managers delete professional avatars" on storage.objects for delete to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]='professionals' and public.user_has_permission(((storage.foldername(name))[2])::uuid,'PROFESSIONALS_EDIT'));

create or replace function public.set_professional_active_status(p_professional_id uuid, p_active boolean)
returns table(future_appointments bigint)
language plpgsql security definer set search_path='' as $$
declare v_org uuid; v_count bigint;
begin
  select organization_id into v_org from public.professionals where id=p_professional_id;
  if v_org is null then raise exception 'professional_not_found'; end if;
  if not public.user_has_permission(v_org,'PROFESSIONALS_DISABLE') then raise exception 'forbidden'; end if;
  select count(*) into v_count from public.appointments where organization_id=v_org and professional_id=p_professional_id and status='SCHEDULED' and starts_at>now();
  update public.professionals set active=p_active, access_status=case when p_active then access_status else case when user_id is null then 'NO_ACCESS'::public.professional_access_status else 'SUSPENDED'::public.professional_access_status end end where id=p_professional_id;
  insert into public.audit_logs(organization_id,actor_user_id,entity_type,entity_id,action,metadata) values(v_org,auth.uid(),'PROFESSIONAL',p_professional_id,case when p_active then 'ENABLED' else 'DISABLED' end,jsonb_build_object('futureAppointments',v_count));
  return query select v_count;
end; $$;



-- ============================================================
-- Permission-aware RLS for existing Courtly domains
-- ============================================================

-- Customers
drop policy if exists "Members can view organization customers" on public.customers;
drop policy if exists "Members can create organization customers" on public.customers;
drop policy if exists "Members can update organization customers" on public.customers;
create policy "customers permission read" on public.customers for select to authenticated using(public.user_has_permission(organization_id,'CUSTOMERS_VIEW') or user_id=auth.uid());
create policy "customers permission create" on public.customers for insert to authenticated with check(public.user_has_permission(organization_id,'CUSTOMERS_CREATE'));
create policy "customers permission update" on public.customers for update to authenticated using(public.user_has_permission(organization_id,'CUSTOMERS_EDIT')) with check(public.user_has_permission(organization_id,'CUSTOMERS_EDIT'));

-- Customer subscriptions
drop policy if exists "organization managers can view customer subscriptions" on public.customer_subscriptions;
drop policy if exists "organization managers can create customer subscriptions" on public.customer_subscriptions;
drop policy if exists "organization managers can update customer subscriptions" on public.customer_subscriptions;
create policy "subscriptions permission read" on public.customer_subscriptions for select to authenticated using(public.user_has_permission(organization_id,'CUSTOMERS_VIEW'));
create policy "subscriptions permission create" on public.customer_subscriptions for insert to authenticated with check(public.user_has_permission(organization_id,'CUSTOMERS_EDIT'));
create policy "subscriptions permission update" on public.customer_subscriptions for update to authenticated using(public.user_has_permission(organization_id,'CUSTOMERS_EDIT')) with check(public.user_has_permission(organization_id,'CUSTOMERS_EDIT'));

-- Activities / Services
drop policy if exists "organization members can view activities" on public.activities;
drop policy if exists "organization managers can create activities" on public.activities;
drop policy if exists "organization managers can update activities" on public.activities;
create policy "activities permission read" on public.activities for select to authenticated using(public.user_has_permission(organization_id,'SERVICES_VIEW') or public.user_has_permission(organization_id,'SCHEDULING_VIEW_ALL') or public.user_has_permission(organization_id,'SCHEDULING_VIEW_OWN'));
create policy "activities permission create" on public.activities for insert to authenticated with check(public.user_has_permission(organization_id,'SERVICES_CREATE'));
create policy "activities permission update" on public.activities for update to authenticated using(public.user_has_permission(organization_id,'SERVICES_EDIT')) with check(public.user_has_permission(organization_id,'SERVICES_EDIT'));

-- Scheduling read/write policies replace role-only manager policies.
drop policy if exists "managers can view schedule rules" on public.schedule_rules;
drop policy if exists "managers can view schedule rule resources" on public.schedule_rule_resources;
drop policy if exists "managers can view schedule generation conflicts" on public.schedule_generation_conflicts;
drop policy if exists "managers can view appointments" on public.appointments;
drop policy if exists "managers can view appointment resources" on public.appointment_resources;
drop policy if exists "managers can update scheduling settings" on public.organization_scheduling_settings;
drop policy if exists "managers can manage resource types" on public.resource_types;
drop policy if exists "managers can manage resources" on public.resources;
drop policy if exists "managers can manage activity resource requirements" on public.activity_resource_requirements;
drop policy if exists "managers can manage professional activities" on public.professional_activities;
drop policy if exists "managers can manage schedule rules" on public.schedule_rules;
drop policy if exists "managers can manage schedule rule resources" on public.schedule_rule_resources;
drop policy if exists "managers can manage appointments" on public.appointments;
drop policy if exists "managers can manage appointment resources" on public.appointment_resources;

create policy "schedule rules permission read" on public.schedule_rules for select to authenticated using(
  public.user_has_permission(organization_id,'SCHEDULING_VIEW_ALL') or
  (public.user_has_permission(organization_id,'SCHEDULING_VIEW_OWN') and professional_id in (select p.id from public.professionals p where p.organization_id=organization_id and p.user_id=auth.uid()))
);
create policy "schedule rule resources permission read" on public.schedule_rule_resources for select to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_VIEW_ALL') or public.user_has_permission(organization_id,'SCHEDULING_VIEW_OWN'));
create policy "schedule conflicts permission read" on public.schedule_generation_conflicts for select to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_VIEW_ALL'));
create policy "appointments permission read" on public.appointments for select to authenticated using(
  public.user_has_permission(organization_id,'SCHEDULING_VIEW_ALL') or
  (public.user_has_permission(organization_id,'SCHEDULING_VIEW_OWN') and professional_id in (select p.id from public.professionals p where p.organization_id=organization_id and p.user_id=auth.uid()))
);
create policy "appointment resources permission read" on public.appointment_resources for select to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_VIEW_ALL') or public.user_has_permission(organization_id,'SCHEDULING_VIEW_OWN'));
create policy "scheduling settings permission update" on public.organization_scheduling_settings for update to authenticated using(public.user_has_permission(organization_id,'ORGANIZATION_SETTINGS_EDIT')) with check(public.user_has_permission(organization_id,'ORGANIZATION_SETTINGS_EDIT'));
create policy "resource types permission manage" on public.resource_types for all to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_EDIT')) with check(public.user_has_permission(organization_id,'SCHEDULING_EDIT'));
create policy "resources permission manage" on public.resources for all to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_EDIT')) with check(public.user_has_permission(organization_id,'SCHEDULING_EDIT'));
create policy "activity resource requirements permission manage" on public.activity_resource_requirements for all to authenticated using(public.user_has_permission(organization_id,'SERVICES_EDIT')) with check(public.user_has_permission(organization_id,'SERVICES_EDIT'));
create policy "professional activities permission manage" on public.professional_activities for all to authenticated using(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT')) with check(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'));
create policy "schedule rules permission manage" on public.schedule_rules for all to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_EDIT')) with check(public.user_has_permission(organization_id,'SCHEDULING_EDIT'));
create policy "schedule rule resources permission manage" on public.schedule_rule_resources for all to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_EDIT')) with check(public.user_has_permission(organization_id,'SCHEDULING_EDIT'));
create policy "appointments permission manage" on public.appointments for all to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_EDIT')) with check(public.user_has_permission(organization_id,'SCHEDULING_EDIT'));
create policy "appointment resources permission manage" on public.appointment_resources for all to authenticated using(public.user_has_permission(organization_id,'SCHEDULING_EDIT')) with check(public.user_has_permission(organization_id,'SCHEDULING_EDIT'));

-- Financial policies become permission-aware. OWNER remains implicitly allowed by user_has_permission.
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies where schemaname='public' and tablename in ('expense_categories','expense_recurrences','financial_expenses','financial_revenues','financial_periods') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;
create policy "financial categories read" on public.expense_categories for select to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_VIEW'));
create policy "financial categories manage" on public.expense_categories for all to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_MANAGE')) with check(public.user_has_permission(organization_id,'FINANCIAL_MANAGE'));
create policy "expense recurrences read" on public.expense_recurrences for select to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_VIEW'));
create policy "expense recurrences manage" on public.expense_recurrences for all to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_MANAGE')) with check(public.user_has_permission(organization_id,'FINANCIAL_MANAGE'));
create policy "financial expenses read" on public.financial_expenses for select to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_VIEW'));
create policy "financial expenses manage" on public.financial_expenses for all to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_MANAGE')) with check(public.user_has_permission(organization_id,'FINANCIAL_MANAGE'));
create policy "financial revenues read" on public.financial_revenues for select to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_VIEW'));
create policy "financial revenues manage" on public.financial_revenues for all to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_MANAGE')) with check(public.user_has_permission(organization_id,'FINANCIAL_MANAGE'));
create policy "financial periods read" on public.financial_periods for select to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_VIEW'));
create policy "financial periods manage" on public.financial_periods for all to authenticated using(public.user_has_permission(organization_id,'FINANCIAL_MANAGE')) with check(public.user_has_permission(organization_id,'FINANCIAL_MANAGE'));

-- Table privileges for authenticated application clients.
grant select, insert, update, delete on public.professional_specialties to authenticated;
grant select, insert, update, delete on public.professional_specialty_assignments to authenticated;
grant select, insert, update, delete on public.professional_registrations to authenticated;
grant select, insert, update, delete on public.professional_availability_rules to authenticated;
grant select, insert, update, delete on public.professional_unavailability to authenticated;
grant select on public.permission_definitions, public.role_permissions to authenticated;
grant select, insert, update, delete on public.membership_permission_overrides to authenticated;
grant select, insert on public.audit_logs to authenticated;

drop trigger if exists professional_specialties_set_updated_at on public.professional_specialties;
create trigger professional_specialties_set_updated_at before update on public.professional_specialties for each row execute function public.set_updated_at();
drop trigger if exists professional_registrations_set_updated_at on public.professional_registrations;
create trigger professional_registrations_set_updated_at before update on public.professional_registrations for each row execute function public.set_updated_at();
drop trigger if exists professional_availability_rules_set_updated_at on public.professional_availability_rules;
create trigger professional_availability_rules_set_updated_at before update on public.professional_availability_rules for each row execute function public.set_updated_at();

-- Enforce professional operational availability for every appointment write,
-- including writes coming from recurrence generation.
create or replace function public.enforce_professional_operational_availability()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  v_timezone text;
  v_weekday int;
  v_start_local time;
  v_end_local time;
begin
  if new.professional_id is null or new.status <> 'SCHEDULED' then
    return new;
  end if;

  if not exists (
    select 1 from public.professionals p
    where p.id=new.professional_id and p.organization_id=new.organization_id and p.active=true
  ) then
    raise exception 'Professional is inactive or not found';
  end if;

  if not exists (
    select 1 from public.professional_activities pa
    where pa.organization_id=new.organization_id and pa.professional_id=new.professional_id and pa.activity_id=new.activity_id
  ) then
    raise exception 'Professional is not qualified for this service';
  end if;

  select o.timezone into v_timezone from public.organizations o where o.id=new.organization_id;
  v_weekday := extract(dow from (new.starts_at at time zone coalesce(v_timezone,'UTC')))::int;
  v_start_local := (new.starts_at at time zone coalesce(v_timezone,'UTC'))::time;
  v_end_local := (new.ends_at at time zone coalesce(v_timezone,'UTC'))::time;

  if exists(select 1 from public.professional_availability_rules ar where ar.organization_id=new.organization_id and ar.professional_id=new.professional_id and ar.active=true)
     and not exists(
       select 1 from public.professional_availability_rules ar
       where ar.organization_id=new.organization_id and ar.professional_id=new.professional_id and ar.active=true
         and ar.weekday=v_weekday and ar.start_time<=v_start_local and ar.end_time>=v_end_local
     ) then
    raise exception 'Professional is outside configured working hours';
  end if;

  if exists(
    select 1 from public.professional_unavailability u
    where u.organization_id=new.organization_id and u.professional_id=new.professional_id
      and tstzrange(u.starts_at,u.ends_at,'[)') && tstzrange(new.starts_at,new.ends_at,'[)')
  ) then
    raise exception 'Professional is unavailable in this interval';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_enforce_professional_operational_availability on public.appointments;
create trigger appointments_enforce_professional_operational_availability
before insert or update of professional_id, activity_id, starts_at, ends_at, status
on public.appointments
for each row execute function public.enforce_professional_operational_availability();

create or replace function public.reassign_professional_future_appointments(p_from_professional_id uuid,p_to_professional_id uuid)
returns table(moved bigint, remaining bigint)
language plpgsql security definer set search_path='' as $$
declare
  v_org uuid;
  v_moved bigint := 0;
  v_remaining bigint := 0;
  v_timezone text;
begin
  select organization_id into v_org from public.professionals where id=p_from_professional_id;
  if v_org is null then raise exception 'professional_not_found'; end if;
  if not public.user_has_permission(v_org,'SCHEDULING_RESCHEDULE') then raise exception 'forbidden'; end if;
  if not exists(select 1 from public.professionals where id=p_to_professional_id and organization_id=v_org and active) then raise exception 'replacement_not_available'; end if;
  select timezone into v_timezone from public.organizations where id=v_org;

  update public.appointments a
     set professional_id=p_to_professional_id
   where a.organization_id=v_org
     and a.professional_id=p_from_professional_id
     and a.status='SCHEDULED'
     and a.starts_at>now()
     and exists(select 1 from public.professional_activities pa where pa.organization_id=v_org and pa.professional_id=p_to_professional_id and pa.activity_id=a.activity_id)
     and (
       not exists(select 1 from public.professional_availability_rules ar where ar.organization_id=v_org and ar.professional_id=p_to_professional_id and ar.active)
       or exists(
         select 1 from public.professional_availability_rules ar
         where ar.organization_id=v_org and ar.professional_id=p_to_professional_id and ar.active
           and ar.weekday=extract(dow from (a.starts_at at time zone coalesce(v_timezone,'UTC')))::int
           and ar.start_time <= (a.starts_at at time zone coalesce(v_timezone,'UTC'))::time
           and ar.end_time >= (a.ends_at at time zone coalesce(v_timezone,'UTC'))::time
       )
     )
     and not exists(select 1 from public.professional_unavailability u where u.organization_id=v_org and u.professional_id=p_to_professional_id and tstzrange(u.starts_at,u.ends_at,'[)') && tstzrange(a.starts_at,a.ends_at,'[)'))
     and not exists(select 1 from public.appointments b where b.organization_id=v_org and b.professional_id=p_to_professional_id and b.status='SCHEDULED' and b.id<>a.id and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(a.starts_at,a.ends_at,'[)'));

  get diagnostics v_moved = row_count;
  select count(*) into v_remaining from public.appointments a where a.organization_id=v_org and a.professional_id=p_from_professional_id and a.status='SCHEDULED' and a.starts_at>now();
  return query select v_moved,v_remaining;
end; $$;
