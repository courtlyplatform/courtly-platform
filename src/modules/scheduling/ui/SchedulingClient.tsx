"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { CourtlyAlert } from "@/shared/ui/CourtlyAlert";
import { saveResourceAction, saveResourceTypeAction, toggleResourceAction } from "@/modules/resources/application/resource-actions";
import {
  cancelAppointmentAction,
  changeScheduleRuleStatusAction,
  createAppointmentAction,
  createScheduleRuleAction,
  setActivityResourceRequirementAction,
  setActivitySpecialtyAction,
  setProfessionalQualificationAction,
  updateSchedulingSettingsAction,
} from "../application/scheduling-actions";
import type {
  Appointment,
  SchedulingPageData,
} from "../domain/scheduling";
import type { Activity } from "@/modules/activities/domain/activity";
import styles from "./scheduling.module.css";

type ViewMode = "day" | "week" | "month";
type Tab = "calendar" | "recurrences" | "resources" | "settings";
type Modal = "appointment" | "recurrence" | "resource" | null;

type Feedback = { type: "success" | "error"; message: string } | null;

type AppointmentForm = {
  customerId: string;
  activityId: string;
  subscriptionId: string;
  date: string;
  startTime: string;
  endTime: string;
  professionalId: string;
  resourceIds: string[];
};

type RecurrenceForm = {
  subscriptionId: string;
  weekday: string;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil: string;
  professionalId: string;
  resourceIds: string[];
};

const todayIso = () => formatLocalDate(new Date());

