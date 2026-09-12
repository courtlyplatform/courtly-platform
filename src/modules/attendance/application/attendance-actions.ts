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
    revalidatePath(`/attendance/${input.appointmentId}/reschedule`);
    revalidatePath("/scheduling");
    return { success: true };
  } catch (error) {
    console.error("[ATTENDANCE] Failed to reschedule appointment", error);
    return { success: false, error: error instanceof Error ? error.message : "rescheduleFailed" };
  }
}
