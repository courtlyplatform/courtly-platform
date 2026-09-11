export type Activity = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  defaultDurationMinutes: number;
  defaultPrice: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateActivityInput = {
  organizationId: string;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  defaultPrice?: number | null;
};

export type UpdateActivityInput = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  defaultPrice?: number | null;
};

export type SetActivityStatusInput = {
  id: string;
  organizationId: string;
  active: boolean;
};