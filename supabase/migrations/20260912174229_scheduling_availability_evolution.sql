-- COURTLY — Scheduling availability evolution
-- Professional presence/absence exceptions, service-specialty color link,
-- optional resource classification and a single database availability function.

-- 1) Professional schedule exceptions -------------------------------------------------
do $$ begin
  create type public.professional_schedule_exception_type as enum ('ABSENCE','PRESENCE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.professional_schedule_exception_reason as enum (
    'PERSONAL','HEALTH','VACATION','TRAINING','EVENT','EXTRA_SHIFT','COVERAGE','OTHER'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.professional_schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  professional_id uuid not null,
  exception_type public.professional_schedule_exception_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason public.professional_schedule_exception_reason not null,
  reason_details text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_schedule_exception_time_valid check (ends_at > starts_at),
  constraint professional_schedule_exception_other_reason check (
    reason <> 'OTHER' or length(trim(coalesce(reason_details,''))) > 0
  ),
  constraint fk_professional_schedule_exception_professional
    foreign key (professional_id, organization_id)
    references public.professionals(id, organization_id)
    on delete cascade
);

create index if not exists idx_professional_schedule_exceptions_lookup
  on public.professional_schedule_exceptions(organization_id, professional_id, starts_at, ends_at)
  where active = true;

alter table public.professional_schedule_exceptions enable row level security;
drop policy if exists "professional schedule exceptions read" on public.professional_schedule_exceptions;
create policy "professional schedule exceptions read"
  on public.professional_schedule_exceptions for select to authenticated
  using(public.is_organization_member(organization_id));
drop policy if exists "professional schedule exceptions manage" on public.professional_schedule_exceptions;
create policy "professional schedule exceptions manage"
  on public.professional_schedule_exceptions for all to authenticated
  using(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'))
  with check(public.user_has_permission(organization_id,'PROFESSIONALS_EDIT'));

grant select, insert, update, delete on public.professional_schedule_exceptions to authenticated;

drop trigger if exists professional_schedule_exceptions_set_updated_at on public.professional_schedule_exceptions;
create trigger professional_schedule_exceptions_set_updated_at
before update on public.professional_schedule_exceptions
for each row execute function public.set_updated_at();

-- Preserve old future unavailability as ABSENCE history when this migration is applied.
insert into public.professional_schedule_exceptions(
  organization_id, professional_id, exception_type, starts_at, ends_at, reason, reason_details, active, created_at, updated_at
)
select u.organization_id, u.professional_id, 'ABSENCE', u.starts_at, u.ends_at,
       'OTHER', coalesce(nullif(trim(u.reason),''),'Imported legacy unavailability'), true,
       coalesce(u.created_at, now()), coalesce(u.created_at, now())
from public.professional_unavailability u
where not exists (
  select 1 from public.professional_schedule_exceptions e
  where e.organization_id=u.organization_id and e.professional_id=u.professional_id
    and e.exception_type='ABSENCE' and e.starts_at=u.starts_at and e.ends_at=u.ends_at
);

-- 2) Services may point to a specialty; this gives appointments their modality color -----
alter table public.activities
  add column if not exists specialty_id uuid null;

alter table public.activities
  drop constraint if exists fk_activities_specialty;
alter table public.activities
  add constraint fk_activities_specialty
  foreign key (specialty_id, organization_id)
  references public.professional_specialties(id, organization_id)
  on delete restrict;

create index if not exists idx_activities_specialty
  on public.activities(organization_id, specialty_id);

-- 3) A physical resource may exist without classification -------------------------------
alter table public.resources alter column resource_type_id drop not null;
alter table public.resources drop constraint if exists fk_resources_type;
alter table public.resources add constraint fk_resources_type
  foreign key (resource_type_id, organization_id)
  references public.resource_types(id, organization_id)
  on delete restrict;

-- 4) Canonical availability function ----------------------------------------------------
create or replace function public.professional_is_available(
  p_organization_id uuid,
  p_professional_id uuid,
  p_activity_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_ignore_appointment_id uuid default null
)
returns boolean
language plpgsql
stable
set search_path=''
as $$
declare
  v_timezone text;
  v_weekday int;
  v_start_local time;
  v_end_local time;
  v_has_rules boolean;
