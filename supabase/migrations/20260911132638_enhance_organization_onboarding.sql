-- ============================================================
-- COURTLY
-- Enhance Organization Onboarding
--
-- Purpose:
-- Adds business configuration fields required during the
-- organization onboarding flow.
--
-- Important:
-- Pricing does NOT belong to the organization or customer.
-- The currency stored here is only the organization's default
-- currency for future commercial operations.
-- ============================================================


-- ============================================================
-- 1. ORGANIZATION BUSINESS TYPE
-- ============================================================

create type public.organization_business_type as enum (
    'ACADEMY',
    'CLUB',
    'STUDIO',
    'INDEPENDENT_PROFESSIONAL',
    'CLINIC',
    'OTHER'
);


-- ============================================================
-- 2. ORGANIZATION COUNTRY
-- ============================================================

create type public.organization_country as enum (
    'BR',
    'US',
    'PT',
    'CA',
    'OTHER'
);


-- ============================================================
-- 3. ORGANIZATION DEFAULT CURRENCY
-- ============================================================

create type public.organization_currency as enum (
    'BRL',
    'USD',
    'EUR',
    'CAD'
);


-- ============================================================
-- 4. ADD BUSINESS CONFIGURATION TO ORGANIZATIONS
-- ============================================================

alter table public.organizations
add column business_type
    public.organization_business_type,

add column phone
    varchar(30),

add column country
    public.organization_country
    not null
    default 'BR',

add column default_currency
    public.organization_currency
    not null
    default 'BRL';


-- ============================================================
-- 5. PHONE VALIDATION
-- ============================================================

alter table public.organizations
add constraint organizations_phone_not_blank
check (
    phone is null
    or length(trim(phone)) > 0
);


-- ============================================================
-- 6. COMMENTS
-- ============================================================

comment on column public.organizations.business_type is
'Primary business category of the organization.';

comment on column public.organizations.phone is
'Main contact phone or WhatsApp number of the organization.';

comment on column public.organizations.country is
'Country where the organization primarily operates.';

comment on column public.organizations.default_currency is
'Default currency used when creating future commercial records. This is not a customer price.';