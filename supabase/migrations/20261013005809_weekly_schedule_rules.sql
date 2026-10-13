-- Create all weekdays of a recurrence atomically using the existing validated RPC.
create or replace function public.create_weekly_scheduling_rules(
  p_customer_subscription_id uuid,
  p_weekdays integer[],
  p_start_time time,
  p_end_time time,
  p_effective_from date,
  p_effective_until date default null,
  p_professional_id uuid default null,
  p_resource_ids uuid[] default array[]::uuid[]
) returns uuid[]
language plpgsql security invoker set search_path = ''
as $$
declare
  v_weekday integer;
  v_ids uuid[] := array[]::uuid[];
  v_id uuid;
begin
  if p_weekdays is null or cardinality(p_weekdays) = 0 or
     exists (select 1 from unnest(p_weekdays) d where d is null or d < 0 or d > 6) or
     (select count(distinct d) from unnest(p_weekdays) d) <> cardinality(p_weekdays) then
    raise exception 'invalidWeekdays';
  end if;
  foreach v_weekday in array p_weekdays loop
    v_id := public.create_scheduling_rule(
      p_customer_subscription_id,
      v_weekday::smallint,
      p_start_time,
      p_end_time,
      p_effective_from,
      p_effective_until,
      p_professional_id,
      p_resource_ids
    );
    v_ids := array_append(v_ids, v_id);
  end loop;
  return v_ids;
end;
$$;
revoke all on function public.create_weekly_scheduling_rules(uuid,integer[],time,time,date,date,uuid,uuid[]) from public;
grant execute on function public.create_weekly_scheduling_rules(uuid,integer[],time,time,date,date,uuid,uuid[]) to authenticated;
