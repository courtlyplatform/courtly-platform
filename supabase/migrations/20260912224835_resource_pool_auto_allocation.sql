-- COURTLY
-- Generic resource pools + automatic, concurrency-safe allocation.
--
-- A resource TYPE classifies an inventory item (court, room, chair, equipment...).
-- A resource POOL defines interchangeability for scheduling. A pool can contain
-- resources from one or many types. A service consumes N units from a pool.
-- This supports, for example:
--   Pool "Quadras de Areia"  -> Quadra 01, 02, 03
--   Pool "Quadras de Tennis" -> hard + clay courts together
-- and remains generic for clinics, gyms, salons, coworking, etc.

-- =============================================================================
-- 1) RESOURCE POOLS
-- =============================================================================
create table if not exists public.resource_pools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name varchar(120) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_pools_name_not_blank check (length(trim(name)) > 0),
  constraint resource_pools_id_organization_unique unique (id, organization_id)
);

create unique index if not exists uq_resource_pools_organization_name
  on public.resource_pools(organization_id, lower(trim(name)));

create table if not exists public.resource_pool_members (
  organization_id uuid not null,
  resource_pool_id uuid not null,
  resource_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (resource_pool_id, resource_id),
  constraint fk_resource_pool_members_pool
    foreign key (resource_pool_id, organization_id)
    references public.resource_pools(id, organization_id)
    on delete cascade,
  constraint fk_resource_pool_members_resource
    foreign key (resource_id, organization_id)
    references public.resources(id, organization_id)
    on delete cascade
);

create index if not exists idx_resource_pool_members_org_resource
  on public.resource_pool_members(organization_id, resource_id);

alter table public.resource_pools enable row level security;
alter table public.resource_pool_members enable row level security;

drop policy if exists "resource pools permission read" on public.resource_pools;
create policy "resource pools permission read"
on public.resource_pools for select to authenticated
using (
  public.user_has_permission(organization_id,'SCHEDULING_VIEW_ALL')
  or public.user_has_permission(organization_id,'SCHEDULING_VIEW_OWN')
  or public.user_has_permission(organization_id,'SERVICES_VIEW')
);

drop policy if exists "resource pool members permission read" on public.resource_pool_members;
create policy "resource pool members permission read"
on public.resource_pool_members for select to authenticated
using (
  public.user_has_permission(organization_id,'SCHEDULING_VIEW_ALL')
  or public.user_has_permission(organization_id,'SCHEDULING_VIEW_OWN')
  or public.user_has_permission(organization_id,'SERVICES_VIEW')
);

drop policy if exists "resource pools permission manage" on public.resource_pools;
create policy "resource pools permission manage"
on public.resource_pools for all to authenticated
using (public.user_has_permission(organization_id,'SCHEDULING_EDIT'))
with check (public.user_has_permission(organization_id,'SCHEDULING_EDIT'));

drop policy if exists "resource pool members permission manage" on public.resource_pool_members;
create policy "resource pool members permission manage"
on public.resource_pool_members for all to authenticated
using (public.user_has_permission(organization_id,'SCHEDULING_EDIT'))
with check (public.user_has_permission(organization_id,'SCHEDULING_EDIT'));

grant select, insert, update, delete on public.resource_pools to authenticated;
grant select, insert, update, delete on public.resource_pool_members to authenticated;

-- Keep updated_at consistent with the rest of Courtly.
drop trigger if exists resource_pools_set_updated_at on public.resource_pools;
create trigger resource_pools_set_updated_at
before update on public.resource_pools
for each row execute function public.set_updated_at();

-- Keep a default same-name pool synchronized with resource types for convenient
-- inventory management. Custom pools are never removed or overwritten.
create or replace function public.sync_resource_default_pool()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type_name text;
  v_old_type_name text;
  v_pool_id uuid;
  v_old_pool_id uuid;
