-- ============================================================
-- COURTLY
-- Customer Commercial - Customer Subscriptions
--
-- Purpose:
-- Creates the commercial relationship between customers
-- and activities/services.
--
-- Commercial terms are intentionally stored on the
-- subscription so historical contracts remain unchanged when:
--
--   - activity.default_price changes;
--   - organization.default_currency changes;
--   - the service is deactivated.
-- ============================================================


-- ============================================================
-- 1. BILLING CYCLE
-- ============================================================

create type public.subscription_billing_cycle as enum (
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'SEMIANNUAL',
    'ANNUAL',
    'ONE_TIME'
);


-- ============================================================
-- 2. SUBSCRIPTION STATUS
-- ============================================================

create type public.subscription_status as enum (
    'ACTIVE',
    'PAUSED',
    'ENDED'
);


-- ============================================================
-- 3. TENANT-SAFE PARENT KEYS
--
-- Required so customer_subscriptions can reference:
--
--     customer + organization
--     activity + organization
--
-- This makes cross-organization relationships impossible
-- even if application code contains a bug.
-- ============================================================

alter table public.customers
add constraint customers_id_organization_unique
unique (
    id,
    organization_id
);


alter table public.activities
add constraint activities_id_organization_unique
unique (
    id,
    organization_id
);


-- ============================================================
-- 4. CUSTOMER SUBSCRIPTIONS
-- ============================================================

create table public.customer_subscriptions (

    id uuid
        primary key
        default gen_random_uuid(),

    organization_id uuid
        not null,

    customer_id uuid
        not null,

    activity_id uuid
        not null,

    amount numeric(12, 2)
        not null,

    currency_code public.organization_currency
        not null,

    billing_cycle public.subscription_billing_cycle
        not null,

    status public.subscription_status
        not null
        default 'ACTIVE',

    starts_at date
        not null
        default current_date,

    ends_at date,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),


    -- --------------------------------------------------------
    -- TENANT-SAFE CUSTOMER
    -- --------------------------------------------------------

    constraint fk_customer_subscriptions_customer
        foreign key (
            customer_id,
            organization_id
        )
        references public.customers (
            id,
            organization_id
        )
        on delete cascade,


    -- --------------------------------------------------------
    -- TENANT-SAFE ACTIVITY
    --
    -- Commercial history must prevent removing a referenced
    -- service.
    -- --------------------------------------------------------

    constraint fk_customer_subscriptions_activity
        foreign key (
            activity_id,
            organization_id
        )
        references public.activities (
            id,
            organization_id
        )
        on delete restrict,


    -- --------------------------------------------------------
    -- COMMERCIAL VALIDATION
    -- --------------------------------------------------------

    constraint customer_subscriptions_amount_non_negative
        check (
            amount >= 0
        ),

    constraint customer_subscriptions_valid_period
        check (
            ends_at is null
            or ends_at >= starts_at
        ),


    -- --------------------------------------------------------
    -- STATUS / END-DATE CONSISTENCY
    --
    -- ACTIVE/PAUSED subscriptions are still open.
    -- ENDED subscriptions must have an end date.
    -- --------------------------------------------------------

    constraint customer_subscriptions_status_end_date
        check (
            (
                status = 'ENDED'
                and ends_at is not null
            )
            or
            (
                status in ('ACTIVE', 'PAUSED')
                and ends_at is null
            )
        )
);


-- ============================================================
-- 5. INDEXES
-- ============================================================

create index idx_customer_subscriptions_organization
    on public.customer_subscriptions (
        organization_id
    );


create index idx_customer_subscriptions_customer
    on public.customer_subscriptions (
        customer_id
    );


create index idx_customer_subscriptions_activity
    on public.customer_subscriptions (
        activity_id
    );


create index idx_customer_subscriptions_organization_status
    on public.customer_subscriptions (
        organization_id,
        status
    );


create index idx_customer_subscriptions_customer_status
    on public.customer_subscriptions (
        customer_id,
        status
    );


-- ============================================================
-- 6. ONE OPEN CONTRACT PER CUSTOMER + SERVICE
--
-- ACTIVE and PAUSED are both considered open contracts.
--
-- Allowed:
--
-- Tennis  Jan-Jun 2026    ENDED
-- Tennis  Sep-... 2026    ACTIVE
--
-- Not allowed:
--
-- Tennis                  ACTIVE
-- Tennis                  ACTIVE
--
-- Nor:
--
-- Tennis                  PAUSED
-- Tennis                  ACTIVE
-- ============================================================

create unique index
    uq_customer_subscriptions_open_customer_activity
on public.customer_subscriptions (
    organization_id,
    customer_id,
    activity_id
)
where status in (
    'ACTIVE',
    'PAUSED'
);


-- ============================================================
-- 7. UPDATED_AT
-- ============================================================

create trigger
    customer_subscriptions_set_updated_at
before update
on public.customer_subscriptions
for each row
execute function public.set_updated_at();


-- ============================================================
-- 8. MANAGER SECURITY HELPER
--
-- OWNER / ADMIN = commercial managers.
-- ============================================================

create or replace function public.is_organization_manager(
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

        where
            m.organization_id =
                target_organization_id

            and m.user_id =
                auth.uid()

            and m.role in (
                'OWNER',
                'ADMIN'
            )
    );
$$;


revoke all
on function public.is_organization_manager(uuid)
from public;


grant execute
on function public.is_organization_manager(uuid)
to authenticated;


-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

alter table public.customer_subscriptions
enable row level security;


-- ============================================================
-- 10. SELECT
--
-- Commercial information is restricted to OWNER / ADMIN.
--
-- PROFESSIONAL access can be introduced later with a
-- purpose-specific policy.
--
-- CUSTOMER access must eventually be restricted to the
-- authenticated customer's own subscriptions.
-- ============================================================

create policy
    "organization managers can view customer subscriptions"
on public.customer_subscriptions
for select
to authenticated
using (
    public.is_organization_manager(
        organization_id
    )
);


-- ============================================================
-- 11. INSERT
-- ============================================================

create policy
    "organization managers can create customer subscriptions"
on public.customer_subscriptions
for insert
to authenticated
with check (
    public.is_organization_manager(
        organization_id
    )
);


-- ============================================================
-- 12. UPDATE
-- ============================================================

create policy
    "organization managers can update customer subscriptions"
on public.customer_subscriptions
for update
to authenticated
using (
    public.is_organization_manager(
        organization_id
    )
)
with check (
    public.is_organization_manager(
        organization_id
    )
);


-- ============================================================
-- 13. TABLE PERMISSIONS
--
-- Intentionally NO DELETE.
--
-- Commercial records must be ended rather than physically
-- removed.
-- ============================================================

grant select, insert, update
on table public.customer_subscriptions
to authenticated;