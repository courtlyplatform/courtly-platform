import type { SchedulingPageData } from "../domain/scheduling";
import type { SchedulingRepository } from "../domain/scheduling-repository";

export async function getSchedulingPageData(
  repository: SchedulingRepository,
  organizationId: string
): Promise<SchedulingPageData> {
  return repository.getPageData(organizationId);
}
