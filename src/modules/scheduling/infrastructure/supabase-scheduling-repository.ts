import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseActivityRepository } from "@/modules/activities/infrastructure/supabase-activity-repository";
import { listActivities } from "@/modules/activities/application/list-activities";
import type {
  Appointment,
  ScheduleRule,
  SchedulingPageData,
} from "../domain/scheduling";
import type { SchedulingRepository } from "../domain/scheduling-repository";

export class SupabaseSchedulingRepository implements SchedulingRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getPageData(organizationId: string): Promise<SchedulingPageData> {
    const db = this.supabase as any;
    const activityRepository = new SupabaseActivityRepository(this.supabase);

    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - 31);
    const rangeEnd = new Date();
    rangeEnd.setDate(rangeEnd.getDate() + 120);

    const [
      activities,
      settingsResult,
      customersResult,
      professionalsResult,
      qualificationsResult,
      resourcesResult,
      requirementsResult,
      subscriptionsResult,
      rulesResult,
      conflictsResult,
      ruleResourcesResult,
      appointmentsResult,
      appointmentResourcesResult,
    ] = await Promise.all([
      listActivities(activityRepository, organizationId),
      db
        .from("organization_scheduling_settings")
        .select("scheduling_enabled, generation_window_days")
        .eq("organization_id", organizationId)
        .single(),
      db
        .from("customers")
        .select("id, name, active")
        .eq("organization_id", organizationId)
        .order("name"),
      db
        .from("professionals")
        .select("id, name, active")
        .eq("organization_id", organizationId)
        .order("name"),
      db
        .from("professional_activities")
        .select("professional_id, activity_id")
        .eq("organization_id", organizationId),
      db
        .from("resources")
        .select("id, name, active, resource_type_id, resource_types(name)")
        .eq("organization_id", organizationId)
        .order("name"),
      db
        .from("activity_resource_requirements")
        .select("activity_id, resource_type_id, quantity, resource_types(name)")
        .eq("organization_id", organizationId),
      db
        .from("customer_subscriptions")
        .select("id, customer_id, activity_id, status, billing_cycle, starts_at, ends_at")
        .eq("organization_id", organizationId),
      db
        .from("schedule_rules")
        .select("id, customer_id, customer_subscription_id, activity_id, professional_id, weekday, start_time, end_time, effective_from, effective_until, status")
        .eq("organization_id", organizationId),
      db
        .from("schedule_generation_conflicts")
        .select("id, schedule_rule_id, starts_at, ends_at, reason")
        .eq("organization_id", organizationId)
        .is("resolved_at", null)
        .order("starts_at"),
      db
        .from("schedule_rule_resources")
        .select("schedule_rule_id, resource_id")
        .eq("organization_id", organizationId),
      db
        .from("appointments")
        .select("id, schedule_rule_id, customer_id, customer_subscription_id, activity_id, professional_id, starts_at, ends_at, status, source, cancellation_reason")
        .eq("organization_id", organizationId)
        .gte("starts_at", rangeStart.toISOString())
        .lte("starts_at", rangeEnd.toISOString())
        .order("starts_at"),
      db
        .from("appointment_resources")
        .select("appointment_id, resource_id")
        .eq("organization_id", organizationId),
    ]);

    const results = [
      settingsResult,
      customersResult,
      professionalsResult,
      qualificationsResult,
      resourcesResult,
      requirementsResult,
      subscriptionsResult,
      rulesResult,
      conflictsResult,
      ruleResourcesResult,
      appointmentsResult,
      appointmentResourcesResult,
    ];

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      throw new Error(`Failed to load scheduling: ${failed.error.message}`);
    }

    const qualificationMap = new Map<string, string[]>();
    for (const row of qualificationsResult.data ?? []) {
      const ids = qualificationMap.get(row.professional_id) ?? [];
      ids.push(row.activity_id);
      qualificationMap.set(row.professional_id, ids);
    }

    const ruleResourceMap = new Map<string, string[]>();
    for (const row of ruleResourcesResult.data ?? []) {
      const ids = ruleResourceMap.get(row.schedule_rule_id) ?? [];
      ids.push(row.resource_id);
      ruleResourceMap.set(row.schedule_rule_id, ids);
    }

    const appointmentResourceMap = new Map<string, string[]>();
    for (const row of appointmentResourcesResult.data ?? []) {
      const ids = appointmentResourceMap.get(row.appointment_id) ?? [];
      ids.push(row.resource_id);
      appointmentResourceMap.set(row.appointment_id, ids);
    }

    const rules: ScheduleRule[] = (rulesResult.data ?? []).map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      customerSubscriptionId: row.customer_subscription_id,
      activityId: row.activity_id,
      professionalId: row.professional_id,
      weekday: row.weekday,
      startTime: row.start_time,
      endTime: row.end_time,
      effectiveFrom: row.effective_from,
      effectiveUntil: row.effective_until,
      status: row.status,
      resourceIds: ruleResourceMap.get(row.id) ?? [],
    }));

    const appointments: Appointment[] = (appointmentsResult.data ?? []).map((row: any) => ({
      id: row.id,
      scheduleRuleId: row.schedule_rule_id,
      customerId: row.customer_id,
      customerSubscriptionId: row.customer_subscription_id,
      activityId: row.activity_id,
      professionalId: row.professional_id,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      source: row.source,
      cancellationReason: row.cancellation_reason,
      resourceIds: appointmentResourceMap.get(row.id) ?? [],
    }));

    return {
      settings: {
        schedulingEnabled: settingsResult.data.scheduling_enabled,
        generationWindowDays: settingsResult.data.generation_window_days,
      },
      activities,
      customers: (customersResult.data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        active: row.active,
      })),
      professionals: (professionalsResult.data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        active: row.active,
        activityIds: qualificationMap.get(row.id) ?? [],
      })),
      resources: (resourcesResult.data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        active: row.active,
        resourceTypeId: row.resource_type_id,
        resourceTypeName: row.resource_types?.name ?? "Resource",
      })),
      activityResourceRequirements: (requirementsResult.data ?? []).map((row: any) => ({
        activityId: row.activity_id,
        resourceTypeId: row.resource_type_id,
        resourceTypeName: row.resource_types?.name ?? "Resource",
        quantity: row.quantity,
      })),
      subscriptions: (subscriptionsResult.data ?? []).map((row: any) => ({
        id: row.id,
        customerId: row.customer_id,
        activityId: row.activity_id,
        status: row.status,
        billingCycle: row.billing_cycle,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
      })),
      rules,
      conflicts: (conflictsResult.data ?? []).map((row: any) => ({
        id: row.id,
        scheduleRuleId: row.schedule_rule_id,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        reason: row.reason,
      })),
      appointments,
    };
  }

  async createAppointment(input: Parameters<SchedulingRepository["createAppointment"]>[0]): Promise<string> {
    const { data, error } = await (this.supabase as any).rpc("create_scheduling_appointment", {
      p_customer_id: input.customerId,
      p_activity_id: input.activityId,
      p_customer_subscription_id: input.customerSubscriptionId ?? null,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt,
      p_professional_id: input.professionalId ?? null,
      p_resource_ids: input.resourceIds ?? [],
      p_source: "MANUAL",
    });

    if (error) throw error;
    return data as string;
  }

  async createScheduleRule(input: Parameters<SchedulingRepository["createScheduleRule"]>[0]): Promise<string> {
    const { data, error } = await (this.supabase as any).rpc("create_scheduling_rule", {
      p_customer_subscription_id: input.customerSubscriptionId,
      p_weekday: input.weekday,
      p_start_time: input.startTime,
      p_end_time: input.endTime,
      p_effective_from: input.effectiveFrom,
      p_effective_until: input.effectiveUntil ?? null,
      p_professional_id: input.professionalId ?? null,
      p_resource_ids: input.resourceIds ?? [],
    });

    if (error) throw error;
    return data as string;
  }

  async cancelAppointment(input: Parameters<SchedulingRepository["cancelAppointment"]>[0]): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("appointments")
      .update({
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: input.reason,
      })
      .eq("id", input.appointmentId)
      .eq("organization_id", input.organizationId)
      .eq("status", "SCHEDULED");

    if (error) throw error;
  }

  async setActivityResourceRequirement(input: Parameters<SchedulingRepository["setActivityResourceRequirement"]>[0]): Promise<void> {
    const db = this.supabase as any;
    const { error: deleteError } = await db
      .from("activity_resource_requirements")
      .delete()
      .eq("organization_id", input.organizationId)
      .eq("activity_id", input.activityId);

    if (deleteError) throw deleteError;

    const { error } = await db.from("activity_resource_requirements").insert({
      organization_id: input.organizationId,
      activity_id: input.activityId,
      resource_type_id: input.resourceTypeId,
      quantity: input.quantity,
    });

    if (error) throw error;
  }

  async setProfessionalQualification(input: Parameters<SchedulingRepository["setProfessionalQualification"]>[0]): Promise<void> {
    const db = this.supabase as any;

    if (input.enabled) {
      const { error } = await db.from("professional_activities").upsert({
        organization_id: input.organizationId,
        professional_id: input.professionalId,
        activity_id: input.activityId,
      });
      if (error) throw error;
      return;
    }

    const { error } = await db
      .from("professional_activities")
      .delete()
      .eq("organization_id", input.organizationId)
      .eq("professional_id", input.professionalId)
      .eq("activity_id", input.activityId);

    if (error) throw error;
  }

  async setScheduleRuleStatus(input: Parameters<SchedulingRepository["setScheduleRuleStatus"]>[0]): Promise<void> {
    const { error } = await (this.supabase as any).rpc("set_schedule_rule_status", {
      p_schedule_rule_id: input.scheduleRuleId,
      p_status: input.status,
    });

    if (error) throw error;
  }

  async updateGenerationWindow(input: Parameters<SchedulingRepository["updateGenerationWindow"]>[0]): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("organization_scheduling_settings")
      .update({ generation_window_days: input.generationWindowDays })
      .eq("organization_id", input.organizationId);

    if (error) throw error;
  }

  async refreshOrganizationWindow(organizationId: string): Promise<void> {
    const { error } = await (this.supabase as any).rpc("refresh_organization_scheduling_window", {
      p_organization_id: organizationId,
    });

    if (error) throw error;
  }
}
