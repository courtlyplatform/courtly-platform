-- COURTLY - International multi-tenant organization profile

alter table public.organizations
    add column if not exists display_name varchar(150),
    add column if not exists legal_name varchar(200),
    add column if not exists country_code varchar(2),
    add column if not exists currency_code varchar(3),
    add column if not exists default_locale varchar(10) not null default 'pt-BR',
    add column if not exists registration_type varchar(40),
    add column if not exists registration_number varchar(80),
    add column if not exists contact_email varchar(255),
    add column if not exists reply_to_email varchar(255),
    add column if not exists phone_country_code varchar(8),
    add column if not exists phone_number varchar(40),
    add column if not exists website_url varchar(500),
    add column if not exists address_line_1 varchar(255),
    add column if not exists address_line_2 varchar(255),
    add column if not exists city varchar(120),
    add column if not exists region varchar(120),
    add column if not exists postal_code varchar(40),
    add column if not exists logo_url text,
    add column if not exists primary_color varchar(7) not null default '#3FAF95',
    add column if not exists secondary_color varchar(7) not null default '#0E342C',
    add column if not exists custom_domain varchar(255),
    add column if not exists custom_domain_status varchar(30) not null default 'NOT_CONFIGURED',
    add column if not exists custom_email_domain varchar(255),
    add column if not exists custom_email_domain_status varchar(30) not null default 'NOT_CONFIGURED';

update public.organizations
set
    display_name = coalesce(display_name, name),
    country_code = coalesce(country_code, case when country::text = 'OTHER' then 'BR' else country::text end),
    currency_code = coalesce(currency_code, default_currency::text),
    phone_number = coalesce(phone_number, phone)
where display_name is null
   or country_code is null
   or currency_code is null
   or phone_number is null;

alter table public.organizations
    alter column display_name set not null,
    alter column country_code set not null,
    alter column currency_code set not null;

alter table public.organizations
    drop constraint if exists organizations_country_code_format,
    add constraint organizations_country_code_format check (country_code ~ '^[A-Z]{2}$'),
    drop constraint if exists organizations_currency_code_format,
    add constraint organizations_currency_code_format check (currency_code ~ '^[A-Z]{3}$'),
    drop constraint if exists organizations_locale_supported,
    add constraint organizations_locale_supported check (default_locale in ('pt-BR','en-US')),
    drop constraint if exists organizations_primary_color_format,
    add constraint organizations_primary_color_format check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
    drop constraint if exists organizations_secondary_color_format,
    add constraint organizations_secondary_color_format check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
    drop constraint if exists organizations_custom_domain_status_check,
    add constraint organizations_custom_domain_status_check check (custom_domain_status in ('NOT_CONFIGURED','PENDING','VERIFIED','FAILED')),
    drop constraint if exists organizations_custom_email_domain_status_check,
    add constraint organizations_custom_email_domain_status_check check (custom_email_domain_status in ('NOT_CONFIGURED','PENDING','VERIFIED','FAILED'));

create unique index if not exists uq_organizations_slug_ci
    on public.organizations (lower(slug));

