-- ============================================================
-- COURTLY
-- Financial Management - Automation
--
-- Generates subscription revenues and recurring expenses for a
-- selected financial month. All inserts are idempotent.
-- ============================================================

-- ============================================================
-- 1. DATE HELPERS
-- ============================================================

create or replace function public.add_subscription_billing_cycle(
    p_date date,
    p_cycle public.subscription_billing_cycle
)
returns date
language plpgsql
immutable
set search_path = ''
as $$
begin
    case p_cycle
        when 'WEEKLY' then
            return (p_date + interval '1 week')::date;
        when 'MONTHLY' then
            return (p_date + interval '1 month')::date;
        when 'QUARTERLY' then
            return (p_date + interval '3 months')::date;
        when 'SEMIANNUAL' then
            return (p_date + interval '6 months')::date;
        when 'ANNUAL' then
            return (p_date + interval '1 year')::date;
        when 'ONE_TIME' then
            return null;
    end case;
end;
$$;

create or replace function public.add_expense_recurrence_cycle(
    p_date date,
    p_cycle public.expense_recurrence_cycle
)
returns date
language plpgsql
immutable
set search_path = ''
as $$
begin
    case p_cycle
        when 'WEEKLY' then
            return (p_date + interval '1 week')::date;
        when 'MONTHLY' then
            return (p_date + interval '1 month')::date;
        when 'QUARTERLY' then
            return (p_date + interval '3 months')::date;
        when 'SEMIANNUAL' then
            return (p_date + interval '6 months')::date;
        when 'ANNUAL' then
            return (p_date + interval '1 year')::date;
    end case;
end;
$$;

revoke all on function public.add_subscription_billing_cycle(date, public.subscription_billing_cycle)
from public, anon, authenticated;

revoke all on function public.add_expense_recurrence_cycle(date, public.expense_recurrence_cycle)
from public, anon, authenticated;

-- ============================================================
-- 2. OWNER HELPER
-- ============================================================

create or replace function public.is_organization_owner(
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
          and m.role = 'OWNER'
    );
$$;

revoke all
on function public.is_organization_owner(uuid)
from public;

grant execute
on function public.is_organization_owner(uuid)
to authenticated;

-- ============================================================
-- 3. INTERNAL REVENUE GENERATOR
-- ============================================================

