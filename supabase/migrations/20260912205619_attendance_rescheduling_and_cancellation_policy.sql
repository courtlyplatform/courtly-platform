-- COURTLY — Attendance, rescheduling and cancellation policy
-- Adds a customer confirmation state to appointments, enforces that new manual
-- bookings/reschedules are future-dated and centralizes the configurable
-- cancellation deadline already stored in organization_scheduling_settings.

alter table public.appointments
  add column if not exists attendance_status text not null default 'PENDING';

alter table public.appointments
  drop constraint if exists appointments_attendance_status_check;

alter table public.appointments
  add constraint appointments_attendance_status_check
  check (attendance_status in ('PENDING','CONFIRMED','CANCELLED'));

update public.appointments
set attendance_status = 'CANCELLED'
where status = 'CANCELLED'
  and attendance_status <> 'CANCELLED';

create index if not exists idx_appointments_org_attendance_starts
  on public.appointments (organization_id, attendance_status, starts_at);

-- Manual/rescheduled appointments can never be persisted in the past.
-- RECURRENCE is deliberately excluded so legacy rolling-window generation does
-- not abort while scanning the current date.
create or replace function public.reject_past_manual_appointment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'SCHEDULED'
     and new.source in ('MANUAL','MAKEUP','RESCHEDULE')
     and new.starts_at <= now() then
    raise exception 'Appointments cannot be scheduled in the past';
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_reject_past_manual on public.appointments;
create trigger appointments_reject_past_manual
before insert or update of starts_at, status, source on public.appointments
for each row execute function public.reject_past_manual_appointment();

create or replace function public.cancel_scheduling_appointment(
  p_appointment_id uuid,
  p_reason text default 'MANUAL_CANCELLATION'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments%rowtype;
  v_cancel_window integer;
begin
  select * into v_appointment
  from public.appointments a
  where a.id = p_appointment_id;

  if v_appointment.id is null then
    raise exception 'Appointment not found';
  end if;

  if not (
    public.user_has_permission(v_appointment.organization_id, 'SCHEDULING_EDIT')
    or public.user_has_permission(v_appointment.organization_id, 'SCHEDULING_RESCHEDULE')
  ) then
    raise exception 'forbidden';
  end if;

  if v_appointment.status <> 'SCHEDULED' then
    raise exception 'Only scheduled appointments can be cancelled';
  end if;

  select coalesce(s.late_cancellation_window_minutes, 120)
  into v_cancel_window
  from public.organization_scheduling_settings s
  where s.organization_id = v_appointment.organization_id;

  v_cancel_window := coalesce(v_cancel_window, 120);

  if now() > v_appointment.starts_at - make_interval(mins => v_cancel_window) then
    raise exception 'Cancellation deadline has passed';
  end if;

  update public.appointments
  set status = 'CANCELLED',
      attendance_status = 'CANCELLED',
      cancelled_at = now(),
      cancellation_reason = nullif(trim(coalesce(p_reason,'')), '')
  where id = p_appointment_id;

  update public.appointment_resources
  set status = 'CANCELLED'
  where appointment_id = p_appointment_id
    and status = 'SCHEDULED';
end;
$$;

revoke all on function public.cancel_scheduling_appointment(uuid,text) from public, anon;
grant execute on function public.cancel_scheduling_appointment(uuid,text) to authenticated;

create or replace function public.set_appointment_attendance_status(
  p_appointment_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  if p_status not in ('PENDING','CONFIRMED') then
    raise exception 'Invalid attendance status';
  end if;

  select organization_id into v_org
  from public.appointments
  where id = p_appointment_id;

  if v_org is null then raise exception 'Appointment not found'; end if;
  if not public.user_has_permission(v_org, 'ATTENDANCE_MANAGE') then
    raise exception 'forbidden';
  end if;

  update public.appointments
  set attendance_status = p_status
  where id = p_appointment_id
    and status = 'SCHEDULED';
end;
$$;

revoke all on function public.set_appointment_attendance_status(uuid,text) from public, anon;
grant execute on function public.set_appointment_attendance_status(uuid,text) to authenticated;

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
  v_prof_req public.scheduling_requirement;
begin
  select * into v_appointment
  from public.appointments a
  where a.id = p_appointment_id;

  if v_appointment.id is null then raise exception 'Appointment not found'; end if;
  if not public.user_has_permission(v_appointment.organization_id, 'SCHEDULING_RESCHEDULE') then
    raise exception 'forbidden';
  end if;
  if v_appointment.status <> 'SCHEDULED' then
    raise exception 'Only scheduled appointments can be rescheduled';
  end if;
  if p_ends_at <= p_starts_at then raise exception 'Invalid appointment interval'; end if;
  if p_starts_at <= now() then raise exception 'Appointments cannot be scheduled in the past'; end if;

  select professional_requirement into v_prof_req
  from public.activities
  where id = v_appointment.activity_id
    and organization_id = v_appointment.organization_id;

  if v_prof_req = 'REQUIRED' and p_professional_id is null then
    raise exception 'Professional is required';
  end if;

  if p_professional_id is not null and not public.professional_is_available(
    v_appointment.organization_id,
    p_professional_id,
    v_appointment.activity_id,
    p_starts_at,
    p_ends_at,
    p_appointment_id
  ) then
    raise exception 'Professional is not available for this service/date/time';
  end if;

  -- Keep the same resources and move their reservations atomically. Existing
  -- exclusion constraints remain the final guard against double booking.
  update public.appointment_resources
  set starts_at = p_starts_at,
      ends_at = p_ends_at
  where appointment_id = p_appointment_id
    and status = 'SCHEDULED';

  update public.appointments
  set starts_at = p_starts_at,
      ends_at = p_ends_at,
      professional_id = p_professional_id,
      source = 'RESCHEDULE',
      attendance_status = 'PENDING',
      cancellation_reason = null,
      cancelled_at = null
  where id = p_appointment_id;
end;
$$;

revoke all on function public.reschedule_scheduling_appointment(uuid,timestamptz,timestamptz,uuid) from public, anon;
grant execute on function public.reschedule_scheduling_appointment(uuid,timestamptz,timestamptz,uuid) to authenticated;
