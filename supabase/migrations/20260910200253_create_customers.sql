create table public.customers (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    name text not null,

    email text,

    phone text,

    birth_date date,

    notes text,

    active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint customers_name_not_blank
        check (length(trim(name)) > 0)
);


-- =========================================================
-- INDEXES
-- =========================================================

create index customers_organization_id_idx
    on public.customers(organization_id);

create index customers_organization_active_idx
    on public.customers(organization_id, active);

create index customers_organization_name_idx
    on public.customers(organization_id, name);


-- =========================================================
-- UPDATED_AT
-- =========================================================

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


create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.customers enable row level security;


-- SELECT
create policy "Members can view organization customers"
on public.customers
for select
to authenticated
using (
    exists (
        select 1
        from public.memberships m
        where m.organization_id = customers.organization_id
          and m.user_id = auth.uid()
    )
);


-- INSERT
create policy "Members can create organization customers"
on public.customers
for insert
to authenticated
with check (
    exists (
        select 1
        from public.memberships m
        where m.organization_id = customers.organization_id
          and m.user_id = auth.uid()
    )
);


-- UPDATE
create policy "Members can update organization customers"
on public.customers
for update
to authenticated
using (
    exists (
        select 1
        from public.memberships m
        where m.organization_id = customers.organization_id
          and m.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.memberships m
        where m.organization_id = customers.organization_id
          and m.user_id = auth.uid()
    )
);


-- =========================================================
-- PERMISSIONS
-- =========================================================

grant select, insert, update
on table public.customers
to authenticated;