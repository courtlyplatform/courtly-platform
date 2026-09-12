import type { Resource } from "./resource";

export interface ResourceRepository {
  save(input: {
    id?: string;
    organizationId: string;
    name: string;
    typeName: string;
  }): Promise<Resource>;

  setActive(input: {
    id: string;
    organizationId: string;
    active: boolean;
  }): Promise<void>;
}
