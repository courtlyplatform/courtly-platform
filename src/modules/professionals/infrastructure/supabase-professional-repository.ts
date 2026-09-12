import type { SupabaseClient } from "@supabase/supabase-js";
import type { Professional } from "../domain/professional";
import type { ProfessionalRepository } from "../domain/professional-repository";

export class SupabaseProfessionalRepository implements ProfessionalRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: {
    organizationId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  }): Promise<Professional> {
    const { data, error } = await (this.supabase as any)
      .from("professionals")
      .insert({
        organization_id: input.organizationId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        active: true,
      })
      .select("id, organization_id, name, email, phone, active")
      .single();

    if (error || !data) throw error ?? new Error("Unable to create professional.");

    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      active: data.active,
    };
  }
}
