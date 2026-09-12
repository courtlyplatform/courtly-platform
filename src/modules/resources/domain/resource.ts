export type ResourceType = {
  id: string;
  organizationId: string;
  name: string;
  active: boolean;
};

export type Resource = {
  id: string;
  organizationId: string;
  resourceTypeId: string;
  resourceTypeName: string;
  name: string;
  active: boolean;
};