create table if not exists public.organization_settings (
    organization_id uuid primary key references public.organizations(id) on delete cascade,
    week_starts_on smallint not null default 0 check (week_starts_on between 0 and 6),
    time_format varchar(2) not null default '24' check (time_format in ('12','24')),
    default_booking_notice_minutes integer not null default 0 check (default_booking_notice_minutes >= 0),
    default_booking_horizon_days integer not null default 60 check (default_booking_horizon_days > 0),
    default_cancellation_notice_minutes integer not null default 120 check (default_cancellation_notice_minutes >= 0),
    default_reschedule_notice_minutes integer not null default 120 check (default_reschedule_notice_minutes >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into public.organization_settings (organization_id)
select o.id from public.organizations o
on conflict (organization_id) do nothing;

alter table public.organization_settings enable row level security;

drop trigger if exists organization_settings_set_updated_at on public.organization_settings;
create trigger organization_settings_set_updated_at
before update on public.organization_settings
for each row execute function public.set_updated_at();


drop policy if exists "members_can_read_organization_settings" on public.organization_settings;
create policy "members_can_read_organization_settings"
on public.organization_settings for select to authenticated
using (public.is_organization_member(organization_id));

drop policy if exists "owners_can_update_organization_settings" on public.organization_settings;
create policy "owners_can_update_organization_settings"
on public.organization_settings for update to authenticated
using (public.is_organization_owner(organization_id))
with check (public.is_organization_owner(organization_id));

drop policy if exists "owners_can_update_organization" on public.organizations;
create policy "owners_can_update_organization"
on public.organizations for update to authenticated
using (public.is_organization_owner(id))
with check (public.is_organization_owner(id));

create or replace function public.ensure_organization_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    insert into public.organization_settings (organization_id)
    values (new.id)
    on conflict (organization_id) do nothing;
    return new;
end;
$$;

drop trigger if exists organizations_ensure_general_settings on public.organizations;
create trigger organizations_ensure_general_settings
after insert on public.organizations
for each row execute function public.ensure_organization_settings();

-- Remove the previous onboarding overload.
drop function if exists public.create_organization_onboarding(
    text, text, public.organization_business_type, text,
    public.organization_country, text, public.organization_currency
);

create or replace function public.create_organization_onboarding(
    p_display_name text,
    p_legal_name text,
    p_professional_name text,
    p_business_type public.organization_business_type,
    p_country_code text,
    p_timezone text,
    p_default_locale text,
    p_currency_code text,
    p_slug text,
    p_registration_type text,
    p_registration_number text,
    p_contact_email text,
    p_reply_to_email text,
    p_phone_country_code text,
    p_phone_number text,
    p_website_url text,
    p_address_line_1 text,
    p_address_line_2 text,
    p_city text,
    p_region text,
    p_postal_code text,
    p_primary_color text,
    p_secondary_color text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_organization_id uuid;
    v_slug text;
    v_legacy_country public.organization_country;
    v_legacy_currency public.organization_currency;
begin
    if v_user_id is null then raise exception 'User is not authenticated'; end if;
    if exists (select 1 from public.memberships m where m.user_id = v_user_id) then
        raise exception 'User already belongs to an organization';
    end if;
    if exists (select 1 from public.customers c where c.user_id = v_user_id) then
        raise exception 'Customer accounts cannot create an organization through this onboarding';
    end if;
    if exists (select 1 from public.professionals p where p.user_id = v_user_id) then
        raise exception 'Professional accounts cannot create an organization through this onboarding';
    end if;

    if nullif(trim(p_display_name),'') is null then raise exception 'Organization display name is required'; end if;
    if nullif(trim(p_professional_name),'') is null then raise exception 'Professional name is required'; end if;
    if p_country_code !~ '^[A-Z]{2}$' then raise exception 'Invalid country code'; end if;
    if p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Invalid currency code'; end if;
    if p_default_locale not in ('pt-BR','en-US') then raise exception 'Invalid locale'; end if;
    if nullif(trim(p_timezone),'') is null then raise exception 'Timezone is required'; end if;

    v_slug := lower(regexp_replace(trim(p_slug), '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    if v_slug = '' then raise exception 'Invalid slug'; end if;
    if exists (select 1 from public.organizations o where lower(o.slug) = lower(v_slug)) then
        v_slug := v_slug || '-' || substring(v_user_id::text,1,8);
    end if;

    v_legacy_country := case p_country_code
        when 'BR' then 'BR'::public.organization_country
        when 'US' then 'US'::public.organization_country
        when 'PT' then 'PT'::public.organization_country
        when 'CA' then 'CA'::public.organization_country
        else 'OTHER'::public.organization_country end;

    v_legacy_currency := case p_currency_code
        when 'BRL' then 'BRL'::public.organization_currency
        when 'USD' then 'USD'::public.organization_currency
        when 'EUR' then 'EUR'::public.organization_currency
        when 'CAD' then 'CAD'::public.organization_currency
        else 'USD'::public.organization_currency end;

    insert into public.organizations (
        name, display_name, legal_name, slug, business_type,
        country, country_code, timezone, default_currency, currency_code, default_locale,
        registration_type, registration_number, contact_email, reply_to_email,
        phone, phone_country_code, phone_number, website_url,
        address_line_1, address_line_2, city, region, postal_code,
        primary_color, secondary_color, status
    ) values (
        trim(p_display_name), trim(p_display_name), nullif(trim(p_legal_name),''), v_slug, p_business_type,
        v_legacy_country, p_country_code, trim(p_timezone), v_legacy_currency, p_currency_code, p_default_locale,
        nullif(trim(p_registration_type),''), nullif(trim(p_registration_number),''), nullif(trim(p_contact_email),''), nullif(trim(p_reply_to_email),''),
        nullif(trim(p_phone_number),''), nullif(trim(p_phone_country_code),''), nullif(trim(p_phone_number),''), nullif(trim(p_website_url),''),
        nullif(trim(p_address_line_1),''), nullif(trim(p_address_line_2),''), nullif(trim(p_city),''), nullif(trim(p_region),''), nullif(trim(p_postal_code),''),
        coalesce(nullif(trim(p_primary_color),''),'#3FAF95'), coalesce(nullif(trim(p_secondary_color),''),'#0E342C'), 'ACTIVE'
    ) returning id into v_organization_id;

    insert into public.memberships (organization_id, user_id, role)
    values (v_organization_id, v_user_id, 'OWNER');

    insert into public.professionals (organization_id, user_id, name, email, phone, active)
    select v_organization_id, v_user_id, trim(p_professional_name), u.email, nullif(trim(p_phone_number),''), true
    from auth.users u where u.id = v_user_id;

    return v_organization_id;
end;
$$;

revoke all on function public.create_organization_onboarding(
    text,text,text,public.organization_business_type,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text
) from public, anon;

grant execute on function public.create_organization_onboarding(
    text,text,text,public.organization_business_type,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text
) to authenticated;
