-- ============================================================
-- COURTLY
-- Auto Reactivate Customer On Commercial Subscription
--
-- Business invariant:
--
-- An ACTIVE or PAUSED commercial subscription cannot coexist
-- with an inactive customer.
--
-- Therefore, whenever an open subscription is created or
-- changed to an open status, Courtly automatically reactivates
-- the customer in the SAME PostgreSQL transaction.
--
-- Example:
--
-- customer.active = false
--
-- OWNER adds Tennis
--
-- Result:
--
-- customer.active = true
-- subscription.status = ACTIVE
--
-- ============================================================


-- ============================================================
-- 1. CUSTOMER AUTO-REACTIVATION FUNCTION
-- ============================================================

create or replace function
public.ensure_customer_active_for_open_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    -- --------------------------------------------------------
    -- ENDED subscriptions do not require an active customer.
    -- --------------------------------------------------------

    if new.status not in (
        'ACTIVE',
        'PAUSED'
    ) then
        return new;
    end if;


    -- --------------------------------------------------------
    -- Ensure the referenced customer becomes active.
    --
    -- customer_id + organization_id are used together so this
    -- remains tenant-safe.
    --
    -- The composite foreign key already guarantees that the
    -- customer belongs to the subscription organization.
    -- --------------------------------------------------------

    update public.customers c
    set
        active = true
    where
        c.id =
            new.customer_id

        and c.organization_id =
            new.organization_id

        and c.active =
            false;


    return new;

end;
$$;


-- ============================================================
-- 2. TRIGGER
--
-- BEFORE INSERT:
-- creating a new ACTIVE subscription reactivates the customer.
--
-- BEFORE UPDATE:
-- protects the invariant if a future feature changes an
-- existing subscription back to ACTIVE / PAUSED.
-- ============================================================

create trigger
    customer_subscription_ensure_active_customer
before insert
or update of
    status,
    customer_id,
    organization_id
on public.customer_subscriptions
for each row
execute function
    public.ensure_customer_active_for_open_subscription();


-- ============================================================
-- 3. SECURITY
--
-- This is a trigger function and is not intended to be called
-- directly through the API.
-- ============================================================

revoke all
on function
public.ensure_customer_active_for_open_subscription()
from public;

revoke all
on function
public.ensure_customer_active_for_open_subscription()
from anon;

revoke all
on function
public.ensure_customer_active_for_open_subscription()
from authenticated;