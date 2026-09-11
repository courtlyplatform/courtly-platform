-- ============================================================
-- COURTLY
-- Financial Management - Foundation
--
-- Creates the core financial data model:
--   - expense_categories
--   - expense_recurrences
--   - financial_expenses
--   - financial_revenues
--   - financial_periods
--
-- Commercial contracts remain in customer_subscriptions.
-- Financial tables represent actual financial occurrences.
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

create type public.financial_entry_status as enum (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);

create type public.financial_revenue_source as enum (
    'SUBSCRIPTION',
    'MANUAL'
);

create type public.expense_recurrence_cycle as enum (
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'SEMIANNUAL',
    'ANNUAL'
);

create type public.financial_period_status as enum (
    'OPEN',
    'CLOSED'
);

-- ============================================================
-- 2. TENANT-SAFE KEYS REQUIRED BY THE FINANCIAL DOMAIN
-- ============================================================

alter table public.customer_subscriptions
add constraint customer_subscriptions_id_organization_unique
unique (
    id,
    organization_id
);

-- ============================================================
-- 3. EXPENSE CATEGORIES
-- ============================================================

create table public.expense_categories (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    -- Stable code used only by Courtly's default categories.
    -- Custom organization categories keep code = null.
    code varchar(50),

    name varchar(120) not null,

    description text,

    system boolean not null default false,

    active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint expense_categories_name_not_blank
        check (length(trim(name)) > 0),

    constraint expense_categories_code_not_blank
        check (
            code is null
            or length(trim(code)) > 0
        ),

    constraint expense_categories_id_organization_unique
        unique (
            id,
            organization_id
        )
);

create unique index uq_expense_categories_organization_name
on public.expense_categories (
    organization_id,
    lower(trim(name))
);

create unique index uq_expense_categories_organization_code
on public.expense_categories (
    organization_id,
    code
)
where code is not null;

create index idx_expense_categories_organization_active
on public.expense_categories (
    organization_id,
    active
);

-- ============================================================
-- 4. EXPENSE RECURRENCES
-- ============================================================

create table public.expense_recurrences (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    category_id uuid not null,

    description varchar(180) not null,

    amount numeric(12, 2) not null,

    currency_code public.organization_currency not null,

    recurrence_cycle public.expense_recurrence_cycle not null,

    starts_at date not null,

    -- Due date for the first occurrence. Future due dates preserve
    -- the same day offset relative to the recurrence reference date.
    first_due_date date not null,

    ends_at date,

    active boolean not null default true,

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint fk_expense_recurrences_category
        foreign key (
            category_id,
            organization_id
        )
        references public.expense_categories (
            id,
            organization_id
        )
        on delete restrict,

    constraint expense_recurrences_description_not_blank
        check (length(trim(description)) > 0),

    constraint expense_recurrences_amount_non_negative
        check (amount >= 0),

    constraint expense_recurrences_valid_period
        check (
            ends_at is null
            or ends_at >= starts_at
        ),

    constraint expense_recurrences_id_organization_unique
        unique (
            id,
            organization_id
        )
);

create index idx_expense_recurrences_organization_active
on public.expense_recurrences (
    organization_id,
    active
);

create index idx_expense_recurrences_category
on public.expense_recurrences (
    category_id
);

-- ============================================================
-- 5. FINANCIAL EXPENSES
-- ============================================================

create table public.financial_expenses (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    category_id uuid not null,

    recurrence_id uuid,

    description varchar(180) not null,

    amount numeric(12, 2) not null,

    currency_code public.organization_currency not null,

    -- Competence / occurrence date.
    reference_date date not null,

    due_date date not null,

    paid_at timestamptz,

    status public.financial_entry_status
        not null
        default 'PENDING',

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint fk_financial_expenses_category
        foreign key (
            category_id,
            organization_id
        )
        references public.expense_categories (
            id,
            organization_id
        )
        on delete restrict,

    constraint fk_financial_expenses_recurrence
        foreign key (
            recurrence_id,
            organization_id
        )
        references public.expense_recurrences (
            id,
            organization_id
        )
        on delete restrict,

    constraint financial_expenses_description_not_blank
        check (length(trim(description)) > 0),

    constraint financial_expenses_amount_non_negative
        check (amount >= 0),

    constraint financial_expenses_paid_status_consistency
        check (
            (
                status = 'PAID'
                and paid_at is not null
            )
            or
            (
                status <> 'PAID'
                and paid_at is null
            )
        )
);

create unique index uq_financial_expenses_recurrence_reference
on public.financial_expenses (
    recurrence_id,
    reference_date
)
where recurrence_id is not null;

create index idx_financial_expenses_organization_reference
on public.financial_expenses (
    organization_id,
    reference_date
);

create index idx_financial_expenses_organization_status_due
on public.financial_expenses (
    organization_id,
    status,
    due_date
);

create index idx_financial_expenses_category
on public.financial_expenses (
    category_id
);

-- ============================================================
-- 6. FINANCIAL REVENUES
-- ============================================================

