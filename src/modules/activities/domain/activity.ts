export type ActivitySchedulingMode = "NONE" | "OPTIONAL" | "REQUIRED";
export type SchedulingRequirement = "NONE" | "OPTIONAL" | "REQUIRED";

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
  specialtyId: string | null;
  specialtyName: string | null;
  specialtyColor: string | null;
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
  specialtyId?: string | null;
};

export type UpdateActivityInput = CreateActivityInput & { id: string };

export type SetActivityStatusInput = {
  id: string;
  organizationId: string;
  active: boolean;
};
