-- ============================================================
-- COURTLY
-- Migration 001 - Identity and Tenant Foundation
--
-- Purpose:
-- Creates the initial multi-tenant foundation of Courtly.
--
-- Main concepts:
--   Organization  -> company, academy, club or independent business
--   Membership    -> relationship between a user and an organization
--   Professional  -> professional who provides services/classes
--
-- Authentication is managed by Supabase through auth.users.
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

-- Allows PostgreSQL to generate UUIDs using gen_random_uuid().
create extension if not exists pgcrypto;


-- ============================================================
-- 2. ENUMS
-- ============================================================

-- Defines the roles a user can have inside an organization.
create type public.organization_role as enum (
    'OWNER',
    'ADMIN',
    'PROFESSIONAL'
);


-- Defines the lifecycle of an organization.
create type public.organization_status as enum (
    'ACTIVE',
    'INACTIVE'
);


-- ============================================================
-- 3. ORGANIZATIONS
-- ============================================================

create table public.organizations (

    id uuid primary key default gen_random_uuid(),

    name varchar(150) not null,

    slug varchar(150) not null unique,

    timezone varchar(100) not null default 'America/Sao_Paulo',

    status public.organization_status
        not null
        default 'ACTIVE',

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),

    constraint organizations_name_not_blank
        check (length(trim(name)) > 0),

    constraint organizations_slug_not_blank
        check (length(trim(slug)) > 0)
);


-- ============================================================
-- 4. MEMBERSHIPS
-- ============================================================

create table public.memberships (

    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    role public.organization_role
        not null
        default 'PROFESSIONAL',

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),

    constraint memberships_user_organization_unique
        unique (organization_id, user_id)
);


-- ============================================================
-- 5. PROFESSIONALS
-- ============================================================

create table public.professionals (

    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    -- Nullable intentionally.
    --
    -- A professional may exist before receiving access
    -- to the Courtly application.
    user_id uuid
        references auth.users(id)
        on delete set null,

    name varchar(150) not null,

    email varchar(255),

    phone varchar(30),

    active boolean
        not null
        default true,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),

    constraint professionals_name_not_blank
        check (length(trim(name)) > 0),

    constraint professionals_user_organization_unique
        unique (organization_id, user_id)
);


-- ============================================================
-- 6. INDEXES
-- ============================================================

create index idx_memberships_user_id
    on public.memberships(user_id);

create index idx_memberships_organization_id
    on public.memberships(organization_id);

create index idx_professionals_organization_id
    on public.professionals(organization_id);

create index idx_professionals_user_id
    on public.professionals(user_id);


-- ============================================================
-- 7. UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin

    new.updated_at = now();

    return new;

end;
$$;


-- ============================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();


create trigger memberships_set_updated_at
before update on public.memberships
for each row
execute function public.set_updated_at();


create trigger professionals_set_updated_at
before update on public.professionals
for each row
execute function public.set_updated_at();


-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

alter table public.organizations
enable row level security;

alter table public.memberships
enable row level security;

alter table public.professionals
enable row level security;


-- ============================================================
-- 10. SECURITY HELPER
-- ============================================================

-- Returns true when the authenticated user belongs
-- to the specified organization.
--
-- SECURITY DEFINER is intentional here so RLS policies can
-- evaluate membership without recursively triggering the
-- memberships RLS policy itself.

create or replace function public.is_organization_member(
    target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.memberships m
        where m.organization_id = target_organization_id
          and m.user_id = auth.uid()
    );
$$;


-- ============================================================
-- 11. RLS - ORGANIZATIONS
-- ============================================================

create policy "members_can_read_organization"
on public.organizations
for select
to authenticated
using (
    public.is_organization_member(id)
);


-- ============================================================
-- 12. RLS - MEMBERSHIPS
-- ============================================================

create policy "members_can_read_memberships"
on public.memberships
for select
to authenticated
using (
    public.is_organization_member(organization_id)
);


-- ============================================================
-- 13. RLS - PROFESSIONALS
-- ============================================================

create policy "members_can_read_professionals"
on public.professionals
for select
to authenticated
using (
    public.is_organization_member(organization_id)
);