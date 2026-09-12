"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/database/supabase/server";
import { canManageCommercialData, getCurrentOrganizationCommercialContext } from "@/shared/auth/get-current-organization-commercial-context";
import { SupabaseResourceRepository } from "../infrastructure/supabase-resource-repository";

export type ResourceActionResult = { success: true; id?: string } | { success: false; error: string };

async function manager() {
  const supabase = await createClient();
  const context = await getCurrentOrganizationCommercialContext(supabase);
  if (!canManageCommercialData(context.role)) throw new Error("forbidden");
  return { context, repository: new SupabaseResourceRepository(supabase) };
}

export async function saveResourceTypeAction(input: { id?: string; name: string }): Promise<ResourceActionResult> {
  try {
    const { context, repository } = await manager();
    const name = input.name.trim();
    if (!name) return { success: false, error: "invalidData" };
    const saved = await repository.saveType({ id: input.id, organizationId: context.organizationId, name });
    revalidatePath("/scheduling");
    return { success: true, id: saved.id };
  } catch (error) {
    console.error("[RESOURCES] Failed to save resource type", error);
    return { success: false, error: error instanceof Error ? error.message : "saveFailed" };
  }
}

export async function saveResourceAction(input: { id?: string; name: string; resourceTypeId?: string | null }): Promise<ResourceActionResult> {
  try {
    const { context, repository } = await manager();
    const name = input.name.trim();
    if (!name) return { success: false, error: "invalidData" };
    const saved = await repository.save({ id: input.id, organizationId: context.organizationId, name, resourceTypeId: input.resourceTypeId ?? null });
    revalidatePath("/scheduling");
    return { success: true, id: saved.id };
  } catch (error) {
    console.error("[RESOURCES] Failed to save resource", error);
    return { success: false, error: error instanceof Error ? error.message : "saveFailed" };
  }
}

export async function toggleResourceAction(resourceId: string, active: boolean): Promise<ResourceActionResult> {
  try {
    const { context, repository } = await manager();
    await repository.setActive({ id: resourceId, organizationId: context.organizationId, active });
    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[RESOURCES] Failed to change resource status", error);
    return { success: false, error: "statusFailed" };
  }
}
