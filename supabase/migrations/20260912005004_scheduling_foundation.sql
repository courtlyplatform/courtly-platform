-- ============================================================
-- COURTLY — FASE F / SCHEDULING FOUNDATION
--
-- Adds:
--   * activity scheduling requirements
--   * organization scheduling settings
--   * resources and resource types
--   * professional/activity qualifications
--   * recurring schedule rules
--   * concrete appointments
--   * appointment resource allocations
--   * availability / conflict-safe booking RPCs
--   * rolling 90-day recurrence generation
--   * subscription/customer lifecycle integration
-- ============================================================

create extension if not exists btree_gist;

-- ============================================================
-- 1. ENUMS
-- ============================================================

do $$ begin
    create type public.activity_scheduling_mode as enum (
        'NONE',
        'OPTIONAL',
        'REQUIRED'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.scheduling_requirement as enum (
        'NONE',
        'OPTIONAL',
        'REQUIRED'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.schedule_rule_status as enum (
        'ACTIVE',
        'PAUSED',
        'ENDED'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.schedule_recurrence_type as enum (
        'WEEKLY'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.appointment_status as enum (
        'SCHEDULED',
        'CANCELLED',
        'COMPLETED'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.appointment_source as enum (
        'RECURRENCE',
        'MANUAL',
        'MAKEUP',
        'RESCHEDULE'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.schedule_generation_conflict_reason as enum (
        'CAPACITY_CONFLICT'
    );
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 2. ACTIVITY SCHEDULING CAPABILITY
-- ============================================================

alter table public.activities
    add column if not exists scheduling_mode public.activity_scheduling_mode
        not null default 'NONE',
    add column if not exists professional_requirement public.scheduling_requirement
        not null default 'NONE',
    add column if not exists resource_requirement public.scheduling_requirement
        not null default 'NONE';

comment on column public.activities.scheduling_mode is
    'Whether this service uses scheduling: NONE, OPTIONAL or REQUIRED.';
comment on column public.activities.professional_requirement is
    'Whether appointments for this service need a professional.';
comment on column public.activities.resource_requirement is
    'Whether appointments for this service need physical resources.';

-- ============================================================
-- 3. ORGANIZATION SCHEDULING SETTINGS
-- ============================================================

create table if not exists public.organization_scheduling_settings (
    organization_id uuid primary key
        references public.organizations(id)
        on delete cascade,

    scheduling_enabled boolean not null default true,
    generation_window_days integer not null default 90,

    check_in_enabled boolean not null default false,
    check_in_window_minutes integer not null default 120,
    late_cancellation_window_minutes integer not null default 120,

    allow_makeup_for_early_cancellation boolean not null default true,
    allow_makeup_for_weather boolean not null default true,
    allow_makeup_for_professional_absence boolean not null default true,
    allow_manual_makeup_override boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint scheduling_generation_window_valid
        check (generation_window_days between 7 and 3650),

    constraint scheduling_check_in_window_valid
        check (check_in_window_minutes between 0 and 10080),

    constraint scheduling_late_cancel_window_valid
        check (late_cancellation_window_minutes between 0 and 10080)
);

insert into public.organization_scheduling_settings (organization_id)
select o.id
from public.organizations o
on conflict (organization_id) do nothing;

create or replace function public.ensure_organization_scheduling_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.organization_scheduling_settings (organization_id)
    values (new.id)
    on conflict (organization_id) do nothing;
    return new;
end;
$$;

drop trigger if exists organizations_ensure_scheduling_settings on public.organizations;
create trigger organizations_ensure_scheduling_settings
after insert on public.organizations
for each row execute function public.ensure_organization_scheduling_settings();

drop trigger if exists scheduling_settings_set_updated_at on public.organization_scheduling_settings;
create trigger scheduling_settings_set_updated_at
before update on public.organization_scheduling_settings
for each row execute function public.set_updated_at();

-- ============================================================
-- 4. RESOURCES
-- ============================================================

create table if not exists public.resource_types (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,
    name varchar(120) not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint resource_types_name_not_blank check (length(trim(name)) > 0),
    constraint resource_types_id_organization_unique unique (id, organization_id)
);

create unique index if not exists uq_resource_types_organization_name
    on public.resource_types (organization_id, lower(trim(name)));

create table if not exists public.resources (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null,
    resource_type_id uuid not null,
    name varchar(120) not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint resources_name_not_blank check (length(trim(name)) > 0),
    constraint resources_id_organization_unique unique (id, organization_id),

    constraint fk_resources_organization
        foreign key (organization_id)
        references public.organizations(id)
        on delete cascade,

    constraint fk_resources_type
        foreign key (resource_type_id, organization_id)
        references public.resource_types(id, organization_id)
        on delete restrict
);

create unique index if not exists uq_resources_organization_name
    on public.resources (organization_id, lower(trim(name)));
create index if not exists idx_resources_org_type_active
    on public.resources (organization_id, resource_type_id, active);

create table if not exists public.activity_resource_requirements (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null,
    activity_id uuid not null,
    resource_type_id uuid not null,
    quantity integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint activity_resource_quantity_positive check (quantity > 0),
    constraint activity_resource_requirement_unique unique (
        activity_id,
        resource_type_id
    ),

    constraint fk_activity_resource_activity
        foreign key (activity_id, organization_id)
        references public.activities(id, organization_id)
        on delete cascade,

    constraint fk_activity_resource_type
        foreign key (resource_type_id, organization_id)
        references public.resource_types(id, organization_id)
        on delete restrict
);

-- ============================================================
-- 5. PROFESSIONAL QUALIFICATIONS
-- ============================================================

alter table public.professionals
    add constraint professionals_id_organization_unique
    unique (id, organization_id);

create table if not exists public.professional_activities (
    organization_id uuid not null,
    professional_id uuid not null,
    activity_id uuid not null,
    created_at timestamptz not null default now(),

    primary key (professional_id, activity_id),

    constraint fk_professional_activities_professional
        foreign key (professional_id, organization_id)
        references public.professionals(id, organization_id)
        on delete cascade,

    constraint fk_professional_activities_activity
        foreign key (activity_id, organization_id)
        references public.activities(id, organization_id)
        on delete cascade
);

-- Tenant-safe subscription key used by Scheduling.
alter table public.customer_subscriptions
    add constraint customer_subscriptions_scheduling_tenant_key
    unique (id, organization_id, customer_id, activity_id);

-- ============================================================
-- 6. SCHEDULE RULES
-- ============================================================

create table if not exists public.schedule_rules (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null,
    customer_id uuid not null,
    customer_subscription_id uuid not null,
    activity_id uuid not null,
    professional_id uuid,

    recurrence_type public.schedule_recurrence_type not null default 'WEEKLY',
    weekday smallint not null,
    start_time time not null,
    end_time time not null,
    effective_from date not null,
    effective_until date,
    timezone varchar(100) not null default 'America/Sao_Paulo',
    status public.schedule_rule_status not null default 'ACTIVE',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint schedule_rules_weekday_valid check (weekday between 0 and 6),
    constraint schedule_rules_time_valid check (end_time > start_time),
    constraint schedule_rules_period_valid check (
        effective_until is null or effective_until >= effective_from
    ),
    constraint schedule_rules_id_organization_unique unique (id, organization_id),

    constraint fk_schedule_rules_customer
        foreign key (customer_id, organization_id)
        references public.customers(id, organization_id)
        on delete restrict,

    constraint fk_schedule_rules_activity
        foreign key (activity_id, organization_id)
        references public.activities(id, organization_id)
        on delete restrict,

    constraint fk_schedule_rules_professional
        foreign key (professional_id, organization_id)
        references public.professionals(id, organization_id)
        on delete restrict,

    constraint fk_schedule_rules_subscription
        foreign key (
            customer_subscription_id,
            organization_id,
            customer_id,
            activity_id
        )
        references public.customer_subscriptions(
            id,
            organization_id,
            customer_id,
            activity_id
        )
        on delete restrict
);

create index if not exists idx_schedule_rules_org_status
    on public.schedule_rules (organization_id, status);
create index if not exists idx_schedule_rules_subscription
    on public.schedule_rules (customer_subscription_id, status);
create index if not exists idx_schedule_rules_customer
    on public.schedule_rules (customer_id, status);
create index if not exists idx_schedule_rules_professional
    on public.schedule_rules (professional_id, status);

create table if not exists public.schedule_rule_resources (
    organization_id uuid not null,
    schedule_rule_id uuid not null,
    resource_id uuid not null,
    created_at timestamptz not null default now(),
    primary key (schedule_rule_id, resource_id),

    constraint fk_schedule_rule_resources_rule
        foreign key (schedule_rule_id, organization_id)
        references public.schedule_rules(id, organization_id)
        on delete cascade,

    constraint fk_schedule_rule_resources_resource
        foreign key (resource_id, organization_id)
        references public.resources(id, organization_id)
        on delete restrict
);

create table if not exists public.schedule_generation_conflicts (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null,
    schedule_rule_id uuid not null,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    reason public.schedule_generation_conflict_reason not null default 'CAPACITY_CONFLICT',
    resolved_at timestamptz,
    created_at timestamptz not null default now(),

    constraint schedule_generation_conflict_unique unique (schedule_rule_id, starts_at),
    constraint schedule_generation_conflicts_time_valid check (ends_at > starts_at),

    constraint fk_schedule_generation_conflicts_rule
        foreign key (schedule_rule_id, organization_id)
        references public.schedule_rules(id, organization_id)
        on delete cascade
);

create index if not exists idx_schedule_generation_conflicts_org_unresolved
    on public.schedule_generation_conflicts (organization_id, starts_at)
    where resolved_at is null;

-- ============================================================
-- 7. APPOINTMENTS
-- ============================================================

create table if not exists public.appointments (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null,
    schedule_rule_id uuid,
    customer_id uuid not null,
    customer_subscription_id uuid,
    activity_id uuid not null,
    professional_id uuid,

    starts_at timestamptz not null,
    ends_at timestamptz not null,

    status public.appointment_status not null default 'SCHEDULED',
    source public.appointment_source not null default 'MANUAL',

    cancellation_reason text,
    cancelled_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint appointments_time_valid check (ends_at > starts_at),
    constraint appointments_id_organization_unique unique (id, organization_id),
    constraint appointments_cancel_consistency check (
        (status = 'CANCELLED' and cancelled_at is not null)
        or
        (status <> 'CANCELLED')
    ),

    constraint fk_appointments_rule
        foreign key (schedule_rule_id, organization_id)
        references public.schedule_rules(id, organization_id)
        on delete restrict,

    constraint fk_appointments_customer
        foreign key (customer_id, organization_id)
        references public.customers(id, organization_id)
        on delete restrict,

    constraint fk_appointments_activity
        foreign key (activity_id, organization_id)
        references public.activities(id, organization_id)
        on delete restrict,

    constraint fk_appointments_professional
        foreign key (professional_id, organization_id)
        references public.professionals(id, organization_id)
        on delete restrict,

    constraint fk_appointments_subscription
        foreign key (
            customer_subscription_id,
            organization_id,
            customer_id,
            activity_id
        )
        references public.customer_subscriptions(
            id,
            organization_id,
            customer_id,
            activity_id
        )
        on delete restrict
);

create unique index if not exists uq_appointments_rule_start
    on public.appointments (schedule_rule_id, starts_at)
    where schedule_rule_id is not null;

create index if not exists idx_appointments_org_start
    on public.appointments (organization_id, starts_at);
create index if not exists idx_appointments_customer_start
    on public.appointments (customer_id, starts_at);
create index if not exists idx_appointments_professional_start
    on public.appointments (professional_id, starts_at)
    where professional_id is not null;

create table if not exists public.appointment_resources (
    organization_id uuid not null,
    appointment_id uuid not null,
    resource_id uuid not null,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    status public.appointment_status not null default 'SCHEDULED',
    created_at timestamptz not null default now(),

    primary key (appointment_id, resource_id),

    constraint appointment_resources_time_valid check (ends_at > starts_at),

    constraint fk_appointment_resources_appointment
        foreign key (appointment_id, organization_id)
        references public.appointments(id, organization_id)
        on delete cascade,

    constraint fk_appointment_resources_resource
        foreign key (resource_id, organization_id)
        references public.resources(id, organization_id)
        on delete restrict
);

-- Database-level protection against overlapping active reservations
-- for the same resource. Cancelled allocations are allowed to overlap.
alter table public.appointment_resources
    drop constraint if exists appointment_resources_no_overlap;

alter table public.appointment_resources
    add constraint appointment_resources_no_overlap
    exclude using gist (
        resource_id with =,
        tstzrange(starts_at, ends_at, '[)') with &&
    )
    where (status = 'SCHEDULED');

-- Professional overlap protection lives directly on appointments.
alter table public.appointments
    drop constraint if exists appointments_professional_no_overlap;

alter table public.appointments
    add constraint appointments_professional_no_overlap
    exclude using gist (
        professional_id with =,
        tstzrange(starts_at, ends_at, '[)') with &&
    )
    where (professional_id is not null and status = 'SCHEDULED');

-- ============================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists resource_types_set_updated_at on public.resource_types;
create trigger resource_types_set_updated_at
before update on public.resource_types
for each row execute function public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

drop trigger if exists activity_resource_requirements_set_updated_at on public.activity_resource_requirements;
create trigger activity_resource_requirements_set_updated_at
before update on public.activity_resource_requirements
for each row execute function public.set_updated_at();

drop trigger if exists schedule_rules_set_updated_at on public.schedule_rules;
create trigger schedule_rules_set_updated_at
before update on public.schedule_rules
for each row execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

-- ============================================================
-- 9. RLS
-- ============================================================

alter table public.organization_scheduling_settings enable row level security;
alter table public.resource_types enable row level security;
alter table public.resources enable row level security;
alter table public.activity_resource_requirements enable row level security;
alter table public.professional_activities enable row level security;
alter table public.schedule_rules enable row level security;
alter table public.schedule_rule_resources enable row level security;
alter table public.schedule_generation_conflicts enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_resources enable row level security;

-- Read policies
create policy "members can view scheduling settings"
on public.organization_scheduling_settings for select to authenticated
using (public.is_organization_member(organization_id));

create policy "members can view resource types"
on public.resource_types for select to authenticated
using (public.is_organization_member(organization_id));

create policy "members can view resources"
on public.resources for select to authenticated
using (public.is_organization_member(organization_id));

create policy "members can view activity resource requirements"
on public.activity_resource_requirements for select to authenticated
using (public.is_organization_member(organization_id));

create policy "members can view professional activities"
on public.professional_activities for select to authenticated
using (public.is_organization_member(organization_id));

create policy "managers can view schedule rules"
on public.schedule_rules for select to authenticated
using (public.is_organization_manager(organization_id));

create policy "managers can view schedule rule resources"
on public.schedule_rule_resources for select to authenticated
using (public.is_organization_manager(organization_id));

create policy "managers can view schedule generation conflicts"
on public.schedule_generation_conflicts for select to authenticated
using (public.is_organization_manager(organization_id));

create policy "managers can view appointments"
on public.appointments for select to authenticated
using (public.is_organization_manager(organization_id));

create policy "managers can view appointment resources"
on public.appointment_resources for select to authenticated
using (public.is_organization_manager(organization_id));

-- Manager write policies
create policy "managers can update scheduling settings"
on public.organization_scheduling_settings for update to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

create policy "managers can manage resource types"
on public.resource_types for all to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

create policy "managers can manage resources"
on public.resources for all to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

create policy "managers can manage activity resource requirements"
on public.activity_resource_requirements for all to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

create policy "managers can manage professional activities"
on public.professional_activities for all to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

create policy "managers can manage schedule rules"
on public.schedule_rules for all to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

create policy "managers can manage schedule rule resources"
on public.schedule_rule_resources for all to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

create policy "managers can manage appointments"
on public.appointments for all to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

create policy "managers can manage appointment resources"
on public.appointment_resources for all to authenticated
using (public.is_organization_manager(organization_id))
with check (public.is_organization_manager(organization_id));

-- ============================================================
-- 10. AVAILABILITY RPC
-- ============================================================

create or replace function public.get_scheduling_availability(
    p_activity_id uuid,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_professional_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_organization_id uuid;
    v_prof_req public.scheduling_requirement;
    v_resource_req public.scheduling_requirement;
    v_prof_available boolean := true;
    v_resource_required integer := 0;
    v_resource_available integer := 0;
begin
    select a.organization_id, a.professional_requirement, a.resource_requirement
    into v_organization_id, v_prof_req, v_resource_req
    from public.activities a
    where a.id = p_activity_id;

    if v_organization_id is null or not public.is_organization_member(v_organization_id) then
        raise exception 'Activity not found or forbidden';
    end if;

    if p_ends_at <= p_starts_at then
        raise exception 'Invalid appointment interval';
    end if;

    if v_prof_req = 'REQUIRED' then
        if p_professional_id is null then
            v_prof_available := exists (
                select 1
                from public.professional_activities pa
                join public.professionals p
                  on p.id = pa.professional_id
                 and p.organization_id = pa.organization_id
                where pa.organization_id = v_organization_id
                  and pa.activity_id = p_activity_id
                  and p.active = true
                  and not exists (
                      select 1
                      from public.appointments ap
                      where ap.organization_id = v_organization_id
                        and ap.professional_id = p.id
                        and ap.status = 'SCHEDULED'
                        and tstzrange(ap.starts_at, ap.ends_at, '[)') &&
                            tstzrange(p_starts_at, p_ends_at, '[)')
                  )
            );
        else
            v_prof_available := exists (
                select 1
                from public.professional_activities pa
                join public.professionals p
                  on p.id = pa.professional_id
                 and p.organization_id = pa.organization_id
                where pa.organization_id = v_organization_id
                  and pa.activity_id = p_activity_id
                  and pa.professional_id = p_professional_id
                  and p.active = true
                  and not exists (
                      select 1 from public.appointments ap
                      where ap.organization_id = v_organization_id
                        and ap.professional_id = p_professional_id
                        and ap.status = 'SCHEDULED'
                        and tstzrange(ap.starts_at, ap.ends_at, '[)') &&
                            tstzrange(p_starts_at, p_ends_at, '[)')
                  )
            );
        end if;
    elsif p_professional_id is not null then
        v_prof_available := not exists (
            select 1 from public.appointments ap
            where ap.organization_id = v_organization_id
              and ap.professional_id = p_professional_id
              and ap.status = 'SCHEDULED'
              and tstzrange(ap.starts_at, ap.ends_at, '[)') &&
                  tstzrange(p_starts_at, p_ends_at, '[)')
        );
    end if;

    select coalesce(sum(arr.quantity), 0)
    into v_resource_required
    from public.activity_resource_requirements arr
    where arr.organization_id = v_organization_id
      and arr.activity_id = p_activity_id;

    select coalesce(sum(x.available_count), 0)
    into v_resource_available
    from (
        select arr.resource_type_id,
               least(
                   arr.quantity,
                   count(r.id) filter (
                       where not exists (
                           select 1
                           from public.appointment_resources ar
                           where ar.organization_id = v_organization_id
                             and ar.resource_id = r.id
                             and ar.status = 'SCHEDULED'
                             and tstzrange(ar.starts_at, ar.ends_at, '[)') &&
                                 tstzrange(p_starts_at, p_ends_at, '[)')
                       )
                   )
               )::integer as available_count
        from public.activity_resource_requirements arr
        left join public.resources r
          on r.organization_id = arr.organization_id
         and r.resource_type_id = arr.resource_type_id
         and r.active = true
        where arr.organization_id = v_organization_id
          and arr.activity_id = p_activity_id
        group by arr.resource_type_id, arr.quantity
    ) x;

    return jsonb_build_object(
        'professionalRequired', v_prof_req = 'REQUIRED',
        'professionalAvailable', v_prof_available,
        'resourceRequired', v_resource_req = 'REQUIRED',
        'requiredResourceCount', v_resource_required,
        'availableRequiredResourceCount', v_resource_available,
        'available',
            v_prof_available
            and (
                v_resource_req <> 'REQUIRED'
                or v_resource_required = 0
                or v_resource_available >= v_resource_required
            )
    );
end;
$$;

-- ============================================================
-- 11. CONFLICT-SAFE MANUAL APPOINTMENT RPC
-- ============================================================

create or replace function public.create_scheduling_appointment(
    p_customer_id uuid,
    p_activity_id uuid,
    p_customer_subscription_id uuid,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_professional_id uuid default null,
    p_resource_ids uuid[] default array[]::uuid[],
    p_source public.appointment_source default 'MANUAL'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_organization_id uuid;
    v_prof_req public.scheduling_requirement;
    v_resource_req public.scheduling_requirement;
    v_appointment_id uuid;
    v_resource_id uuid;
    v_required_total integer := 0;
    v_selected_required integer := 0;
begin
    select a.organization_id, a.professional_requirement, a.resource_requirement
    into v_organization_id, v_prof_req, v_resource_req
    from public.activities a
    where a.id = p_activity_id and a.active = true;

    if v_organization_id is null then
        raise exception 'Activity not found';
    end if;

    if not public.is_organization_manager(v_organization_id) then
        raise exception 'Forbidden';
    end if;

    if p_ends_at <= p_starts_at then
        raise exception 'Invalid appointment interval';
    end if;

    if not exists (
        select 1 from public.customers c
        where c.id = p_customer_id
          and c.organization_id = v_organization_id
          and c.active = true
    ) then
        raise exception 'Customer not found or inactive';
    end if;

    if p_customer_subscription_id is not null and not exists (
        select 1 from public.customer_subscriptions cs
        where cs.id = p_customer_subscription_id
          and cs.organization_id = v_organization_id
          and cs.customer_id = p_customer_id
          and cs.activity_id = p_activity_id
          and cs.status = 'ACTIVE'
    ) then
        raise exception 'Active compatible subscription not found';
    end if;

    if v_prof_req = 'REQUIRED' and p_professional_id is null then
        raise exception 'Professional is required';
    end if;

    if p_professional_id is not null then
        if not exists (
            select 1
            from public.professionals p
            where p.id = p_professional_id
              and p.organization_id = v_organization_id
              and p.active = true
        ) then
            raise exception 'Professional not found or inactive';
        end if;

        if v_prof_req = 'REQUIRED' and not exists (
            select 1 from public.professional_activities pa
            where pa.organization_id = v_organization_id
              and pa.professional_id = p_professional_id
              and pa.activity_id = p_activity_id
        ) then
            raise exception 'Professional is not qualified for this service';
        end if;

        perform pg_advisory_xact_lock(hashtextextended(p_professional_id::text, 0));

        if exists (
            select 1 from public.appointments ap
            where ap.organization_id = v_organization_id
              and ap.professional_id = p_professional_id
              and ap.status = 'SCHEDULED'
              and tstzrange(ap.starts_at, ap.ends_at, '[)') &&
                  tstzrange(p_starts_at, p_ends_at, '[)')
        ) then
            raise exception 'Professional is not available';
        end if;
    end if;

    select coalesce(sum(arr.quantity), 0)
    into v_required_total
    from public.activity_resource_requirements arr
    where arr.organization_id = v_organization_id
      and arr.activity_id = p_activity_id;

    if v_resource_req = 'REQUIRED' and v_required_total = 0 then
        raise exception 'Resource requirement is not configured';
    end if;

    if v_resource_req = 'REQUIRED' and v_required_total > 0 then
        if exists (
            select 1
            from public.activity_resource_requirements arr
            where arr.organization_id = v_organization_id
              and arr.activity_id = p_activity_id
              and (
                  select count(*)
                  from unnest(p_resource_ids) selected_id
                  join public.resources r
                    on r.id = selected_id
                   and r.organization_id = v_organization_id
                   and r.active = true
                  where r.resource_type_id = arr.resource_type_id
              ) < arr.quantity
        ) then
            raise exception 'Required resources were not selected';
        end if;
    end if;

    foreach v_resource_id in array p_resource_ids loop
        if not exists (
            select 1 from public.resources r
            where r.id = v_resource_id
              and r.organization_id = v_organization_id
              and r.active = true
        ) then
            raise exception 'Resource not found or inactive';
        end if;

        perform pg_advisory_xact_lock(hashtextextended(v_resource_id::text, 0));

        if exists (
            select 1 from public.appointment_resources ar
            where ar.organization_id = v_organization_id
              and ar.resource_id = v_resource_id
              and ar.status = 'SCHEDULED'
              and tstzrange(ar.starts_at, ar.ends_at, '[)') &&
                  tstzrange(p_starts_at, p_ends_at, '[)')
        ) then
            raise exception 'Resource is not available';
        end if;
    end loop;

    insert into public.appointments (
        organization_id,
        customer_id,
        customer_subscription_id,
        activity_id,
        professional_id,
        starts_at,
        ends_at,
        status,
        source
    ) values (
        v_organization_id,
        p_customer_id,
        p_customer_subscription_id,
        p_activity_id,
        p_professional_id,
        p_starts_at,
        p_ends_at,
        'SCHEDULED',
        p_source
    ) returning id into v_appointment_id;

    foreach v_resource_id in array p_resource_ids loop
        insert into public.appointment_resources (
            organization_id,
            appointment_id,
            resource_id,
            starts_at,
            ends_at,
            status
        ) values (
            v_organization_id,
            v_appointment_id,
            v_resource_id,
            p_starts_at,
            p_ends_at,
            'SCHEDULED'
        );
    end loop;

    return v_appointment_id;
end;
$$;

-- ============================================================
-- 12. CANCELLATION SYNC
-- ============================================================

create or replace function public.sync_appointment_resource_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.appointment_resources ar
    set
        status = new.status,
        starts_at = new.starts_at,
        ends_at = new.ends_at
    where ar.appointment_id = new.id
      and ar.organization_id = new.organization_id;
    return new;
end;
$$;

drop trigger if exists appointments_sync_resource_status on public.appointments;
create trigger appointments_sync_resource_status
after update of status, starts_at, ends_at on public.appointments
for each row execute function public.sync_appointment_resource_status();

-- ============================================================
-- 13. ROLLING RECURRENCE GENERATOR
-- ============================================================

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
    select * into r
    from public.schedule_rules sr
    where sr.id = p_schedule_rule_id;

    if r.id is null or r.status <> 'ACTIVE' then
        return 0;
    end if;

    -- Direct authenticated calls are tenant/role protected. Database-internal
    -- execution (for example pg_cron) has auth.uid() = null and is allowed.
    if auth.uid() is not null and not public.is_organization_manager(r.organization_id) then
        raise exception 'Forbidden';
    end if;

    select s.generation_window_days
    into v_window_days
    from public.organization_scheduling_settings s
    where s.organization_id = r.organization_id;

    v_target_end := coalesce(p_window_end, current_date + coalesce(v_window_days, 90));
    if r.effective_until is not null then
        v_target_end := least(v_target_end, r.effective_until);
    end if;

    select least(v_target_end, cs.ends_at)
    into v_target_end
    from public.customer_subscriptions cs
    where cs.id = r.customer_subscription_id
      and cs.ends_at is not null;

    if v_target_end is null then
        v_target_end := coalesce(p_window_end, current_date + coalesce(v_window_days, 90));
        if r.effective_until is not null then
            v_target_end := least(v_target_end, r.effective_until);
        end if;
    end if;

    v_date := greatest(r.effective_from, current_date);

    while v_date <= v_target_end loop
        if extract(dow from v_date)::smallint = r.weekday then
            v_start := ((v_date::text || ' ' || r.start_time::text)::timestamp at time zone r.timezone);
            v_end := ((v_date::text || ' ' || r.end_time::text)::timestamp at time zone r.timezone);

            begin
                insert into public.appointments (
                    organization_id,
                    schedule_rule_id,
                    customer_id,
                    customer_subscription_id,
                    activity_id,
                    professional_id,
                    starts_at,
                    ends_at,
                    status,
                    source
                ) values (
                    r.organization_id,
                    r.id,
                    r.customer_id,
                    r.customer_subscription_id,
                    r.activity_id,
                    r.professional_id,
                    v_start,
                    v_end,
                    'SCHEDULED',
                    'RECURRENCE'
                )
                on conflict (schedule_rule_id, starts_at) where schedule_rule_id is not null
                do nothing
                returning id into v_appointment_id;

                if v_appointment_id is not null then
                    for v_resource_id in
                        select srr.resource_id
                        from public.schedule_rule_resources srr
                        where srr.schedule_rule_id = r.id
                    loop
                        insert into public.appointment_resources (
                            organization_id,
                            appointment_id,
                            resource_id,
                            starts_at,
                            ends_at,
                            status
                        ) values (
                            r.organization_id,
                            v_appointment_id,
                            v_resource_id,
                            v_start,
                            v_end,
                            'SCHEDULED'
                        );
                    end loop;

                    update public.schedule_generation_conflicts sgc
                    set resolved_at = now()
                    where sgc.schedule_rule_id = r.id
                      and sgc.starts_at = v_start
                      and sgc.resolved_at is null;

                    v_inserted := v_inserted + 1;
                end if;
            exception
                when exclusion_violation then
                    -- A conflicting professional/resource reservation exists.
                    -- Persist the skipped occurrence so it is visible to the OWNER.
                    insert into public.schedule_generation_conflicts (
                        organization_id,
                        schedule_rule_id,
                        starts_at,
                        ends_at,
                        reason,
                        resolved_at
                    ) values (
                        r.organization_id,
                        r.id,
                        v_start,
                        v_end,
                        'CAPACITY_CONFLICT',
                        null
                    )
                    on conflict (schedule_rule_id, starts_at)
                    do update set
                        ends_at = excluded.ends_at,
                        reason = excluded.reason,
                        resolved_at = null;
            end;
        end if;
        v_date := v_date + 1;
    end loop;

    return v_inserted;
end;
$$;

create or replace function public.refresh_scheduling_window()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_rule record;
    v_total integer := 0;
begin
    for v_rule in
        select sr.id
        from public.schedule_rules sr
        join public.customer_subscriptions cs on cs.id = sr.customer_subscription_id
        join public.customers c on c.id = sr.customer_id and c.organization_id = sr.organization_id
        where sr.status = 'ACTIVE'
          and cs.status = 'ACTIVE'
          and c.active = true
    loop
        v_total := v_total + public.generate_schedule_rule_appointments(v_rule.id, null);
    end loop;

    -- ONE_TIME commercial agreements automatically close after their final
    -- scheduled appointment has finished and no future scheduled occurrence exists.
    update public.customer_subscriptions cs
    set status = 'ENDED',
        ends_at = greatest(current_date, cs.starts_at)
    where cs.status = 'ACTIVE'
      and cs.billing_cycle = 'ONE_TIME'
      and exists (
          select 1
          from public.appointments ap
          where ap.customer_subscription_id = cs.id
            and ap.ends_at <= now()
      )
      and not exists (
          select 1
          from public.appointments ap
          where ap.customer_subscription_id = cs.id
            and ap.status = 'SCHEDULED'
            and ap.ends_at > now()
      );

    return v_total;
end;
$$;

-- Generate immediately after a new active rule is inserted.
create or replace function public.generate_appointments_after_rule_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.status = 'ACTIVE' then
        perform public.generate_schedule_rule_appointments(new.id, null);
    end if;
    return new;
end;
$$;

drop trigger if exists schedule_rules_generate_after_insert on public.schedule_rules;
create trigger schedule_rules_generate_after_insert
after insert on public.schedule_rules
for each row execute function public.generate_appointments_after_rule_insert();

-- ============================================================
-- 13B. SAFE REACTIVATION OF FUTURE CANCELLED OCCURRENCES
-- ============================================================

create or replace function public.reactivate_subscription_pause_appointments(
    p_subscription_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_appointment record;
    v_count integer := 0;
begin
    for v_appointment in
        select ap.id
        from public.appointments ap
        where ap.customer_subscription_id = p_subscription_id
          and ap.status = 'CANCELLED'
          and ap.starts_at >= now()
          and ap.cancellation_reason = 'SUBSCRIPTION_PAUSED'
        order by ap.starts_at
    loop
        begin
            update public.appointments ap
            set status = 'SCHEDULED',
                cancelled_at = null,
                cancellation_reason = null
            where ap.id = v_appointment.id;
            v_count := v_count + 1;
        exception
            when exclusion_violation then
                -- Another booking may have occupied the professional/resource
                -- while this subscription was paused. Keep this occurrence
                -- cancelled instead of overbooking.
                null;
        end;
    end loop;

    return v_count;
end;
$$;

create or replace function public.reactivate_rule_pause_appointments(
    p_schedule_rule_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_appointment record;
    v_count integer := 0;
begin
    for v_appointment in
        select ap.id
        from public.appointments ap
        where ap.schedule_rule_id = p_schedule_rule_id
          and ap.status = 'CANCELLED'
          and ap.starts_at >= now()
          and ap.cancellation_reason = 'RULE_PAUSED'
        order by ap.starts_at
    loop
        begin
            update public.appointments ap
            set status = 'SCHEDULED',
                cancelled_at = null,
                cancellation_reason = null
            where ap.id = v_appointment.id;
            v_count := v_count + 1;
        exception
            when exclusion_violation then
                null;
        end;
    end loop;

    return v_count;
end;
$$;

-- ============================================================
-- 14. SUBSCRIPTION LIFECYCLE INTEGRATION
-- ============================================================

create or replace function public.sync_scheduling_from_subscription_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.status = 'PAUSED' and old.status is distinct from new.status then
        update public.schedule_rules sr
        set status = 'PAUSED'
        where sr.customer_subscription_id = new.id
          and sr.status = 'ACTIVE';

        update public.appointments ap
        set status = 'CANCELLED',
            cancelled_at = now(),
            cancellation_reason = 'SUBSCRIPTION_PAUSED'
        where ap.customer_subscription_id = new.id
          and ap.status = 'SCHEDULED'
          and ap.starts_at >= now();

    elsif new.status = 'ACTIVE' and old.status = 'PAUSED' then
        update public.schedule_rules sr
        set status = 'ACTIVE'
        where sr.customer_subscription_id = new.id
          and sr.status = 'PAUSED';

        perform public.reactivate_subscription_pause_appointments(new.id);

        perform public.generate_schedule_rule_appointments(sr.id, null)
        from public.schedule_rules sr
        where sr.customer_subscription_id = new.id
          and sr.status = 'ACTIVE';

    elsif new.status = 'ENDED' and old.status is distinct from new.status then
        update public.schedule_rules sr
        set status = 'ENDED',
            effective_until = coalesce(sr.effective_until, greatest(current_date, sr.effective_from))
        where sr.customer_subscription_id = new.id
          and sr.status <> 'ENDED';

        update public.appointments ap
        set status = 'CANCELLED',
            cancelled_at = now(),
            cancellation_reason = 'SUBSCRIPTION_ENDED'
        where ap.customer_subscription_id = new.id
          and ap.status = 'SCHEDULED'
          and ap.starts_at >= now();
    end if;

    return new;
end;
$$;

drop trigger if exists customer_subscriptions_sync_scheduling on public.customer_subscriptions;
create trigger customer_subscriptions_sync_scheduling
after update of status on public.customer_subscriptions
for each row execute function public.sync_scheduling_from_subscription_status();

-- ============================================================
-- 15. EXTEND CUSTOMER DEACTIVATION RPC ATOMICALLY
-- ============================================================

create or replace function public.set_customer_active_status(
    p_customer_id uuid,
    p_active boolean
)
returns table (
    active boolean,
    ended_subscriptions integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_organization_id uuid;
    v_ended_subscriptions integer := 0;
begin
    if auth.uid() is null then
        raise exception 'User is not authenticated';
    end if;

    select c.organization_id
    into v_organization_id
    from public.customers c
    where c.id = p_customer_id;

    if v_organization_id is null then
        raise exception 'Customer not found';
    end if;

    if not public.is_organization_manager(v_organization_id) then
        raise exception 'User is not allowed to change customer status';
    end if;

    if p_active = false then
        update public.customer_subscriptions cs
        set status = 'ENDED'::public.subscription_status,
            ends_at = greatest(current_date, cs.starts_at)
        where cs.organization_id = v_organization_id
          and cs.customer_id = p_customer_id
          and cs.status in ('ACTIVE', 'PAUSED');

        get diagnostics v_ended_subscriptions = row_count;

        -- Defensive update; subscription trigger already performs this,
        -- but keeping it here makes the customer lifecycle invariant explicit.
        update public.schedule_rules sr
        set status = 'ENDED',
            effective_until = coalesce(sr.effective_until, greatest(current_date, sr.effective_from))
        where sr.organization_id = v_organization_id
          and sr.customer_id = p_customer_id
          and sr.status <> 'ENDED';

        update public.appointments ap
        set status = 'CANCELLED',
            cancelled_at = now(),
            cancellation_reason = 'CUSTOMER_DEACTIVATED'
        where ap.organization_id = v_organization_id
          and ap.customer_id = p_customer_id
          and ap.status = 'SCHEDULED'
          and ap.starts_at >= now();
    end if;

    update public.customers c
    set active = p_active
    where c.id = p_customer_id
      and c.organization_id = v_organization_id;

    return query select p_active, v_ended_subscriptions;
end;
$$;

-- ============================================================
-- 15A. SCHEDULE RULE STATUS RPC
-- ============================================================

create or replace function public.set_schedule_rule_status(
    p_schedule_rule_id uuid,
    p_status public.schedule_rule_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    r public.schedule_rules%rowtype;
begin
    select * into r
    from public.schedule_rules sr
    where sr.id = p_schedule_rule_id;

    if r.id is null then
        raise exception 'Schedule rule not found';
    end if;

    if not public.is_organization_manager(r.organization_id) then
        raise exception 'Forbidden';
    end if;

    if r.status = 'ENDED' then
        raise exception 'Ended schedule rules are immutable';
    end if;

    if p_status = 'PAUSED' then
        update public.schedule_rules
        set status = 'PAUSED'
        where id = r.id;

        update public.appointments
        set status = 'CANCELLED',
            cancelled_at = now(),
            cancellation_reason = 'RULE_PAUSED'
        where schedule_rule_id = r.id
          and status = 'SCHEDULED'
          and starts_at >= now();

    elsif p_status = 'ACTIVE' then
        update public.schedule_rules
        set status = 'ACTIVE'
        where id = r.id;

        perform public.reactivate_rule_pause_appointments(r.id);
        perform public.generate_schedule_rule_appointments(r.id, null);

    elsif p_status = 'ENDED' then
        update public.schedule_rules
        set status = 'ENDED',
            effective_until = coalesce(effective_until, greatest(current_date, effective_from))
        where id = r.id;

        update public.appointments
        set status = 'CANCELLED',
            cancelled_at = now(),
            cancellation_reason = 'RULE_ENDED'
        where schedule_rule_id = r.id
          and status = 'SCHEDULED'
          and starts_at >= now();
    end if;
end;
$$;

-- ============================================================
-- 15B. TENANT-SCOPED MANUAL WINDOW REFRESH
-- ============================================================

create or replace function public.refresh_organization_scheduling_window(
    p_organization_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_rule record;
    v_total integer := 0;
begin
    if not public.is_organization_manager(p_organization_id) then
        raise exception 'Forbidden';
    end if;

    for v_rule in
        select sr.id
        from public.schedule_rules sr
        join public.customer_subscriptions cs on cs.id = sr.customer_subscription_id
        join public.customers c on c.id = sr.customer_id and c.organization_id = sr.organization_id
        where sr.organization_id = p_organization_id
          and sr.status = 'ACTIVE'
          and cs.status = 'ACTIVE'
          and c.active = true
    loop
        v_total := v_total + public.generate_schedule_rule_appointments(v_rule.id, null);
    end loop;

    update public.customer_subscriptions cs
    set status = 'ENDED',
        ends_at = greatest(current_date, cs.starts_at)
    where cs.organization_id = p_organization_id
      and cs.status = 'ACTIVE'
      and cs.billing_cycle = 'ONE_TIME'
      and exists (
          select 1 from public.appointments ap
          where ap.customer_subscription_id = cs.id
            and ap.ends_at <= now()
      )
      and not exists (
          select 1 from public.appointments ap
          where ap.customer_subscription_id = cs.id
            and ap.status = 'SCHEDULED'
            and ap.ends_at > now()
      );

    return v_total;
end;
$$;

-- ============================================================
-- 16. FUNCTION SECURITY
-- ============================================================

revoke all on function public.get_scheduling_availability(uuid,timestamptz,timestamptz,uuid) from public, anon;
grant execute on function public.get_scheduling_availability(uuid,timestamptz,timestamptz,uuid) to authenticated;

revoke all on function public.create_scheduling_appointment(uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid[],public.appointment_source) from public, anon;
grant execute on function public.create_scheduling_appointment(uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid[],public.appointment_source) to authenticated;

revoke all on function public.generate_schedule_rule_appointments(uuid,date) from public, anon;
grant execute on function public.generate_schedule_rule_appointments(uuid,date) to authenticated;

revoke all on function public.refresh_scheduling_window() from public, anon, authenticated;

revoke all on function public.refresh_organization_scheduling_window(uuid) from public, anon;
grant execute on function public.refresh_organization_scheduling_window(uuid) to authenticated;

revoke all on function public.set_schedule_rule_status(uuid,public.schedule_rule_status) from public, anon;
grant execute on function public.set_schedule_rule_status(uuid,public.schedule_rule_status) to authenticated;

-- ============================================================
-- 17. GRANTS
-- ============================================================

grant select, update on public.organization_scheduling_settings to authenticated;
grant select, insert, update, delete on public.resource_types to authenticated;
grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.activity_resource_requirements to authenticated;
grant select, insert, update, delete on public.professional_activities to authenticated;
grant select, insert, update, delete on public.schedule_rules to authenticated;
grant select, insert, update, delete on public.schedule_rule_resources to authenticated;
grant select on public.schedule_generation_conflicts to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select, insert, update, delete on public.appointment_resources to authenticated;

-- ============================================================
-- 18. OPTIONAL PG_CRON JOB
--
-- Supabase hosted projects support pg_cron. This block is safe on
-- environments where the extension is available. If it is not available,
-- call refresh_scheduling_window() once per day from your infrastructure.
-- ============================================================

do $$
begin
    begin
        create extension if not exists pg_cron;
        if not exists (select 1 from cron.job where jobname = 'courtly-refresh-scheduling-window') then
            perform cron.schedule(
                'courtly-refresh-scheduling-window',
                '15 3 * * *',
                'select public.refresh_scheduling_window();'
            );
        end if;
    exception
        when others then
            raise notice 'pg_cron was not configured automatically: %', sqlerrm;
    end;
end $$;

-- ============================================================
-- 19. ATOMIC SCHEDULE RULE CREATION
--
-- The generic AFTER INSERT trigger is removed because resource
-- allocations must be attached before occurrences are generated.
-- ============================================================

drop trigger if exists schedule_rules_generate_after_insert on public.schedule_rules;

create or replace function public.create_scheduling_rule(
    p_customer_subscription_id uuid,
    p_weekday smallint,
    p_start_time time,
    p_end_time time,
    p_effective_from date,
    p_effective_until date default null,
    p_professional_id uuid default null,
    p_resource_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_subscription public.customer_subscriptions%rowtype;
    v_activity public.activities%rowtype;
    v_timezone text;
    v_rule_id uuid;
    v_resource_id uuid;
    v_required_total integer := 0;
    v_selected_required integer := 0;
begin
    select * into v_subscription
    from public.customer_subscriptions cs
    where cs.id = p_customer_subscription_id;

    if v_subscription.id is null then
        raise exception 'Subscription not found';
    end if;

    if not public.is_organization_manager(v_subscription.organization_id) then
        raise exception 'Forbidden';
    end if;

    if v_subscription.status <> 'ACTIVE' then
        raise exception 'Only active subscriptions can be scheduled';
    end if;

    select * into v_activity
    from public.activities a
    where a.id = v_subscription.activity_id
      and a.organization_id = v_subscription.organization_id
      and a.active = true;

    if v_activity.id is null or v_activity.scheduling_mode = 'NONE' then
        raise exception 'Service does not support scheduling';
    end if;

    if p_weekday not between 0 and 6 or p_end_time <= p_start_time then
        raise exception 'Invalid recurrence';
    end if;

    if p_effective_until is not null and p_effective_until < p_effective_from then
        raise exception 'Invalid recurrence period';
    end if;

    if v_activity.professional_requirement = 'REQUIRED' and p_professional_id is null then
        raise exception 'Professional is required';
    end if;

    if p_professional_id is not null then
        if not exists (
            select 1
            from public.professionals p
            where p.id = p_professional_id
              and p.organization_id = v_subscription.organization_id
              and p.active = true
        ) then
            raise exception 'Professional not found or inactive';
        end if;

        if v_activity.professional_requirement = 'REQUIRED'
           and not exists (
               select 1 from public.professional_activities pa
               where pa.organization_id = v_subscription.organization_id
                 and pa.professional_id = p_professional_id
                 and pa.activity_id = v_activity.id
           ) then
            raise exception 'Professional is not qualified for this service';
        end if;
    end if;

    select coalesce(sum(arr.quantity), 0)
    into v_required_total
    from public.activity_resource_requirements arr
    where arr.organization_id = v_subscription.organization_id
      and arr.activity_id = v_activity.id;

    if v_activity.resource_requirement = 'REQUIRED' and v_required_total = 0 then
        raise exception 'Resource requirement is not configured';
    end if;

    if v_activity.resource_requirement = 'REQUIRED' and v_required_total > 0 then
        if exists (
            select 1
            from public.activity_resource_requirements arr
            where arr.organization_id = v_subscription.organization_id
              and arr.activity_id = v_activity.id
              and (
                  select count(*)
                  from unnest(p_resource_ids) selected_id
                  join public.resources r
                    on r.id = selected_id
                   and r.organization_id = v_subscription.organization_id
                   and r.active = true
                  where r.resource_type_id = arr.resource_type_id
              ) < arr.quantity
        ) then
            raise exception 'Required resources were not selected';
        end if;
    end if;

    select o.timezone into v_timezone
    from public.organizations o
    where o.id = v_subscription.organization_id;

    insert into public.schedule_rules (
        organization_id,
        customer_id,
        customer_subscription_id,
        activity_id,
        professional_id,
        recurrence_type,
        weekday,
        start_time,
        end_time,
        effective_from,
        effective_until,
        timezone,
        status
    ) values (
        v_subscription.organization_id,
        v_subscription.customer_id,
        v_subscription.id,
        v_subscription.activity_id,
        p_professional_id,
        'WEEKLY',
        p_weekday,
        p_start_time,
        p_end_time,
        p_effective_from,
        p_effective_until,
        coalesce(v_timezone, 'America/Sao_Paulo'),
        'ACTIVE'
    ) returning id into v_rule_id;

    foreach v_resource_id in array p_resource_ids loop
        if not exists (
            select 1 from public.resources r
            where r.id = v_resource_id
              and r.organization_id = v_subscription.organization_id
              and r.active = true
        ) then
            raise exception 'Resource not found or inactive';
        end if;

        insert into public.schedule_rule_resources (
            organization_id,
            schedule_rule_id,
            resource_id
        ) values (
            v_subscription.organization_id,
            v_rule_id,
            v_resource_id
        );
    end loop;

    perform public.generate_schedule_rule_appointments(v_rule_id, null);

    return v_rule_id;
end;
$$;

revoke all on function public.create_scheduling_rule(uuid,smallint,time,time,date,date,uuid,uuid[]) from public, anon;
grant execute on function public.create_scheduling_rule(uuid,smallint,time,time,date,date,uuid,uuid[]) to authenticated;
