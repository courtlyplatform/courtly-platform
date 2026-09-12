import { redirect } from "next/navigation";
import { createClient } from "@/shared/database/supabase/server";
import {
  canManageCommercialData,
  getCurrentOrganizationCommercialContext,
} from "@/shared/auth/get-current-organization-commercial-context";
import { getSchedulingPageData } from "@/modules/scheduling/application/get-scheduling-page-data";
import { SupabaseSchedulingRepository } from "@/modules/scheduling/infrastructure/supabase-scheduling-repository";
import { SchedulingClient } from "@/modules/scheduling/ui/SchedulingClient";

export default async function SchedulingPage() {
  const supabase = await createClient();
  const context = await getCurrentOrganizationCommercialContext(supabase);

  if (!canManageCommercialData(context.role)) {
    redirect("/dashboard");
  }

  const repository = new SupabaseSchedulingRepository(supabase);
  const data = await getSchedulingPageData(repository, context.organizationId);

  return <SchedulingClient initialData={data} />;
}
