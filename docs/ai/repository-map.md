# Mapa de arquivos — baseline 2026-10-13

## Navegação

- [Aplicação](#aplicação)
- [Shared e tipos](#shared-e-tipos)
- [Migrations](#migrations)
- [Demais arquivos](#demais-arquivos)

Paths são relativos à raiz. Inventário estático da base recebida; atualizar itens
afetados em cada implementação, sem exigir regeneração integral.

## Aplicação

- `src/app/(app)/attendance/page.tsx` — tabelas: appointments, organization_scheduling_settings
- `src/app/(app)/customers/[id]/edit/page.tsx`
- `src/app/(app)/customers/new/page.tsx`
- `src/app/(app)/customers/page.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/financial/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/organization/page.tsx` — tabelas: memberships, organizations
- `src/app/(app)/professionals/page.tsx`
- `src/app/(app)/profile/page.tsx`
- `src/app/(app)/scheduling/page.tsx`
- `src/app/(app)/services/page.tsx` — tabelas: activity_resource_requirements, professional_specialties, resource_pool_members, resource_pools; RPC: courtly_service_durations
- `src/app/(auth)/confirm/route.ts` — exports: GET
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/onboarding/page.tsx` — tabelas: memberships, profiles
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx` — exports: metadata
- `src/app/page.tsx`
- `src/modules/activities/application/activity-actions.ts` — exports: ActivityActionResult, saveActivityAction, toggleActivityAction
- `src/modules/activities/application/activity-schema.ts` — exports: activitySchedulingModes, schedulingRequirements, activitySchema, ActivityFormData
- `src/modules/activities/application/create-activity.ts` — exports: createActivity
- `src/modules/activities/application/list-activities.ts` — exports: listActivities
- `src/modules/activities/application/set-activity-status.ts` — exports: setActivityStatus
- `src/modules/activities/application/update-activity.ts` — exports: updateActivity
- `src/modules/activities/domain/activity-repository.ts` — exports: ActivityRepository
- `src/modules/activities/domain/activity.ts` — exports: ActivitySchedulingMode, SchedulingRequirement, ActivityAttendanceMode, Activity, CreateActivityInput, UpdateActivityInput, SetActivityStatusInput
- `src/modules/activities/infrastructure/supabase-activity-repository.ts` — exports: SupabaseActivityRepository; tabelas: activities
- `src/modules/activities/ui/services-client.tsx` — exports: ServicesClient
- `src/modules/attendance/application/attendance-actions.ts` — exports: AttendanceActionResult, setAttendanceStatusAction, rescheduleAppointmentAction, setParticipantAttendanceStatusAction, getRescheduleOptionsAction, checkRescheduleAvailabilityAction; tabelas: appointments, professional_activities, professionals; RPC: preview_reschedule_scheduling_appointment, reschedule_scheduling_appointment, set_appointment_attendance_status, set_appointment_participant_attendance_status
- `src/modules/attendance/ui/AttendanceClient.tsx` — exports: AttendanceAppointment, AttendanceClient
- `src/modules/attendance/ui/RescheduleClient.tsx` — exports: RescheduleClient
- `src/modules/attendance/ui/attendance.module.css`
- `src/modules/attendance/ui/reschedule.module.css`
- `src/modules/auth/actions.ts` — exports: signUp, signIn, signOut, requestPasswordReset, updatePassword, updateProfile, changePassword, uploadAvatar, removeAvatar; tabelas: avatars, memberships, profiles
- `src/modules/auth/components/AvatarEditor.tsx` — exports: AvatarEditor
- `src/modules/auth/queries.ts` — exports: CurrentUserProfile, getCurrentUserProfile; tabelas: avatars, memberships, profiles
- `src/modules/customer-subscriptions/application/change-customer-subscription-status.ts` — exports: changeCustomerSubscriptionStatus
- `src/modules/customer-subscriptions/application/customer-subscription-actions.ts` — exports: CustomerSubscriptionActionError, CustomerSubscriptionActionResult, saveCustomerSubscriptionAction, changeCustomerSubscriptionStatusAction
- `src/modules/customer-subscriptions/application/customer-subscription-schema.ts` — exports: currencyCodes, billingCycles, customerSubscriptionSchema, CustomerSubscriptionFormData
- `src/modules/customer-subscriptions/application/list-customer-subscriptions.ts` — exports: listCustomerSubscriptions
- `src/modules/customer-subscriptions/application/save-customer-subscription.ts` — exports: saveCustomerSubscription
- `src/modules/customer-subscriptions/domain/customer-subscription-repository.ts` — exports: CustomerSubscriptionRepository
- `src/modules/customer-subscriptions/domain/customer-subscription.ts` — exports: SubscriptionBillingCycle, CustomerSubscriptionStatus, CurrencyCode, CustomerSubscription, CreateCustomerSubscriptionInput, UpdateCustomerSubscriptionInput, ChangeCustomerSubscriptionStatusInput
- `src/modules/customer-subscriptions/infrastructure/supabase-customer-subscription-repository.ts` — exports: SupabaseCustomerSubscriptionRepository
- `src/modules/customer-subscriptions/ui/CustomerSubscriptionsClient.tsx` — exports: CustomerSubscriptionsClient
- `src/modules/customers/actions.ts` — exports: CustomerStatusResult, createCustomer, updateCustomer, toggleCustomerStatus
- `src/modules/customers/components/CustomerForm.tsx` — exports: CustomerForm
- `src/modules/customers/components/CustomerStatusAction.tsx` — exports: CustomerStatusAction
- `src/modules/customers/components/CustomersView.tsx` — exports: CustomersView
- `src/modules/customers/documents/documentFormatter.ts` — exports: onlyDigits, formatDocument, normalizeDocument, getDocumentMaxLength, getDocumentPlaceholder
- `src/modules/customers/documents/documentTypes.ts` — exports: DOCUMENT_TYPES, DocumentType, DocumentTypeOption, DOCUMENT_TYPE_OPTIONS, isDocumentType
- `src/modules/customers/documents/documentValidator.ts` — exports: isValidDocument
- `src/modules/customers/queries.ts` — exports: getCustomers, getCustomerById; tabelas: customers
- `src/modules/customers/types.ts` — exports: Customer, CustomerInsert, CustomerUpdate, CustomerActivePlanSummary, CustomerListItem
- `src/modules/customers/validation.ts` — exports: CustomerFormData, CustomerValidationErrorCode, CustomerValidationError, parseCustomerFormData, normalizePhone
- `src/modules/financial/application/financial-actions.ts` — exports: FinancialActionError, FinancialActionResult, syncFinancialPeriodAction, saveExpenseAction, saveManualRevenueAction, createExpenseCategoryAction, changeExpenseStatusAction, changeRevenueStatusAction
- `src/modules/financial/application/financial-schema.ts` — exports: financialEntryStatuses, expenseRecurrenceCycles, expenseSchema, manualRevenueSchema, expenseCategorySchema, periodReferenceSchema, financialStatusSchema
- `src/modules/financial/application/get-financial-page-data.ts` — exports: getFinancialPageData, getMonthRange, shiftMonth
- `src/modules/financial/domain/financial-repository.ts` — exports: DateRange, RevenueTotal, FinancialRepository
- `src/modules/financial/domain/financial.ts` — exports: FinancialEntryStatus, FinancialRevenueSource, ExpenseRecurrenceCycle, FinancialPeriodStatus, ExpenseCategory, ExpenseRecurrence, FinancialExpense, FinancialRevenue, FinancialSummary, FinancialMonthlyPoint, ExpenseCategoryTotal, FinancialReportRow, FinancialPageData, CreateExpenseCategoryInput, SaveExpenseInput, SaveManualRevenueInput
- `src/modules/financial/infrastructure/supabase-financial-repository.ts` — exports: SupabaseFinancialRepository; tabelas: expense_categories, expense_recurrences, financial_expenses, financial_revenues; RPC: courtly_mrr, courtly_revenue_totals
- `src/modules/financial/ui/ExpenseModal.tsx` — exports: ExpenseModal
- `src/modules/financial/ui/FinancialCharts.tsx` — exports: FinancialCharts
- `src/modules/financial/ui/FinancialClient.tsx` — exports: FinancialClient
- `src/modules/financial/ui/FinancialSummaryCards.tsx` — exports: FinancialSummaryCards
- `src/modules/financial/ui/RevenueModal.tsx` — exports: RevenueModal
- `src/modules/financial/ui/financial.module.css`
- `src/modules/organizations/actions.ts` — exports: completeOnboarding, updateOrganization; tabelas: memberships, organizations; RPC: create_organization_onboarding
- `src/modules/organizations/organization-options.ts` — exports: BUSINESS_TYPES, BusinessType, LOCALES, OrganizationLocale, CountryPreset, COUNTRY_PRESETS, COUNTRY_SUGGESTIONS, CURRENCY_SUGGESTIONS, TIMEZONE_SUGGESTIONS, normalizeSlug
- `src/modules/organizations/ui/OrganizationOnboardingClient.tsx` — exports: OrganizationOnboardingClient
- `src/modules/organizations/ui/OrganizationSettingsClient.tsx` — exports: OrganizationSettingsClient
- `src/modules/organizations/ui/organization.module.css`
- `src/modules/professionals/application/professional-actions.ts` — exports: ProfessionalActionResult, saveProfessionalAction, saveSpecialtyAction, setSpecialtyStatusAction, setProfessionalStatusAction, reassignFutureAppointmentsAction, saveProfessionalAccessAction, inviteProfessionalAction, uploadProfessionalAvatarAction, removeProfessionalAvatarAction, saveProfessionalScheduleExceptionAction, setProfessionalScheduleExceptionActiveAction, AvailabilitySlot, findProfessionalAvailabilityAction; tabelas: activities, activity_resource_requirements, appointment_participants, appointment_resources, appointments, audit_logs, avatars, membership_permission_overrides, memberships, professional_activities, professional_availability_rules, professional_registrations, professional_schedule_exceptions, professional_specialties, professional_specialty_assignments, professionals, resource_pool_members; RPC: reassign_professional_future_appointments, set_professional_active_status
- `src/modules/professionals/domain/professional-repository.ts` — exports: ProfessionalRepository
- `src/modules/professionals/domain/professional.ts` — exports: ProfessionalAccessStatus, ProfessionalSpecialtyArea, ProfessionalRegistration, ProfessionalSpecialty, ProfessionalAvailabilityRule, ProfessionalUnavailability, ProfessionalScheduleExceptionType, ProfessionalScheduleExceptionReason, ProfessionalScheduleException, Professional, ProfessionalListFilters, ProfessionalPageData
- `src/modules/professionals/infrastructure/supabase-professional-repository.ts` — exports: SupabaseProfessionalRepository; tabelas: activities, avatars, membership_permission_overrides, memberships, professional_activities, professional_availability_rules, professional_registrations, professional_schedule_exceptions, professional_specialties, professional_specialty_assignments, professional_unavailability, professionals, role_permissions; RPC: courtly_professional_options, get_my_permissions
- `src/modules/professionals/ui/ProfessionalAvatarEditor.tsx` — exports: ProfessionalAvatarEditor
- `src/modules/professionals/ui/ProfessionalExceptionsPanel.tsx` — exports: ProfessionalExceptionsPanel
- `src/modules/professionals/ui/ProfessionalsClient.tsx` — exports: ProfessionalsClient
- `src/modules/professionals/ui/professionals.module.css`
- `src/modules/resources/application/resource-actions.ts` — exports: ResourceActionResult, saveResourceTypeAction, saveResourceAction, toggleResourceAction, saveResourcePoolAction; RPC: save_resource_pool
- `src/modules/resources/domain/resource-repository.ts` — exports: ResourceRepository
- `src/modules/resources/domain/resource.ts` — exports: ResourceType, Resource
- `src/modules/resources/infrastructure/supabase-resource-repository.ts` — exports: SupabaseResourceRepository; tabelas: resource_types, resources
- `src/modules/scheduling/application/get-scheduling-page-data.ts` — exports: getSchedulingPageData
- `src/modules/scheduling/application/scheduling-actions.ts` — exports: SchedulingActionResult, createAppointmentAction, createScheduleRuleAction, createWeeklyScheduleRulesAction, cancelAppointmentAction, setActivityResourceRequirementAction, setProfessionalQualificationAction, changeScheduleRuleStatusAction, updateSchedulingSettingsAction, setActivitySpecialtyAction, settleAppointmentPaymentAction, searchAppointmentCustomersAction, searchRecurrenceSubscriptionsAction; tabelas: activities, customer_subscriptions, customers
- `src/modules/scheduling/domain/scheduling-repository.ts` — exports: SchedulingRepository
- `src/modules/scheduling/domain/scheduling.ts` — exports: AppointmentStatus, AppointmentSource, ScheduleRuleStatus, SchedulingSettings, SchedulingCustomer, ProfessionalAvailabilityRule, ProfessionalScheduleException, SchedulingProfessional, SchedulingResourceType, SchedulingResourcePool, SchedulingResource, SchedulingSubscription, ScheduleRule, AppointmentParticipant, Appointment, ActivityResourceRequirement, ScheduleGenerationConflict, SchedulingPageData
- `src/modules/scheduling/infrastructure/supabase-scheduling-repository.ts` — exports: SupabaseSchedulingRepository; tabelas: activity_resource_requirements, appointment_participants, appointment_resources, appointments, customer_subscriptions, customers, organization_scheduling_settings, professional_activities, professional_availability_rules, professional_schedule_exceptions, professional_specialties, professionals, resource_pool_members, resource_pools, resource_types, resources, schedule_generation_conflicts, schedule_rule_resources, schedule_rules; RPC: cancel_scheduling_appointment, create_group_scheduling_appointment, create_scheduling_rule, create_weekly_scheduling_rules, refresh_organization_scheduling_window, set_schedule_rule_status, settle_appointment_payment
- `src/modules/scheduling/ui/SchedulingClient.tsx` — exports: SchedulingClient
- `src/modules/scheduling/ui/scheduling.module.css`

## Shared e tipos

- `src/shared/Providers.tsx` — exports: Providers
- `src/shared/auth/get-current-organization-commercial-context.ts` — exports: OrganizationRole, CurrentOrganizationCommercialContext, getCurrentOrganizationCommercialContext, canManageCommercialData
- `src/shared/auth/get-current-organization-financial-context.ts` — exports: CurrentOrganizationFinancialContext, getCurrentOrganizationFinancialContext, canManageFinancialData; tabelas: memberships, organizations
- `src/shared/auth/get-current-organization-id.ts` — exports: getCurrentOrganizationId; tabelas: memberships
- `src/shared/auth/permissions.ts` — exports: PermissionCode, AccessContext, getCurrentAccessContext, can; tabelas: memberships; RPC: get_my_permissions
- `src/shared/database/supabase/admin.ts` — exports: createAdminClient
- `src/shared/database/supabase/client.ts` — exports: createClient
- `src/shared/database/supabase/server.ts` — exports: createClient
- `src/shared/i18n/I18nProvider.tsx` — exports: I18nProvider, useI18n
- `src/shared/i18n/LanguageSwitcher.tsx` — exports: LanguageSwitcher
- `src/shared/i18n/config.ts` — exports: SUPPORTED_LOCALES, Locale, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale
- `src/shared/i18n/dictionaries/en-US.ts` — exports: enUS
- `src/shared/i18n/dictionaries/pt-BR.ts` — exports: ptBR
- `src/shared/i18n/getCurrentLocale.ts` — exports: getCurrentLocale
- `src/shared/i18n/getDictionary.ts` — exports: Dictionary, getDictionary
- `src/shared/pagination/actions.ts` — exports: loadListPage; tabelas: appointments, professional_schedule_exceptions, professional_specialties, schedule_generation_conflicts, schedule_rule_resources, schedule_rules; RPC: courtly_page_ids
- `src/shared/pagination/contracts.ts` — exports: PageSize, Filters, ModuleItems, ListModule, PaginationParams, RevenueTotals, PaginatedResult, normalizePagination
- `src/shared/pagination/use-server-pagination.ts` — exports: useServerPagination
- `src/shared/theme/ThemeProvider.tsx` — exports: Theme, ThemeProvider, useTheme
- `src/shared/theme/ThemeToggle.tsx` — exports: ThemeToggle
- `src/shared/ui/AppShell.tsx` — exports: AppShell
- `src/shared/ui/AuthLayout.tsx` — exports: AuthLayout
- `src/shared/ui/Button.tsx` — exports: Button
- `src/shared/ui/CourtlyAlert.tsx` — exports: CourtlyAlert
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/Header.tsx` — exports: Header
- `src/shared/ui/PageHeader.tsx` — exports: PageHeader
- `src/shared/ui/Pagination.tsx` — exports: PaginationState, Pagination
- `src/shared/ui/Sidebar.tsx` — exports: Sidebar; tabelas: memberships; RPC: get_my_permissions
- `src/shared/ui/confirmDialog.tsx` — exports: ConfirmDialog
- `src/types/database.types.ts` — exports: Json, Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants

## Migrations

- `supabase/migrations/20260910174917_create_identity_and_tenant_foundation.sql` — funções: public.set_updated_at, public.is_organization_member
- `supabase/migrations/20260910194201_create_organization_onboarding_function.sql` — funções: public.create_organization_onboarding
- `supabase/migrations/20260910200253_create_customers.sql` — funções: public.set_updated_at
- `supabase/migrations/20260911014858_add_customer_document_fields.sql`
- `supabase/migrations/20260911032448_user_profiles_rbac_and_avatars.sql` — funções: public.handle_new_user
- `supabase/migrations/20260911132638_enhance_organization_onboarding.sql`
- `supabase/migrations/20260911133341_update_organization_onboarding_rpc.sql`
- `supabase/migrations/20260911170348_create_activities.sql` — funções: public.set_updated_at
- `supabase/migrations/20260911190210_customer_subscriptions.sql` — funções: public.is_organization_manager
- `supabase/migrations/20260911195539_customer_status_commercial_consistency.sql` — funções: public.set_customer_active_status
- `supabase/migrations/20260911202047_auto_reactivate_customer_on_subscription.sql` — funções: public.ensure_customer_active_for_open_subscription
- `supabase/migrations/20260911212241_financial_foundation.sql` — funções: public.seed_default_expense_categories, public.handle_organization_financial_defaults
- `supabase/migrations/20260911212353_financial_automation.sql` — funções: public.add_subscription_billing_cycle, public.add_expense_recurrence_cycle, public.is_organization_owner, public.generate_subscription_revenues_for_period, public.generate_recurring_expenses_for_period, public.refresh_financial_overdue_statuses, public.sync_financial_period
- `supabase/migrations/20260911212453_financial_security.sql`
- `supabase/migrations/20260911214942_fix_financial_period_sync_ambiguity.sql` — funções: public.sync_financial_period
- `supabase/migrations/20260912005004_scheduling_foundation.sql` — funções: public.ensure_organization_scheduling_settings, public.get_scheduling_availability, public.create_scheduling_appointment, public.sync_appointment_resource_status, public.generate_schedule_rule_appointments, public.refresh_scheduling_window, public.generate_appointments_after_rule_insert, public.reactivate_subscription_pause_appointments, public.reactivate_rule_pause_appointments, public.sync_scheduling_from_subscription_status, public.set_customer_active_status, public.set_schedule_rule_status, public.refresh_organization_scheduling_window, public.create_scheduling_rule
- `supabase/migrations/20260912135409_professionals_domain.sql` — funções: public.user_has_permission, public.get_my_permissions, public.set_professional_active_status, public.enforce_professional_operational_availability, public.reassign_professional_future_appointments
- `supabase/migrations/20260912153554_fix_organization_onboarding_professional_name.sql` — funções: public.create_organization_onboarding
- `supabase/migrations/20260912161937_professional_specialties_and_multi_availability.sql` — funções: public.prevent_professional_availability_overlap
- `supabase/migrations/20260912174229_scheduling_availability_evolution.sql` — funções: public.professional_is_available, public.enforce_professional_operational_availability, public.list_available_professionals, public.generate_schedule_rule_appointments
- `supabase/migrations/20260912192249_recurrence_contract_and_professional_validations.sql` — funções: public.normalize_schedule_rule_contract_period
- `supabase/migrations/20260912205619_attendance_rescheduling_and_cancellation_policy.sql` — funções: public.reject_past_manual_appointment, public.cancel_scheduling_appointment, public.set_appointment_attendance_status, public.reschedule_scheduling_appointment
- `supabase/migrations/20260912224835_resource_pool_auto_allocation.sql` — funções: public.sync_resource_default_pool, public.save_resource_pool, public.replace_activity_resource_requirements, public.allocate_activity_resources, public.get_scheduling_availability, public.create_scheduling_appointment, public.create_scheduling_rule, public.generate_schedule_rule_appointments, public.reschedule_scheduling_appointment
- `supabase/migrations/20260915004828_international_organization_tenant_profile.sql` — funções: public.ensure_organization_settings, public.create_organization_onboarding
- `supabase/migrations/20260915011656_fix_international_onboarding_professional_identity.sql` — funções: public.create_organization_onboarding
- `supabase/migrations/20261012224302_group_appointments_capacity_financial_availability.sql` — funções: public.create_group_scheduling_appointment, public.set_appointment_participant_attendance_status, public.settle_appointment_payment
- `supabase/migrations/20261013002331_fix_group_appointment_source_enum.sql` — funções: public.create_group_scheduling_appointment
- `supabase/migrations/20261013005809_weekly_schedule_rules.sql` — funções: public.create_weekly_scheduling_rules
- `supabase/migrations/20261013012721_preview_reschedule_availability.sql` — funções: public.preview_reschedule_scheduling_appointment
- `supabase/migrations/20261013022353_server_side_pagination.sql` — funções: public.courtly_search_text, public.courtly_page_ids, public.courtly_revenue_totals, public.courtly_mrr, public.courtly_service_durations, public.courtly_professional_options

## Demais arquivos

`package.json`/`package-lock.json`: dependências e scripts; `tsconfig.json`:
strict/alias; `eslint.config.mjs`: Next ESLint; `next.config.ts`,
`postcss.config.mjs`, `next-env.d.ts`: configuração; `supabase/config.toml`:
ambiente local; `supabase/snippets/`: consultas avulsas; `public/`: imagens/logos
e SVGs; `src/app/icon.png`: ícone; README original é scaffold.

Arquivo de ambiente local, secrets temporários e tsbuildinfo não são fonte
de instrução nem devem fazer parte de entregas. CLAUDE.md referencia AGENTS.md.
