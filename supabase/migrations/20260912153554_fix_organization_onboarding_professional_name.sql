-- ============================================================
-- COURTLY
-- Fix Organization Onboarding after Professionals Domain
--
-- Cause:
-- The professionals domain made professionals.first_name and
-- professionals.last_name NOT NULL. The existing onboarding RPC
-- still inserted only the legacy `name` field, so organization
-- creation failed when it attempted to create the OWNER's
-- professional record.
-- ============================================================

create or replace function public.create_organization_onboarding(
    p_organization_name text,
    p_professional_name text,
    p_business_type public.organization_business_type,
    p_phone text,
    p_country public.organization_country,
    p_timezone text,
    p_default_currency public.organization_currency
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid;
    v_organization_id uuid;
    v_slug text;

    v_professional_name text;
    v_first_name text;
    v_last_name text;
begin

    -- ========================================================
    -- AUTHENTICATION
    -- ========================================================

    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception
            'User is not authenticated';
    end if;


    -- ========================================================
    -- AUTHORIZATION
    -- ========================================================

    if exists (
        select 1
        from public.memberships m
        where m.user_id = v_user_id
    ) then
        raise exception
            'User already belongs to an organization';
    end if;


    if exists (
        select 1
        from public.customers c
        where c.user_id = v_user_id
    ) then
        raise exception
            'Customer accounts cannot create an organization through this onboarding';
    end if;


    if exists (
        select 1
        from public.professionals p
        where p.user_id = v_user_id
    ) then
        raise exception
            'Professional accounts cannot create an organization through this onboarding';
    end if;


    -- ========================================================
    -- INPUT VALIDATION
    -- ========================================================

    if p_organization_name is null
       or trim(p_organization_name) = '' then
        raise exception
            'Organization name is required';
    end if;


    if p_professional_name is null
       or trim(p_professional_name) = '' then
        raise exception
            'Professional name is required';
    end if;


    if p_business_type is null then
        raise exception
            'Business type is required';
    end if;


    if p_country is null then
        raise exception
            'Country is required';
    end if;


    if p_timezone is null
       or trim(p_timezone) = '' then
        raise exception
            'Timezone is required';
    end if;


    if p_default_currency is null then
        raise exception
            'Default currency is required';
    end if;


    p_phone := nullif(
        trim(p_phone),
        ''
    );


    -- ========================================================
    -- PROFESSIONAL NAME NORMALIZATION
    -- ========================================================

    v_professional_name :=
        trim(
            regexp_replace(
                p_professional_name,
                '\s+',
                ' ',
                'g'
            )
        );


    v_first_name :=
        split_part(
            v_professional_name,
            ' ',
            1
        );


    if position(
        ' ' in v_professional_name
    ) > 0 then

        v_last_name :=
            trim(
                substring(
                    v_professional_name
                    from
                    position(
                        ' ' in v_professional_name
                    ) + 1
                )
            );

    else

        v_last_name := '';

    end if;


    -- ========================================================
    -- UNIQUE ORGANIZATION SLUG
    -- ========================================================

    v_slug :=
        lower(
            regexp_replace(
                trim(
                    p_organization_name
                ),
                '[^a-zA-Z0-9]+',
                '-',
                'g'
            )
        )
        || '-'
        || substring(
            v_user_id::text,
            1,
            8
        );


    -- ========================================================
    -- CREATE ORGANIZATION
    -- ========================================================

    insert into public.organizations (
        name,
        slug,
        business_type,
        phone,
        country,
        timezone,
        default_currency,
        status
    )
    values (
        trim(
            p_organization_name
        ),
        v_slug,
        p_business_type,
        p_phone,
        p_country,
        trim(
            p_timezone
        ),
        p_default_currency,
        'ACTIVE'
    )
    returning id
    into v_organization_id;


    -- ========================================================
    -- CREATE OWNER MEMBERSHIP
    -- ========================================================

    insert into public.memberships (
        organization_id,
        user_id,
        role
    )
    values (
        v_organization_id,
        v_user_id,
        'OWNER'
    );


    -- ========================================================
    -- CREATE OWNER PROFESSIONAL
    -- ========================================================

    insert into public.professionals (
        organization_id,
        user_id,
        name,
        first_name,
        last_name,
        email,
        phone,
        active,
        access_status
    )
    select
        v_organization_id,
        v_user_id,
        v_professional_name,
        v_first_name,
        v_last_name,
        u.email,
        p_phone,
        true,
        'ACTIVE'::public.professional_access_status
    from auth.users u
    where u.id = v_user_id;


    if not found then
        raise exception
            'Authenticated user could not be loaded';
    end if;


    return v_organization_id;

end;
$$;


-- ============================================================
-- PERMISSIONS
-- ============================================================

revoke all
on function public.create_organization_onboarding(
    text,
    text,
    public.organization_business_type,
    text,
    public.organization_country,
    text,
    public.organization_currency
)
from public;


revoke all
on function public.create_organization_onboarding(
    text,
    text,
    public.organization_business_type,
    text,
    public.organization_country,
    text,
    public.organization_currency
)
from anon;


grant execute
on function public.create_organization_onboarding(
    text,
    text,
    public.organization_business_type,
    text,
    public.organization_country,
    text,
    public.organization_currency
)
to authenticated;