export function SchedulingClient({ initialData }: { initialData: SchedulingPageData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dictionary, locale } = useI18n();
  const t = dictionary.scheduling;

  const [tab, setTab] = useState<Tab>("calendar");
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [modal, setModal] = useState<Modal>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>(() => ({
    customerId: "",
    activityId: "",
    subscriptionId: "",
    date: todayIso(),
    startTime: "09:00",
    endTime: "10:00",
    professionalId: "",
    resourceIds: [],
  }));

  const [recurrenceForm, setRecurrenceForm] = useState<RecurrenceForm>(() => ({
    subscriptionId: "",
    weekday: "1",
    startTime: "09:00",
    endTime: "10:00",
    effectiveFrom: todayIso(),
    effectiveUntil: "",
    professionalId: "",
    resourceIds: [],
  }));

  const [resourceForm, setResourceForm] = useState({ id: "", name: "", resourceTypeId: "" });
  const [resourceTypeForm, setResourceTypeForm] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [windowDays, setWindowDays] = useState(String(initialData.settings.generationWindowDays));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchParams.get("openAppointment") !== "1") return;
    const customerId = searchParams.get("customerId") ?? "";
    const date = searchParams.get("date") ?? todayIso();
    const startTime = searchParams.get("startTime") ?? "09:00";
    const endTime = searchParams.get("endTime") ?? "10:00";
    const activityId = searchParams.get("activityId") ?? "";
    setAppointmentForm((current) => ({ ...current, customerId, date, startTime, endTime, activityId }));
    setModal("appointment");
  }, [searchParams]);

  const activeActivities = useMemo(
    () => initialData.activities.filter((activity) => activity.active && activity.schedulingMode !== "NONE"),
    [initialData.activities]
  );

  const appointmentActivity = activeActivities.find((activity) => activity.id === appointmentForm.activityId) ?? null;
  const recurrenceSubscription = initialData.subscriptions.find((item) => item.id === recurrenceForm.subscriptionId) ?? null;
  const recurrenceActivity = recurrenceSubscription
    ? activeActivities.find((activity) => activity.id === recurrenceSubscription.activityId) ?? null
    : null;

  const visibleAppointments = useMemo(
    () => initialData.appointments.filter((appointment) => appointment.status !== "CANCELLED"),
    [initialData.appointments]
  );

  const calendarDays = useMemo(() => getCalendarDays(cursor, view), [cursor, view]);

  const openAppointment = () => {
    setFeedback(null);
    setModalError(null);
    setAppointmentForm({
      customerId: "",
      activityId: "",
      subscriptionId: "",
      date: formatLocalDate(cursor),
      startTime: "09:00",
      endTime: "10:00",
      professionalId: "",
      resourceIds: [],
    });
    setModal("appointment");
  };

  const openRecurrence = () => {
    setFeedback(null);
    setModalError(null);
    setRecurrenceForm({
      subscriptionId: "",
      weekday: String(cursor.getDay()),
      startTime: "09:00",
      endTime: "10:00",
      effectiveFrom: formatLocalDate(cursor),
      effectiveUntil: "",
      professionalId: "",
      resourceIds: [],
    });
    setModal("recurrence");
  };

  const closeModal = () => {
    if (isPending) return;
    setModal(null);
    setModalError(null);
  };

  const handleActivityChange = (activityId: string) => {
    const customerId = appointmentForm.customerId;
    const compatible = initialData.subscriptions.find(
      (subscription) =>
        subscription.customerId === customerId &&
        subscription.activityId === activityId &&
        subscription.status === "ACTIVE"
    );
    const activity = activeActivities.find((item) => item.id === activityId);
    const endTime = activity
      ? addMinutesToTime(appointmentForm.startTime, activity.defaultDurationMinutes)
      : appointmentForm.endTime;

    setAppointmentForm((current) => ({
      ...current,
      activityId,
      subscriptionId: compatible?.id ?? "",
      professionalId: "",
      resourceIds: [],
      endTime,
    }));
  };

  const handleAppointmentSubmit = (event: FormEvent) => {
    event.preventDefault();
    setModalError(null);

    if (!appointmentForm.customerId || !appointmentForm.activityId || !appointmentForm.date) {
      setModalError(t.feedback.invalidData);
      return;
    }

    const startsAt = localDateTimeToIso(appointmentForm.date, appointmentForm.startTime);
    const endsAt = localDateTimeToIso(appointmentForm.date, appointmentForm.endTime);

    if (new Date(endsAt) <= new Date(startsAt)) {
      setModalError(t.feedback.invalidInterval);
      return;
    }

    const clientAvailability = getClientAvailability({
      activity: appointmentActivity,
      startsAt,
      endsAt,
      professionalId: appointmentForm.professionalId || null,
      resourceIds: appointmentForm.resourceIds,
      data: initialData,
    });

    if (!clientAvailability.available) {
      setModalError(clientAvailability.reason ?? t.feedback.unavailable);
      return;
    }

    startTransition(async () => {
      const result = await createAppointmentAction({
        customerId: appointmentForm.customerId,
        activityId: appointmentForm.activityId,
        customerSubscriptionId: appointmentForm.subscriptionId || null,
        startsAt,
        endsAt,
        professionalId: appointmentForm.professionalId || null,
        resourceIds: appointmentForm.resourceIds,
      });

      if (!result.success) {
        setModalError(humanizeServerError("error" in result ? result.error : "unavailable", t));
        return;
      }

      setModal(null);
      setFeedback({ type: "success", message: t.feedback.appointmentCreated });
      router.refresh();
    });
  };

  const handleRecurrenceSubmit = (event: FormEvent) => {
    event.preventDefault();
    setModalError(null);

    if (!recurrenceForm.subscriptionId || !recurrenceActivity) {
      setModalError(t.feedback.invalidData);
      return;
    }

    if (recurrenceForm.endTime <= recurrenceForm.startTime) {
      setModalError(t.feedback.invalidInterval);
      return;
    }

    if (
      recurrenceActivity.professionalRequirement === "REQUIRED" &&
      !recurrenceForm.professionalId
    ) {
      setModalError(t.feedback.professionalRequired);
      return;
    }

    const requiredResources = getRequiredResources(recurrenceActivity, initialData);
    if (
      recurrenceActivity.resourceRequirement === "REQUIRED" &&
      requiredResources.length > 0 &&
      !hasRequiredResourcesSelected(requiredResources, recurrenceForm.resourceIds, initialData)
    ) {
      setModalError(t.feedback.resourceRequired);
      return;
    }

    startTransition(async () => {
      const result = await createScheduleRuleAction({
        customerSubscriptionId: recurrenceForm.subscriptionId,
        weekday: Number(recurrenceForm.weekday),
        startTime: recurrenceForm.startTime,
        endTime: recurrenceForm.endTime,
        effectiveFrom: recurrenceForm.effectiveFrom,
        effectiveUntil: recurrenceForm.effectiveUntil || null,
        professionalId: recurrenceForm.professionalId || null,
        resourceIds: recurrenceForm.resourceIds,
      });

      if (!result.success) {
        setModalError(humanizeServerError("error" in result ? result.error : "unavailable", t));
        return;
      }

      setModal(null);
      setFeedback({ type: "success", message: t.feedback.recurrenceCreated });
      router.refresh();
    });
  };

  const changeCursor = (direction: -1 | 1) => {
    const next = new Date(cursor);
    if (view === "day") next.setDate(next.getDate() + direction);
    if (view === "week") next.setDate(next.getDate() + direction * 7);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    setCursor(startOfDay(next));
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.secondaryButton} type="button" onClick={openRecurrence}>
            {t.actions.newRecurrence}
          </button>
          <button className={styles.primaryButton} type="button" onClick={openAppointment}>
            {t.actions.newAppointment}
          </button>
        </div>
      </header>

      {feedback && <CourtlyAlert type={feedback.type} message={feedback.message} />}

      <nav className={styles.tabs} aria-label={t.tabs.label}>
        {(["calendar", "recurrences", "resources", "settings"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            className={tab === item ? styles.tabActive : styles.tab}
            onClick={() => setTab(item)}
          >
            {t.tabs[item]}
          </button>
        ))}
      </nav>

      {tab === "calendar" && (
        <section className={styles.calendarCard}>
          <div className={styles.calendarToolbar}>
            <div className={styles.toolbarGroup}>
              <button type="button" className={styles.iconButton} onClick={() => changeCursor(-1)} aria-label={t.calendar.previous}>
                ‹
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setCursor(startOfDay(new Date()))}>
                {t.calendar.today}
              </button>
              <button type="button" className={styles.iconButton} onClick={() => changeCursor(1)} aria-label={t.calendar.next}>
                ›
              </button>
            </div>

            <strong className={styles.periodTitle}>{formatPeriodTitle(cursor, view, locale)}</strong>

            <div className={styles.segmented}>
              {(["day", "week", "month"] as ViewMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={view === item ? styles.segmentActive : styles.segment}
                  onClick={() => setView(item)}
                >
                  {t.views[item]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.capacityLegend}>
            <span><i className={styles.dotAvailable} />{t.capacity.available}</span>
            <span><i className={styles.dotBusy} />{t.capacity.busy}</span>
            <span><i className={styles.dotUnavailable} />{t.capacity.unavailable}</span>
          </div>

          {view === "month" ? (
            <MonthCalendar
              days={calendarDays}
              cursor={cursor}
              appointments={visibleAppointments}
              data={initialData}
              locale={locale}
              t={t}
              now={now}
              onSelectDay={(date: Date) => {
                setCursor(date);
                setView("day");
              }}
            />
          ) : (
            <DayWeekCalendar
              days={calendarDays}
              appointments={visibleAppointments}
              data={initialData}
              locale={locale}
              t={t}
              now={now}
              onCancel={(appointmentId: string) =>
                startTransition(async () => {
                  const result = await cancelAppointmentAction(appointmentId);
                  if (result.success) {
                    setFeedback({ type: "success", message: t.feedback.appointmentCancelled });
                    router.refresh();
                  } else {
                    setFeedback({ type: "error", message: t.feedback.cancelFailed });
                  }
                })
              }
            />
          )}
        </section>
      )}

      {tab === "recurrences" && (
        <RecurrencesPanel
          data={initialData}
          t={t}
          locale={locale}
          pending={isPending}
          onNew={openRecurrence}
          onStatus={(ruleId: string, status: "ACTIVE" | "PAUSED" | "ENDED") =>
            startTransition(async () => {
              const result = await changeScheduleRuleStatusAction(ruleId, status);
              setFeedback({
                type: result.success ? "success" : "error",
                message: result.success ? t.feedback.ruleStatusUpdated : t.feedback.ruleStatusFailed,
              });
              if (result.success) router.refresh();
            })
          }
        />
      )}

      {tab === "resources" && (
        <ResourcesPanel
          data={initialData}
          t={t}
          locale={locale}
          pending={isPending}
          onNew={() => {
            setResourceForm({ id: "", name: "", resourceTypeId: "" });
            setModalError(null);
            setModal("resource");
          }}
          onEdit={(resource: any) => {
            setResourceForm({ id: resource.id, name: resource.name, resourceTypeId: resource.resourceTypeId ?? "" });
            setModalError(null);
            setModal("resource");
          }}
          onToggle={(id: string, active: boolean) =>
            startTransition(async () => {
              const result = await toggleResourceAction(id, active);
              setFeedback({
                type: result.success ? "success" : "error",
                message: result.success ? t.feedback.resourceUpdated : t.feedback.resourceFailed,
              });
              if (result.success) router.refresh();
            })
          }
          onRequirement={(activityId: string, resourceTypeId: string, quantity: number) =>
            startTransition(async () => {
              const result = await setActivityResourceRequirementAction({ activityId, resourceTypeId, quantity });
              setFeedback({
                type: result.success ? "success" : "error",
                message: result.success ? t.feedback.requirementUpdated : t.feedback.requirementFailed,
              });
              if (result.success) router.refresh();
            })
          }
          onSpecialty={(activityId: string, specialtyId: string | null) =>
            startTransition(async () => {
              const result = await setActivitySpecialtyAction({ activityId, specialtyId });
              setFeedback({
                type: result.success ? "success" : "error",
                message: result.success ? (locale === "pt-BR" ? "Especialidade do serviço atualizada." : "Service specialty updated.") : t.feedback.requirementFailed,
              });
              if (result.success) router.refresh();
            })
          }
        />
      )}

      {tab === "settings" && (
        <section className={styles.settingsCard}>
          <div>
            <span className={styles.sectionEyebrow}>{t.settings.eyebrow}</span>
            <h2>{t.settings.title}</h2>
            <p>{t.settings.description}</p>
          </div>
          <div className={styles.settingRow}>
            <div>
              <strong>{t.settings.windowTitle}</strong>
              <p>{t.settings.windowHelp}</p>
            </div>
            <div className={styles.numberField}>
              <input
                type="number"
                min={7}
                max={3650}
                value={windowDays}
                onChange={(event) => setWindowDays(event.target.value)}
              />
              <span>{t.settings.days}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await updateSchedulingSettingsAction({ generationWindowDays: Number(windowDays) });
                setFeedback({
                  type: result.success ? "success" : "error",
                  message: result.success ? t.feedback.settingsUpdated : t.feedback.settingsFailed,
                });
                if (result.success) router.refresh();
              })
            }
          >
            {isPending ? t.actions.saving : t.actions.save}
          </button>
        </section>
      )}

      {modal === "appointment" && (
        <Modal title={t.appointment.title} subtitle={t.appointment.description} closeLabel={t.actions.close} onClose={closeModal}>
          <form className={styles.form} onSubmit={handleAppointmentSubmit}>
            <div className={styles.formGrid}>
              <Field label={t.fields.customer}>
                <CustomerSearchField
                  customers={initialData.customers.filter((customer) => customer.active)}
                  selectedId={appointmentForm.customerId}
                  onSelect={(customerId: string) =>
                    setAppointmentForm((current) => ({
                      ...current,
                      customerId,
                      activityId: "",
                      subscriptionId: "",
                      professionalId: "",
                      resourceIds: [],
                    }))
                  }
                  createHref={buildCustomerCreateHref(appointmentForm)}
                  locale={locale}
                />
              </Field>

              <Field label={t.fields.service}>
                <select value={appointmentForm.activityId} onChange={(event) => handleActivityChange(event.target.value)}>
                  <option value="">{t.placeholders.selectService}</option>
                  {activeActivities.map((activity) => (
                    <option key={activity.id} value={activity.id}>{activity.name}</option>
                  ))}
                </select>
              </Field>

              <Field label={t.fields.date}>
                <input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(event) => setAppointmentForm((current) => ({ ...current, date: event.target.value }))}
                />
              </Field>

              <Field label={t.fields.startTime}>
                <input
                  type="time"
                  value={appointmentForm.startTime}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAppointmentForm((current) => ({
                      ...current,
                      startTime: value,
                      endTime: appointmentActivity
                        ? addMinutesToTime(value, appointmentActivity.defaultDurationMinutes)
                        : current.endTime,
                    }));
                  }}
                />
              </Field>

              <Field label={t.fields.endTime}>
                <input
                  type="time"
                  value={appointmentForm.endTime}
                  onChange={(event) => setAppointmentForm((current) => ({ ...current, endTime: event.target.value }))}
                />
              </Field>

              <Field label={t.fields.professional}>
                <select
                  value={appointmentForm.professionalId}
                  onChange={(event) => setAppointmentForm((current) => ({ ...current, professionalId: event.target.value }))}
                >
                  <option value="">{t.placeholders.noProfessional}</option>
                  {getAvailableProfessionalsForSlot(appointmentActivity, appointmentForm.date, appointmentForm.startTime, appointmentForm.endTime, initialData).map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <SubscriptionHint
              customerId={appointmentForm.customerId}
              activityId={appointmentForm.activityId}
              selectedId={appointmentForm.subscriptionId}
              data={initialData}
              t={t}
              onChange={(subscriptionId: string) => setAppointmentForm((current) => ({ ...current, subscriptionId }))}
            />

            <ResourceSelector
              activity={appointmentActivity}
              selected={appointmentForm.resourceIds}
              data={initialData}
              t={t}
              locale={locale}
              onChange={(resourceIds: string[]) => setAppointmentForm((current) => ({ ...current, resourceIds }))}
              date={appointmentForm.date}
              startTime={appointmentForm.startTime}
              endTime={appointmentForm.endTime}
            />

            {appointmentActivity && appointmentForm.date && (
              <AvailabilityPreview
                activity={appointmentActivity}
                form={appointmentForm}
                data={initialData}
                t={t}
              />
            )}

            {modalError && <CourtlyAlert type="error" message={modalError} />}
            <ModalActions t={t} pending={isPending} onCancel={closeModal} submitLabel={t.actions.createAppointment} />
          </form>
        </Modal>
      )}

      {modal === "recurrence" && (
        <Modal title={t.recurrence.title} subtitle={t.recurrence.description} closeLabel={t.actions.close} onClose={closeModal}>
          <form className={styles.form} onSubmit={handleRecurrenceSubmit}>
            <Field label={t.fields.subscription}>
              <select
                value={recurrenceForm.subscriptionId}
                onChange={(event) =>
                  setRecurrenceForm((current) => ({
                    ...current,
                    subscriptionId: event.target.value,
                    professionalId: "",
                    resourceIds: [],
                  }))
                }
              >
                <option value="">{t.placeholders.selectSubscription}</option>
                {initialData.subscriptions.filter((subscription) => subscription.status === "ACTIVE").map((subscription) => {
                  const customer = initialData.customers.find((item) => item.id === subscription.customerId);
                  const activity = initialData.activities.find((item) => item.id === subscription.activityId);
                  if (!activity || activity.schedulingMode === "NONE") return null;
                  return (
                    <option key={subscription.id} value={subscription.id}>
                      {customer?.name ?? "Customer"} — {activity.name}
                    </option>
                  );
                })}
              </select>
            </Field>

            <div className={styles.formGrid}>
              <Field label={t.fields.weekday}>
                <select
                  value={recurrenceForm.weekday}
                  onChange={(event) => setRecurrenceForm((current) => ({ ...current, weekday: event.target.value }))}
                >
                  {t.weekdays.map((label: string, index: number) => <option key={label} value={index}>{label}</option>)}
                </select>
              </Field>
              <Field label={t.fields.startTime}>
                <input type="time" value={recurrenceForm.startTime} onChange={(event) => setRecurrenceForm((current) => ({ ...current, startTime: event.target.value }))} />
              </Field>
              <Field label={t.fields.endTime}>
                <input type="time" value={recurrenceForm.endTime} onChange={(event) => setRecurrenceForm((current) => ({ ...current, endTime: event.target.value }))} />
              </Field>
              <Field label={t.fields.effectiveFrom}>
                <input type="date" value={recurrenceForm.effectiveFrom} onChange={(event) => setRecurrenceForm((current) => ({ ...current, effectiveFrom: event.target.value }))} />
              </Field>
              <Field label={t.fields.effectiveUntil}>
                <input type="date" value={recurrenceForm.effectiveUntil} onChange={(event) => setRecurrenceForm((current) => ({ ...current, effectiveUntil: event.target.value }))} />
              </Field>
              <Field label={t.fields.professional}>
                <select value={recurrenceForm.professionalId} onChange={(event) => setRecurrenceForm((current) => ({ ...current, professionalId: event.target.value }))}>
                  <option value="">{t.placeholders.noProfessional}</option>
                  {getCompatibleProfessionals(recurrenceActivity, initialData).map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <ResourceSelector
              activity={recurrenceActivity}
              selected={recurrenceForm.resourceIds}
              data={initialData}
              t={t}
              locale={locale}
              onChange={(resourceIds: string[]) => setRecurrenceForm((current) => ({ ...current, resourceIds }))}
            />

            <div className={styles.infoBox}>
              <strong>{t.recurrence.windowTitle}</strong>
              <p>{t.recurrence.windowDescription.replace("{days}", String(initialData.settings.generationWindowDays))}</p>
            </div>

            {modalError && <CourtlyAlert type="error" message={modalError} />}
            <ModalActions t={t} pending={isPending} onCancel={closeModal} submitLabel={t.actions.createRecurrence} />
          </form>
        </Modal>
      )}

      {modal === "resource" && (
        <Modal title={resourceForm.id ? (locale === "pt-BR" ? "Editar recurso" : "Edit resource") : t.resources.newTitle} subtitle={t.resources.newDescription} closeLabel={t.actions.close} onClose={closeModal}>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              setModalError(null);
              startTransition(async () => {
                const result = await saveResourceAction({
                  id: resourceForm.id || undefined,
                  name: resourceForm.name,
                  resourceTypeId: resourceForm.resourceTypeId || null,
                });
                if (!result.success) {
                  setModalError(t.feedback.resourceFailed);
                  return;
                }
                setModal(null);
                setFeedback({ type: "success", message: t.feedback.resourceUpdated });
                router.refresh();
              });
            }}
          >
            <Field label={t.resources.type}>
              <select
                value={resourceForm.resourceTypeId}
                onChange={(event) => setResourceForm((current) => ({ ...current, resourceTypeId: event.target.value }))}
              >
                <option value="">{locale === "pt-BR" ? "Sem requisito/tipo vinculado" : "No linked requirement/type"}</option>
                {initialData.resourceTypes.filter((item) => item.active).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>
            <div className={styles.inlineTypeCreator}>
              <input
                value={resourceTypeForm}
                placeholder={locale === "pt-BR" ? "Novo tipo/requisito (ex.: Quadra de Tennis)" : "New requirement/type"}
                onChange={(event) => setResourceTypeForm(event.target.value)}
              />
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={!resourceTypeForm.trim() || isPending}
                onClick={() => startTransition(async () => {
                  const result = await saveResourceTypeAction({ name: resourceTypeForm });
                  if (result.success) {
                    setResourceTypeForm("");
                    if (result.id) setResourceForm((current) => ({ ...current, resourceTypeId: result.id! }));
                    router.refresh();
                  }
                })}
              >
                {locale === "pt-BR" ? "Criar tipo" : "Create type"}
              </button>
            </div>
            <Field label={t.resources.name}>
              <input
                value={resourceForm.name}
                placeholder={t.resources.namePlaceholder}
                onChange={(event) => setResourceForm((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            {modalError && <CourtlyAlert type="error" message={modalError} />}
            <ModalActions t={t} pending={isPending} onCancel={closeModal} submitLabel={t.actions.save} />
          </form>
        </Modal>
      )}
    </main>
  );
}

function DayWeekCalendar({ days, appointments, data, locale, t, onCancel, now }: any) {
  const hours = Array.from({ length: 15 }, (_, index) => index + 7);
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();

  return (
    <div className={styles.dayWeekGrid} style={{ gridTemplateColumns: `84px repeat(${days.length}, minmax(170px, 1fr))` }}>
      <div className={styles.cornerCell} />
      {days.map((day: Date) => (
        <div key={day.toISOString()} className={`${styles.dayHeader} ${isSameDate(day, now) ? styles.dayHeaderToday : ""}`}>
          <span>{new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day)}</span>
          <strong>{new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(day)}</strong>
        </div>
      ))}

      {hours.flatMap((hour) => [
        <div key={`hour-${hour}`} className={styles.timeCell}>{String(hour).padStart(2, "0")}:00</div>,
        ...days.map((day: Date) => {
          const cellAppointments = appointments.filter((appointment: Appointment) => {
            const date = new Date(appointment.startsAt);
            return isSameDate(date, day) && date.getHours() === hour;
          });
          const nowInThisCell = isSameDate(day, now) && nowHour === hour;
          const top = `${Math.max(0, Math.min(100, (nowMinute / 60) * 100))}%`;

          return (
            <div key={`${day.toISOString()}-${hour}`} className={styles.slotCell}>
              {nowInThisCell && (
                <div className={styles.currentTimeLine} style={{ top }}>
                  <span>{formatTime(now.toISOString(), locale)}</span>
                </div>
              )}
              {cellAppointments.map((appointment: Appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} data={data} locale={locale} t={t} onCancel={onCancel} />
              ))}
            </div>
          );
        }),
      ])}
    </div>
  );
}

