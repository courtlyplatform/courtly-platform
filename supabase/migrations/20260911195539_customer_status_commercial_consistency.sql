-- ============================================================
-- COURTLY
-- Customer Commercial Consistency
--
-- Responsibilities:
--
-- 1. Repair existing inconsistent records:
--      inactive customer
--      +
--      ACTIVE / PAUSED subscription
--
-- 2. Provide an atomic operation for customer activation /
--    deactivation.
--
-- When a customer is deactivated:
--
--      ACTIVE  -> ENDED
--      PAUSED  -> ENDED
--      customer.active -> false
--
-- Reactivating a customer DOES NOT reactivate historical
-- subscriptions.
-- ============================================================


-- ============================================================
-- 1. REPAIR EXISTING INCONSISTENCIES
--
-- There may already be inactive customers whose commercial
-- subscriptions are still ACTIVE / PAUSED.
--
-- We repair those records before introducing the RPC.
-- ============================================================

update public.customer_subscriptions cs
set
    status =
        'ENDED'::public.subscription_status,

    ends_at =
        greatest(
            current_date,
            cs.starts_at
        )
from public.customers c
where
    c.id =
        cs.customer_id

    and c.organization_id =
        cs.organization_id

    and c.active =
        false

    and cs.status in (
        'ACTIVE',
        'PAUSED'
    );


-- ============================================================
-- 2. ATOMIC CUSTOMER STATUS FUNCTION
--
-- The function controls both:
--
-- - customer status
-- - commercial subscription status
--
-- PostgreSQL executes the function in the same transaction.
--
-- If any statement fails, the entire operation is rolled back.
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

    v_ended_subscriptions integer :=
        0;
begin

    -- ========================================================
    -- AUTHENTICATION
    -- ========================================================

    if auth.uid() is null then
        raise exception
            'User is not authenticated';
    end if;


    -- ========================================================
    -- CUSTOMER / ORGANIZATION
    -- ========================================================

    select
        c.organization_id
    into
        v_organization_id
    from public.customers c
    where
        c.id =
            p_customer_id;


    if v_organization_id is null then
        raise exception
            'Customer not found';
    end if;


    -- ========================================================
    -- AUTHORIZATION
    --
    -- Commercial lifecycle changes may only be performed
    -- by OWNER / ADMIN.
    -- ========================================================

    if not public.is_organization_manager(
        v_organization_id
    ) then
        raise exception
            'User is not allowed to change customer status';
    end if;


    -- ========================================================
    -- DEACTIVATION
    --
    -- ACTIVE and PAUSED commercial relationships become ENDED.
    --
    -- greatest(current_date, starts_at) also protects contracts
    -- that were configured with a future start date because
    -- customer_subscriptions requires:
    --
    -- ends_at >= starts_at
    -- ========================================================

    if p_active = false then

        update public.customer_subscriptions cs
        set
            status =
                'ENDED'::public.subscription_status,

            ends_at =
                greatest(
                    current_date,
                    cs.starts_at
                )
        where
            cs.organization_id =
                v_organization_id

            and cs.customer_id =
                p_customer_id

            and cs.status in (
                'ACTIVE',
                'PAUSED'
            );


        get diagnostics
            v_ended_subscriptions =
                row_count;

    end if;


    -- ========================================================
    -- CUSTOMER STATUS
    --
    -- This happens after subscriptions intentionally.
    --
    -- If subscription closing fails, this statement is never
    -- committed either.
    -- ========================================================

    update public.customers c
    set
        active =
            p_active
    where
        c.id =
            p_customer_id

        and c.organization_id =
            v_organization_id;


    -- ========================================================
    -- RESULT
    -- ========================================================

    return query
    select
        p_active,
        v_ended_subscriptions;

end;
$$;


-- ============================================================
-- 3. FUNCTION SECURITY
-- ============================================================

revoke all
on function public.set_customer_active_status(
    uuid,
    boolean
)
from public;


revoke all
on function public.set_customer_active_status(
    uuid,
    boolean
)
from anon;


grant execute
on function public.set_customer_active_status(
    uuid,
    boolean
)
to authenticated;