create table public.financial_revenues (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    customer_id uuid,

    customer_subscription_id uuid,

    activity_id uuid,

    source public.financial_revenue_source not null,

    description varchar(180) not null,

    amount numeric(12, 2) not null,

    currency_code public.organization_currency not null,

    -- Competence / billing occurrence date.
    reference_date date not null,

    due_date date not null,

    paid_at timestamptz,

    status public.financial_entry_status
        not null
        default 'PENDING',

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint fk_financial_revenues_customer
        foreign key (
            customer_id,
            organization_id
        )
        references public.customers (
            id,
            organization_id
        )
        on delete restrict,

    constraint fk_financial_revenues_subscription
        foreign key (
            customer_subscription_id,
            organization_id
        )
        references public.customer_subscriptions (
            id,
            organization_id
        )
        on delete restrict,

    constraint fk_financial_revenues_activity
        foreign key (
            activity_id,
            organization_id
        )
        references public.activities (
            id,
            organization_id
        )
        on delete restrict,

    constraint financial_revenues_description_not_blank
        check (length(trim(description)) > 0),

    constraint financial_revenues_amount_non_negative
        check (amount >= 0),

    constraint financial_revenues_subscription_source_consistency
        check (
            (
                source = 'SUBSCRIPTION'
                and customer_id is not null
                and customer_subscription_id is not null
                and activity_id is not null
            )
            or
            (
                source = 'MANUAL'
                and customer_subscription_id is null
            )
        ),

    constraint financial_revenues_paid_status_consistency
        check (
            (
                status = 'PAID'
                and paid_at is not null
            )
            or
            (
                status <> 'PAID'
                and paid_at is null
            )
        )
);

create unique index uq_financial_revenues_subscription_reference
on public.financial_revenues (
    customer_subscription_id,
    reference_date
)
where customer_subscription_id is not null;

create index idx_financial_revenues_organization_reference
on public.financial_revenues (
    organization_id,
    reference_date
);

create index idx_financial_revenues_organization_status_due
on public.financial_revenues (
    organization_id,
    status,
    due_date
);

create index idx_financial_revenues_customer
on public.financial_revenues (
    customer_id
);

create index idx_financial_revenues_subscription
on public.financial_revenues (
    customer_subscription_id
);

-- ============================================================
-- 7. FINANCIAL PERIODS
-- ============================================================

create table public.financial_periods (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    year smallint not null,

    month smallint not null,

    status public.financial_period_status
        not null
        default 'OPEN',

    closed_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint financial_periods_year_valid
        check (year between 2000 and 2200),

    constraint financial_periods_month_valid
        check (month between 1 and 12),

    constraint financial_periods_closed_consistency
        check (
            (
                status = 'CLOSED'
                and closed_at is not null
            )
            or
            (
                status = 'OPEN'
                and closed_at is null
            )
        ),

    constraint financial_periods_organization_year_month_unique
        unique (
            organization_id,
            year,
            month
        )
);

create index idx_financial_periods_organization_status
on public.financial_periods (
    organization_id,
    status
);

-- ============================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================

create trigger expense_categories_set_updated_at
before update on public.expense_categories
for each row
execute function public.set_updated_at();

create trigger expense_recurrences_set_updated_at
before update on public.expense_recurrences
for each row
execute function public.set_updated_at();

create trigger financial_expenses_set_updated_at
before update on public.financial_expenses
for each row
execute function public.set_updated_at();

create trigger financial_revenues_set_updated_at
before update on public.financial_revenues
for each row
execute function public.set_updated_at();

create trigger financial_periods_set_updated_at
before update on public.financial_periods
for each row
execute function public.set_updated_at();

-- ============================================================
-- 9. DEFAULT EXPENSE CATEGORIES
-- ============================================================

create or replace function public.seed_default_expense_categories(
    p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.expense_categories (
        organization_id,
        code,
        name,
        system,
        active
    )
    values
        (p_organization_id, 'RENT', 'Aluguel', true, true),
        (p_organization_id, 'STAFF', 'Funcionários', true, true),
        (p_organization_id, 'PROFESSIONALS', 'Profissionais', true, true),
        (p_organization_id, 'ENERGY', 'Energia', true, true),
        (p_organization_id, 'WATER', 'Água', true, true),
        (p_organization_id, 'INTERNET', 'Internet', true, true),
        (p_organization_id, 'MARKETING', 'Marketing', true, true),
        (p_organization_id, 'SOFTWARE', 'Software', true, true),
        (p_organization_id, 'EQUIPMENT', 'Equipamentos', true, true),
        (p_organization_id, 'MAINTENANCE', 'Manutenção', true, true),
        (p_organization_id, 'TAXES', 'Impostos', true, true),
        (p_organization_id, 'ACCOUNTING', 'Contabilidade', true, true),
        (p_organization_id, 'OTHER', 'Outros', true, true)
    on conflict do nothing;
end;
$$;

-- Existing organizations.
do $$
declare
    v_organization record;
begin
    for v_organization in
        select id
        from public.organizations
    loop
        perform public.seed_default_expense_categories(
            v_organization.id
        );
    end loop;
end;
$$;

-- New organizations.
create or replace function public.handle_organization_financial_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform public.seed_default_expense_categories(new.id);
    return new;
end;
$$;

create trigger organization_financial_defaults
    after insert
    on public.organizations
    for each row
    execute function public.handle_organization_financial_defaults();

revoke all
on function public.seed_default_expense_categories(uuid)
from public, anon, authenticated;

revoke all
on function public.handle_organization_financial_defaults()
from public, anon, authenticated;