function MonthCalendar({ days, cursor, appointments, data, locale, t, onSelectDay, now }: any) {
  const today = startOfDay(now);
  return (
    <div className={styles.monthGrid}>
      {t.weekdaysShort.map((label: string) => <div key={label} className={styles.monthWeekday}>{label}</div>)}
      {days.map((day: Date) => {
        const dayAppointments = appointments.filter((appointment: Appointment) => isSameDate(new Date(appointment.startsAt), day));
        const currentMonth = day.getMonth() === cursor.getMonth();
        const isToday = isSameDate(day, today);
        const isPast = startOfDay(day).getTime() < today.getTime();
        return (
          <button
            key={day.toISOString()}
            type="button"
            className={`${styles.monthDay} ${!currentMonth ? styles.monthDayMuted : ""} ${isPast ? styles.monthDayPast : ""} ${isToday ? styles.monthDayToday : ""}`}
            onClick={() => onSelectDay(day)}
          >
            <strong className={styles.monthDateNumber}>{day.getDate()}{isToday && <i className={styles.todayDot} />}</strong>
            <span>{dayAppointments.length ? t.calendar.appointmentCount.replace("{count}", String(dayAppointments.length)) : t.calendar.free}</span>
            {dayAppointments.slice(0, 3).map((appointment: Appointment) => {
              const activity = data.activities.find((item: Activity) => item.id === appointment.activityId);
              return <i key={appointment.id} style={{ color: activity?.specialtyColor ?? undefined }}>{formatTime(appointment.startsAt, locale)} · {activity?.name}</i>;
            })}
          </button>
        );
      })}
    </div>
  );
}

