"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/database/supabase/server";
import { canManageCommercialData, getCurrentOrganizationCommercialContext } from "@/shared/auth/get-current-organization-commercial-context";
import { SupabaseResourceRepository } from "../infrastructure/supabase-resource-repository";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";

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
  } catch (error: any) {
    console.error("[RESOURCES] Failed to save resource", error);

    if (
      error?.code === "23505" ||
      String(error?.message ?? "").includes("uq_resources_organization_name")
    ) {
      return { success: false, error: "resourceNameAlreadyExists" };
    }

    return { success: false, error: error?.message ?? "saveFailed" };
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

export async function saveResourcePoolAction(input: {
  id?: string;
  name: string;
  resourceIds: string[];
}): Promise<ResourceActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentOrganizationCommercialContext(supabase);
    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "SCHEDULING_EDIT")) throw new Error("forbidden");

    const name = input.name.trim();
    if (!name) return { success: false, error: "invalidData" };

    const { data, error } = await (supabase as any).rpc("save_resource_pool", {
      p_organization_id: context.organizationId,
      p_pool_id: input.id ?? null,
      p_name: name,
      p_resource_ids: input.resourceIds,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/scheduling");
    revalidatePath("/services");
    return { success: true, id: data as string };
  } catch (error) {
    console.error("[RESOURCES] Failed to save resource pool", error);
    return { success: false, error: error instanceof Error ? error.message : "saveFailed" };
  }
}
