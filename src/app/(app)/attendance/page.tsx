import { redirect } from "next/navigation";
import { createClient } from "@/shared/database/supabase/server";
import { getCurrentOrganizationCommercialContext } from "@/shared/auth/get-current-organization-commercial-context";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";
import { AttendanceClient } from "@/modules/attendance/ui/AttendanceClient";

export default async function AttendancePage() {
  const supabase = await createClient();
  const context = await getCurrentOrganizationCommercialContext(supabase);
  const access = await getCurrentAccessContext(supabase);

  if (!can(access, "ATTENDANCE_VIEW")) {
    redirect("/dashboard");
  }

  const canManageAttendance = can(access, "ATTENDANCE_MANAGE");
  const canReschedule = can(access, "SCHEDULING_RESCHEDULE");

  const db = supabase as any;
  const [appointmentsResult, settingsResult] = await Promise.all([
    db
      .from("appointments")
      .select(`
        id, customer_id, activity_id, professional_id, starts_at, ends_at,
        status, attendance_status, source, cancellation_reason,
        customers(name,document_type,document_number,email,phone),
        activities(name,professional_specialties(name,color)),
        professionals(name)
      `)
      .eq("organization_id", context.organizationId)
      .order("starts_at", { ascending: false }),
    db
      .from("organization_scheduling_settings")
      .select("late_cancellation_window_minutes")
      .eq("organization_id", context.organizationId)
      .single(),
  ]);

  if (appointmentsResult.error) throw appointmentsResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const appointments = (appointmentsResult.data ?? []).map((row: any) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customers?.name ?? "",
    documentType: row.customers?.document_type ?? null,
    documentNumber: row.customers?.document_number ?? null,
    email: row.customers?.email ?? null,
    phone: row.customers?.phone ?? null,
    activityId: row.activity_id,
    activityName: row.activities?.name ?? "",
    specialtyName: row.activities?.professional_specialties?.name ?? null,
    specialtyColor: row.activities?.professional_specialties?.color ?? null,
    professionalId: row.professional_id,
    professionalName: row.professionals?.name ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    appointmentStatus: row.status,
    attendanceStatus: row.attendance_status ?? (row.status === "CANCELLED" ? "CANCELLED" : "PENDING"),
    source: row.source,
    cancellationReason: row.cancellation_reason,
  }));

  return (
    <AttendanceClient
      appointments={appointments}
      cancellationWindowMinutes={settingsResult.data?.late_cancellation_window_minutes ?? 120}
      canManageAttendance={canManageAttendance}
      canReschedule={canReschedule}
    />
  );
}