function AppointmentCard({ appointment, data, locale, t, onCancel }: any) {
  const activity = data.activities.find((item: Activity) => item.id === appointment.activityId);
  const customer = data.customers.find((item: any) => item.id === appointment.customerId);
  const professional = data.professionals.find((item: any) => item.id === appointment.professionalId);
  const resources = data.resources.filter((item: any) => appointment.resourceIds.includes(item.id));
  const color = activity?.specialtyColor ?? "var(--courtly-green)";

  return (
    <article className={styles.appointmentCard} style={{ borderLeftColor: color, background: `color-mix(in srgb, ${color} 9%, var(--surface))` }}>
      <div className={styles.appointmentTime} style={{ color }}>{formatTime(appointment.startsAt, locale)}–{formatTime(appointment.endsAt, locale)}</div>
      <strong>{customer?.name ?? t.calendar.unknownCustomer}</strong>
      <span>{activity?.name ?? t.calendar.unknownService}</span>
      {activity?.specialtyName && <small>{activity.specialtyName}</small>}
      {professional && <small>{professional.name}</small>}
      {resources.length > 0 && <small>{resources.map((resource: any) => resource.name).join(", ")}</small>}
      <div className={styles.appointmentFooter}>
        <span className={styles.statusScheduled}>{t.status.scheduled}</span>
        {new Date(appointment.startsAt) > new Date() && (
          <button type="button" onClick={() => onCancel(appointment.id)}>{t.actions.cancelAppointment}</button>
        )}
      </div>
    </article>
  );
}

