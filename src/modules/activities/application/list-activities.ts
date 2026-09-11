import type {
  Activity,
} from "../domain/activity";

import type {
  ActivityRepository,
} from "../domain/activity-repository";

export async function listActivities(
  repository: ActivityRepository,
  organizationId: string
): Promise<Activity[]> {
  return repository.listByOrganization(
    organizationId
  );
}