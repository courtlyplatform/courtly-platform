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
  customerId: string;
  activityId: string;
  customerSubscriptionId?: string | null;
  startsAt: string;
  endsAt: string;
  professionalId?: string | null;
  resourceIds?: string[];
}): Promise<SchedulingActionResult> {
  try {
    const { repository } = await getManagerContext();
    const id = await repository.createAppointment(input);

    revalidatePath("/scheduling");
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
    return { success: true };
  } catch (error) {
    console.error("[SCHEDULING] Failed to cancel appointment", error);
    return { success: false, error: "cancelFailed" };
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
}): Promise<SchedulingActionResult> {
  try {
    const { repository, context } = await getManagerContext();

    if (
      !Number.isInteger(input.generationWindowDays) ||
      input.generationWindowDays < 7 ||
      input.generationWindowDays > 3650
    ) {
      return { success: false, error: "invalidWindow" };
    }

    await repository.updateGenerationWindow({
      organizationId: context.organizationId,
      generationWindowDays: input.generationWindowDays,
    });

    await repository.refreshOrganizationWindow(context.organizationId);

    revalidatePath("/scheduling");
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
