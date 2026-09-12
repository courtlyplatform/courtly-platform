import {
  redirect,
} from "next/navigation";

import {
  ServicesClient,
} from "@/modules/activities/ui/services-client";

import {
  SupabaseActivityRepository,
} from "@/modules/activities/infrastructure/supabase-activity-repository";

import {
  listActivities,
} from "@/modules/activities/application/list-activities";

import {
  getCurrentOrganizationId,
} from "@/shared/auth/get-current-organization-id";

import {
  createClient,
} from "@/shared/database/supabase/server";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";

export default async function ServicesPage() {
  const supabase =
    await createClient();

  const {
    data: authData,
  } =
    await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  const access = await getCurrentAccessContext(supabase);
  if (!can(access, "SERVICES_VIEW")) redirect("/dashboard");

  const organizationId =
    await getCurrentOrganizationId(
      supabase
    );

  const repository =
    new SupabaseActivityRepository(
      supabase
    );

  const activities =
    await listActivities(
      repository,
      organizationId
    );

  return (
    <ServicesClient
      initialActivities={
        activities
      }
    />
  );
}