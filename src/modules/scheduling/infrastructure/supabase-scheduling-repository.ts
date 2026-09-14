import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseActivityRepository } from "@/modules/activities/infrastructure/supabase-activity-repository";
import { listActivities } from "@/modules/activities/application/list-activities";
import type { Appointment, ScheduleRule, SchedulingPageData } from "../domain/scheduling";
import type { SchedulingRepository } from "../domain/scheduling-repository";

export class SupabaseSchedulingRepository implements SchedulingRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getPageData(organizationId: string): Promise<SchedulingPageData> {
    const db = this.supabase as any;
    const activityRepository = new SupabaseActivityRepository(this.supabase);
    const rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 60);
    const rangeEnd = new Date(); rangeEnd.setDate(rangeEnd.getDate() + 180);

    const [
      activities, settingsResult, customersResult, specialtiesResult, professionalsResult, qualificationsResult,
      availabilityResult, exceptionsResult, resourceTypesResult, resourcesResult, resourcePoolsResult, poolMembersResult, requirementsResult,
      subscriptionsResult, rulesResult, conflictsResult, ruleResourcesResult, appointmentsResult,
      appointmentResourcesResult,
    ] = await Promise.all([
      listActivities(activityRepository, organizationId),
      db.from("organization_scheduling_settings").select("scheduling_enabled,generation_window_days,late_cancellation_window_minutes").eq("organization_id", organizationId).single(),
      db.from("customers").select("id,name,document_type,document_number,email,phone,active").eq("organization_id", organizationId).order("name"),
      db.from("professional_specialties").select("id,name,color,active").eq("organization_id", organizationId).order("name"),
      db.from("professionals").select("id,name,active").eq("organization_id", organizationId).order("name"),
      db.from("professional_activities").select("professional_id,activity_id").eq("organization_id", organizationId),
      db.from("professional_availability_rules").select("id,professional_id,weekday,start_time,end_time,active").eq("organization_id", organizationId).eq("active", true),
      db.from("professional_schedule_exceptions").select("id,professional_id,exception_type,starts_at,ends_at,active").eq("organization_id", organizationId).eq("active", true).order("starts_at"),
      db.from("resource_types").select("id,name,active").eq("organization_id", organizationId).order("name"),
      db.from("resources").select("id,name,active,resource_type_id,resource_types(name)").eq("organization_id", organizationId).order("name"),
      db.from("resource_pools").select("id,name,active").eq("organization_id", organizationId).order("name"),
      db.from("resource_pool_members").select("resource_pool_id,resource_id").eq("organization_id", organizationId),
      db.from("activity_resource_requirements").select("activity_id,resource_pool_id,quantity,resource_pools(name)").eq("organization_id", organizationId).not("resource_pool_id", "is", null),
      db.from("customer_subscriptions").select("id,customer_id,activity_id,status,billing_cycle,starts_at,ends_at").eq("organization_id", organizationId),
      db.from("schedule_rules").select("id,customer_id,customer_subscription_id,activity_id,professional_id,weekday,start_time,end_time,effective_from,effective_until,status").eq("organization_id", organizationId),
      db.from("schedule_generation_conflicts").select("id,schedule_rule_id,starts_at,ends_at,reason").eq("organization_id", organizationId).is("resolved_at", null).order("starts_at"),
      db.from("schedule_rule_resources").select("schedule_rule_id,resource_id").eq("organization_id", organizationId),
      db.from("appointments").select("id,schedule_rule_id,customer_id,customer_subscription_id,activity_id,professional_id,starts_at,ends_at,status,source,cancellation_reason,attendance_status").eq("organization_id", organizationId).gte("starts_at", rangeStart.toISOString()).lte("starts_at", rangeEnd.toISOString()).order("starts_at"),
      db.from("appointment_resources").select("appointment_id,resource_id").eq("organization_id", organizationId),
    ]);

    const results = [settingsResult, customersResult, specialtiesResult, professionalsResult, qualificationsResult, availabilityResult, exceptionsResult, resourceTypesResult, resourcesResult, resourcePoolsResult, poolMembersResult, requirementsResult, subscriptionsResult, rulesResult, conflictsResult, ruleResourcesResult, appointmentsResult, appointmentResourcesResult];
    const failed = results.find((r: any) => r.error);
    if (failed?.error) throw new Error(`Failed to load scheduling: ${failed.error.message}`);

    const qualificationMap = new Map<string, string[]>();
    for (const row of qualificationsResult.data ?? []) qualificationMap.set(row.professional_id, [...(qualificationMap.get(row.professional_id) ?? []), row.activity_id]);
    const availabilityMap = new Map<string, any[]>();
    for (const row of availabilityResult.data ?? []) availabilityMap.set(row.professional_id, [...(availabilityMap.get(row.professional_id) ?? []), row]);
    const exceptionMap = new Map<string, any[]>();
    for (const row of exceptionsResult.data ?? []) exceptionMap.set(row.professional_id, [...(exceptionMap.get(row.professional_id) ?? []), row]);
    const ruleResourceMap = new Map<string, string[]>();
    for (const row of ruleResourcesResult.data ?? []) ruleResourceMap.set(row.schedule_rule_id, [...(ruleResourceMap.get(row.schedule_rule_id) ?? []), row.resource_id]);
    const appointmentResourceMap = new Map<string, string[]>();
    for (const row of appointmentResourcesResult.data ?? []) appointmentResourceMap.set(row.appointment_id, [...(appointmentResourceMap.get(row.appointment_id) ?? []), row.resource_id]);
    const poolMemberMap = new Map<string, string[]>();
    for (const row of poolMembersResult.data ?? []) poolMemberMap.set(row.resource_pool_id, [...(poolMemberMap.get(row.resource_pool_id) ?? []), row.resource_id]);

    const rules: ScheduleRule[] = (rulesResult.data ?? []).map((row: any) => ({
      id: row.id, customerId: row.customer_id, customerSubscriptionId: row.customer_subscription_id,
      activityId: row.activity_id, professionalId: row.professional_id, weekday: row.weekday,
      startTime: row.start_time, endTime: row.end_time, effectiveFrom: row.effective_from,
      effectiveUntil: row.effective_until, status: row.status, resourceIds: ruleResourceMap.get(row.id) ?? [],
    }));
    const appointments: Appointment[] = (appointmentsResult.data ?? []).map((row: any) => ({
      id: row.id, scheduleRuleId: row.schedule_rule_id, customerId: row.customer_id,
      customerSubscriptionId: row.customer_subscription_id, activityId: row.activity_id,
      professionalId: row.professional_id, startsAt: row.starts_at, endsAt: row.ends_at,
      status: row.status, source: row.source, cancellationReason: row.cancellation_reason,
      attendanceStatus: row.attendance_status ?? (row.status === "CANCELLED" ? "CANCELLED" : "PENDING"),
      resourceIds: appointmentResourceMap.get(row.id) ?? [],
    }));

    return {
      settings: { schedulingEnabled: settingsResult.data.scheduling_enabled, generationWindowDays: settingsResult.data.generation_window_days, cancellationWindowMinutes: settingsResult.data.late_cancellation_window_minutes ?? 120 },
      activities,
      specialties: (specialtiesResult.data ?? []).map((r: any) => ({ id: r.id, name: r.name, color: r.color, active: r.active })),
      customers: (customersResult.data ?? []).map((r: any) => ({ id: r.id, name: r.name, documentType: r.document_type, documentNumber: r.document_number, email: r.email, phone: r.phone, active: r.active })),
      professionals: (professionalsResult.data ?? []).map((r: any) => ({
        id: r.id, name: r.name, active: r.active, activityIds: qualificationMap.get(r.id) ?? [],
        availabilityRules: (availabilityMap.get(r.id) ?? []).map((x: any) => ({ id: x.id, weekday: x.weekday, startTime: x.start_time, endTime: x.end_time, active: x.active })),
        scheduleExceptions: (exceptionMap.get(r.id) ?? []).map((x: any) => ({ id: x.id, exceptionType: x.exception_type, startsAt: x.starts_at, endsAt: x.ends_at, active: x.active })),
      })),
      resourceTypes: (resourceTypesResult.data ?? []).map((r: any) => ({ id: r.id, name: r.name, active: r.active })),
      resources: (resourcesResult.data ?? []).map((r: any) => ({ id: r.id, name: r.name, active: r.active, resourceTypeId: r.resource_type_id, resourceTypeName: r.resource_types?.name ?? null })),
      resourcePools: (resourcePoolsResult.data ?? []).map((r: any) => ({ id: r.id, name: r.name, active: r.active, resourceIds: poolMemberMap.get(r.id) ?? [] })),
      activityResourceRequirements: (requirementsResult.data ?? []).map((r: any) => ({ activityId: r.activity_id, resourcePoolId: r.resource_pool_id, resourcePoolName: r.resource_pools?.name ?? "Resource pool", quantity: r.quantity })),
      subscriptions: (subscriptionsResult.data ?? []).map((r: any) => ({ id: r.id, customerId: r.customer_id, activityId: r.activity_id, status: r.status, billingCycle: r.billing_cycle, startsAt: r.starts_at, endsAt: r.ends_at })),
      rules,
      conflicts: (conflictsResult.data ?? []).map((r: any) => ({ id: r.id, scheduleRuleId: r.schedule_rule_id, startsAt: r.starts_at, endsAt: r.ends_at, reason: r.reason })),
      appointments,
    };
  }

  async createAppointment(input: Parameters<SchedulingRepository["createAppointment"]>[0]): Promise<string> {
    const { data, error } = await (this.supabase as any).rpc("create_scheduling_appointment", {
      p_customer_id: input.customerId, p_activity_id: input.activityId,
      p_customer_subscription_id: input.customerSubscriptionId ?? null,
      p_starts_at: input.startsAt, p_ends_at: input.endsAt,
      p_professional_id: input.professionalId ?? null, p_resource_ids: input.resourceIds ?? [], p_source: "MANUAL",
    });
    if (error) throw error; return data as string;
  }

  async createScheduleRule(input: Parameters<SchedulingRepository["createScheduleRule"]>[0]): Promise<string> {
    const { data, error } = await (this.supabase as any).rpc("create_scheduling_rule", {
      p_customer_subscription_id: input.customerSubscriptionId, p_weekday: input.weekday,
      p_start_time: input.startTime, p_end_time: input.endTime, p_effective_from: input.effectiveFrom,
      p_effective_until: input.effectiveUntil ?? null, p_professional_id: input.professionalId ?? null,
      p_resource_ids: input.resourceIds ?? [],
    });
    if (error) throw error; return data as string;
  }

  async cancelAppointment(input: Parameters<SchedulingRepository["cancelAppointment"]>[0]): Promise<void> {
    const { error } = await (this.supabase as any).rpc("cancel_scheduling_appointment", {
      p_appointment_id: input.appointmentId,
      p_reason: input.reason,
    });
    if (error) throw new Error(error.message);
  }

  async setActivityResourceRequirement(input: Parameters<SchedulingRepository["setActivityResourceRequirement"]>[0]): Promise<void> {
    const db = this.supabase as any;
    const { error: deleteError } = await db.from("activity_resource_requirements").delete().eq("organization_id", input.organizationId).eq("activity_id", input.activityId);
    if (deleteError) throw deleteError;
    const { error } = await db.from("activity_resource_requirements").insert({ organization_id: input.organizationId, activity_id: input.activityId, resource_type_id: input.resourceTypeId, quantity: input.quantity });
    if (error) throw error;
  }

  async setProfessionalQualification(input: Parameters<SchedulingRepository["setProfessionalQualification"]>[0]): Promise<void> {
    const db = this.supabase as any;
    if (input.enabled) { const { error } = await db.from("professional_activities").upsert({ organization_id: input.organizationId, professional_id: input.professionalId, activity_id: input.activityId }); if (error) throw error; return; }
    const { error } = await db.from("professional_activities").delete().eq("organization_id", input.organizationId).eq("professional_id", input.professionalId).eq("activity_id", input.activityId); if (error) throw error;
  }

  async setScheduleRuleStatus(input: Parameters<SchedulingRepository["setScheduleRuleStatus"]>[0]): Promise<void> {
    const { error } = await (this.supabase as any).rpc("set_schedule_rule_status", { p_schedule_rule_id: input.scheduleRuleId, p_status: input.status }); if (error) throw error;
  }
  async updateGenerationWindow(input: Parameters<SchedulingRepository["updateGenerationWindow"]>[0]): Promise<void> {
    const { error } = await (this.supabase as any).from("organization_scheduling_settings").update({
      generation_window_days: input.generationWindowDays,
      late_cancellation_window_minutes: input.cancellationWindowMinutes,
    }).eq("organization_id", input.organizationId); if (error) throw error;
  }
  async refreshOrganizationWindow(organizationId: string): Promise<void> {
    const { error } = await (this.supabase as any).rpc("refresh_organization_scheduling_window", { p_organization_id: organizationId }); if (error) throw error;
  }
}