begin
  if tg_op = 'UPDATE' and old.resource_type_id is distinct from new.resource_type_id and old.resource_type_id is not null then
    select rt.name into v_old_type_name
    from public.resource_types rt
    where rt.id = old.resource_type_id and rt.organization_id = old.organization_id;

    select rp.id into v_old_pool_id
    from public.resource_pools rp
    where rp.organization_id = old.organization_id
      and lower(trim(rp.name)) = lower(trim(v_old_type_name))
    limit 1;

    if v_old_pool_id is not null then
      delete from public.resource_pool_members
      where organization_id = old.organization_id
        and resource_pool_id = v_old_pool_id
        and resource_id = old.id;
    end if;
  end if;

  if new.resource_type_id is null then return new; end if;

  select rt.name into v_type_name
  from public.resource_types rt
  where rt.id = new.resource_type_id and rt.organization_id = new.organization_id;

  if v_type_name is null then return new; end if;

  select rp.id into v_pool_id
  from public.resource_pools rp
  where rp.organization_id = new.organization_id
    and lower(trim(rp.name)) = lower(trim(v_type_name))
  limit 1;

  if v_pool_id is null then
    begin
      insert into public.resource_pools(organization_id, name, active)
      values (new.organization_id, v_type_name, true)
      returning id into v_pool_id;
    exception when unique_violation then
      select rp.id into v_pool_id
      from public.resource_pools rp
      where rp.organization_id = new.organization_id
        and lower(trim(rp.name)) = lower(trim(v_type_name))
      limit 1;
    end;
  end if;

  insert into public.resource_pool_members(organization_id, resource_pool_id, resource_id)
  values (new.organization_id, v_pool_id, new.id)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists resources_sync_default_pool on public.resources;
create trigger resources_sync_default_pool
after insert or update of resource_type_id on public.resources
for each row execute function public.sync_resource_default_pool();

-- =============================================================================
-- 2) EVOLVE SERVICE RESOURCE REQUIREMENTS FROM TYPE -> POOL
-- =============================================================================
alter table public.activity_resource_requirements
  add column if not exists resource_pool_id uuid;

alter table public.activity_resource_requirements
  alter column resource_type_id drop not null;

alter table public.activity_resource_requirements
  drop constraint if exists fk_activity_resource_pool;

alter table public.activity_resource_requirements
  add constraint fk_activity_resource_pool
  foreign key (resource_pool_id, organization_id)
  references public.resource_pools(id, organization_id)
  on delete restrict;

-- Every existing resource type gets a same-name default pool. This is a safe
-- migration path and preserves the old configuration semantics.
insert into public.resource_pools(organization_id, name, active)
select rt.organization_id, rt.name, rt.active
from public.resource_types rt
where not exists (
  select 1 from public.resource_pools rp
  where rp.organization_id = rt.organization_id
    and lower(trim(rp.name)) = lower(trim(rt.name))
);

-- Put each current resource into the default pool matching its type.
insert into public.resource_pool_members(organization_id, resource_pool_id, resource_id)
select r.organization_id, rp.id, r.id
from public.resources r
join public.resource_types rt
  on rt.id = r.resource_type_id
 and rt.organization_id = r.organization_id
join public.resource_pools rp
  on rp.organization_id = rt.organization_id
 and lower(trim(rp.name)) = lower(trim(rt.name))
on conflict do nothing;

-- Move existing service requirements to those default pools.
update public.activity_resource_requirements arr
set resource_pool_id = rp.id
from public.resource_types rt
join public.resource_pools rp
  on rp.organization_id = rt.organization_id
 and lower(trim(rp.name)) = lower(trim(rt.name))
where arr.resource_pool_id is null
  and arr.resource_type_id = rt.id
  and arr.organization_id = rt.organization_id;

alter table public.activity_resource_requirements
  drop constraint if exists activity_resource_requirement_unique;

drop index if exists uq_activity_resource_requirement_pool;
create unique index uq_activity_resource_requirement_pool
  on public.activity_resource_requirements(activity_id, resource_pool_id)
  where resource_pool_id is not null;

alter table public.activity_resource_requirements
  drop constraint if exists activity_resource_requirement_has_target;
alter table public.activity_resource_requirements
  add constraint activity_resource_requirement_has_target
  check (resource_pool_id is not null or resource_type_id is not null);

