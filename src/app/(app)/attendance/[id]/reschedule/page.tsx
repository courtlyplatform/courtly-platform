import { notFound, redirect } from "next/navigation";
import { createClient } from "@/shared/database/supabase/server";
import { getCurrentOrganizationCommercialContext } from "@/shared/auth/get-current-organization-commercial-context";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";
import { RescheduleClient } from "@/modules/attendance/ui/RescheduleClient";

export default async function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const context = await getCurrentOrganizationCommercialContext(supabase);
  const access = await getCurrentAccessContext(supabase);
  if (!can(access, "SCHEDULING_RESCHEDULE")) redirect("/attendance");

  const db = supabase as any;
  const { data: appointment, error } = await db
    .from("appointments")
    .select(`
      id,activity_id,professional_id,starts_at,ends_at,status,attendance_status,
      customers(name),activities(name,professional_requirement,professional_specialties(name,color))
    `)
    .eq("organization_id", context.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!appointment) notFound();
  if (appointment.status !== "SCHEDULED") redirect("/attendance");

  const [{ data: professionals, error: pError }, { data: qualified, error: qError }] = await Promise.all([
    db.from("professionals").select("id,name,active").eq("organization_id", context.organizationId).eq("active", true).order("name"),
    db.from("professional_activities").select("professional_id").eq("organization_id", context.organizationId).eq("activity_id", appointment.activity_id),
  ]);
  if (pError) throw pError;
  if (qError) throw qError;

  const qualifiedIds = new Set((qualified ?? []).map((row: any) => row.professional_id));
  const professionalRequired = appointment.activities?.professional_requirement === "REQUIRED";
  const availableProfessionals = (professionals ?? []).filter((row: any) => !professionalRequired || qualifiedIds.has(row.id));

  return (
    <RescheduleClient
      appointment={{
        id: appointment.id,
        customerName: appointment.customers?.name ?? "",
        activityName: appointment.activities?.name ?? "",
        specialtyName: appointment.activities?.professional_specialties?.name ?? null,
        specialtyColor: appointment.activities?.professional_specialties?.color ?? null,
        professionalId: appointment.professional_id,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        professionalRequired,
      }}
      professionals={availableProfessionals}
    />
  );
}