create or replace function public.generate_subscription_revenues_for_period(
    p_organization_id uuid,
    p_period_start date,
    p_period_end date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_subscription record;
    v_occurrence date;
    v_effective_end date;
    v_inserted integer := 0;
    v_row_count integer := 0;
begin
    for v_subscription in
        select
            cs.id,
            cs.customer_id,
            cs.activity_id,
            cs.amount,
            cs.currency_code,
            cs.billing_cycle,
            cs.status,
            cs.starts_at,
            cs.ends_at,
            a.name as activity_name
        from public.customer_subscriptions cs
        join public.activities a
          on a.id = cs.activity_id
         and a.organization_id = cs.organization_id
        where cs.organization_id = p_organization_id
          and cs.starts_at <= p_period_end
          and (
              cs.status = 'ACTIVE'
              or (
                  cs.status = 'ENDED'
                  and cs.ends_at is not null
                  and cs.ends_at >= p_period_start
              )
          )
    loop
        v_effective_end := least(
            p_period_end,
            coalesce(v_subscription.ends_at, p_period_end)
        );

        v_occurrence := v_subscription.starts_at;

        while v_occurrence is not null
          and v_occurrence < p_period_start
        loop
            v_occurrence := public.add_subscription_billing_cycle(
                v_occurrence,
                v_subscription.billing_cycle
            );
        end loop;

        while v_occurrence is not null
          and v_occurrence <= v_effective_end
        loop
            insert into public.financial_revenues (
                organization_id,
                customer_id,
                customer_subscription_id,
                activity_id,
                source,
                description,
                amount,
                currency_code,
                reference_date,
                due_date,
                status
            )
            values (
                p_organization_id,
                v_subscription.customer_id,
                v_subscription.id,
                v_subscription.activity_id,
                'SUBSCRIPTION',
                v_subscription.activity_name,
                v_subscription.amount,
                v_subscription.currency_code,
                v_occurrence,
                v_occurrence,
                case
                    when v_occurrence < current_date
                        then 'OVERDUE'::public.financial_entry_status
                    else 'PENDING'::public.financial_entry_status
                end
            )
            on conflict (
                customer_subscription_id,
                reference_date
            )
            where customer_subscription_id is not null
            do nothing;

            get diagnostics v_row_count = row_count;
            v_inserted := v_inserted + v_row_count;

            v_occurrence := public.add_subscription_billing_cycle(
                v_occurrence,
                v_subscription.billing_cycle
            );
        end loop;
    end loop;

    return v_inserted;
end;
$$;

-- ============================================================
-- 4. INTERNAL RECURRING EXPENSE GENERATOR
-- ============================================================

create or replace function public.generate_recurring_expenses_for_period(
    p_organization_id uuid,
    p_period_start date,
    p_period_end date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_recurrence record;
    v_occurrence date;
    v_effective_end date;
    v_inserted integer := 0;
    v_row_count integer := 0;
begin
    for v_recurrence in
        select
            er.id,
            er.category_id,
            er.description,
            er.amount,
            er.currency_code,
            er.recurrence_cycle,
            er.starts_at,
            er.first_due_date,
            er.ends_at,
            er.notes
        from public.expense_recurrences er
        where er.organization_id = p_organization_id
          and er.active = true
          and er.starts_at <= p_period_end
          and (
              er.ends_at is null
              or er.ends_at >= p_period_start
          )
    loop
        v_effective_end := least(
            p_period_end,
            coalesce(v_recurrence.ends_at, p_period_end)
        );

        v_occurrence := v_recurrence.starts_at;

        while v_occurrence < p_period_start
        loop
            v_occurrence := public.add_expense_recurrence_cycle(
                v_occurrence,
                v_recurrence.recurrence_cycle
            );
        end loop;

        while v_occurrence <= v_effective_end
        loop
            insert into public.financial_expenses (
                organization_id,
                category_id,
                recurrence_id,
                description,
                amount,
                currency_code,
                reference_date,
                due_date,
                status,
                notes
            )
            values (
                p_organization_id,
                v_recurrence.category_id,
                v_recurrence.id,
                v_recurrence.description,
                v_recurrence.amount,
                v_recurrence.currency_code,
                v_occurrence,
                (
                    v_occurrence
                    + (
                        v_recurrence.first_due_date
                        - v_recurrence.starts_at
                    )
                ),
                case
                    when (
                        v_occurrence
                        + (
                            v_recurrence.first_due_date
                            - v_recurrence.starts_at
                        )
                    ) < current_date
                        then 'OVERDUE'::public.financial_entry_status
                    else 'PENDING'::public.financial_entry_status
                end,
                v_recurrence.notes
            )
            on conflict (
                recurrence_id,
                reference_date
            )
            where recurrence_id is not null
            do nothing;

            get diagnostics v_row_count = row_count;
            v_inserted := v_inserted + v_row_count;

            v_occurrence := public.add_expense_recurrence_cycle(
                v_occurrence,
                v_recurrence.recurrence_cycle
            );
        end loop;
    end loop;

    return v_inserted;
end;
$$;

-- ============================================================
-- 5. OVERDUE STATUS REFRESH
-- ============================================================

create or replace function public.refresh_financial_overdue_statuses(
    p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.financial_revenues
    set status = 'OVERDUE'
    where organization_id = p_organization_id
      and status = 'PENDING'
      and due_date < current_date;

    update public.financial_expenses
    set status = 'OVERDUE'
    where organization_id = p_organization_id
      and status = 'PENDING'
      and due_date < current_date;
end;
$$;

-- ============================================================
-- 6. PUBLIC OWNER-ONLY PERIOD SYNC
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
    if auth.uid() is null then
        raise exception 'User is not authenticated';
    end if;

    select m.organization_id
    into v_organization_id
    from public.memberships m
    where m.user_id = auth.uid()
      and m.role = 'OWNER'
    order by m.created_at asc
    limit 1;

    if v_organization_id is null then
        raise exception 'User is not allowed to manage financial data';
    end if;

    v_period_start := date_trunc('month', p_reference_date)::date;
    v_period_end := (
        date_trunc('month', p_reference_date)
        + interval '1 month'
        - interval '1 day'
    )::date;

    insert into public.financial_periods (
        organization_id,
        year,
        month,
        status
    )
    values (
        v_organization_id,
        extract(year from v_period_start)::smallint,
        extract(month from v_period_start)::smallint,
        'OPEN'
    )
    on conflict (
        organization_id,
        year,
        month
    )
    do nothing;

    v_generated_revenues :=
        public.generate_subscription_revenues_for_period(
            v_organization_id,
            v_period_start,
            v_period_end
        );

    v_generated_expenses :=
        public.generate_recurring_expenses_for_period(
            v_organization_id,
            v_period_start,
            v_period_end
        );

    perform public.refresh_financial_overdue_statuses(
        v_organization_id
    );

    return query
    select
        v_organization_id,
        v_period_start,
        v_period_end,
        v_generated_revenues,
        v_generated_expenses;
end;
$$;

revoke all
on function public.sync_financial_period(date)
from public, anon;

grant execute
on function public.sync_financial_period(date)
to authenticated;

-- Internal helpers are not API entrypoints.
revoke all
on function public.generate_subscription_revenues_for_period(uuid, date, date)
from public, anon, authenticated;

revoke all
on function public.generate_recurring_expenses_for_period(uuid, date, date)
from public, anon, authenticated;

revoke all
on function public.refresh_financial_overdue_statuses(uuid)
from public, anon, authenticated;
