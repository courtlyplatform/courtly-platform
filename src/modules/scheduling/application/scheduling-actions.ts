"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/database/supabase/server";
import {
  getCurrentOrganizationCommercialContext,
} from "@/shared/auth/get-current-organization-commercial-context";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";
import { SupabaseSchedulingRepository } from "../infrastructure/supabase-scheduling-repository";

export type SchedulingActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

async function getManagerContext() {
  const supabase = await createClient();
  const context = await getCurrentOrganizationCommercialContext(supabase);

  const access = await getCurrentAccessContext(supabase);
  if (!can(access, "SCHEDULING_EDIT")) {
    throw new Error("forbidden");
  }

  return {
    context,
    repository: new SupabaseSchedulingRepository(supabase),
  };
}

export async function createAppointmentAction(input: {
  customerIds: string[];
  activityId: string;
  customerSubscriptionId?: string | null;
  startsAt: string;
  endsAt: string;
  professionalId?: string | null;
  resourceIds?: string[];
}): Promise<SchedulingActionResult> {
  try {
    if (!input.customerIds?.length) return { success: false, error: "participantRequired" };
    if (new Date(input.startsAt).getTime() <= Date.now()) {
      return { success: false, error: "pastAppointment" };
    }
    if (new Date(input.endsAt).getTime() <= new Date(input.startsAt).getTime()) {
      return { success: false, error: "invalidInterval" };
    }

    const { repository } = await getManagerContext();
    const id = await repository.createAppointment(input);

    revalidatePath("/scheduling");
    revalidatePath("/attendance");
    return { success: true, id };
  } catch (error) {
    console.error("[SCHEDULING] Failed to create appointment", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "appointmentFailed",
    };
  }
}

export async function createScheduleRuleAction(input: {
  customerSubscriptionId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  professionalId?: string | null;
  resourceIds?: string[];
}): Promise<SchedulingActionResult> {
  try {
    const { repository } = await getManagerContext();
    const id = await repository.createScheduleRule(input);

    revalidatePath("/scheduling");
    return { success: true, id };
  } catch (error) {
    console.error("[SCHEDULING] Failed to create schedule rule", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ruleFailed",
    };
  }
}

export async function createWeeklyScheduleRulesAction(input: {
  customerSubscriptionId: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  professionalId?: string | null;
  resourceIds?: string[];
}): Promise<SchedulingActionResult> {
  try {
    const { repository } = await getManagerContext();
    if (!input.weekdays.length || new Set(input.weekdays).size !== input.weekdays.length ||
        input.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
      return { success: false, error: "invalidWeekdays" };
    }
    const id = await repository.createWeeklyScheduleRules(input);
    revalidatePath("/scheduling");
    return { success: true, id };
  } catch (error) {
    console.error("[SCHEDULING] Failed to create weekly schedule rules", error);
    return { success: false, error: error instanceof Error ? error.message : "ruleFailed" };
  }
}

export async function cancelAppointmentAction(
  appointmentId: string,
  reason = "MANUAL_CANCELLATION"
): Promise<SchedulingActionResult> {
  try {
    const { repository, context } = await getManagerContext();

    await repository.cancelAppointment({
      organizationId: context.organizationId,
      appointmentId,
      reason,
    });

    revalidatePath("/scheduling");
    revalidatePath("/attendance");
    return { success: true };
  } catch (error) {
    console.error("[SCHEDULING] Failed to cancel appointment", error);
    return { success: false, error: error instanceof Error ? error.message : "cancelFailed" };
  }
}

export async function setActivityResourceRequirementAction(input: {
  activityId: string;
  resourceTypeId: string;
  quantity: number;
}): Promise<SchedulingActionResult> {
  try {
    const { repository, context } = await getManagerContext();

    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      return { success: false, error: "invalidQuantity" };
    }

    await repository.setActivityResourceRequirement({
      organizationId: context.organizationId,
      ...input,
    });

    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[SCHEDULING] Failed to save resource requirement", error);
    return { success: false, error: "requirementFailed" };
  }
}

export async function setProfessionalQualificationAction(input: {
  professionalId: string;
  activityId: string;
  enabled: boolean;
}): Promise<SchedulingActionResult> {
  try {
    const { repository, context } = await getManagerContext();

    await repository.setProfessionalQualification({
      organizationId: context.organizationId,
      ...input,
    });

    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[SCHEDULING] Failed to save professional qualification", error);
    return { success: false, error: "qualificationFailed" };
  }
}

export async function changeScheduleRuleStatusAction(
  scheduleRuleId: string,
  status: "ACTIVE" | "PAUSED" | "ENDED"
): Promise<SchedulingActionResult> {
  try {
    const { repository } = await getManagerContext();
    await repository.setScheduleRuleStatus({ scheduleRuleId, status });

    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[SCHEDULING] Failed to change schedule rule status", error);
    return { success: false, error: "ruleStatusFailed" };
  }
}

export async function updateSchedulingSettingsAction(input: {
  generationWindowDays: number;
  cancellationWindowMinutes: number;
}): Promise<SchedulingActionResult> {
  try {
    const { repository, context } = await getManagerContext();

    if (
      !Number.isInteger(input.generationWindowDays) ||
      input.generationWindowDays < 7 ||
      input.generationWindowDays > 3650 ||
      !Number.isInteger(input.cancellationWindowMinutes) ||
      input.cancellationWindowMinutes < 0 ||
      input.cancellationWindowMinutes > 10080
    ) {
      return { success: false, error: "invalidWindow" };
    }

    await repository.updateGenerationWindow({
      organizationId: context.organizationId,
      generationWindowDays: input.generationWindowDays,
      cancellationWindowMinutes: input.cancellationWindowMinutes,
    });

    await repository.refreshOrganizationWindow(context.organizationId);

    revalidatePath("/scheduling");
    revalidatePath("/attendance");
    return { success: true };
  } catch (error) {
    console.error("[SCHEDULING] Failed to update settings", error);
    return { success: false, error: "settingsFailed" };
  }
}

