# Contratos SQL — baseline 2026-10-13

## Tabelas criadas em migrations

`activities`, `activity_resource_requirements`, `appointment_participants`, `appointment_resources`, `appointments`, `audit_logs`, `customer_subscriptions`, `customers`, `expense_categories`, `expense_recurrences`, `financial_expenses`, `financial_periods`, `financial_revenues`, `membership_permission_overrides`, `memberships`, `organization_scheduling_settings`, `organization_settings`, `organizations`, `permission_definitions`, `professional_activities`, `professional_availability_rules`, `professional_registrations`, `professional_schedule_exceptions`, `professional_specialties`, `professional_specialty_assignments`, `professional_unavailability`, `professionals`, `profiles`, `resource_pool_members`, `resource_pools`, `resource_types`, `resources`, `role_permissions`, `schedule_generation_conflicts`, `schedule_rule_resources`, `schedule_rules`

## Enums criados

`activity_scheduling_mode`, `appointment_source`, `appointment_status`, `expense_recurrence_cycle`, `financial_entry_status`, `financial_period_status`, `financial_revenue_source`, `organization_business_type`, `organization_country`, `organization_currency`, `organization_role`, `organization_status`, `professional_access_status`, `professional_schedule_exception_reason`, `professional_schedule_exception_type`, `professional_specialty_area`, `schedule_generation_conflict_reason`, `schedule_recurrence_type`, `schedule_rule_status`, `scheduling_requirement`, `subscription_billing_cycle`, `subscription_status`

## Funções e últimas definições textuais

Assinaturas incluem nomes/defaults conforme SQL recebido. Conferir overloads,
ALTER/DROP e schema instalado antes de editar. O índice é textual; não prova
aplicação da migration nem substitui resolução PostgreSQL por tipos de argumentos.

