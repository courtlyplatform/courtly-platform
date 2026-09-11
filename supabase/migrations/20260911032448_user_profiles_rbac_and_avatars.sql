-- ============================================================
-- COURTLY
-- Profiles + RBAC preparation + customer auth + avatars
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- ============================================================

create table if not exists public.profiles (
    user_id uuid primary key
        references auth.users(id)
        on delete cascade,

    full_name text,
    phone text,
    avatar_path text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


alter table public.profiles
enable row level security;


drop policy if exists
    "Users can view own profile"
    on public.profiles;

create policy
    "Users can view own profile"
on public.profiles
for select
to authenticated
using (
    auth.uid() = user_id
);


drop policy if exists
    "Users can update own profile"
    on public.profiles;

create policy
    "Users can update own profile"
on public.profiles
for update
to authenticated
using (
    auth.uid() = user_id
)
with check (
    auth.uid() = user_id
);


drop policy if exists
    "Users can insert own profile"
    on public.profiles;

create policy
    "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (
    auth.uid() = user_id
);


-- ============================================================
-- 2. AUTOMATIC PROFILE CREATION
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (
        user_id,
        full_name
    )
    values (
        new.id,
        nullif(
            trim(
                coalesce(
                    new.raw_user_meta_data ->> 'full_name',
                    ''
                )
            ),
            ''
        )
    )
    on conflict (user_id) do nothing;

    return new;
end;
$$;


drop trigger if exists
    on_auth_user_created
    on auth.users;

create trigger
    on_auth_user_created
after insert
on auth.users
for each row
execute function public.handle_new_user();


-- ============================================================
-- 3. BACKFILL EXISTING USERS
-- ============================================================

insert into public.profiles (
    user_id,
    full_name
)
select
    id,
    nullif(
        trim(
            coalesce(
                raw_user_meta_data ->> 'full_name',
                ''
            )
        ),
        ''
    )
from auth.users
on conflict (user_id) do nothing;


-- ============================================================
-- 4. CUSTOMER ↔ AUTH USER
-- Future student portal.
-- ============================================================

alter table public.customers
add column if not exists user_id uuid
references auth.users(id)
on delete set null;


create unique index if not exists
    customers_user_id_unique
on public.customers(user_id)
where user_id is not null;


-- ============================================================
-- 5. MEMBERSHIP ROLES
--
-- The memberships.role column already uses the PostgreSQL
-- enum public.organization_role.
--
-- OWNER        = organization owner
-- ADMIN        = delegated administrator
-- PROFESSIONAL = teacher/provider
-- CUSTOMER     = student/client
-- ============================================================

alter type public.organization_role
add value if not exists 'CUSTOMER';


-- ============================================================
-- 6. PREVENT DIRECT ROLE ESCALATION
--
-- A browser/client cannot INSERT/UPDATE/DELETE memberships.
-- Controlled SECURITY DEFINER RPCs are responsible for that.
-- ============================================================

revoke insert, update, delete
on public.memberships
from anon, authenticated;


-- ============================================================
-- 7. AVATARS BUCKET
-- Public read; write remains protected by RLS.
-- ============================================================

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'avatars',
    'avatars',
    true,
    5242880,
    array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)
on conflict (id)
do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- 8. AVATAR STORAGE RLS
--
-- File structure:
-- avatars/{user_id}/avatar.ext
-- ============================================================

drop policy if exists
    "Users can upload own avatar"
    on storage.objects;

create policy
    "Users can upload own avatar"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'avatars'
    and
    (storage.foldername(name))[1]
        = auth.uid()::text
);


drop policy if exists
    "Users can update own avatar"
    on storage.objects;

create policy
    "Users can update own avatar"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'avatars'
    and
    (storage.foldername(name))[1]
        = auth.uid()::text
)
with check (
    bucket_id = 'avatars'
    and
    (storage.foldername(name))[1]
        = auth.uid()::text
);


drop policy if exists
    "Users can delete own avatar"
    on storage.objects;

create policy
    "Users can delete own avatar"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'avatars'
    and
    (storage.foldername(name))[1]
        = auth.uid()::text
);