export async function setActivitySpecialtyAction(input: { activityId: string; specialtyId: string | null }): Promise<SchedulingActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentOrganizationCommercialContext(supabase);
    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "SERVICES_EDIT")) return { success: false, error: "forbidden" };
    const { error } = await (supabase as any).from("activities")
      .update({ specialty_id: input.specialtyId })
      .eq("id", input.activityId).eq("organization_id", context.organizationId);
    if (error) throw error;
    revalidatePath("/scheduling");
    revalidatePath("/services");
    return { success: true };
  } catch (error) {
    console.error("[SCHEDULING] Failed to set activity specialty", error);
    return { success: false, error: "specialtyFailed" };
  }
}


export async function settleAppointmentPaymentAction(input: { appointmentId: string; amount?: number | null; reference?: string | null }): Promise<SchedulingActionResult> {
  try {
    const { repository } = await getManagerContext();
    await repository.settleAppointmentPayment(input);
    revalidatePath("/scheduling"); revalidatePath("/attendance"); revalidatePath("/financial");
    return { success: true };
  } catch (error) {
    console.error("[SCHEDULING] Failed to settle appointment", error);
    return { success: false, error: error instanceof Error ? error.message : "paymentFailed" };
  }
}


/** Tenant-scoped, paginated autocomplete; never loads the full customer directory. */
export async function searchAppointmentCustomersAction(query: string): Promise<{ id: string; name: string; documentNumber: string | null }[]> {
  const term = query.trim().slice(0, 80);
  if (term.length < 2) return [];
  const supabase = await createClient();
  const context = await getCurrentOrganizationCommercialContext(supabase);
  const access = await getCurrentAccessContext(supabase);
  if (!can(access, "SCHEDULING_VIEW_ALL") && !can(access, "SCHEDULING_VIEW_OWN") && !can(access, "SCHEDULING_EDIT")) throw new Error("forbidden");
  // Escape PostgREST OR expression delimiters and LIKE wildcards.
  const safe = term.replace(/[%_,().\\]/g, "");
  if (safe.length < 2) return [];
  const digits = term.replace(/\D/g, "");
  const predicates = [`name.ilike.%${safe}%`];
  if (digits.length >= 2) predicates.push(`document_number.ilike.%${digits}%`);
  const { data, error } = await supabase.from("customers")
    .select("id,name,document_number")
    .eq("organization_id", context.organizationId)
    .eq("active", true)
    .or(predicates.join(","))
    .order("name", { ascending: true }).limit(10);
  if (error) throw new Error("customerSearchFailed");
  return (data ?? []).map(row => ({ id: row.id, name: row.name, documentNumber: row.document_number }));
}

/** Search active commercial contracts on demand, scoped to the authenticated tenant. */
export async function searchRecurrenceSubscriptionsAction(query: string): Promise<{
  id: string; customerName: string; documentNumber: string | null; activityName: string;
}[]> {
  const term = query.trim().slice(0, 80);
  if (term.length < 2) return [];
  const supabase = await createClient();
  const context = await getCurrentOrganizationCommercialContext(supabase);
  const access = await getCurrentAccessContext(supabase);
  if (!can(access, "SCHEDULING_EDIT")) throw new Error("forbidden");
  const safe = term.replace(/[%_,().\\]/g, "");
  if (safe.length < 2) return [];
  const digits = term.replace(/\D/g, "");
  const predicates = [`name.ilike.%${safe}%`];
  if (digits.length >= 2) predicates.push(`document_number.ilike.%${digits}%`);
  const { data: customers, error: customerError } = await supabase.from("customers")
    .select("id,name,document_number")
    .eq("organization_id", context.organizationId)
    .or(predicates.join(","))
    .order("name")
    .limit(50);
  if (customerError) throw customerError;
  if (!customers?.length) return [];
  const { data: subscriptions, error: subscriptionError } = await supabase.from("customer_subscriptions")
    .select("id,customer_id,activity_id")
    .eq("organization_id", context.organizationId)
    .eq("status", "ACTIVE")
    .in("customer_id", customers.map((customer) => customer.id))
    .limit(50);
  if (subscriptionError) throw subscriptionError;
  if (!subscriptions?.length) return [];
  const activityIds = [...new Set(subscriptions.map((subscription) => subscription.activity_id))];
  const { data: activities, error: activityError } = await supabase.from("activities")
    .select("id,name,scheduling_mode")
    .eq("organization_id", context.organizationId)
    .in("id", activityIds);
  if (activityError) throw activityError;
  const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
  const activityMap = new Map((activities ?? []).filter((activity) => activity.scheduling_mode !== "NONE").map((activity) => [activity.id, activity]));
  return subscriptions.flatMap((subscription) => {
    const customer = customerMap.get(subscription.customer_id);
    const activity = activityMap.get(subscription.activity_id);
    return customer && activity ? [{ id: subscription.id, customerName: customer.name, documentNumber: customer.document_number, activityName: activity.name }] : [];
  }).slice(0, 10);
}
