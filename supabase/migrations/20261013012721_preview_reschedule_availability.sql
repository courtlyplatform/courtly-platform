-- Preview the exact authoritative rescheduling operation without committing any changes.
-- The deliberate exception rolls back all writes performed inside the inner block.
create or replace function public.preview_reschedule_scheduling_appointment(
  p_appointment_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_professional_id uuid default null
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_message text;
begin
  begin
    perform public.reschedule_scheduling_appointment(p_appointment_id,p_starts_at,p_ends_at,p_professional_id);
    raise exception using message = '__courtly_preview_rollback__';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message = '__courtly_preview_rollback__' then
      return jsonb_build_object('available',true,'reason','available');
    end if;
    if v_message ilike '%professional%not available%' then
      return jsonb_build_object('available',false,'reason','professionalUnavailable');
    elsif v_message ilike '%resource%' or v_message ilike '%pool%' or v_message ilike '%capacity%' then
      return jsonb_build_object('available',false,'reason','resourceUnavailable');
    elsif v_message ilike '%professional%required%' then
      return jsonb_build_object('available',false,'reason','professionalRequired');
    elsif v_message ilike '%past%' then
      return jsonb_build_object('available',false,'reason','pastAppointment');
    elsif v_message ilike '%interval%' then
      return jsonb_build_object('available',false,'reason','invalidInterval');
    elsif v_message ilike '%forbidden%' then
      return jsonb_build_object('available',false,'reason','forbidden');
    elsif v_message ilike '%not found%' or v_message ilike '%scheduled appointments%' then
      return jsonb_build_object('available',false,'reason','appointmentUnavailable');
    end if;
    return jsonb_build_object('available',false,'reason','unknown');
  end;
end;
$$;
revoke all on function public.preview_reschedule_scheduling_appointment(uuid,timestamptz,timestamptz,uuid) from public, anon;
grant execute on function public.preview_reschedule_scheduling_appointment(uuid,timestamptz,timestamptz,uuid) to authenticated;
