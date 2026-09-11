import type {
  Activity,
} from "../domain/activity";

import type {
  ActivityRepository,
} from "../domain/activity-repository";

import {
  activitySchema,
} from "./activity-schema";

type Params = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  defaultPrice?: number | null;
};

export async function updateActivity(
  repository: ActivityRepository,
  params: Params
): Promise<Activity> {
  const validated =
    activitySchema.parse({
      name: params.name,
      description:
        params.description,
      defaultDurationMinutes:
        params.defaultDurationMinutes,
      defaultPrice:
        params.defaultPrice,
    });

  return repository.update({
    id:
      params.id,

    organizationId:
      params.organizationId,

    name:
      validated.name,

    description:
      validated.description,

    defaultDurationMinutes:
      validated.defaultDurationMinutes,

    defaultPrice:
      validated.defaultPrice,
  });
}