-- =============================================================================
-- 3) MANAGE A RESOURCE POOL ATOMICALLY
-- =============================================================================
create or replace function public.save_resource_pool(
  p_organization_id uuid,
  p_pool_id uuid,
  p_name text,
  p_resource_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := p_organization_id;
  v_pool_id uuid;
  v_resource_id uuid;
begin
  if v_org is null then raise exception 'Organization not found'; end if;

  if p_pool_id is not null and not exists (
    select 1 from public.resource_pools rp
    where rp.id = p_pool_id and rp.organization_id = v_org
  ) then raise exception 'Resource pool not found'; end if;
  if not public.user_has_permission(v_org, 'SCHEDULING_EDIT') then raise exception 'forbidden'; end if;
  if length(trim(coalesce(p_name,''))) = 0 then raise exception 'Pool name is required'; end if;

  if p_pool_id is null then
    insert into public.resource_pools(organization_id, name)
    values (v_org, trim(p_name))
    returning id into v_pool_id;
  else
    v_pool_id := p_pool_id;
    update public.resource_pools
    set name = trim(p_name)
    where id = v_pool_id and organization_id = v_org;
  end if;

  delete from public.resource_pool_members
  where organization_id = v_org and resource_pool_id = v_pool_id;

  foreach v_resource_id in array coalesce(p_resource_ids, array[]::uuid[])
  loop
    if not exists (
      select 1 from public.resources r
      where r.id = v_resource_id
        and r.organization_id = v_org
        and r.active = true
    ) then
      raise exception 'Resource not found or inactive';
    end if;

    insert into public.resource_pool_members(organization_id, resource_pool_id, resource_id)
    values (v_org, v_pool_id, v_resource_id)
    on conflict do nothing;
  end loop;

  return v_pool_id;
end;
$$;

revoke all on function public.save_resource_pool(uuid,uuid,text,uuid[]) from public, anon;
grant execute on function public.save_resource_pool(uuid,uuid,text,uuid[]) to authenticated;

-- =============================================================================
-- 4) SERVICE-SIDE REQUIREMENT REPLACEMENT
-- =============================================================================
create or replace function public.replace_activity_resource_requirements(
  p_activity_id uuid,
  p_requirements jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_item jsonb;
  v_pool uuid;
  v_quantity integer;
begin
  select a.organization_id into v_org
  from public.activities a
  where a.id = p_activity_id;

  if v_org is null then raise exception 'Activity not found'; end if;
  if not (
    public.user_has_permission(v_org, 'SERVICES_EDIT')
    or public.user_has_permission(v_org, 'SERVICES_CREATE')
  ) then raise exception 'forbidden'; end if;

  if p_requirements is null or jsonb_typeof(p_requirements) <> 'array' then
    raise exception 'Requirements must be a JSON array';
  end if;

  delete from public.activity_resource_requirements
  where organization_id = v_org
    and activity_id = p_activity_id;

  for v_item in select value from jsonb_array_elements(p_requirements)
  loop
    v_pool := nullif(v_item->>'resourcePoolId', '')::uuid;
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);

    if v_pool is null or v_quantity <= 0 then raise exception 'Invalid resource requirement'; end if;

    if not exists (
      select 1 from public.resource_pools rp
      where rp.id = v_pool
        and rp.organization_id = v_org
        and rp.active = true
    ) then raise exception 'Resource pool not found or inactive'; end if;

    insert into public.activity_resource_requirements(
      organization_id, activity_id, resource_pool_id, resource_type_id, quantity
    ) values (
      v_org, p_activity_id, v_pool, null, v_quantity
    );
  end loop;
end;
$$;

revoke all on function public.replace_activity_resource_requirements(uuid,jsonb) from public, anon;
grant execute on function public.replace_activity_resource_requirements(uuid,jsonb) to authenticated;

-- =============================================================================
-- 5) INTERNAL, CONCURRENCY-SAFE RESOURCE ALLOCATOR
-- =============================================================================
create or replace function public.allocate_activity_resources(
  p_organization_id uuid,
  p_activity_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_ignore_appointment_id uuid default null
)
returns uuid[]
language plpgsql
set search_path = ''
as $$
declare
  v_requirement_mode public.scheduling_requirement;
  v_requirement record;
  v_resource record;
  v_selected uuid[] := array[]::uuid[];
  v_selected_for_requirement uuid[];
  v_count integer;