function RecurrencesPanel({ data, t, pending, onNew, onStatus }: any) {
  return (
    <section className={styles.panelCard}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>{t.recurrences.eyebrow}</span>
          <h2>{t.recurrences.title}</h2>
          <p>{t.recurrences.description}</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={onNew}>{t.actions.newRecurrence}</button>
      </div>

      <div className={styles.rulesList}>
        {data.rules.map((rule: any) => {
          const customer = data.customers.find((item: any) => item.id === rule.customerId);
          const activity = data.activities.find((item: Activity) => item.id === rule.activityId);
          const professional = data.professionals.find((item: any) => item.id === rule.professionalId);
          const resources = data.resources.filter((item: any) => rule.resourceIds.includes(item.id));
          const conflicts = data.conflicts.filter((item: any) => item.scheduleRuleId === rule.id);

          return (
            <article key={rule.id} className={styles.ruleCard}>
              <div>
                <span className={styles.ruleStatus}>{t.ruleStatus[rule.status.toLowerCase()]}</span>
                <strong>{customer?.name ?? t.calendar.unknownCustomer} — {activity?.name ?? t.calendar.unknownService}</strong>
                <p>
                  {t.weekdays[rule.weekday]} · {String(rule.startTime).slice(0, 5)}–{String(rule.endTime).slice(0, 5)}
                </p>
                <small>
                  {professional ? professional.name : t.placeholders.noProfessional}
                  {resources.length ? ` · ${resources.map((resource: any) => resource.name).join(", ")}` : ""}
                </small>
                {conflicts.length > 0 && (
                  <div className={styles.ruleConflict}>
                    {t.recurrences.conflicts.replace("{count}", String(conflicts.length))}
                  </div>
                )}
              </div>
              {rule.status !== "ENDED" && (
                <div className={styles.ruleActions}>
                  {rule.status === "ACTIVE" ? (
                    <button type="button" disabled={pending} onClick={() => onStatus(rule.id, "PAUSED")}>{t.recurrences.pause}</button>
                  ) : (
                    <button type="button" disabled={pending} onClick={() => onStatus(rule.id, "ACTIVE")}>{t.recurrences.resume}</button>
                  )}
                  <button type="button" disabled={pending} onClick={() => onStatus(rule.id, "ENDED")}>{t.recurrences.end}</button>
                </div>
              )}
            </article>
          );
        })}
        {data.rules.length === 0 && <p className={styles.emptyText}>{t.recurrences.empty}</p>}
      </div>
    </section>
  );
}

