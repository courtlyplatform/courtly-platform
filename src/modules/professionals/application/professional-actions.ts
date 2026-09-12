"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/database/supabase/server";
import {
  canManageCommercialData,
  getCurrentOrganizationCommercialContext,
} from "@/shared/auth/get-current-organization-commercial-context";
import { SupabaseProfessionalRepository } from "../infrastructure/supabase-professional-repository";

export type ProfessionalActionResult =
  | { success: true }
  | { success: false; error: string };

export async function saveProfessionalAction(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
}): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentOrganizationCommercialContext(supabase);

    if (!canManageCommercialData(context.role)) {
      return { success: false, error: "forbidden" };
    }

    const name = input.name.trim();
    if (name.length < 2) {
      return { success: false, error: "invalidName" };
    }

    const repository = new SupabaseProfessionalRepository(supabase);
    await repository.create({
      organizationId: context.organizationId,
      name,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
    });

    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[PROFESSIONALS] Failed to save professional", error);
    return { success: false, error: "saveFailed" };
  }
}
