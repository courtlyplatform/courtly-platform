-- COURTLY
-- Fix: international onboarding RPC was recreated without the required
-- professionals.first_name / professionals.last_name fields.
-- This migration preserves the international multi-tenant onboarding signature
-- and restores compatibility with the Professionals domain.

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
    v_professional_name text;
    v_first_name text;
    v_last_name text;
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

    -- Professionals requires first_name and last_name to be NOT NULL.
    -- Keep the legacy full name while also populating the normalized identity fields.
    v_professional_name := trim(regexp_replace(p_professional_name, '\s+', ' ', 'g'));
    v_first_name := split_part(v_professional_name, ' ', 1);

    if position(' ' in v_professional_name) > 0 then
        v_last_name := trim(substring(v_professional_name from position(' ' in v_professional_name) + 1));
    else
        v_last_name := '';
    end if;

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

    insert into public.professionals (
        organization_id, user_id, name, first_name, last_name,
        email, phone, active, access_status
    )
    select
        v_organization_id, v_user_id, v_professional_name, v_first_name, v_last_name,
        u.email, nullif(trim(p_phone_number),''), true,
        'ACTIVE'::public.professional_access_status
    from auth.users u
    where u.id = v_user_id;

    return v_organization_id;
end;
$$;


revoke all on function public.create_organization_onboarding(
    text,text,text,public.organization_business_type,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text
) from public, anon;

grant execute on function public.create_organization_onboarding(
    text,text,text,public.organization_business_type,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text
) to authenticated;
