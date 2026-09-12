import type { Resource, ResourceType } from "./resource";

export interface ResourceRepository {
  listTypes(organizationId: string): Promise<ResourceType[]>;
  saveType(input: { id?: string; organizationId: string; name: string }): Promise<ResourceType>;
  save(input: { id?: string; organizationId: string; name: string; resourceTypeId?: string | null }): Promise<Resource>;
  setActive(input: { id: string; organizationId: string; active: boolean }): Promise<void>;
}