function ResourcesPanel({ data, t, locale, pending, onNew, onEdit, onToggle, onRequirement, onSpecialty }: any) {
  const resourceTypes = data.resourceTypes
    .filter((item: any) => item.active)
    .map((item: any) => [item.id, item.name]) as [string, string][];

  return (
    <section className={styles.panelCard}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>{t.resources.eyebrow}</span>
          <h2>{t.resources.title}</h2>
          <p>{t.resources.description}</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={onNew}>{t.resources.new}</button>
      </div>

      <div className={styles.resourceGrid}>
        {data.resources.map((resource: any) => (
          <article key={resource.id} className={styles.resourceCard}>
            <div>
              <span>{resource.resourceTypeName ?? (locale === "pt-BR" ? "Sem requisito vinculado" : "No linked requirement")}</span>
              <strong>{resource.name}</strong>
            </div>
            <div className={styles.resourceCardActions}>
              <button type="button" disabled={pending} onClick={() => onEdit(resource)}>{locale === "pt-BR" ? "Editar" : "Edit"}</button>
              <button type="button" disabled={pending} onClick={() => onToggle(resource.id, !resource.active)}>
                {resource.active ? t.resources.deactivate : t.resources.activate}
              </button>
            </div>
          </article>
        ))}
        {data.resources.length === 0 && <p className={styles.emptyText}>{t.resources.empty}</p>}
      </div>

      <div className={styles.subsection}>
        <h3>{t.resources.requirementsTitle}</h3>
        <p>{t.resources.requirementsDescription}</p>
        {data.activities.filter((activity: Activity) => activity.resourceRequirement !== "NONE").map((activity: Activity) => {
          const existing = data.activityResourceRequirements.find((item: any) => item.activityId === activity.id);
          return (
            <RequirementEditor key={activity.id} activity={activity} existing={existing} resourceTypes={resourceTypes} t={t} onSave={onRequirement} />
          );
        })}
      </div>

      <div className={styles.subsection}>
        <h3>{locale === "pt-BR" ? "Cor por especialidade" : "Specialty color"}</h3>
        <p>{locale === "pt-BR" ? "Vincule opcionalmente cada serviço a uma especialidade. A agenda usará a cor dessa especialidade no compromisso." : "Optionally link each service to a specialty. The calendar will use that specialty color for appointments."}</p>
        {data.activities.filter((activity: Activity) => activity.schedulingMode !== "NONE").map((activity: Activity) => (
          <div className={styles.requirementRow} key={`specialty-${activity.id}`}>
            <strong>{activity.name}</strong>
            <select value={activity.specialtyId ?? ""} onChange={(event) => onSpecialty(activity.id, event.target.value || null)}>
              <option value="">{locale === "pt-BR" ? "Cor padrão" : "Default color"}</option>
              {data.specialties.filter((item: any) => item.active).map((item: any) => (
                <option key={item.id} value={item.id}>{item.name} · {item.color}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}

function RequirementEditor({ activity, existing, resourceTypes, t, onSave }: any) {
  const [typeId, setTypeId] = useState(existing?.resourceTypeId ?? resourceTypes[0]?.[0] ?? "");
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? 1));

  return (
    <div className={styles.requirementRow}>
      <strong>{activity.name}</strong>
      <select value={typeId} onChange={(event) => setTypeId(event.target.value)}>
        <option value="">{t.resources.selectType}</option>
        {resourceTypes.map(([id, name]: [string, string]) => <option key={id} value={id}>{name}</option>)}
      </select>
      <input type="number" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
      <button type="button" className={styles.secondaryButton} disabled={!typeId} onClick={() => onSave(activity.id, typeId, Number(quantity))}>
        {t.actions.save}
      </button>
    </div>
  );
}

function SubscriptionHint({ customerId, activityId, selectedId, data, t, onChange }: any) {
  if (!customerId || !activityId) return null;
  const compatible = data.subscriptions.filter(
    (subscription: any) => subscription.customerId === customerId && subscription.activityId === activityId && subscription.status === "ACTIVE"
  );
  return (
    <div className={styles.subscriptionBox}>
      <strong>{t.appointment.subscriptionTitle}</strong>
      {compatible.length > 0 ? (
        <select value={selectedId} onChange={(event) => onChange(event.target.value)}>
          <option value="">{t.appointment.withoutSubscription}</option>
          {compatible.map((subscription: any) => (
            <option key={subscription.id} value={subscription.id}>{subscription.billingCycle} · {subscription.startsAt}</option>
          ))}
        </select>
      ) : (
        <p>{t.appointment.noSubscription}</p>
      )}
    </div>
  );
}

function ResourceSelector({ activity, selected, data, t, locale, onChange, date, startTime, endTime }: any) {
  if (!activity || activity.resourceRequirement === "NONE") return null;
  const requirements = getRequiredResources(activity, data);
  const allowedTypeIds = new Set(requirements.map((item: any) => item.resourceTypeId));
  const startsAt = date && startTime ? localDateTimeToIso(date, startTime) : null;
  const endsAt = date && endTime ? localDateTimeToIso(date, endTime) : null;
  const resources = data.resources.filter((resource: any) => resource.active && (allowedTypeIds.size === 0 || (resource.resourceTypeId && allowedTypeIds.has(resource.resourceTypeId))));

  return (
    <div className={styles.resourceSelector}>
      <div>
        <strong>{t.fields.resources}</strong>
        <p>{activity.resourceRequirement === "REQUIRED" ? t.resources.requiredHelp : t.resources.optionalHelp}</p>
      </div>
      <div className={styles.resourceOptions}>
        {resources.map((resource: any) => {
          const busy = startsAt && endsAt ? isResourceBusy(resource.id, startsAt, endsAt, data) : false;
          return (
            <label key={resource.id} className={busy ? styles.resourceOptionBusy : ""}>
              <input
                type="checkbox"
                disabled={busy}
                checked={selected.includes(resource.id)}
                onChange={(event) => {
                  const next = event.target.checked ? [...selected, resource.id] : selected.filter((id: string) => id !== resource.id);
                  onChange(next);
                }}
              />
              <span>{resource.name}<small>{resource.resourceTypeName ?? (locale === "pt-BR" ? "Sem tipo" : "No type")} · {busy ? (locale === "pt-BR" ? "Ocupado" : "Busy") : (locale === "pt-BR" ? "Disponível" : "Available")}</small></span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function AvailabilityPreview({ activity, form, data, t }: any) {
  const startsAt = localDateTimeToIso(form.date, form.startTime);
  const endsAt = localDateTimeToIso(form.date, form.endTime);
  const availability = getClientAvailability({
    activity,
    startsAt,
    endsAt,
    professionalId: form.professionalId || null,
    resourceIds: form.resourceIds,
    data,
  });

  return (
    <div className={availability.available ? styles.availabilityOk : styles.availabilityBlocked}>
      <strong>{availability.available ? t.capacity.available : t.capacity.unavailable}</strong>
      <p>{availability.reason ?? t.capacity.ready}</p>
    </div>
  );
}

function CustomerSearchField({ customers, selectedId, onSelect, createHref, locale }: any) {
  const selected = customers.find((customer: any) => customer.id === selectedId);
  const [query, setQuery] = useState(selected ? customerLabel(selected) : "");
  const [open, setOpen] = useState(false);
  const normalized = normalizeSearch(query);
  const filtered = customers.filter((customer: any) => {
    if (!normalized) return true;
    const name = normalizeSearch(customer.name);
    const doc = String(customer.documentNumber ?? "").replace(/\D/g, "");
    const queryDigits = query.replace(/\D/g, "");
    return name.includes(normalized) || (queryDigits && doc.includes(queryDigits));
  }).slice(0, 12);

  useEffect(() => {
    if (selected) setQuery(customerLabel(selected));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.customerSearch}>
      <input
        value={query}
        placeholder={locale === "pt-BR" ? "Buscar por nome ou CPF" : "Search by name or document"}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); if (selectedId) onSelect(""); }}
      />
      {open && (
        <div className={styles.customerSearchMenu}>
          {filtered.map((customer: any) => (
            <button key={customer.id} type="button" onClick={() => { onSelect(customer.id); setQuery(customerLabel(customer)); setOpen(false); }}>
              <strong>{customer.name}</strong>
              <span>{customer.documentNumber ? `${customer.documentType ?? ""} ${customer.documentNumber}` : (locale === "pt-BR" ? "Sem documento" : "No document")}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className={styles.customerSearchEmpty}>{locale === "pt-BR" ? "Nenhum cliente encontrado." : "No client found."}</div>}
          <Link className={styles.customerCreateLink} href={createHref}>{locale === "pt-BR" ? "+ Cliente não cadastrado? Cadastrar cliente" : "+ Client not registered? Create client"}</Link>
        </div>
      )}
    </div>
  );
}

function customerLabel(customer: any) {
  return customer.documentNumber ? `${customer.name} · ${customer.documentNumber}` : customer.name;
}
function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function buildCustomerCreateHref(form: AppointmentForm) {
  const params = new URLSearchParams({ openAppointment: "1", date: form.date, startTime: form.startTime, endTime: form.endTime });
  if (form.activityId) params.set("activityId", form.activityId);
  return `/customers/new?returnTo=${encodeURIComponent(`/scheduling?${params.toString()}`)}`;
}

function Modal({ title, subtitle, closeLabel, onClose, children }: any) {
  return (
    <div className={styles.modalOverlay} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true">
        <header className={styles.modalHeader}>
          <div><h2>{title}</h2><p>{subtitle}</p></div>
          <button type="button" className={styles.modalClose} aria-label={closeLabel} onClick={onClose}>×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Field({ label, children }: any) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}

function ModalActions({ t, pending, onCancel, submitLabel }: any) {
  return (
    <div className={styles.modalActions}>
      <button type="button" className={styles.secondaryButton} disabled={pending} onClick={onCancel}>{t.actions.cancel}</button>
      <button type="submit" className={styles.primaryButton} disabled={pending}>{pending ? t.actions.saving : submitLabel}</button>
    </div>
  );
}

function getCompatibleProfessionals(activity: Activity | null, data: SchedulingPageData) {
  if (!activity) return [];
  return data.professionals.filter((professional) => {
    if (!professional.active) return false;
    if (activity.professionalRequirement === "NONE") return true;
    return professional.activityIds.includes(activity.id);
  });
}

function getAvailableProfessionalsForSlot(activity: Activity | null, date: string, startTime: string, endTime: string, data: SchedulingPageData) {
  if (!activity || !date || !startTime || !endTime || endTime <= startTime) return [];
  const startsAt = localDateTimeToIso(date, startTime);
  const endsAt = localDateTimeToIso(date, endTime);
  return getCompatibleProfessionals(activity, data).filter((professional) => isProfessionalAvailable(professional, activity.id, startsAt, endsAt, data));
}

function isProfessionalAvailable(professional: SchedulingPageData["professionals"][number], activityId: string, startsAt: string, endsAt: string, data: SchedulingPageData) {
  if (!professional.active || !professional.activityIds.includes(activityId)) return false;
  if (data.appointments.some((appointment) => appointment.status === "SCHEDULED" && appointment.professionalId === professional.id && overlaps(startsAt, endsAt, appointment.startsAt, appointment.endsAt))) return false;

  const absence = professional.scheduleExceptions.some((exception) => exception.active && exception.exceptionType === "ABSENCE" && overlaps(startsAt, endsAt, exception.startsAt, exception.endsAt));
  if (absence) return false;

  const presence = professional.scheduleExceptions.some((exception) => exception.active && exception.exceptionType === "PRESENCE" && new Date(exception.startsAt) <= new Date(startsAt) && new Date(exception.endsAt) >= new Date(endsAt));
  if (presence) return true;

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const weekday = start.getDay();
  const localStart = `${String(start.getHours()).padStart(2,"0")}:${String(start.getMinutes()).padStart(2,"0")}`;
  const localEnd = `${String(end.getHours()).padStart(2,"0")}:${String(end.getMinutes()).padStart(2,"0")}`;
  return professional.availabilityRules.some((rule) => rule.active && rule.weekday === weekday && rule.startTime.slice(0,5) <= localStart && rule.endTime.slice(0,5) >= localEnd);
}

function isResourceBusy(resourceId: string, startsAt: string, endsAt: string, data: SchedulingPageData) {
  return data.appointments.some((appointment) => appointment.status === "SCHEDULED" && appointment.resourceIds.includes(resourceId) && overlaps(startsAt, endsAt, appointment.startsAt, appointment.endsAt));
}

function getRequiredResources(activity: Activity, data: SchedulingPageData) {
  return data.activityResourceRequirements.filter((item) => item.activityId === activity.id);
}

function hasRequiredResourcesSelected(requirements: any[], selected: string[], data: SchedulingPageData) {
  return requirements.every((requirement) => {
    const count = selected.filter((resourceId) => {
      const resource = data.resources.find((item) => item.id === resourceId);
      return resource?.resourceTypeId === requirement.resourceTypeId;
    }).length;
    return count >= requirement.quantity;
  });
}

function getClientAvailability({ activity, startsAt, endsAt, professionalId, resourceIds, data }: any) {
  if (!activity) return { available: false, reason: null };

  if (activity.professionalRequirement === "REQUIRED" && !professionalId) {
    return { available: false, reason: "Professional required." };
  }

  if (professionalId) {
    const professional = data.professionals.find((item: any) => item.id === professionalId);
    if (!professional || !isProfessionalAvailable(professional, activity.id, startsAt, endsAt, data)) {
      return { available: false, reason: "Professional is not available for this service/date/time." };
    }
  }

  const requirements = getRequiredResources(activity, data);
  if (activity.resourceRequirement === "REQUIRED" && requirements.length === 0) {
    return { available: false, reason: "Required resource type is not configured for this service." };
  }

  if (
    activity.resourceRequirement === "REQUIRED" &&
    !hasRequiredResourcesSelected(requirements, resourceIds, data)
  ) {
    return { available: false, reason: "Select all required resources." };
  }

  for (const resourceId of resourceIds) {
    const conflict = data.appointments.some((appointment: Appointment) =>
      appointment.status === "SCHEDULED" &&
      appointment.resourceIds.includes(resourceId) &&
      overlaps(startsAt, endsAt, appointment.startsAt, appointment.endsAt)
    );
    if (conflict) return { available: false, reason: "One of the selected resources is already booked." };
  }

  return { available: true, reason: null };
}

function humanizeServerError(error: string, t: any) {
  const value = error.toLowerCase();
  if (value.includes("professional is not available") || value.includes("professional_no_overlap")) return t.feedback.professionalUnavailable;
  if (value.includes("resource is not available") || value.includes("appointment_resources_no_overlap")) return t.feedback.resourceUnavailable;
  if (value.includes("professional is required")) return t.feedback.professionalRequired;
  if (value.includes("required resources")) return t.feedback.resourceRequired;
  if (value.includes("subscription")) return t.feedback.subscriptionInvalid;
  return t.feedback.unavailable;
}

function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

function addMinutesToTime(value: string, minutes: number) {
  const [hours, mins] = value.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function localDateTimeToIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function startOfDay(value: Date) {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(value: Date) {
  const result = startOfDay(value);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function getCalendarDays(cursor: Date, view: ViewMode) {
  if (view === "day") return [startOfDay(cursor)];
  if (view === "week") {
    const first = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return date;
    });
  }

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const first = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return date;
  });
}

function formatPeriodTitle(cursor: Date, view: ViewMode, locale: string) {
  if (view === "day") return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(cursor);
  if (view === "month") return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(cursor);
  const days = getCalendarDays(cursor, "week");
  return `${new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(days[0])} – ${new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(days[6])}`;
}

function formatTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
