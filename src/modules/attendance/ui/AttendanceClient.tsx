"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { CourtlyAlert } from "@/shared/ui/CourtlyAlert";
import { setAttendanceStatusAction } from "../application/attendance-actions";
import styles from "./attendance.module.css";

export type AttendanceAppointment = {
  id: string;
  customerId: string;
  customerName: string;
  documentType: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  activityId: string;
  activityName: string;
  specialtyName: string | null;
  specialtyColor: string | null;
  professionalId: string | null;
  professionalName: string | null;
  startsAt: string;
  endsAt: string;
  appointmentStatus: "SCHEDULED" | "CANCELLED" | "COMPLETED";
  attendanceStatus: "PENDING" | "CONFIRMED" | "CANCELLED";
  source: string;
  cancellationReason: string | null;
};

export function AttendanceClient({
  appointments,
  cancellationWindowMinutes,
  canManageAttendance,
  canReschedule,
}: {
  appointments: AttendanceAppointment[];
  cancellationWindowMinutes: number;
  canManageAttendance: boolean;
  canReschedule: boolean;
}) {
  const { locale } = useI18n();
  const pt = locale === "pt-BR";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    return appointments.filter((item) => {
      const matchesStatus = status === "ALL" || item.attendanceStatus === status;
      const haystack = normalize([
        item.customerName,
        item.documentType,
        item.documentNumber,
        item.email,
        item.phone,
        item.activityName,
        item.specialtyName,
        item.professionalName,
      ].filter(Boolean).join(" "));
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [appointments, query, status]);

  const updateStatus = (appointmentId: string, next: "PENDING" | "CONFIRMED") => {
    setFeedback(null);
    startTransition(async () => {
      const result = await setAttendanceStatusAction(appointmentId, next);
      if (!result.success) {
        setFeedback({ type: "error", message: pt ? "Não foi possível atualizar a confirmação." : "Could not update confirmation." });
        return;
      }
      setFeedback({ type: "success", message: pt ? "Confirmação atualizada." : "Confirmation updated." });
      router.refresh();
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>{pt ? "Operação" : "Operations"}</span>
          <h1>{pt ? "Presenças" : "Attendance"}</h1>
          <p>{pt ? "Acompanhe confirmações, cancelamentos e reagendamentos de todos os compromissos." : "Track confirmations, cancellations and rescheduling for every appointment."}</p>
        </div>
        <div className={styles.policyPill}>
          {pt ? "Cancelamento até" : "Cancellation up to"} <strong>{formatWindow(cancellationWindowMinutes, pt)}</strong> {pt ? "antes" : "before"}
        </div>
      </header>

      {feedback && <CourtlyAlert type={feedback.type} message={feedback.message} />}

      <section className={styles.filters}>
        <label>
          <span>{pt ? "Buscar" : "Search"}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={pt ? "Cliente, documento, e-mail, telefone, serviço ou profissional" : "Customer, document, email, phone, service or professional"} />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">{pt ? "Todos" : "All"}</option>
            <option value="CONFIRMED">{pt ? "Confirmado" : "Confirmed"}</option>
            <option value="PENDING">{pt ? "Pendente" : "Pending"}</option>
            <option value="CANCELLED">{pt ? "Cancelado" : "Cancelled"}</option>
          </select>
        </label>
      </section>

      <section className={styles.listCard}>
        <div className={styles.listHead}>
          <span>{pt ? "Cliente" : "Customer"}</span><span>{pt ? "Documento" : "Document"}</span><span>{pt ? "Contato" : "Contact"}</span>
          <span>{pt ? "Modalidade" : "Service"}</span><span>{pt ? "Compromisso" : "Appointment"}</span><span>{pt ? "Profissional" : "Professional"}</span><span>Status</span><span>{pt ? "Ações" : "Actions"}</span>
        </div>
        {filtered.length === 0 ? (
          <div className={styles.empty}>{pt ? "Nenhum compromisso encontrado." : "No appointments found."}</div>
        ) : filtered.map((item) => (
          <article key={item.id} className={styles.row}>
            <div data-label={pt ? "Cliente" : "Customer"}><strong>{item.customerName}</strong></div>
            <div data-label={pt ? "Documento" : "Document"}><span>{item.documentType ?? "—"}</span><small>{item.documentNumber ?? "—"}</small></div>
            <div data-label={pt ? "Contato" : "Contact"}><span>{item.email ?? "—"}</span><small>{item.phone ?? "—"}</small></div>
            <div data-label={pt ? "Modalidade" : "Service"} className={styles.serviceCell}>
              <i style={{ background: item.specialtyColor ?? "var(--courtly-green)" }} />
              <span><strong>{item.activityName}</strong><small>{item.specialtyName ?? "—"}</small></span>
            </div>
            <div data-label={pt ? "Compromisso" : "Appointment"}><strong>{formatDate(item.startsAt, locale)}</strong><small>{formatTime(item.startsAt, locale)}–{formatTime(item.endsAt, locale)}</small></div>
            <div data-label={pt ? "Profissional" : "Professional"}><span>{item.professionalName ?? (pt ? "Não se aplica" : "Not applicable")}</span></div>
            <div data-label="Status"><StatusBadge status={item.attendanceStatus} pt={pt} /></div>
            <div data-label={pt ? "Ações" : "Actions"} className={styles.actions}>
              {item.appointmentStatus === "SCHEDULED" && item.attendanceStatus !== "CANCELLED" && (
                <>
                  {canManageAttendance && <button disabled={pending || item.attendanceStatus === "CONFIRMED"} onClick={() => updateStatus(item.id, "CONFIRMED")}>{pt ? "Confirmar" : "Confirm"}</button>}
                  {canManageAttendance && <button disabled={pending || item.attendanceStatus === "PENDING"} onClick={() => updateStatus(item.id, "PENDING")}>{pt ? "Pendente" : "Pending"}</button>}
                  {canReschedule && <Link className={styles.primaryAction} href={`/attendance/${item.id}/reschedule`}>{pt ? "Reagendar" : "Reschedule"}</Link>}
                </>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function StatusBadge({ status, pt }: { status: AttendanceAppointment["attendanceStatus"]; pt: boolean }) {
  const label = status === "CONFIRMED" ? (pt ? "Confirmado" : "Confirmed") : status === "CANCELLED" ? (pt ? "Cancelado" : "Cancelled") : (pt ? "Pendente" : "Pending");
  return <span className={`${styles.status} ${styles[`status${status}`]}`}>{label}</span>;
}

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
function formatDate(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(value)); }
function formatTime(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function formatWindow(minutes: number, pt: boolean) {
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return pt ? `${minutes} min` : `${minutes} min`;
}
