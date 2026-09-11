import type {
  ActivityRepository,
} from "../domain/activity-repository";

type Params = {
  id: string;
  organizationId: string;
  active: boolean;
};

export async function setActivityStatus(
  repository: ActivityRepository,
  params: Params
): Promise<void> {
  await repository.setActive({
    id:
      params.id,

    organizationId:
      params.organizationId,

    active:
      params.active,
  });
}