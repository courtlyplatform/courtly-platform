"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CourtlyAlert } from "@/shared/ui/CourtlyAlert";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type {
  Professional,
  ProfessionalPageData,
  ProfessionalScheduleExceptionReason,
  ProfessionalScheduleExceptionType,
} from "../domain/professional";
import {
  saveProfessionalScheduleExceptionAction,
  setProfessionalScheduleExceptionActiveAction,
} from "../application/professional-actions";
import styles from "./professionals.module.css";

const reasons: ProfessionalScheduleExceptionReason[] = [
  "PERSONAL",
  "HEALTH",
  "VACATION",
  "TRAINING",
  "EVENT",
  "EXTRA_SHIFT",
  "COVERAGE",
  "OTHER",
];

export function ProfessionalExceptionsPanel({ initialData }: { initialData: ProfessionalPageData }) {
  const router = useRouter();
  const { locale } = useI18n();
  const pt = locale === "pt-BR";
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(initialData.professionals[0]?.id ?? "");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyForm());

  const selected = initialData.professionals.find((p) => p.id === selectedId) ?? null;
  const history = useMemo(
    () => [...(selected?.scheduleExceptions ?? [])].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()),
    [selected],
  );

  function startNew(type: ProfessionalScheduleExceptionType = "ABSENCE") {
    setEditingId(null);
    setForm({ ...emptyForm(), exceptionType: type });
    setFeedback(null);
  }

  function editException(item: NonNullable<Professional["scheduleExceptions"]>[number]) {
    const start = toLocalParts(item.startsAt);
    const end = toLocalParts(item.endsAt);
    setEditingId(item.id);
    setForm({
      exceptionType: item.exceptionType,
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      reason: item.reason,
      reasonDetails: item.reasonDetails ?? "",
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (!form.date || !form.startTime || !form.endTime || form.endTime <= form.startTime) {
      setFeedback({ type: "error", message: pt ? "Informe uma data e um intervalo de horário válido." : "Enter a valid date and time interval." });
      return;
    }
    if (form.reason === "OTHER" && !form.reasonDetails.trim()) {
      setFeedback({ type: "error", message: pt ? "Descreva o motivo ao selecionar Outros." : "Describe the reason when selecting Other." });
      return;
    }
    startTransition(async () => {
      const result = await saveProfessionalScheduleExceptionAction({
        id: editingId ?? undefined,
        professionalId: selected.id,
        exceptionType: form.exceptionType,
        startsAt: localDateTimeToIso(form.date, form.startTime),
        endsAt: localDateTimeToIso(form.date, form.endTime),
        reason: form.reason,
        reasonDetails: form.reasonDetails,
      });
      if (!result.success) {
        setFeedback({ type: "error", message: pt ? "Não foi possível salvar a exceção." : "Could not save the exception." });
        return;
      }
      setFeedback({ type: "success", message: pt ? "Exceção salva com sucesso." : "Exception saved successfully." });
      setEditingId(null);
      setForm(emptyForm());
      router.refresh();
    });
  }

  return (
    <section className={styles.exceptionsLayout}>
      <aside className={styles.exceptionsProfessionals}>
        <div className={styles.exceptionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>{pt ? "Agenda profissional" : "Professional schedule"}</span>
            <h2>{pt ? "Exceções" : "Exceptions"}</h2>
            <p>{pt ? "Ausências e presenças extraordinárias." : "Absences and extraordinary availability."}</p>
          </div>
        </div>
        <div className={styles.exceptionProfessionalList}>
          {initialData.professionals.map((professional) => (
            <button
              key={professional.id}
              type="button"
              className={professional.id === selectedId ? styles.exceptionProfessionalActive : styles.exceptionProfessionalButton}
              onClick={() => { setSelectedId(professional.id); setEditingId(null); setForm(emptyForm()); }}
            >
              <strong>{professional.fullName}</strong>
              <span>{professional.scheduleExceptions.length} {pt ? "registros" : "records"}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className={styles.exceptionContent}>
        {!selected ? (
          <p>{pt ? "Cadastre um profissional primeiro." : "Create a professional first."}</p>
        ) : (
          <>
            <div className={styles.exceptionTopbar}>
              <div>
                <h3>{selected.fullName}</h3>
                <p>{pt ? "O histórico é mantido mesmo após a data passar." : "History is kept even after the date passes."}</p>
              </div>
              <div className={styles.exceptionQuickActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => startNew("PRESENCE")}>{pt ? "+ Presença" : "+ Presence"}</button>
                <button type="button" className={styles.primaryButton} onClick={() => startNew("ABSENCE")}>{pt ? "+ Ausência" : "+ Absence"}</button>
              </div>
            </div>

            {feedback && <CourtlyAlert type={feedback.type} message={feedback.message} />}

            <form className={styles.exceptionForm} onSubmit={submit}>
              <div className={styles.exceptionFormGrid}>
                <label><span>{pt ? "Tipo" : "Type"}</span>
                  <select value={form.exceptionType} onChange={(e) => setForm((x) => ({ ...x, exceptionType: e.target.value as ProfessionalScheduleExceptionType }))}>
                    <option value="ABSENCE">{pt ? "Ausência" : "Absence"}</option>
                    <option value="PRESENCE">{pt ? "Presença extraordinária" : "Extra presence"}</option>
                  </select>
                </label>
                <label><span>{pt ? "Data" : "Date"}</span><input type="date" value={form.date} onChange={(e) => setForm((x) => ({ ...x, date: e.target.value }))} /></label>
                <label><span>{pt ? "Início" : "Start"}</span><input type="time" value={form.startTime} onChange={(e) => setForm((x) => ({ ...x, startTime: e.target.value }))} /></label>
                <label><span>{pt ? "Fim" : "End"}</span><input type="time" value={form.endTime} onChange={(e) => setForm((x) => ({ ...x, endTime: e.target.value }))} /></label>
                <label><span>{pt ? "Motivo" : "Reason"}</span>
                  <select value={form.reason} onChange={(e) => setForm((x) => ({ ...x, reason: e.target.value as ProfessionalScheduleExceptionReason }))}>
                    {reasons.map((reason) => <option key={reason} value={reason}>{reasonLabel(reason, pt)}</option>)}
                  </select>
                </label>
                {form.reason === "OTHER" && (
                  <label className={styles.exceptionReasonDetails}><span>{pt ? "Descreva o motivo" : "Describe the reason"}</span><input value={form.reasonDetails} onChange={(e) => setForm((x) => ({ ...x, reasonDetails: e.target.value }))} /></label>
                )}
              </div>
              <div className={styles.exceptionFormActions}>
                {editingId && <button type="button" className={styles.secondaryButton} onClick={() => { setEditingId(null); setForm(emptyForm()); }}>{pt ? "Cancelar edição" : "Cancel edit"}</button>}
                <button type="submit" className={styles.primaryButton} disabled={pending}>{pending ? (pt ? "Salvando..." : "Saving...") : (editingId ? (pt ? "Atualizar exceção" : "Update exception") : (pt ? "Salvar exceção" : "Save exception"))}</button>
              </div>
            </form>

            <div className={styles.exceptionHistory}>
              <h3>{pt ? "Histórico" : "History"}</h3>
              {history.length === 0 ? <p className={styles.emptyText}>{pt ? "Nenhuma exceção cadastrada." : "No exceptions registered."}</p> : history.map((item) => (
                <article key={item.id} className={styles.exceptionHistoryRow}>
                  <div className={item.exceptionType === "ABSENCE" ? styles.exceptionBadgeAbsence : styles.exceptionBadgePresence}>
                    {item.exceptionType === "ABSENCE" ? (pt ? "Ausência" : "Absence") : (pt ? "Presença" : "Presence")}
                  </div>
                  <div className={styles.exceptionHistoryMain}>
                    <strong>{formatDate(item.startsAt, locale)} · {formatTime(item.startsAt, locale)}–{formatTime(item.endsAt, locale)}</strong>
                    <span>{reasonLabel(item.reason, pt)}{item.reasonDetails ? ` · ${item.reasonDetails}` : ""}</span>
                  </div>
                  <div className={styles.exceptionHistoryActions}>
                    <span className={item.active ? styles.exceptionStatusActive : styles.exceptionStatusInactive}>{item.active ? (pt ? "Ativa" : "Active") : (pt ? "Cancelada" : "Cancelled")}</span>
                    <button type="button" onClick={() => editException(item)}>{pt ? "Editar" : "Edit"}</button>
                    <button type="button" disabled={pending} onClick={() => startTransition(async () => {
                      const result = await setProfessionalScheduleExceptionActiveAction(item.id, !item.active);
                      if (result.success) router.refresh();
                    })}>{item.active ? (pt ? "Cancelar" : "Cancel") : (pt ? "Reativar" : "Reactivate")}</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function emptyForm() {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return { exceptionType: "ABSENCE" as ProfessionalScheduleExceptionType, date, startTime: "09:00", endTime: "10:00", reason: "PERSONAL" as ProfessionalScheduleExceptionReason, reasonDetails: "" };
}
function localDateTimeToIso(date: string, time: string) { return new Date(`${date}T${time}:00`).toISOString(); }
function toLocalParts(value: string) { const d = new Date(value); return { date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`, time: `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` }; }
function formatDate(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value)); }
function formatTime(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function reasonLabel(reason: ProfessionalScheduleExceptionReason, pt: boolean) {
  const map: Record<ProfessionalScheduleExceptionReason, [string,string]> = {
    PERSONAL: ["Pessoal","Personal"], HEALTH: ["Saúde","Health"], VACATION: ["Férias / folga","Vacation / day off"],
    TRAINING: ["Treinamento","Training"], EVENT: ["Evento","Event"], EXTRA_SHIFT: ["Horário extra","Extra shift"],
    COVERAGE: ["Cobertura / substituição","Coverage / replacement"], OTHER: ["Outros","Other"],
  };
  return map[reason][pt ? 0 : 1];
}
