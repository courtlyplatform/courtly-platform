-- ============================================================
-- COURTLY
-- Financial Management - OWNER-only RLS
-- ============================================================

alter table public.expense_categories enable row level security;
alter table public.expense_recurrences enable row level security;
alter table public.financial_expenses enable row level security;
alter table public.financial_revenues enable row level security;
alter table public.financial_periods enable row level security;

-- ============================================================
-- EXPENSE CATEGORIES
-- ============================================================

create policy "owners can view expense categories"
on public.expense_categories
for select
to authenticated
using (
    public.is_organization_owner(organization_id)
);

create policy "owners can create expense categories"
on public.expense_categories
for insert
to authenticated
with check (
    public.is_organization_owner(organization_id)
);

create policy "owners can update expense categories"
on public.expense_categories
for update
to authenticated
using (
    public.is_organization_owner(organization_id)
)
with check (
    public.is_organization_owner(organization_id)
);

-- ============================================================
-- EXPENSE RECURRENCES
-- ============================================================

create policy "owners can view expense recurrences"
on public.expense_recurrences
for select
to authenticated
using (
    public.is_organization_owner(organization_id)
);

create policy "owners can create expense recurrences"
on public.expense_recurrences
for insert
to authenticated
with check (
    public.is_organization_owner(organization_id)
);

create policy "owners can update expense recurrences"
on public.expense_recurrences
for update
to authenticated
using (
    public.is_organization_owner(organization_id)
)
with check (
    public.is_organization_owner(organization_id)
);

-- ============================================================
-- FINANCIAL EXPENSES
-- ============================================================

create policy "owners can view financial expenses"
on public.financial_expenses
for select
to authenticated
using (
    public.is_organization_owner(organization_id)
);

create policy "owners can create financial expenses"
on public.financial_expenses
for insert
to authenticated
with check (
    public.is_organization_owner(organization_id)
);

create policy "owners can update financial expenses"
on public.financial_expenses
for update
to authenticated
using (
    public.is_organization_owner(organization_id)
)
with check (
    public.is_organization_owner(organization_id)
);

-- ============================================================
-- FINANCIAL REVENUES
-- ============================================================

create policy "owners can view financial revenues"
on public.financial_revenues
for select
to authenticated
using (
    public.is_organization_owner(organization_id)
);

create policy "owners can create financial revenues"
on public.financial_revenues
for insert
to authenticated
with check (
    public.is_organization_owner(organization_id)
);

create policy "owners can update financial revenues"
on public.financial_revenues
for update
to authenticated
using (
    public.is_organization_owner(organization_id)
)
with check (
    public.is_organization_owner(organization_id)
);

-- ============================================================
-- FINANCIAL PERIODS
-- ============================================================

create policy "owners can view financial periods"
on public.financial_periods
for select
to authenticated
using (
    public.is_organization_owner(organization_id)
);

create policy "owners can create financial periods"
on public.financial_periods
for insert
to authenticated
with check (
    public.is_organization_owner(organization_id)
);

create policy "owners can update financial periods"
on public.financial_periods
for update
to authenticated
using (
    public.is_organization_owner(organization_id)
)
with check (
    public.is_organization_owner(organization_id)
);

-- ============================================================
-- TABLE PERMISSIONS
--
-- Intentionally no DELETE permission. Financial history must be
-- cancelled/deactivated instead of physically deleted.
-- ============================================================

grant select, insert, update
on table public.expense_categories
to authenticated;

grant select, insert, update
on table public.expense_recurrences
to authenticated;

grant select, insert, update
on table public.financial_expenses
to authenticated;

grant select, insert, update
on table public.financial_revenues
to authenticated;

grant select, insert, update
on table public.financial_periods
to authenticated;
