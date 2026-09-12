export type ActivitySchedulingMode =
  | "NONE"
  | "OPTIONAL"
  | "REQUIRED";

export type SchedulingRequirement =
  | "NONE"
  | "OPTIONAL"
  | "REQUIRED";

export type Activity = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  defaultDurationMinutes: number;
  defaultPrice: number | null;
  schedulingMode: ActivitySchedulingMode;
  professionalRequirement: SchedulingRequirement;
  resourceRequirement: SchedulingRequirement;
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
  schedulingMode: ActivitySchedulingMode;
  professionalRequirement: SchedulingRequirement;
  resourceRequirement: SchedulingRequirement;
};

export type UpdateActivityInput = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  defaultPrice?: number | null;
  schedulingMode: ActivitySchedulingMode;
  professionalRequirement: SchedulingRequirement;
  resourceRequirement: SchedulingRequirement;
};

export type SetActivityStatusInput = {
  id: string;
  organizationId: string;
  active: boolean;
};