begin
  if p_professional_id is null or p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    return false;
  end if;

  if not exists (
    select 1 from public.professionals p
    where p.id=p_professional_id and p.organization_id=p_organization_id and p.active=true
  ) then return false; end if;

  if p_activity_id is not null and not exists (
    select 1 from public.professional_activities pa
    where pa.organization_id=p_organization_id and pa.professional_id=p_professional_id and pa.activity_id=p_activity_id
  ) then return false; end if;

  -- Existing booking always blocks the interval.
  if exists (
    select 1 from public.appointments a
    where a.organization_id=p_organization_id and a.professional_id=p_professional_id
      and a.status='SCHEDULED' and (p_ignore_appointment_id is null or a.id<>p_ignore_appointment_id)
      and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(p_starts_at,p_ends_at,'[)')
  ) then return false; end if;

  -- ABSENCE wins over every other rule.
  if exists (
    select 1 from public.professional_schedule_exceptions e
    where e.organization_id=p_organization_id and e.professional_id=p_professional_id
      and e.active=true and e.exception_type='ABSENCE'
      and tstzrange(e.starts_at,e.ends_at,'[)') && tstzrange(p_starts_at,p_ends_at,'[)')
  ) then return false; end if;

  -- PRESENCE can enable an interval outside the weekly schedule, but it must cover it fully.
  if exists (
    select 1 from public.professional_schedule_exceptions e
    where e.organization_id=p_organization_id and e.professional_id=p_professional_id
      and e.active=true and e.exception_type='PRESENCE'
      and e.starts_at<=p_starts_at and e.ends_at>=p_ends_at
  ) then return true; end if;

  select coalesce(o.timezone,'UTC') into v_timezone
  from public.organizations o where o.id=p_organization_id;

  v_weekday := extract(dow from (p_starts_at at time zone v_timezone))::int;
  v_start_local := (p_starts_at at time zone v_timezone)::time;
  v_end_local := (p_ends_at at time zone v_timezone)::time;

  select exists(
    select 1 from public.professional_availability_rules ar
    where ar.organization_id=p_organization_id and ar.professional_id=p_professional_id and ar.active=true
  ) into v_has_rules;

  -- No configured weekly rules means no regular availability. Presence exceptions may still enable it.
  if not v_has_rules then return false; end if;

  return exists (
    select 1 from public.professional_availability_rules ar
    where ar.organization_id=p_organization_id and ar.professional_id=p_professional_id and ar.active=true
      and ar.weekday=v_weekday and ar.start_time<=v_start_local and ar.end_time>=v_end_local
  );
end;
$$;

grant execute on function public.professional_is_available(uuid,uuid,uuid,timestamptz,timestamptz,uuid) to authenticated;

-- 5) Appointment trigger uses the canonical function ------------------------------------
create or replace function public.enforce_professional_operational_availability()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.professional_id is null or new.status <> 'SCHEDULED' then return new; end if;

  if not public.professional_is_available(
    new.organization_id,
    new.professional_id,
    new.activity_id,
    new.starts_at,
    new.ends_at,
    case when tg_op='UPDATE' then new.id else null end
  ) then
    raise exception 'Professional is not available for this service/date/time';
  end if;

  return new;
end;
$$;

-- Existing trigger name is preserved and will call the replaced function.

