-- Courtly: group appointments, capacity snapshots, per-participant attendance,
-- appointment-level settlement and availability support.

alter table public.activities
  add column if not exists attendance_mode text not null default 'INDIVIDUAL',
  add column if not exists max_participants integer,
  add column if not exists sessions_per_week integer;

alter table public.activities drop constraint if exists activities_attendance_mode_check;
alter table public.activities add constraint activities_attendance_mode_check check (attendance_mode in ('INDIVIDUAL','GROUP','FLEXIBLE'));
alter table public.activities drop constraint if exists activities_max_participants_check;
alter table public.activities add constraint activities_max_participants_check check (max_participants is null or max_participants > 0);
alter table public.activities drop constraint if exists activities_sessions_per_week_check;
alter table public.activities add constraint activities_sessions_per_week_check check (sessions_per_week is null or sessions_per_week between 1 and 14);

update public.activities set max_participants = 1 where attendance_mode = 'INDIVIDUAL' and max_participants is null;

alter table public.appointments
  add column if not exists capacity integer,
  add column if not exists payment_status text not null default 'PENDING',
  add column if not exists paid_at timestamptz,
  add column if not exists paid_amount numeric(14,2),
  add column if not exists payment_reference text;

alter table public.appointments drop constraint if exists appointments_capacity_check;
alter table public.appointments add constraint appointments_capacity_check check (capacity is null or capacity > 0);
alter table public.appointments drop constraint if exists appointments_payment_status_check;
alter table public.appointments add constraint appointments_payment_status_check check (payment_status in ('PENDING','PAID','CANCELLED'));

update public.appointments a
set capacity = coalesce(s.max_participants, 1)
from public.activities s
where s.id = a.activity_id and a.capacity is null;

create table if not exists public.appointment_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  attendance_status text not null default 'PENDING' check (attendance_status in ('PENDING','CONFIRMED','ABSENT','CANCELLED')),
  participant_status text not null default 'ACTIVE' check (participant_status in ('ACTIVE','CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, customer_id)
);
create index if not exists ix_appointment_participants_org on public.appointment_participants(organization_id);
create index if not exists ix_appointment_participants_customer on public.appointment_participants(customer_id, appointment_id);

-- Backfill every historical appointment with its original customer.
insert into public.appointment_participants(organization_id, appointment_id, customer_id, attendance_status, participant_status)
select a.organization_id, a.id, a.customer_id,
       case when a.attendance_status = 'CONFIRMED' then 'CONFIRMED' when a.status = 'CANCELLED' then 'CANCELLED' else 'PENDING' end,
       case when a.status = 'CANCELLED' then 'CANCELLED' else 'ACTIVE' end
from public.appointments a
where a.customer_id is not null
on conflict (appointment_id, customer_id) do nothing;

alter table public.appointment_participants enable row level security;
drop policy if exists appointment_participants_tenant on public.appointment_participants;
create policy appointment_participants_tenant on public.appointment_participants
for all to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

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
  v_id := public.create_scheduling_appointment(p_customer_ids[1], p_activity_id, p_customer_subscription_id, p_starts_at, p_ends_at, p_professional_id, p_resource_ids, p_source);
  update appointments set capacity=v_capacity where id=v_id;
  delete from appointment_participants where appointment_id=v_id;
  foreach v_customer in array p_customer_ids loop
    insert into appointment_participants(organization_id,appointment_id,customer_id) values(v_org,v_id,v_customer);
  end loop;
  return v_id;
end $$;

create or replace function public.set_appointment_participant_attendance_status(p_appointment_id uuid, p_customer_id uuid, p_status text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_status not in ('PENDING','CONFIRMED','ABSENT','CANCELLED') then raise exception 'invalidAttendanceStatus'; end if;
  if not exists (select 1 from public.appointments a where a.id=p_appointment_id and public.is_organization_member(a.organization_id)) then raise exception 'notAuthorized'; end if;
  update appointment_participants set attendance_status=p_status, updated_at=now()
  where appointment_id=p_appointment_id and customer_id=p_customer_id;
  if not found then raise exception 'participantNotFound'; end if;
end $$;

create or replace function public.settle_appointment_payment(p_appointment_id uuid, p_amount numeric default null, p_reference text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.appointments a where a.id=p_appointment_id and public.is_organization_member(a.organization_id)) then raise exception 'notAuthorized'; end if;
  if p_amount is not null and p_amount < 0 then raise exception 'invalidAmount'; end if;
  update appointments set payment_status='PAID', paid_at=now(), paid_amount=p_amount, payment_reference=nullif(trim(p_reference),'')
  where id=p_appointment_id and status <> 'CANCELLED';
  if not found then raise exception 'appointmentNotFoundOrCancelled'; end if;
end $$;

create or replace view public.appointment_capacity_view with (security_invoker = true) as
select a.id appointment_id, a.organization_id, a.activity_id, a.capacity,
       count(ap.id) filter(where ap.participant_status='ACTIVE')::int occupied,
       greatest(coalesce(a.capacity,1)-count(ap.id) filter(where ap.participant_status='ACTIVE'),0)::int available
from appointments a left join appointment_participants ap on ap.appointment_id=a.id
group by a.id;

grant select on public.appointment_capacity_view to authenticated;
grant execute on function public.create_group_scheduling_appointment(uuid[],uuid,uuid,timestamptz,timestamptz,uuid,uuid[],text) to authenticated;
grant execute on function public.set_appointment_participant_attendance_status(uuid,uuid,text) to authenticated;
grant execute on function public.settle_appointment_payment(uuid,numeric,text) to authenticated;

-- Restrict privileged RPCs to authenticated users only.
revoke all on function public.create_group_scheduling_appointment(uuid[],uuid,uuid,timestamptz,timestamptz,uuid,uuid[],text) from public, anon;
revoke all on function public.set_appointment_participant_attendance_status(uuid,uuid,text) from public, anon;
revoke all on function public.settle_appointment_payment(uuid,numeric,text) from public, anon;
grant select, insert, update, delete on public.appointment_participants to authenticated;
