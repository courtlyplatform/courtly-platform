export type ResourceType = {
  id: string;
  organizationId: string;
  name: string;
  active: boolean;
};

export type Resource = {
  id: string;
  organizationId: string;
  resourceTypeId: string | null;
  resourceTypeName: string | null;
  name: string;
  active: boolean;
};
