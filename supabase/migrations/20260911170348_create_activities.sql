-- ============================================================
-- RF-04 - Activities / Services
-- ============================================================

create table if not exists public.activities (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    name varchar(120) not null,

    description text,

    -- Default used when scheduling a service.
    -- It does NOT determine the price.
    default_duration_minutes integer not null,

    -- Commercial reference only.
    -- It can later be overridden per customer/service/appointment.
    default_price numeric(12, 2),

    active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint activities_name_not_blank
        check (length(trim(name)) > 0),

    constraint activities_duration_positive
        check (default_duration_minutes > 0),

    constraint activities_price_non_negative
        check (
            default_price is null
            or default_price >= 0
        )
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_activities_organization_id
    on public.activities(organization_id);

create index if not exists idx_activities_organization_active
    on public.activities(
        organization_id,
        active
    );

-- Avoid duplicate service names inside the same organization.
-- "Tênis", "TÊNIS" and "tênis" are considered the same service.
create unique index if not exists uq_activities_organization_name
    on public.activities(
        organization_id,
        lower(trim(name))
    );

-- ============================================================
-- UPDATED_AT
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_activities_updated_at
on public.activities;

create trigger set_activities_updated_at
before update
on public.activities
for each row
execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.activities enable row level security;

-- Members of the organization can see the services.
create policy "organization members can view activities"
on public.activities
for select
to authenticated
using (
    exists (
        select 1
        from public.memberships m
        where m.organization_id = activities.organization_id
          and m.user_id = auth.uid()
    )
);

-- Owner/Admin can create services.
create policy "organization managers can create activities"
on public.activities
for insert
to authenticated
with check (
    exists (
        select 1
        from public.memberships m
        where m.organization_id = activities.organization_id
          and m.user_id = auth.uid()
          and lower(m.role::text) in ('owner', 'admin')
    )
);

-- Owner/Admin can update services.
create policy "organization managers can update activities"
on public.activities
for update
to authenticated
using (
    exists (
        select 1
        from public.memberships m
        where m.organization_id = activities.organization_id
          and m.user_id = auth.uid()
          and lower(m.role::text) in ('owner', 'admin')
    )
)
with check (
    exists (
        select 1
        from public.memberships m
        where m.organization_id = activities.organization_id
          and m.user_id = auth.uid()
          and lower(m.role::text) in ('owner', 'admin')
    )
);

-- INTENTIONALLY NO DELETE POLICY.
--
-- Activities must be deactivated instead of physically deleted,
-- preserving historical references for future appointments,
-- subscriptions, payments and attendance.