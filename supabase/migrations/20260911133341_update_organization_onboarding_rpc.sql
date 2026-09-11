-- ============================================================
-- COURTLY
-- Update Organization Onboarding RPC
--
-- Purpose:
-- Evolves the organization onboarding flow to:
--
--   1. Persist the organization's business configuration.
--   2. Keep OWNER assignment exclusively on the backend.
--   3. Prevent existing members, customers and professionals
--      from using this flow to create an OWNER organization.
--   4. Remove the previous RPC signature.
-- ============================================================


-- ============================================================
-- 1. REMOVE EXECUTION FROM THE OLD RPC
-- ============================================================

revoke all
on function public.create_organization_onboarding(text, text)
from public;

revoke all
on function public.create_organization_onboarding(text, text)
from anon;

revoke all
on function public.create_organization_onboarding(text, text)
from authenticated;


-- ============================================================
-- 2. REMOVE OLD RPC
-- ============================================================

drop function if exists
public.create_organization_onboarding(text, text);


-- ============================================================
-- 3. CREATE THE NEW RPC
-- ============================================================

create function public.create_organization_onboarding(
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
begin

    -- ========================================================
    -- AUTHENTICATION
    -- ========================================================

    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'User is not authenticated';
    end if;


    -- ========================================================
    -- AUTHORIZATION
    --
    -- This public onboarding flow is exclusively for users
    -- creating their first organization as OWNER.
    -- ========================================================

    if exists (
        select 1
        from public.memberships m
        where m.user_id = v_user_id
    ) then
        raise exception
            'User already belongs to an organization';
    end if;


    -- A user already linked to a customer must never use
    -- the public organization onboarding to become OWNER.

    if exists (
        select 1
        from public.customers c
        where c.user_id = v_user_id
    ) then
        raise exception
            'Customer accounts cannot create an organization through this onboarding';
    end if;


    -- The same protection applies to professionals who were
    -- already linked/invited into an existing organization.

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


    -- Phone is optional.
    -- Empty strings are normalized to NULL.

    p_phone := nullif(
        trim(p_phone),
        ''
    );


    -- ========================================================
    -- UNIQUE ORGANIZATION SLUG
    -- ========================================================

    v_slug :=
        lower(
            regexp_replace(
                trim(p_organization_name),
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
        trim(p_organization_name),
        v_slug,
        p_business_type,
        p_phone,
        p_country,
        trim(p_timezone),
        p_default_currency,
        'ACTIVE'
    )
    returning id
    into v_organization_id;


    -- ========================================================
    -- CREATE OWNER MEMBERSHIP
    --
    -- IMPORTANT:
    -- OWNER is never supplied by the frontend.
    -- This RPC is the only component deciding the role.
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
    -- CREATE OWNER PROFESSIONAL RECORD
    -- ========================================================

    insert into public.professionals (
        organization_id,
        user_id,
        name,
        email,
        phone,
        active
    )
    select
        v_organization_id,
        v_user_id,
        trim(p_professional_name),
        u.email,
        p_phone,
        true
    from auth.users u
    where u.id = v_user_id;


    -- ========================================================
    -- RETURN CREATED ORGANIZATION
    -- ========================================================

    return v_organization_id;

end;
$$;


-- ============================================================
-- 4. PERMISSIONS
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