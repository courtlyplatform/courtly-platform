"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/database/supabase/server";
import {
  canManageCommercialData,
  getCurrentOrganizationCommercialContext,
} from "@/shared/auth/get-current-organization-commercial-context";
import { SupabaseResourceRepository } from "../infrastructure/supabase-resource-repository";

export type ResourceActionResult =
  | { success: true }
  | { success: false; error: string };

export async function saveResourceAction(input: {
  id?: string;
  name: string;
  typeName: string;
}): Promise<ResourceActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentOrganizationCommercialContext(supabase);

    if (!canManageCommercialData(context.role)) {
      return { success: false, error: "forbidden" };
    }

    const name = input.name.trim();
    const typeName = input.typeName.trim();

    if (!name || !typeName) {
      return { success: false, error: "invalidData" };
    }

    const repository = new SupabaseResourceRepository(supabase);
    await repository.save({
      id: input.id,
      organizationId: context.organizationId,
      name,
      typeName,
    });

    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[RESOURCES] Failed to save resource", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "saveFailed",
    };
  }
}

export async function toggleResourceAction(
  resourceId: string,
  active: boolean
): Promise<ResourceActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentOrganizationCommercialContext(supabase);

    if (!canManageCommercialData(context.role)) {
      return { success: false, error: "forbidden" };
    }

    const repository = new SupabaseResourceRepository(supabase);
    await repository.setActive({
      id: resourceId,
      organizationId: context.organizationId,
      active,
    });

    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[RESOURCES] Failed to change resource status", error);
    return { success: false, error: "statusFailed" };
  }
}