| Função / parâmetros | Última migration com esta declaração |
| --- | --- |
| `public.add_expense_recurrence_cycle(p_date date, p_cycle public.expense_recurrence_cycle)` | `20260911212353_financial_automation.sql` |
| `public.add_subscription_billing_cycle(p_date date, p_cycle public.subscription_billing_cycle)` | `20260911212353_financial_automation.sql` |
| `public.allocate_activity_resources(p_organization_id uuid, p_activity_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_ignore_appointment_id uuid default null)` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.cancel_scheduling_appointment(p_appointment_id uuid, p_reason text default 'MANUAL_CANCELLATION')` | `20260912205619_attendance_rescheduling_and_cancellation_policy.sql` |
| `public.courtly_mrr(p_organization_id uuid,p_currency text)` | `20261013022353_server_side_pagination.sql` |
| `public.courtly_page_ids(p_organization_id uuid, p_module text, p_filters jsonb default '{}'::jsonb, p_page integer default 1, p_page_size integer default 10)` | `20261013022353_server_side_pagination.sql` |
| `public.courtly_professional_options(p_organization_id uuid)` | `20261013022353_server_side_pagination.sql` |
| `public.courtly_revenue_totals(p_organization_id uuid,p_start date,p_end date)` | `20261013022353_server_side_pagination.sql` |
| `public.courtly_search_text(value text)` | `20261013022353_server_side_pagination.sql` |
| `public.courtly_service_durations(p_organization_id uuid)` | `20261013022353_server_side_pagination.sql` |
| `public.create_group_scheduling_appointment(p_customer_ids uuid[], p_activity_id uuid, p_customer_subscription_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_professional_id uuid default null, p_resource_ids uuid[] default '{}', p_source text default 'MANUAL')` | `20261013002331_fix_group_appointment_source_enum.sql` |
| `public.create_organization_onboarding(p_display_name text, p_legal_name text, p_professional_name text, p_business_type public.organization_business_type, p_country_code text, p_timezone text, p_default_locale text, p_currency_code text, p_slug text, p_registration_type text, p_registration_number text, p_contact_email text, p_reply_to_email text, p_phone_country_code text, p_phone_number text, p_website_url text, p_address_line_1 text, p_address_line_2 text, p_city text, p_region text, p_postal_code text, p_primary_color text, p_secondary_color text)` | `20260915011656_fix_international_onboarding_professional_identity.sql` |
| `public.create_organization_onboarding(p_organization_name text, p_professional_name text)` | `20260910194201_create_organization_onboarding_function.sql` |
| `public.create_organization_onboarding(p_organization_name text, p_professional_name text, p_business_type public.organization_business_type, p_phone text, p_country public.organization_country, p_timezone text, p_default_currency public.organization_currency)` | `20260912153554_fix_organization_onboarding_professional_name.sql` |
| `public.create_scheduling_appointment(p_customer_id uuid, p_activity_id uuid, p_customer_subscription_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_professional_id uuid default null, p_resource_ids uuid[] default array[]::uuid[], p_source public.appointment_source default 'MANUAL')` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.create_scheduling_rule(p_customer_subscription_id uuid, p_weekday smallint, p_start_time time, p_end_time time, p_effective_from date, p_effective_until date default null, p_professional_id uuid default null, p_resource_ids uuid[] default array[]::uuid[])` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.create_weekly_scheduling_rules(p_customer_subscription_id uuid, p_weekdays integer[], p_start_time time, p_end_time time, p_effective_from date, p_effective_until date default null, p_professional_id uuid default null, p_resource_ids uuid[] default array[]::uuid[])` | `20261013005809_weekly_schedule_rules.sql` |
| `public.enforce_professional_operational_availability()` | `20260912174229_scheduling_availability_evolution.sql` |
| `public.ensure_customer_active_for_open_subscription()` | `20260911202047_auto_reactivate_customer_on_subscription.sql` |
| `public.ensure_organization_scheduling_settings()` | `20260912005004_scheduling_foundation.sql` |
| `public.ensure_organization_settings()` | `20260915004828_international_organization_tenant_profile.sql` |
| `public.generate_appointments_after_rule_insert()` | `20260912005004_scheduling_foundation.sql` |
| `public.generate_recurring_expenses_for_period(p_organization_id uuid, p_period_start date, p_period_end date)` | `20260911212353_financial_automation.sql` |
| `public.generate_schedule_rule_appointments(p_schedule_rule_id uuid, p_window_end date default null)` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.generate_subscription_revenues_for_period(p_organization_id uuid, p_period_start date, p_period_end date)` | `20260911212353_financial_automation.sql` |
| `public.get_my_permissions()` | `20260912135409_professionals_domain.sql` |
| `public.get_scheduling_availability(p_activity_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_professional_id uuid default null)` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.handle_new_user()` | `20260911032448_user_profiles_rbac_and_avatars.sql` |
| `public.handle_organization_financial_defaults()` | `20260911212241_financial_foundation.sql` |
| `public.is_organization_manager(target_organization_id uuid)` | `20260911190210_customer_subscriptions.sql` |
| `public.is_organization_member(target_organization_id uuid)` | `20260910174917_create_identity_and_tenant_foundation.sql` |
| `public.is_organization_owner(target_organization_id uuid)` | `20260911212353_financial_automation.sql` |
| `public.list_available_professionals(p_activity_id uuid, p_starts_at timestamptz, p_ends_at timestamptz)` | `20260912174229_scheduling_availability_evolution.sql` |
| `public.normalize_schedule_rule_contract_period()` | `20260912192249_recurrence_contract_and_professional_validations.sql` |
| `public.prevent_professional_availability_overlap()` | `20260912161937_professional_specialties_and_multi_availability.sql` |
| `public.preview_reschedule_scheduling_appointment(p_appointment_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_professional_id uuid default null)` | `20261013012721_preview_reschedule_availability.sql` |
| `public.professional_is_available(p_organization_id uuid, p_professional_id uuid, p_activity_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_ignore_appointment_id uuid default null)` | `20260912174229_scheduling_availability_evolution.sql` |
| `public.reactivate_rule_pause_appointments(p_schedule_rule_id uuid)` | `20260912005004_scheduling_foundation.sql` |
| `public.reactivate_subscription_pause_appointments(p_subscription_id uuid)` | `20260912005004_scheduling_foundation.sql` |
| `public.reassign_professional_future_appointments(p_from_professional_id uuid,p_to_professional_id uuid)` | `20260912135409_professionals_domain.sql` |
| `public.refresh_financial_overdue_statuses(p_organization_id uuid)` | `20260911212353_financial_automation.sql` |
| `public.refresh_organization_scheduling_window(p_organization_id uuid)` | `20260912005004_scheduling_foundation.sql` |
| `public.refresh_scheduling_window()` | `20260912005004_scheduling_foundation.sql` |
| `public.reject_past_manual_appointment()` | `20260912205619_attendance_rescheduling_and_cancellation_policy.sql` |
| `public.replace_activity_resource_requirements(p_activity_id uuid, p_requirements jsonb)` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.reschedule_scheduling_appointment(p_appointment_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_professional_id uuid default null)` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.save_resource_pool(p_organization_id uuid, p_pool_id uuid, p_name text, p_resource_ids uuid[] default array[]::uuid[])` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.seed_default_expense_categories(p_organization_id uuid)` | `20260911212241_financial_foundation.sql` |
| `public.set_appointment_attendance_status(p_appointment_id uuid, p_status text)` | `20260912205619_attendance_rescheduling_and_cancellation_policy.sql` |
| `public.set_appointment_participant_attendance_status(p_appointment_id uuid, p_customer_id uuid, p_status text)` | `20261012224302_group_appointments_capacity_financial_availability.sql` |
| `public.set_customer_active_status(p_customer_id uuid, p_active boolean)` | `20260912005004_scheduling_foundation.sql` |
| `public.set_professional_active_status(p_professional_id uuid, p_active boolean)` | `20260912135409_professionals_domain.sql` |
| `public.set_schedule_rule_status(p_schedule_rule_id uuid, p_status public.schedule_rule_status)` | `20260912005004_scheduling_foundation.sql` |
| `public.set_updated_at()` | `20260911170348_create_activities.sql` |
| `public.settle_appointment_payment(p_appointment_id uuid, p_amount numeric default null, p_reference text default null)` | `20261012224302_group_appointments_capacity_financial_availability.sql` |
| `public.sync_appointment_resource_status()` | `20260912005004_scheduling_foundation.sql` |
| `public.sync_financial_period(p_reference_date date)` | `20260911214942_fix_financial_period_sync_ambiguity.sql` |
| `public.sync_resource_default_pool()` | `20260912224835_resource_pool_auto_allocation.sql` |
| `public.sync_scheduling_from_subscription_status()` | `20260912005004_scheduling_foundation.sql` |
| `public.user_has_permission(target_organization_id uuid, target_permission text)` | `20260912135409_professionals_domain.sql` |

## Fluxos que exigem revisão conjunta

- Onboarding: auth/profile → create_organization_onboarding → organização/membership/profissional.
- Contratos: status do cliente/assinatura → triggers de receitas e agenda.
- Agenda: criação/reagendamento → profissionais/exceções → alocação pools → recursos.
- Grupo: função de criação → participante legado + associação → capacidade e presença.
- Financeiro: sync_financial_period e triggers → receitas/despesas/overdue → agregados.
- Paginação: courtly_page_ids → RLS/permissões → hidratação pelos IDs ordenados.

Tipos TS gerados são auxiliares. Fazer diff contra geração do banco de teste.
Não usar a primeira definição de função como verdade se existe substituição posterior.
