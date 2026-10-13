-- Fix enum type mismatch when delegating group creation to the existing scheduling RPC.
-- Preserve the original scheduling validation and resource pool allocation.

create or replace function public.create_group_scheduling_appointment(
  p_customer_ids uuid[], p_activity_id uuid, p_customer_subscription_id uuid,
  p_starts_at timestamptz, p_ends_at timestamptz, p_professional_id uuid default null,
  p_resource_ids uuid[] default '{}', p_source text default 'MANUAL'
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_org uuid; v_capacity integer; v_mode text; v_id uuid; v_customer uuid; v_count integer;
begin
  if p_customer_ids is null or cardinality(p_customer_ids)=0 then raise exception 'participantRequired'; end if;
  select organization_id, coalesce(max_participants, case when attendance_mode='INDIVIDUAL' then 1 else cardinality(p_customer_ids) end), attendance_mode
    into v_org, v_capacity, v_mode from activities where id=p_activity_id and active=true;
  if v_org is null then raise exception 'serviceNotFound'; end if;
  if auth.uid() is null or not public.is_organization_member(v_org) then raise exception 'notAuthorized'; end if;
  select count(distinct x) into v_count from unnest(p_customer_ids) x;
  if v_count <> cardinality(p_customer_ids) then raise exception 'duplicateParticipant'; end if;
  if v_count > v_capacity then raise exception 'capacityExceeded'; end if;
  if v_mode='INDIVIDUAL' and v_count > 1 then raise exception 'individualServiceCapacity'; end if;
  if exists(select 1 from unnest(p_customer_ids) x left join customers c on c.id=x and c.organization_id=v_org and c.active=true where c.id is null) then raise exception 'invalidParticipant'; end if;

  -- Reuse the existing authoritative RPC for conflict, professional and resource validations.
  v_id := public.create_scheduling_appointment(p_customer_ids[1], p_activity_id, p_customer_subscription_id, p_starts_at, p_ends_at, p_professional_id, p_resource_ids, p_source::public.appointment_source);
  update appointments set capacity=v_capacity where id=v_id;
  delete from appointment_participants where appointment_id=v_id;
  foreach v_customer in array p_customer_ids loop
    insert into appointment_participants(organization_id,appointment_id,customer_id) values(v_org,v_id,v_customer);
  end loop;
  return v_id;
end $$;

