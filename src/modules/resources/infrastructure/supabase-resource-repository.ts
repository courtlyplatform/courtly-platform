import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resource, ResourceType } from "../domain/resource";
import type { ResourceRepository } from "../domain/resource-repository";

export class SupabaseResourceRepository implements ResourceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listTypes(organizationId: string): Promise<ResourceType[]> {
    const { data, error } = await (this.supabase as any).from("resource_types")
      .select("id,organization_id,name,active").eq("organization_id", organizationId).order("name");
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ id: row.id, organizationId: row.organization_id, name: row.name, active: row.active }));
  }

  async saveType(input: { id?: string; organizationId: string; name: string }): Promise<ResourceType> {
    const db = this.supabase as any;
    const mutation = input.id
      ? db.from("resource_types").update({ name: input.name }).eq("id", input.id).eq("organization_id", input.organizationId)
      : db.from("resource_types").insert({ organization_id: input.organizationId, name: input.name, active: true });
    const { data, error } = await mutation.select("id,organization_id,name,active").single();
    if (error) throw error;
    return { id: data.id, organizationId: data.organization_id, name: data.name, active: data.active };
  }

  async save(input: { id?: string; organizationId: string; name: string; resourceTypeId?: string | null }): Promise<Resource> {
    const db = this.supabase as any;
    const mutation = input.id
      ? db.from("resources").update({ name: input.name, resource_type_id: input.resourceTypeId ?? null }).eq("id", input.id).eq("organization_id", input.organizationId)
      : db.from("resources").insert({ organization_id: input.organizationId, resource_type_id: input.resourceTypeId ?? null, name: input.name, active: true });
    const { data, error } = await mutation.select("id,organization_id,resource_type_id,name,active,resource_types(name)").single();
    if (error || !data) throw error ?? new Error("Unable to save resource.");
    return {
      id: data.id,
      organizationId: data.organization_id,
      resourceTypeId: data.resource_type_id,
      resourceTypeName: data.resource_types?.name ?? null,
      name: data.name,
      active: data.active,
    };
  }

  async setActive(input: { id: string; organizationId: string; active: boolean }): Promise<void> {
    const { error } = await (this.supabase as any).from("resources").update({ active: input.active })
      .eq("id", input.id).eq("organization_id", input.organizationId);
    if (error) throw error;
  }
}
