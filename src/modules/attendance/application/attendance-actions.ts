"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/database/supabase/server";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";

export type AttendanceActionResult =
  | { success: true }
  | { success: false; error: string };

export async function setAttendanceStatusAction(
  appointmentId: string,
  status: "PENDING" | "CONFIRMED",
): Promise<AttendanceActionResult> {
  try {
    const supabase = await createClient();
    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "ATTENDANCE_MANAGE")) return { success: false, error: "forbidden" };

    const { error } = await (supabase as any).rpc("set_appointment_attendance_status", {
      p_appointment_id: appointmentId,
      p_status: status,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/attendance");
    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[ATTENDANCE] Failed to change confirmation status", error);
    return { success: false, error: error instanceof Error ? error.message : "statusFailed" };
  }
}

export async function rescheduleAppointmentAction(input: {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
  professionalId?: string | null;
}): Promise<AttendanceActionResult> {
  try {
    if (new Date(input.startsAt).getTime() <= Date.now()) {
      return { success: false, error: "pastAppointment" };
    }
    if (new Date(input.endsAt).getTime() <= new Date(input.startsAt).getTime()) {
      return { success: false, error: "invalidInterval" };
    }

    const supabase = await createClient();
    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "SCHEDULING_RESCHEDULE")) return { success: false, error: "forbidden" };

    const { error } = await (supabase as any).rpc("reschedule_scheduling_appointment", {
      p_appointment_id: input.appointmentId,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt,
      p_professional_id: input.professionalId ?? null,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/attendance");
    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[ATTENDANCE] Failed to reschedule appointment", error);
    return { success: false, error: error instanceof Error ? error.message : "rescheduleFailed" };
  }
}


export async function setParticipantAttendanceStatusAction(appointmentId: string, customerId: string, status: "PENDING" | "CONFIRMED" | "ABSENT" | "CANCELLED"): Promise<AttendanceActionResult> {
  try {
    const supabase = await createClient(); const access = await getCurrentAccessContext(supabase);
    if (!can(access, "ATTENDANCE_MANAGE")) return { success: false, error: "forbidden" };
    const { error } = await (supabase as any).rpc("set_appointment_participant_attendance_status", { p_appointment_id: appointmentId, p_customer_id: customerId, p_status: status });
    if (error) throw new Error(error.message);
    revalidatePath("/attendance"); revalidatePath("/scheduling"); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "statusFailed" }; }
}

// Fetch only the selected appointment, scoped to the authenticated tenant.
export async function getRescheduleOptionsAction(appointmentId: string) {
  try {
    const supabase = await createClient();
    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "SCHEDULING_RESCHEDULE")) return { success: false as const, error: "forbidden" };
    const { getCurrentOrganizationCommercialContext } = await import("@/shared/auth/get-current-organization-commercial-context");
    const context = await getCurrentOrganizationCommercialContext(supabase);
    const db = supabase as any;
    const { data: appointment, error } = await db.from("appointments")
      .select("id,activity_id,professional_id,starts_at,ends_at,status,customers(name),activities(name,professional_requirement,professional_specialties(name,color))")
      .eq("organization_id", context.organizationId).eq("id", appointmentId).maybeSingle();
    if (error) throw error;
    if (!appointment || appointment.status !== "SCHEDULED") return { success: false as const, error: "appointmentUnavailable" };
    const [{ data: professionals, error: pError }, { data: qualified, error: qError }] = await Promise.all([
      db.from("professionals").select("id,name,active").eq("organization_id", context.organizationId).eq("active", true).order("name"),
      db.from("professional_activities").select("professional_id").eq("organization_id", context.organizationId).eq("activity_id", appointment.activity_id),
    ]);
    if (pError) throw pError;
    if (qError) throw qError;
    const qualifiedIds = new Set((qualified ?? []).map((row: any) => row.professional_id));
    const required = appointment.activities?.professional_requirement === "REQUIRED";
    return { success: true as const, appointment: {
      id: appointment.id, customerName: appointment.customers?.name ?? "",
      activityName: appointment.activities?.name ?? "", specialtyName: appointment.activities?.professional_specialties?.name ?? null,
      specialtyColor: appointment.activities?.professional_specialties?.color ?? null,
      professionalId: appointment.professional_id, startsAt: appointment.starts_at, endsAt: appointment.ends_at,
      professionalRequired: required,
    }, professionals: (professionals ?? []).filter((p: any) => qualifiedIds.has(p.id) || p.id === appointment.professional_id)
      .map((p: any) => ({ id: p.id as string, name: p.name as string, active: p.active as boolean })) };
  } catch (error) {
    console.error("[ATTENDANCE] Failed to load rescheduling options", error);
    return { success: false as const, error: "loadFailed" };
  }
}

// Dry-run the authoritative rescheduling RPC inside a rolled-back PL/pgSQL subtransaction.
export async function checkRescheduleAvailabilityAction(input: {
  appointmentId: string; startsAt: string; endsAt: string; professionalId?: string | null;
}): Promise<{ available: boolean; reason: string }> {
  try {
    const supabase = await createClient();
    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "SCHEDULING_RESCHEDULE")) return { available: false, reason: "forbidden" };
    const { data, error } = await (supabase as any).rpc("preview_reschedule_scheduling_appointment", {
      p_appointment_id: input.appointmentId,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt,
      p_professional_id: input.professionalId ?? null,
    });
    if (error) throw error;
    return { available: data?.available === true, reason: String(data?.reason ?? "unknown") };
  } catch (error) {
    console.error("[ATTENDANCE] Reschedule availability preview failed", error);
    return { available: false, reason: "checkFailed" };
  }
}
