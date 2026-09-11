-- ============================================================
-- COURTLY
-- Financial Management
-- Fix Financial Period Sync Ambiguity
--
-- Problem:
--
-- sync_financial_period() returns a column named organization_id.
--
-- Inside the same PL/pgSQL function, the previous ON CONFLICT
-- clause also referenced organization_id directly:
--
--     on conflict (
--         organization_id,
--         year,
--         month
--     )
--
-- PostgreSQL could not determine whether organization_id meant:
--
--   1. the financial_periods table column; or
--   2. the RETURNS TABLE output variable.
--
-- Solution:
--
-- Reference the existing UNIQUE constraint directly.
-- ============================================================


create or replace function public.sync_financial_period(
    p_reference_date date
)
returns table (
    organization_id uuid,
    period_start date,
    period_end date,
    generated_revenues integer,
    generated_expenses integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_organization_id uuid;

    v_period_start date;

    v_period_end date;

    v_generated_revenues integer;

    v_generated_expenses integer;
begin

    -- ========================================================
    -- 1. AUTHENTICATION
    -- ========================================================

    if auth.uid() is null then
        raise exception
            'User is not authenticated';
    end if;


    -- ========================================================
    -- 2. OWNER ORGANIZATION
    --
    -- Financial Management is intentionally OWNER-only.
    -- ========================================================

    select
        m.organization_id
    into
        v_organization_id
    from public.memberships m
    where
        m.user_id = auth.uid()
        and m.role = 'OWNER'
    order by
        m.created_at asc
    limit 1;


    if v_organization_id is null then
        raise exception
            'User is not allowed to manage financial data';
    end if;


    -- ========================================================
    -- 3. FINANCIAL PERIOD
    -- ========================================================

    v_period_start :=
        date_trunc(
            'month',
            p_reference_date
        )::date;


    v_period_end :=
        (
            date_trunc(
                'month',
                p_reference_date
            )
            + interval '1 month'
            - interval '1 day'
        )::date;


    -- ========================================================
    -- 4. ENSURE FINANCIAL PERIOD EXISTS
    --
    -- IMPORTANT:
    --
    -- We intentionally use ON CONFLICT ON CONSTRAINT instead
    -- of:
    --
    --     ON CONFLICT (organization_id, year, month)
    --
    -- because organization_id is also an output variable of
    -- this RETURNS TABLE function.
    --
    -- Referencing the concrete database constraint removes
    -- that ambiguity completely.
    -- ========================================================

    insert into public.financial_periods (
        organization_id,
        year,
        month,
        status
    )
    values (
        v_organization_id,

        extract(
            year
            from v_period_start
        )::smallint,

        extract(
            month
            from v_period_start
        )::smallint,

        'OPEN'
    )
    on conflict on constraint
        financial_periods_organization_year_month_unique
    do nothing;


    -- ========================================================
    -- 5. GENERATE SUBSCRIPTION REVENUES
    --
    -- Idempotent:
    --
    -- subscription + reference_date can only be generated once.
    -- ========================================================

    v_generated_revenues :=
        public.generate_subscription_revenues_for_period(
            v_organization_id,
            v_period_start,
            v_period_end
        );


    -- ========================================================
    -- 6. GENERATE RECURRING EXPENSES
    --
    -- Idempotent:
    --
    -- recurrence + reference_date can only be generated once.
    -- ========================================================

    v_generated_expenses :=
        public.generate_recurring_expenses_for_period(
            v_organization_id,
            v_period_start,
            v_period_end
        );


    -- ========================================================
    -- 7. REFRESH OVERDUE ENTRIES
    -- ========================================================

    perform
        public.refresh_financial_overdue_statuses(
            v_organization_id
        );


    -- ========================================================
    -- 8. RESULT
    -- ========================================================

    return query
    select
        v_organization_id,
        v_period_start,
        v_period_end,
        v_generated_revenues,
        v_generated_expenses;

end;
$$;


-- ============================================================
-- SECURITY
-- ============================================================

revoke all
on function public.sync_financial_period(date)
from public;


revoke all
on function public.sync_financial_period(date)
from anon;


grant execute
on function public.sync_financial_period(date)
to authenticated;


comment on function public.sync_financial_period(date) is
'Synchronizes the financial period for the authenticated OWNER organization, generating subscription revenues and recurring expenses idempotently.';