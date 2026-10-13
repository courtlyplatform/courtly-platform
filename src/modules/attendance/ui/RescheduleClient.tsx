"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { CourtlyAlert } from "@/shared/ui/CourtlyAlert";
import { checkRescheduleAvailabilityAction, rescheduleAppointmentAction } from "../application/attendance-actions";
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

export function RescheduleClient({ appointment, professionals, onClose, onSuccess }: { appointment: Appointment; professionals: Array<{ id: string; name: string; active: boolean }>; onClose: () => void; onSuccess: () => void }) {
  const { locale, dictionary } = useI18n();
  const messages = dictionary.rescheduleAvailability;
  const pt = locale === "pt-BR";
  const initial = toLocalParts(appointment.startsAt, appointment.endsAt);
  const [form, setForm] = useState({ date: initial.date, startTime: initial.startTime, endTime: initial.endTime, professionalId: appointment.professionalId ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [availability, setAvailability] = useState<{ status: "checking" | "available" | "unavailable"; reason?: string }>({ status: "checking" });
  const startsAtMs = new Date(`${form.date}T${form.startTime}:00`).getTime();
  const endsAtMs = new Date(`${form.date}T${form.endTime}:00`).getTime();
  const validInput = Boolean(form.date && form.startTime && form.endTime) &&
    Number.isFinite(startsAtMs) && Number.isFinite(endsAtMs) && startsAtMs > Date.now() &&
    endsAtMs > startsAtMs && (!appointment.professionalRequired || Boolean(form.professionalId));

  useEffect(() => {
    let active = true;
    if (!form.date || !form.startTime || !form.endTime || !Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs)) {
      setAvailability({ status: "unavailable", reason: "invalidInterval" });
      return;
    }
    if (startsAtMs <= Date.now()) { setAvailability({ status: "unavailable", reason: "pastAppointment" }); return; }
    if (endsAtMs <= startsAtMs) { setAvailability({ status: "unavailable", reason: "invalidInterval" }); return; }
    if (appointment.professionalRequired && !form.professionalId) { setAvailability({ status: "unavailable", reason: "professionalRequired" }); return; }
    setAvailability({ status: "checking" });
    const timer = setTimeout(async () => {
      const result = await checkRescheduleAvailabilityAction({
        appointmentId: appointment.id,
        startsAt: new Date(startsAtMs).toISOString(),
        endsAt: new Date(endsAtMs).toISOString(),
        professionalId: form.professionalId || null,
      });
      if (active) setAvailability(result.available ? { status: "available" } : { status: "unavailable", reason: result.reason });
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [appointment.id, appointment.professionalRequired, form.date, form.startTime, form.endTime, form.professionalId, startsAtMs, endsAtMs]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (availability.status !== "available" || !validInput) return;
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
        setError(messages.saveFailed);
        setAvailability({ status: "checking" });
        return;
      }
      onSuccess();
    });
  };

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="reschedule-modal-title">
        <header className={styles.modalHeader}>
          <div><h2 id="reschedule-modal-title">{pt ? "Reagendar compromisso" : "Reschedule appointment"}</h2>
          <p>{pt ? "Altere somente esta ocorrência. A recorrência e as demais datas serão mantidas." : "Change this occurrence only. Other recurring dates remain unchanged."}</p></div>
          <button className={styles.close} type="button" onClick={onClose} disabled={pending} aria-label={pt ? "Fechar" : "Close"}>×</button>
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
          <div className={`${styles.availability} ${availability.status === "available" ? styles.available : availability.status === "unavailable" ? styles.unavailable : ""}`} role="status" aria-live="polite">
            <strong>{availability.status === "checking" ? messages.checking : availability.status === "available" ? messages.available : messages.unavailable}</strong>
            {availability.status === "unavailable" && <span>{(messages.reasons as Record<string, string>)[availability.reason ?? ""] ?? messages.reasons.unknown}</span>}
          </div>
          {error && <CourtlyAlert type="error" message={error} />}
          <div className={styles.actions}>
            <button className={styles.cancel} type="button" disabled={pending} onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
            <button disabled={pending || !validInput || availability.status !== "available"} type="submit">{pending ? (pt ? "Reagendando..." : "Rescheduling...") : (pt ? "Confirmar reagendamento" : "Confirm reschedule")}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function toLocalParts(start: string, end: string) {
  const s = new Date(start); const e = new Date(end);
  return { date: `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`, startTime: `${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`, endTime: `${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}` };
}
function todayLocal(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function formatDateTime(value:string,locale:string){return new Intl.DateTimeFormat(locale,{dateStyle:"short",timeStyle:"short"}).format(new Date(value))}
function formatTime(value:string,locale:string){return new Intl.DateTimeFormat(locale,{hour:"2-digit",minute:"2-digit"}).format(new Date(value))}
