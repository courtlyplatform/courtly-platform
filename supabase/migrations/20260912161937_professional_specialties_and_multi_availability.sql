-- Professional specialties metadata + support for multiple availability intervals per weekday.
-- The availability table already supported multiple rows/day; this migration adds guardrails and specialty metadata.

do $$ begin
  create type public.professional_specialty_area as enum (
    'HEALTHCARE','DENTISTRY','FITNESS','SPORTS','THERAPY','BEAUTY','WELLNESS','EDUCATION','OTHER'
  );
exception when duplicate_object then null; end $$;

alter table public.professional_specialties
  add column if not exists area public.professional_specialty_area not null default 'OTHER',
  add column if not exists color varchar(7) not null default '#46B99A';

alter table public.professional_specialties
  drop constraint if exists professional_specialties_color_hex,
  add constraint professional_specialties_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$');

create index if not exists idx_professional_specialties_org_area_active
  on public.professional_specialties(organization_id, area, active);

create index if not exists idx_professional_availability_professional_weekday_time
  on public.professional_availability_rules(organization_id, professional_id, weekday, start_time, end_time)
  where active = true;

create or replace function public.prevent_professional_availability_overlap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.active and exists (
    select 1
    from public.professional_availability_rules ar
    where ar.organization_id = new.organization_id
      and ar.professional_id = new.professional_id
      and ar.weekday = new.weekday
      and ar.active = true
      and ar.id <> new.id
      and new.start_time < ar.end_time
      and new.end_time > ar.start_time
  ) then
    raise exception 'Professional availability intervals cannot overlap on the same weekday';
  end if;
  return new;
end;
$$;

drop trigger if exists professional_availability_prevent_overlap on public.professional_availability_rules;
create trigger professional_availability_prevent_overlap
before insert or update of weekday, start_time, end_time, active, professional_id
on public.professional_availability_rules
for each row execute function public.prevent_professional_availability_overlap();