begin
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'Invalid appointment interval';
  end if;

  select a.resource_requirement into v_requirement_mode
  from public.activities a
  where a.id = p_activity_id
    and a.organization_id = p_organization_id
    and a.active = true;

  if v_requirement_mode is null then raise exception 'Activity not found or inactive'; end if;
  if v_requirement_mode = 'NONE' then return v_selected; end if;

  if v_requirement_mode = 'REQUIRED'
     and not exists (
       select 1 from public.activity_resource_requirements arr
       where arr.organization_id = p_organization_id
         and arr.activity_id = p_activity_id
         and arr.resource_pool_id is not null
     ) then
    raise exception 'Resource requirement is not configured';
  end if;

  for v_requirement in
    select arr.resource_pool_id, arr.quantity
    from public.activity_resource_requirements arr
    where arr.organization_id = p_organization_id
      and arr.activity_id = p_activity_id
      and arr.resource_pool_id is not null
    order by arr.resource_pool_id
  loop
    v_count := 0;
    v_selected_for_requirement := array[]::uuid[];

    for v_resource in
      select r.id
      from public.resource_pool_members rpm
      join public.resources r
        on r.id = rpm.resource_id
       and r.organization_id = rpm.organization_id
      where rpm.organization_id = p_organization_id
        and rpm.resource_pool_id = v_requirement.resource_pool_id
        and r.active = true
        and not (r.id = any(v_selected))
      order by r.name, r.id
    loop
      perform pg_advisory_xact_lock(hashtextextended(v_resource.id::text, 0));

      if not exists (
        select 1 from public.appointment_resources ar
        where ar.organization_id = p_organization_id
          and ar.resource_id = v_resource.id
          and ar.status = 'SCHEDULED'
          and (p_ignore_appointment_id is null or ar.appointment_id <> p_ignore_appointment_id)
          and tstzrange(ar.starts_at, ar.ends_at, '[)') &&
              tstzrange(p_starts_at, p_ends_at, '[)')
      ) then
        v_selected := array_append(v_selected, v_resource.id);
        v_selected_for_requirement := array_append(v_selected_for_requirement, v_resource.id);
        v_count := v_count + 1;
        exit when v_count >= v_requirement.quantity;
      end if;
    end loop;

    if v_count < v_requirement.quantity then
      if v_requirement_mode = 'REQUIRED' then
        raise exception 'Required resources are not available';
      end if;

      -- Optional requirement: do not reserve a partial set.
      v_selected := array(
        select selected_id
        from unnest(v_selected) selected_id
        where not (selected_id = any(v_selected_for_requirement))
      );
    end if;
  end loop;

  return coalesce(v_selected, array[]::uuid[]);
end;
$$;

revoke all on function public.allocate_activity_resources(uuid,uuid,timestamptz,timestamptz,uuid) from public, anon, authenticated;

