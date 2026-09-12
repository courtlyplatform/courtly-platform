"use client";

import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { CourtlyAlert } from "@/shared/ui/CourtlyAlert";
import { rescheduleAppointmentAction } from "../application/attendance-actions";
import styles from "./reschedule.module.css";

type Appointment = {
  id: string;
  customerName: string;
  activityName: string;
  specialtyName: string | null;
  specialtyColor: string | null;
  professionalId: string | null;
  startsAt: string;
  endsAt: string;
  professionalRequired: boolean;
};

export function RescheduleClient({ appointment, professionals }: { appointment: Appointment; professionals: Array<{ id: string; name: string; active: boolean }> }) {
  const { locale } = useI18n();
  const pt = locale === "pt-BR";
  const router = useRouter();
  const initial = toLocalParts(appointment.startsAt, appointment.endsAt);
  const [form, setForm] = useState({ date: initial.date, startTime: initial.startTime, endTime: initial.endTime, professionalId: appointment.professionalId ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const startsAt = new Date(`${form.date}T${form.startTime}:00`).toISOString();
    const endsAt = new Date(`${form.date}T${form.endTime}:00`).toISOString();
    if (new Date(startsAt).getTime() <= Date.now()) {
      setError(pt ? "O novo horário precisa estar no futuro." : "The new time must be in the future.");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError(pt ? "O horário final deve ser posterior ao inicial." : "End time must be later than start time.");
      return;
    }
    if (appointment.professionalRequired && !form.professionalId) {
      setError(pt ? "Este serviço exige um profissional." : "This service requires a professional.");
      return;
    }

    startTransition(async () => {
      const result = await rescheduleAppointmentAction({
        appointmentId: appointment.id,
        startsAt,
        endsAt,
        professionalId: form.professionalId || null,
      });
      if (!result.success) {
        const message = ("error" in result ? result.error : "").toLowerCase().includes("available")
          ? (pt ? "O profissional ou recurso não está disponível nesse horário." : "The professional or resource is unavailable at that time.")
          : (pt ? "Não foi possível reagendar. Revise o horário e tente novamente." : "Could not reschedule. Review the time and try again.");
        setError(message);
        return;
      }
      router.push("/attendance");
      router.refresh();
    });
  };

  return (
    <main className={styles.page}>
      <header>
        <span className={styles.eyebrow}>{pt ? "Presenças / Reagendamento" : "Attendance / Rescheduling"}</span>
        <h1>{pt ? "Reagendar compromisso" : "Reschedule appointment"}</h1>
        <p>{pt ? "Escolha um novo horário futuro. O compromisso mantém cliente, serviço e recursos vinculados." : "Choose a new future time. Customer, service and linked resources are preserved."}</p>
      </header>

      <section className={styles.summary} style={{ borderLeftColor: appointment.specialtyColor ?? "var(--courtly-green)" }}>
        <strong>{appointment.customerName}</strong>
        <span>{appointment.activityName}{appointment.specialtyName ? ` · ${appointment.specialtyName}` : ""}</span>
        <small>{pt ? "Atual:" : "Current:"} {formatDateTime(appointment.startsAt, locale)}–{formatTime(appointment.endsAt, locale)}</small>
      </section>

      <form className={styles.form} onSubmit={submit}>
        <div className={styles.grid}>
          <label><span>{pt ? "Data" : "Date"}</span><input type="date" min={todayLocal()} value={form.date} onChange={(e) => setForm((x) => ({ ...x, date: e.target.value }))} required /></label>
          <label><span>{pt ? "Início" : "Start"}</span><input type="time" value={form.startTime} onChange={(e) => setForm((x) => ({ ...x, startTime: e.target.value }))} required /></label>
          <label><span>{pt ? "Fim" : "End"}</span><input type="time" value={form.endTime} onChange={(e) => setForm((x) => ({ ...x, endTime: e.target.value }))} required /></label>
          <label><span>{pt ? "Profissional" : "Professional"}</span>
            <select value={form.professionalId} onChange={(e) => setForm((x) => ({ ...x, professionalId: e.target.value }))}>
              {!appointment.professionalRequired && <option value="">{pt ? "Sem profissional" : "No professional"}</option>}
              {professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
            </select>
          </label>
        </div>
        {error && <CourtlyAlert type="error" message={error} />}
        <div className={styles.actions}>
          <Link href="/attendance">{pt ? "Voltar" : "Back"}</Link>
          <button disabled={pending} type="submit">{pending ? (pt ? "Reagendando..." : "Rescheduling...") : (pt ? "Confirmar reagendamento" : "Confirm reschedule")}</button>
        </div>
      </form>
    </main>
  );
}

function toLocalParts(start: string, end: string) {
  const s = new Date(start); const e = new Date(end);
  return { date: `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`, startTime: `${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`, endTime: `${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}` };
}
function todayLocal(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function formatDateTime(value:string,locale:string){return new Intl.DateTimeFormat(locale,{dateStyle:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value))}
function formatTime(value:string,locale:string){return new Intl.DateTimeFormat(locale,{hour:"2-digit",minute:"2-digit"}).format(new Date(value))}
