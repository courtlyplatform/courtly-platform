import { redirect } from "next/navigation";
import { ServicesClient } from "@/modules/activities/ui/services-client";
import { SupabaseActivityRepository } from "@/modules/activities/infrastructure/supabase-activity-repository";
import { listActivities } from "@/modules/activities/application/list-activities";
import { getCurrentOrganizationId } from "@/shared/auth/get-current-organization-id";
import { createClient } from "@/shared/database/supabase/server";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const access = await getCurrentAccessContext(supabase);
  if (!can(access, "SERVICES_VIEW")) redirect("/dashboard");

  const organizationId = await getCurrentOrganizationId(supabase);
  const repository = new SupabaseActivityRepository(supabase);

  const [activities, poolsResult, membersResult, requirementsResult, specialtiesResult] =
    await Promise.all([
      listActivities(repository, organizationId),
      (supabase as any)
        .from("resource_pools")
        .select("id,name,active")
        .eq("organization_id", organizationId)
        .order("name"),
      (supabase as any)
        .from("resource_pool_members")
        .select("resource_pool_id,resource_id,resources(active)")
        .eq("organization_id", organizationId),
      (supabase as any)
        .from("activity_resource_requirements")
        .select("activity_id,resource_pool_id,quantity")
        .eq("organization_id", organizationId)
        .not("resource_pool_id", "is", null),
      (supabase as any)
        .from("professional_specialties")
        .select("id,name,color,active")
        .eq("organization_id", organizationId)
        .order("name"),
    ]);

  const failed = [poolsResult, membersResult, requirementsResult, specialtiesResult].find(
    (result) => result.error,
  );
  if (failed?.error) {
    throw new Error(`Failed to load service configuration: ${failed.error.message}`);
  }

  const activeMemberCounts = new Map<string, number>();
  for (const member of membersResult.data ?? []) {
    if (!member.resources?.active) continue;
    activeMemberCounts.set(
      member.resource_pool_id,
      (activeMemberCounts.get(member.resource_pool_id) ?? 0) + 1,
    );
  }

  return (
    <ServicesClient
      initialActivities={activities}
      resourcePools={(poolsResult.data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        active: row.active,
        activeResourceCount: activeMemberCounts.get(row.id) ?? 0,
      }))}
      resourceRequirements={(requirementsResult.data ?? []).map((row: any) => ({
        activityId: row.activity_id,
        resourcePoolId: row.resource_pool_id,
        quantity: row.quantity,
      }))}
      specialties={(specialtiesResult.data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        active: row.active,
      }))}
    />
  );
}
