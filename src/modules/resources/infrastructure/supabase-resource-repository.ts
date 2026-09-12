import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resource } from "../domain/resource";
import type { ResourceRepository } from "../domain/resource-repository";

export class SupabaseResourceRepository implements ResourceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(input: {
    id?: string;
    organizationId: string;
    name: string;
    typeName: string;
  }): Promise<Resource> {
    const db = this.supabase as any;

    const { data: existingType, error: lookupError } = await db
      .from("resource_types")
      .select("id, name")
      .eq("organization_id", input.organizationId)
      .ilike("name", input.typeName)
      .limit(1)
      .maybeSingle();

    if (lookupError) throw lookupError;

    let resourceType = existingType;

    if (!resourceType) {
      const { data: createdType, error: typeError } = await db
        .from("resource_types")
        .insert({
          organization_id: input.organizationId,
          name: input.typeName,
          active: true,
        })
        .select("id, name")
        .single();

      if (typeError || !createdType) {
        throw typeError ?? new Error("Unable to create resource type.");
      }

      resourceType = createdType;
    }

    const mutation = input.id
      ? db
          .from("resources")
          .update({
            name: input.name,
            resource_type_id: resourceType.id,
          })
          .eq("id", input.id)
          .eq("organization_id", input.organizationId)
      : db.from("resources").insert({
          organization_id: input.organizationId,
          resource_type_id: resourceType.id,
          name: input.name,
        });

    const { data, error } = await mutation
      .select("id, organization_id, resource_type_id, name, active")
      .single();

    if (error || !data) throw error ?? new Error("Unable to save resource.");

    return {
      id: data.id,
      organizationId: data.organization_id,
      resourceTypeId: data.resource_type_id,
      resourceTypeName: resourceType.name,
      name: data.name,
      active: data.active,
    };
  }

  async setActive(input: {
    id: string;
    organizationId: string;
    active: boolean;
  }): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("resources")
      .update({ active: input.active })
      .eq("id", input.id)
      .eq("organization_id", input.organizationId);

    if (error) throw error;
  }
}
