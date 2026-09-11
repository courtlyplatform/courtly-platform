import type {
  Activity,
  CreateActivityInput,
  SetActivityStatusInput,
  UpdateActivityInput,
} from "./activity";

export interface ActivityRepository {
  listByOrganization(
    organizationId: string
  ): Promise<Activity[]>;

  findById(
    organizationId: string,
    activityId: string
  ): Promise<Activity | null>;

  create(
    input: CreateActivityInput
  ): Promise<Activity>;

  update(
    input: UpdateActivityInput
  ): Promise<Activity>;

  setActive(
    input: SetActivityStatusInput
  ): Promise<void>;
}