-- =============================================================================
-- 6) AVAILABILITY BY SHARED POOL
-- =============================================================================
create or replace function public.get_scheduling_availability(
  p_activity_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_professional_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_prof_req public.scheduling_requirement;
  v_resource_req public.scheduling_requirement;
  v_prof_available boolean := true;
  v_configured boolean := false;
  v_resources_available boolean := true;
  v_required_total integer := 0;
  v_available_total integer := 0;
  v_req record;
  v_available integer;
begin
  select a.organization_id, a.professional_requirement, a.resource_requirement
  into v_org, v_prof_req, v_resource_req
  from public.activities a
  where a.id = p_activity_id and a.active = true;

  if v_org is null or not public.is_organization_member(v_org) then
    raise exception 'Activity not found or forbidden';
  end if;
  if p_ends_at <= p_starts_at then raise exception 'Invalid appointment interval'; end if;

  if v_prof_req = 'REQUIRED' then
    if p_professional_id is null then
      v_prof_available := exists (
        select 1 from public.professionals p
        join public.professional_activities pa
          on pa.organization_id = p.organization_id
         and pa.professional_id = p.id
         and pa.activity_id = p_activity_id
        where p.organization_id = v_org
          and p.active = true
          and public.professional_is_available(v_org,p.id,p_activity_id,p_starts_at,p_ends_at,null)
      );
    else
      v_prof_available := public.professional_is_available(
        v_org,p_professional_id,p_activity_id,p_starts_at,p_ends_at,null
      );
    end if;
  elsif p_professional_id is not null then
    v_prof_available := public.professional_is_available(
      v_org,p_professional_id,p_activity_id,p_starts_at,p_ends_at,null
    );
  end if;

  select exists(
    select 1 from public.activity_resource_requirements arr
    where arr.organization_id = v_org
      and arr.activity_id = p_activity_id
      and arr.resource_pool_id is not null
  ) into v_configured;

  for v_req in
    select arr.resource_pool_id, arr.quantity
    from public.activity_resource_requirements arr
    where arr.organization_id = v_org
      and arr.activity_id = p_activity_id
      and arr.resource_pool_id is not null
  loop
    v_required_total := v_required_total + v_req.quantity;

    select count(*)::integer into v_available
    from public.resource_pool_members rpm
    join public.resources r
      on r.id = rpm.resource_id
     and r.organization_id = rpm.organization_id
    where rpm.organization_id = v_org
      and rpm.resource_pool_id = v_req.resource_pool_id
      and r.active = true
      and not exists (
        select 1 from public.appointment_resources ar
        where ar.organization_id = v_org
          and ar.resource_id = r.id
          and ar.status = 'SCHEDULED'
          and tstzrange(ar.starts_at, ar.ends_at, '[)') &&
              tstzrange(p_starts_at, p_ends_at, '[)')
      );

    v_available_total := v_available_total + least(v_available, v_req.quantity);
    if v_available < v_req.quantity then v_resources_available := false; end if;
  end loop;

  if v_resource_req = 'REQUIRED' and not v_configured then v_resources_available := false; end if;

  return jsonb_build_object(
    'professionalRequired', v_prof_req = 'REQUIRED',
    'professionalAvailable', v_prof_available,
    'resourceRequired', v_resource_req = 'REQUIRED',
    'resourceConfigured', v_configured,
    'requiredResourceCount', v_required_total,
    'availableRequiredResourceCount', v_available_total,
    'resourcesAvailable', v_resources_available,
    'available', v_prof_available and (
      v_resource_req <> 'REQUIRED' or (v_configured and v_resources_available)
    )
  );
end;
$$;

revoke all on function public.get_scheduling_availability(uuid,timestamptz,timestamptz,uuid) from public, anon;
grant execute on function public.get_scheduling_availability(uuid,timestamptz,timestamptz,uuid) to authenticated;

-- =============================================================================
-- 7) MANUAL APPOINTMENT: AUTO-ALLOCATE CONCRETE RESOURCES
-- =============================================================================
create or replace function public.create_scheduling_appointment(
  p_customer_id uuid,
  p_activity_id uuid,
  p_customer_subscription_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_professional_id uuid default null,
  p_resource_ids uuid[] default array[]::uuid[],
  p_source public.appointment_source default 'MANUAL'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activity public.activities%rowtype;
  v_appointment_id uuid;
  v_resource_id uuid;
  v_allocated uuid[];
begin
  select * into v_activity from public.activities a
  where a.id = p_activity_id and a.active = true;

  if v_activity.id is null then raise exception 'Activity not found'; end if;
  if not public.user_has_permission(v_activity.organization_id,'SCHEDULING_EDIT') then raise exception 'Forbidden'; end if;
  if p_ends_at <= p_starts_at then raise exception 'Invalid appointment interval'; end if;
  if p_starts_at <= now() then raise exception 'Appointments cannot be scheduled in the past'; end if;

  if not exists (
    select 1 from public.customers c
    where c.id=p_customer_id and c.organization_id=v_activity.organization_id and c.active=true
  ) then raise exception 'Customer not found or inactive'; end if;

  if p_customer_subscription_id is not null and not exists (
    select 1 from public.customer_subscriptions cs
    where cs.id=p_customer_subscription_id
      and cs.organization_id=v_activity.organization_id
      and cs.customer_id=p_customer_id
      and cs.activity_id=p_activity_id
      and cs.status='ACTIVE'
  ) then raise exception 'Active compatible subscription not found'; end if;

  if v_activity.professional_requirement='REQUIRED' and p_professional_id is null then
    raise exception 'Professional is required';
  end if;

  if p_professional_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_professional_id::text,0));
    if not public.professional_is_available(
      v_activity.organization_id,p_professional_id,p_activity_id,p_starts_at,p_ends_at,null
    ) then raise exception 'Professional is not available for this service/date/time'; end if;
  end if;

  -- p_resource_ids remains only for RPC backward compatibility. Pool allocation
  -- is authoritative and prevents callers from bypassing service requirements.
  v_allocated := public.allocate_activity_resources(
    v_activity.organization_id,p_activity_id,p_starts_at,p_ends_at,null
  );

  insert into public.appointments(
    organization_id,customer_id,customer_subscription_id,activity_id,professional_id,
    starts_at,ends_at,status,source
  ) values (
    v_activity.organization_id,p_customer_id,p_customer_subscription_id,p_activity_id,
    p_professional_id,p_starts_at,p_ends_at,'SCHEDULED',p_source
  ) returning id into v_appointment_id;

  foreach v_resource_id in array v_allocated loop
    insert into public.appointment_resources(
      organization_id,appointment_id,resource_id,starts_at,ends_at,status
    ) values (
      v_activity.organization_id,v_appointment_id,v_resource_id,p_starts_at,p_ends_at,'SCHEDULED'
    );
  end loop;

  return v_appointment_id;
