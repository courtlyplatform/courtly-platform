import type { Activity } from "../domain/activity";
import type { ActivityRepository } from "../domain/activity-repository";
import { activitySchema } from "./activity-schema";

type Params = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  defaultPrice?: number | null;
  schedulingMode: Activity["schedulingMode"];
  professionalRequirement: Activity["professionalRequirement"];
  resourceRequirement: Activity["resourceRequirement"];
};

export async function updateActivity(
  repository: ActivityRepository,
  params: Params
): Promise<Activity> {
  const validated = activitySchema.parse(params);

  return repository.update({
    id: params.id,
    organizationId: params.organizationId,
    name: validated.name,
    description: validated.description,
    defaultDurationMinutes: validated.defaultDurationMinutes,
    defaultPrice: validated.defaultPrice,
    schedulingMode: validated.schedulingMode,
    professionalRequirement: validated.professionalRequirement,
    resourceRequirement: validated.resourceRequirement,
  });
}
