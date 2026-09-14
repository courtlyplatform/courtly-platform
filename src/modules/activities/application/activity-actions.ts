"use server";

import { revalidatePath } from "next/cache";
import { createActivity } from "./create-activity";
import { updateActivity } from "./update-activity";
import { setActivityStatus } from "./set-activity-status";
import { SupabaseActivityRepository } from "../infrastructure/supabase-activity-repository";
import { getCurrentOrganizationId } from "@/shared/auth/get-current-organization-id";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";
import { createClient } from "@/shared/database/supabase/server";

export type ActivityActionResult = {
  success: boolean;
  id?: string;
  error?: string;
};

type ResourceRequirementRequest = {
  resourcePoolId: string;
  quantity: number;
};

type SaveActivityRequest = {
  id?: string;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  defaultPrice?: number | null;
  schedulingMode: "NONE" | "OPTIONAL" | "REQUIRED";
  professionalRequirement: "NONE" | "OPTIONAL" | "REQUIRED";
  resourceRequirement: "NONE" | "OPTIONAL" | "REQUIRED";
  specialtyId?: string | null;
  resourceRequirements?: ResourceRequirementRequest[];
};

export async function saveActivityAction(
  request: SaveActivityRequest,
): Promise<ActivityActionResult> {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId(supabase);
    const access = await getCurrentAccessContext(supabase);

    if (!can(access, request.id ? "SERVICES_EDIT" : "SERVICES_CREATE")) {
      return { success: false, error: "forbidden" };
    }

    const normalizedRequirements =
      request.schedulingMode === "NONE" || request.resourceRequirement === "NONE"
        ? []
        : normalizeResourceRequirements(request.resourceRequirements ?? []);

    if (
      request.schedulingMode !== "NONE" &&
      request.resourceRequirement === "REQUIRED" &&
      normalizedRequirements.length === 0
    ) {
      return { success: false, error: "resourceRequirementMissing" };
    }

    const repository = new SupabaseActivityRepository(supabase);
    const common = {
      organizationId,
      name: request.name,
      description: request.description,
      defaultDurationMinutes: request.defaultDurationMinutes,
      defaultPrice: request.defaultPrice,
      schedulingMode: request.schedulingMode,
      professionalRequirement: request.professionalRequirement,
      resourceRequirement: request.resourceRequirement,
      specialtyId: request.specialtyId ?? null,
    };

    const saved = request.id
      ? await updateActivity(repository, { id: request.id, ...common })
      : await createActivity(repository, common);

    const { error: requirementError } = await (supabase as any).rpc(
      "replace_activity_resource_requirements",
      {
        p_activity_id: saved.id,
        p_requirements: normalizedRequirements,
      },
    );

    if (requirementError) {
      throw new Error(requirementError.message);
    }

    revalidatePath("/services");
    revalidatePath("/scheduling");

    return { success: true, id: saved.id };
  } catch (error) {
    console.error("[ACTIVITIES] Failed to save activity", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function toggleActivityAction(
  activityId: string,
  active: boolean,
): Promise<ActivityActionResult> {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentOrganizationId(supabase);
    const access = await getCurrentAccessContext(supabase);

    if (!can(access, "SERVICES_DEACTIVATE")) {
      return { success: false, error: "forbidden" };
    }

    const repository = new SupabaseActivityRepository(supabase);
    await setActivityStatus(repository, { id: activityId, organizationId, active });

    revalidatePath("/services");
    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[ACTIVITIES] Failed to change activity status", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

function normalizeResourceRequirements(
  requirements: ResourceRequirementRequest[],
): ResourceRequirementRequest[] {
  const merged = new Map<string, number>();

  for (const requirement of requirements) {
    const resourcePoolId = requirement.resourcePoolId.trim();
    const quantity = Number(requirement.quantity);
    if (!resourcePoolId || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("invalidResourceRequirement");
    }
    merged.set(resourcePoolId, (merged.get(resourcePoolId) ?? 0) + quantity);
  }

  return Array.from(merged, ([resourcePoolId, quantity]) => ({
    resourcePoolId,
    quantity,
  }));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("uq_activities_organization_name") ||
      error.message.includes("duplicate key")
    ) {
      return "Já existe um serviço com este nome.";
    }
    return error.message;
  }

  return "Não foi possível concluir a operação.";
}
