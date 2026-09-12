-- COURTLY — Recurrence contract period + professional validation
-- Aligns recurrence dates with the selected commercial plan and prevents
-- choosing a professional who cannot serve the first effective occurrence.

create or replace function public.normalize_schedule_rule_contract_period()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_subscription public.customer_subscriptions%rowtype;
    v_timezone text;
    v_contract_end date;
    v_first_date date;
    v_start timestamptz;
    v_end timestamptz;
begin
    select * into v_subscription
    from public.customer_subscriptions cs
    where cs.id = new.customer_subscription_id
      and cs.organization_id = new.organization_id;

    if v_subscription.id is null then
        raise exception 'Subscription not found';
    end if;

    if v_subscription.status <> 'ACTIVE' then
        raise exception 'Only active subscriptions can be scheduled';
    end if;

    if v_subscription.billing_cycle = 'ONE_TIME' then
        raise exception 'One-time subscriptions do not support weekly recurrence';
    end if;

    -- Commercial plan is the source of truth for the recurrence period.
    new.effective_from := v_subscription.starts_at;
    v_contract_end := coalesce(
        v_subscription.ends_at,
        public.add_subscription_billing_cycle(
            v_subscription.starts_at,
            v_subscription.billing_cycle
        )
    );
    new.effective_until := v_contract_end;

    if new.effective_until is null or new.effective_until < new.effective_from then
        raise exception 'Invalid subscription recurrence period';
    end if;

    select coalesce(o.timezone, 'America/Sao_Paulo')
    into v_timezone
    from public.organizations o
    where o.id = new.organization_id;

    -- The generator starts from today when the contract began in the past,
    -- so validate the same first relevant occurrence here.
    v_first_date := greatest(new.effective_from, current_date);

    while extract(dow from v_first_date)::smallint <> new.weekday loop
        v_first_date := v_first_date + 1;
    end loop;

    if v_first_date > new.effective_until then
        raise exception 'No occurrence fits inside the subscription period';
    end if;

    if new.professional_id is not null then
        v_start := ((v_first_date::text || ' ' || new.start_time::text)::timestamp at time zone v_timezone);
        v_end := ((v_first_date::text || ' ' || new.end_time::text)::timestamp at time zone v_timezone);

        if not public.professional_is_available(
            new.organization_id,
            new.professional_id,
            new.activity_id,
            v_start,
            v_end,
            null
        ) then
            raise exception 'Professional is not available for the first recurrence date/time';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists normalize_schedule_rule_contract_period_before_insert
on public.schedule_rules;

create trigger normalize_schedule_rule_contract_period_before_insert
before insert on public.schedule_rules
for each row
execute function public.normalize_schedule_rule_contract_period();

revoke all on function public.normalize_schedule_rule_contract_period() from public, anon, authenticated;