end;
$$;

revoke all on function public.create_scheduling_appointment(uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid[],public.appointment_source) from public, anon;
grant execute on function public.create_scheduling_appointment(uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid[],public.appointment_source) to authenticated;

-- =============================================================================
-- 8) RECURRENCE RULE: STORE INTENT, NOT A PERMANENT PHYSICAL RESOURCE
-- =============================================================================
create or replace function public.create_scheduling_rule(
  p_customer_subscription_id uuid,
  p_weekday smallint,
  p_start_time time,
  p_end_time time,
  p_effective_from date,
  p_effective_until date default null,
  p_professional_id uuid default null,
  p_resource_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription public.customer_subscriptions%rowtype;
  v_activity public.activities%rowtype;
  v_timezone text;
  v_rule_id uuid;
begin
  select * into v_subscription from public.customer_subscriptions cs
  where cs.id=p_customer_subscription_id;

  if v_subscription.id is null then raise exception 'Subscription not found'; end if;
  if not public.user_has_permission(v_subscription.organization_id,'SCHEDULING_EDIT') then raise exception 'Forbidden'; end if;
  if v_subscription.status<>'ACTIVE' then raise exception 'Only active subscriptions can be scheduled'; end if;
  if p_weekday<0 or p_weekday>6 then raise exception 'Invalid weekday'; end if;
  if p_end_time<=p_start_time then raise exception 'Invalid recurrence interval'; end if;
  if p_effective_until is not null and p_effective_until<p_effective_from then raise exception 'Invalid recurrence period'; end if;

  select * into v_activity from public.activities a
  where a.id=v_subscription.activity_id
    and a.organization_id=v_subscription.organization_id
    and a.active=true;

  if v_activity.id is null then raise exception 'Activity not found or inactive'; end if;
  if v_activity.professional_requirement='REQUIRED' and p_professional_id is null then raise exception 'Professional is required'; end if;

  if p_professional_id is not null then
    if not exists (
      select 1 from public.professionals p
      where p.id=p_professional_id and p.organization_id=v_subscription.organization_id and p.active=true
    ) then raise exception 'Professional not found or inactive'; end if;
    if v_activity.professional_requirement='REQUIRED' and not exists (
      select 1 from public.professional_activities pa
      where pa.organization_id=v_subscription.organization_id
        and pa.professional_id=p_professional_id
        and pa.activity_id=v_activity.id
    ) then raise exception 'Professional is not qualified for this service'; end if;
  end if;

  if v_activity.resource_requirement='REQUIRED' and not exists (
    select 1 from public.activity_resource_requirements arr
    where arr.organization_id=v_subscription.organization_id
      and arr.activity_id=v_activity.id
      and arr.resource_pool_id is not null
  ) then raise exception 'Resource requirement is not configured'; end if;

  select coalesce(o.timezone,'America/Sao_Paulo') into v_timezone
  from public.organizations o where o.id=v_subscription.organization_id;

  insert into public.schedule_rules(
    organization_id,customer_id,customer_subscription_id,activity_id,professional_id,
    recurrence_type,weekday,start_time,end_time,effective_from,effective_until,timezone,status
  ) values (
    v_subscription.organization_id,v_subscription.customer_id,v_subscription.id,
    v_subscription.activity_id,p_professional_id,'WEEKLY',p_weekday,p_start_time,p_end_time,
    p_effective_from,p_effective_until,v_timezone,'ACTIVE'
  ) returning id into v_rule_id;

  perform public.generate_schedule_rule_appointments(v_rule_id,null);
  return v_rule_id;
end;
$$;

revoke all on function public.create_scheduling_rule(uuid,smallint,time,time,date,date,uuid,uuid[]) from public, anon;
grant execute on function public.create_scheduling_rule(uuid,smallint,time,time,date,date,uuid,uuid[]) to authenticated;

-- =============================================================================
-- 9) GENERATOR: AUTO-ALLOCATE FOR EACH OCCURRENCE
-- =============================================================================
create or replace function public.generate_schedule_rule_appointments(
  p_schedule_rule_id uuid,
  p_window_end date default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.schedule_rules%rowtype;
  v_window_days integer;
  v_target_end date;
  v_date date;
  v_start timestamptz;
  v_end timestamptz;
  v_inserted integer := 0;
  v_appointment_id uuid;
  v_resource_id uuid;
  v_allocated uuid[];
begin
  select * into r from public.schedule_rules sr where sr.id=p_schedule_rule_id;
  if r.id is null or r.status<>'ACTIVE' then return 0; end if;
  if auth.uid() is not null and not public.user_has_permission(r.organization_id,'SCHEDULING_EDIT') then raise exception 'Forbidden'; end if;

  select s.generation_window_days into v_window_days
  from public.organization_scheduling_settings s where s.organization_id=r.organization_id;

  v_target_end := coalesce(p_window_end,current_date+coalesce(v_window_days,90));
  if r.effective_until is not null then v_target_end:=least(v_target_end,r.effective_until); end if;

  select least(v_target_end,cs.ends_at) into v_target_end
  from public.customer_subscriptions cs
  where cs.id=r.customer_subscription_id and cs.ends_at is not null;

  if v_target_end is null then
    v_target_end:=coalesce(p_window_end,current_date+coalesce(v_window_days,90));
    if r.effective_until is not null then v_target_end:=least(v_target_end,r.effective_until); end if;
  end if;

  v_date:=greatest(r.effective_from,current_date);
  while v_date<=v_target_end loop
    if extract(dow from v_date)::smallint=r.weekday then
      v_start:=((v_date::text||' '||r.start_time::text)::timestamp at time zone r.timezone);
      v_end:=((v_date::text||' '||r.end_time::text)::timestamp at time zone r.timezone);

      if not exists (
        select 1 from public.appointments existing
        where existing.schedule_rule_id=r.id
          and existing.starts_at=v_start
          and existing.status='SCHEDULED'
      ) then
        begin
          if r.professional_id is not null then
            perform pg_advisory_xact_lock(hashtextextended(r.professional_id::text,0));
            if not public.professional_is_available(
              r.organization_id,r.professional_id,r.activity_id,v_start,v_end,null
            ) then raise exception 'Professional is not available'; end if;
          end if;

          v_allocated:=public.allocate_activity_resources(
            r.organization_id,r.activity_id,v_start,v_end,null
          );

          insert into public.appointments(
            organization_id,schedule_rule_id,customer_id,customer_subscription_id,
            activity_id,professional_id,starts_at,ends_at,status,source
          ) values (
            r.organization_id,r.id,r.customer_id,r.customer_subscription_id,r.activity_id,
            r.professional_id,v_start,v_end,'SCHEDULED','RECURRENCE'
          ) returning id into v_appointment_id;

          foreach v_resource_id in array v_allocated loop
            insert into public.appointment_resources(
              organization_id,appointment_id,resource_id,starts_at,ends_at,status
            ) values (
              r.organization_id,v_appointment_id,v_resource_id,v_start,v_end,'SCHEDULED'
            );
          end loop;

          update public.schedule_generation_conflicts
          set resolved_at=now()
          where schedule_rule_id=r.id and starts_at=v_start and resolved_at is null;

          v_inserted:=v_inserted+1;
        exception
          when unique_violation or exclusion_violation then
            insert into public.schedule_generation_conflicts(
              organization_id,schedule_rule_id,starts_at,ends_at,reason,resolved_at
            ) values (r.organization_id,r.id,v_start,v_end,'CAPACITY_CONFLICT',null)
            on conflict(schedule_rule_id,starts_at)
            do update set ends_at=excluded.ends_at,reason=excluded.reason,resolved_at=null;
          when others then
            insert into public.schedule_generation_conflicts(
              organization_id,schedule_rule_id,starts_at,ends_at,reason,resolved_at
            ) values (r.organization_id,r.id,v_start,v_end,'CAPACITY_CONFLICT',null)
            on conflict(schedule_rule_id,starts_at)
            do update set ends_at=excluded.ends_at,reason=excluded.reason,resolved_at=null;
        end;
      end if;
    end if;
    v_date:=v_date+1;
  end loop;

  return v_inserted;
end;
$$;

-- =============================================================================
-- 10) RESCHEDULE: RELEASE OLD RESOURCES AND REALLOCATE FROM THE POOL
-- =============================================================================
create or replace function public.reschedule_scheduling_appointment(
  p_appointment_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_professional_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments%rowtype;
  v_activity public.activities%rowtype;
  v_allocated uuid[];
  v_resource_id uuid;
begin
  select * into v_appointment from public.appointments a where a.id=p_appointment_id;
  if v_appointment.id is null then raise exception 'Appointment not found'; end if;
  if not public.user_has_permission(v_appointment.organization_id,'SCHEDULING_RESCHEDULE') then raise exception 'forbidden'; end if;
  if v_appointment.status<>'SCHEDULED' then raise exception 'Only scheduled appointments can be rescheduled'; end if;
  if p_ends_at<=p_starts_at then raise exception 'Invalid appointment interval'; end if;
  if p_starts_at<=now() then raise exception 'Appointments cannot be scheduled in the past'; end if;

  select * into v_activity from public.activities a
  where a.id=v_appointment.activity_id and a.organization_id=v_appointment.organization_id;

  if v_activity.professional_requirement='REQUIRED' and p_professional_id is null then raise exception 'Professional is required'; end if;

  if p_professional_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_professional_id::text,0));
    if not public.professional_is_available(
      v_appointment.organization_id,p_professional_id,v_appointment.activity_id,
      p_starts_at,p_ends_at,p_appointment_id
    ) then raise exception 'Professional is not available for this service/date/time'; end if;
  end if;

  v_allocated:=public.allocate_activity_resources(
    v_appointment.organization_id,v_appointment.activity_id,p_starts_at,p_ends_at,p_appointment_id
  );

  delete from public.appointment_resources where appointment_id=p_appointment_id;

  foreach v_resource_id in array v_allocated loop
    insert into public.appointment_resources(
      organization_id,appointment_id,resource_id,starts_at,ends_at,status
    ) values (
      v_appointment.organization_id,p_appointment_id,v_resource_id,p_starts_at,p_ends_at,'SCHEDULED'
    );
  end loop;

  update public.appointments
  set starts_at=p_starts_at,
      ends_at=p_ends_at,
      professional_id=p_professional_id,
      source='RESCHEDULE',
      attendance_status='PENDING',
      cancellation_reason=null,
      cancelled_at=null
  where id=p_appointment_id;
end;
$$;

revoke all on function public.reschedule_scheduling_appointment(uuid,timestamptz,timestamptz,uuid) from public, anon;
grant execute on function public.reschedule_scheduling_appointment(uuid,timestamptz,timestamptz,uuid) to authenticated;