-- 6) Return available professionals for a concrete slot ---------------------------------
create or replace function public.list_available_professionals(
  p_activity_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns table(professional_id uuid)
language sql
stable
security invoker
set search_path=''
as $$
  select p.id
  from public.professionals p
  join public.activities a on a.id=p_activity_id and a.organization_id=p.organization_id
  where p.active=true
    and public.is_organization_member(p.organization_id)
    and public.professional_is_available(p.organization_id,p.id,p_activity_id,p_starts_at,p_ends_at,null)
  order by p.name;
$$;

grant execute on function public.list_available_professionals(uuid,timestamptz,timestamptz) to authenticated;

-- 7) Recurrence generator: a date exception affects only that occurrence, never the whole rule.
create or replace function public.generate_schedule_rule_appointments(
    p_schedule_rule_id uuid,
    p_window_end date default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    r public.schedule_rules%rowtype;
    v_window_days integer;
    v_target_end date;
    v_date date;
    v_start timestamptz;
    v_end timestamptz;
    v_inserted integer := 0;
    v_appointment_id uuid;
    v_resource_id uuid;
begin
    select * into r from public.schedule_rules sr where sr.id = p_schedule_rule_id;
    if r.id is null or r.status <> 'ACTIVE' then return 0; end if;

    if auth.uid() is not null and not public.is_organization_manager(r.organization_id) then
        raise exception 'Forbidden';
    end if;

    select s.generation_window_days into v_window_days
    from public.organization_scheduling_settings s where s.organization_id = r.organization_id;

    v_target_end := coalesce(p_window_end, current_date + coalesce(v_window_days, 90));
    if r.effective_until is not null then v_target_end := least(v_target_end, r.effective_until); end if;

    select least(v_target_end, cs.ends_at) into v_target_end
    from public.customer_subscriptions cs
    where cs.id = r.customer_subscription_id and cs.ends_at is not null;

    if v_target_end is null then
        v_target_end := coalesce(p_window_end, current_date + coalesce(v_window_days, 90));
        if r.effective_until is not null then v_target_end := least(v_target_end, r.effective_until); end if;
    end if;

    v_date := greatest(r.effective_from, current_date);
    while v_date <= v_target_end loop
      if extract(dow from v_date)::smallint = r.weekday then
        v_start := ((v_date::text || ' ' || r.start_time::text)::timestamp at time zone r.timezone);
        v_end := ((v_date::text || ' ' || r.end_time::text)::timestamp at time zone r.timezone);

        if r.professional_id is not null and not public.professional_is_available(
          r.organization_id, r.professional_id, r.activity_id, v_start, v_end, null
        ) then
          insert into public.schedule_generation_conflicts(
            organization_id, schedule_rule_id, starts_at, ends_at, reason, resolved_at
          ) values (
            r.organization_id, r.id, v_start, v_end, 'CAPACITY_CONFLICT', null
          )
          on conflict (schedule_rule_id, starts_at)
          do update set ends_at=excluded.ends_at, reason=excluded.reason, resolved_at=null;
        else
          begin
            v_appointment_id := null;
            insert into public.appointments(
              organization_id, schedule_rule_id, customer_id, customer_subscription_id,
              activity_id, professional_id, starts_at, ends_at, status, source
            ) values (
              r.organization_id, r.id, r.customer_id, r.customer_subscription_id,
              r.activity_id, r.professional_id, v_start, v_end, 'SCHEDULED', 'RECURRENCE'
            )
            on conflict (schedule_rule_id, starts_at) where schedule_rule_id is not null
            do nothing
            returning id into v_appointment_id;

            if v_appointment_id is not null then
              for v_resource_id in
                select srr.resource_id from public.schedule_rule_resources srr where srr.schedule_rule_id=r.id
              loop
                insert into public.appointment_resources(
                  organization_id, appointment_id, resource_id, starts_at, ends_at, status
                ) values (
                  r.organization_id, v_appointment_id, v_resource_id, v_start, v_end, 'SCHEDULED'
                );
              end loop;

              update public.schedule_generation_conflicts sgc
              set resolved_at=now()
              where sgc.schedule_rule_id=r.id and sgc.starts_at=v_start and sgc.resolved_at is null;

              v_inserted := v_inserted + 1;
            end if;
          exception
            when exclusion_violation then
              insert into public.schedule_generation_conflicts(
                organization_id, schedule_rule_id, starts_at, ends_at, reason, resolved_at
              ) values (
                r.organization_id, r.id, v_start, v_end, 'CAPACITY_CONFLICT', null
              )
              on conflict (schedule_rule_id, starts_at)
              do update set ends_at=excluded.ends_at, reason=excluded.reason, resolved_at=null;
          end;
        end if;
      end if;
      v_date := v_date + 1;
    end loop;

    return v_inserted;
end;
$$;
