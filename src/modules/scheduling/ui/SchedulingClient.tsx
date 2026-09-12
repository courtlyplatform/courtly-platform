"use client";

import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { CourtlyAlert } from "@/shared/ui/CourtlyAlert";
import { saveResourceAction, toggleResourceAction } from "@/modules/resources/application/resource-actions";
import {
  cancelAppointmentAction,
  changeScheduleRuleStatusAction,
  createAppointmentAction,
  createScheduleRuleAction,
  setActivityResourceRequirementAction,
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

  const [resourceForm, setResourceForm] = useState({ id: "", name: "", typeName: "" });
  const [windowDays, setWindowDays] = useState(String(initialData.settings.generationWindowDays));

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
          pending={isPending}
          onNew={() => {
            setResourceForm({ id: "", name: "", typeName: "" });
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
                <select
                  value={appointmentForm.customerId}
                  onChange={(event) =>
                    setAppointmentForm((current) => ({
                      ...current,
                      customerId: event.target.value,
                      activityId: "",
                      subscriptionId: "",
                      professionalId: "",
                      resourceIds: [],
                    }))
                  }
                >
                  <option value="">{t.placeholders.selectCustomer}</option>
                  {initialData.customers.filter((customer) => customer.active).map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
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
                  {getCompatibleProfessionals(appointmentActivity, initialData).map((professional) => (
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
              onChange={(resourceIds: string[]) => setAppointmentForm((current) => ({ ...current, resourceIds }))}
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
        <Modal title={t.resources.newTitle} subtitle={t.resources.newDescription} closeLabel={t.actions.close} onClose={closeModal}>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              setModalError(null);
              startTransition(async () => {
                const result = await saveResourceAction({
                  id: resourceForm.id || undefined,
                  name: resourceForm.name,
                  typeName: resourceForm.typeName,
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
              <input
                value={resourceForm.typeName}
                placeholder={t.resources.typePlaceholder}
                onChange={(event) => setResourceForm((current) => ({ ...current, typeName: event.target.value }))}
              />
            </Field>
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

function DayWeekCalendar({ days, appointments, data, locale, t, onCancel }: any) {
  return (
    <div className={styles.dayWeekGrid} style={{ gridTemplateColumns: `84px repeat(${days.length}, minmax(170px, 1fr))` }}>
      <div className={styles.cornerCell} />
      {days.map((day: Date) => (
        <div key={day.toISOString()} className={styles.dayHeader}>
          <span>{new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day)}</span>
          <strong>{new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(day)}</strong>
        </div>
      ))}

      {Array.from({ length: 15 }, (_, index) => index + 7).flatMap((hour) => [
        <div key={`hour-${hour}`} className={styles.timeCell}>{String(hour).padStart(2, "0")}:00</div>,
        ...days.map((day: Date) => {
          const cellAppointments = appointments.filter((appointment: Appointment) => {
            const date = new Date(appointment.startsAt);
            return isSameDate(date, day) && date.getHours() === hour;
          });

          const activeResources = data.resources.filter((resource: any) => resource.active);
          const activeProfessionals = data.professionals.filter((professional: any) => professional.active);
          const usedResources = new Set(cellAppointments.flatMap((appointment: Appointment) => appointment.resourceIds));
          const usedProfessionals = new Set(
            cellAppointments
              .map((appointment: Appointment) => appointment.professionalId)
              .filter(Boolean)
          );
          const globallyFull =
            (activeResources.length > 0 && usedResources.size >= activeResources.length) ||
            (activeProfessionals.length > 0 && usedProfessionals.size >= activeProfessionals.length);

          return (
            <div
              key={`${day.toISOString()}-${hour}`}
              className={`${styles.slotCell} ${globallyFull ? styles.slotFull : ""}`}
            >
              {(activeResources.length > 0 || activeProfessionals.length > 0) && (
                <div className={styles.slotOccupancy}>
                  {activeResources.length > 0 && (
                    <span>{t.capacity.resources}: {usedResources.size}/{activeResources.length}</span>
                  )}
                  {activeProfessionals.length > 0 && (
                    <span>{t.capacity.professionals}: {usedProfessionals.size}/{activeProfessionals.length}</span>
                  )}
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

function MonthCalendar({ days, cursor, appointments, data, locale, t, onSelectDay }: any) {
  return (
    <div className={styles.monthGrid}>
      {t.weekdaysShort.map((label: string) => <div key={label} className={styles.monthWeekday}>{label}</div>)}
      {days.map((day: Date) => {
        const dayAppointments = appointments.filter((appointment: Appointment) => isSameDate(new Date(appointment.startsAt), day));
        const currentMonth = day.getMonth() === cursor.getMonth();
        return (
          <button
            key={day.toISOString()}
            type="button"
            className={`${styles.monthDay} ${!currentMonth ? styles.monthDayMuted : ""}`}
            onClick={() => onSelectDay(day)}
          >
            <strong>{day.getDate()}</strong>
            <span>{dayAppointments.length ? t.calendar.appointmentCount.replace("{count}", String(dayAppointments.length)) : t.calendar.free}</span>
            {dayAppointments.slice(0, 3).map((appointment: Appointment) => {
              const activity = data.activities.find((item: Activity) => item.id === appointment.activityId);
              return <i key={appointment.id}>{formatTime(appointment.startsAt, locale)} · {activity?.name}</i>;
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

  return (
    <article className={styles.appointmentCard}>
      <div className={styles.appointmentTime}>{formatTime(appointment.startsAt, locale)}–{formatTime(appointment.endsAt, locale)}</div>
      <strong>{customer?.name ?? t.calendar.unknownCustomer}</strong>
      <span>{activity?.name ?? t.calendar.unknownService}</span>
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

function ResourcesPanel({ data, t, pending, onNew, onToggle, onRequirement }: any) {
  const resourceTypes = Array.from(
    new Map(data.resources.map((resource: any) => [resource.resourceTypeId, resource.resourceTypeName])).entries()
  ) as [string, string][];

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
              <span>{resource.resourceTypeName}</span>
              <strong>{resource.name}</strong>
            </div>
            <button type="button" disabled={pending} onClick={() => onToggle(resource.id, !resource.active)}>
              {resource.active ? t.resources.deactivate : t.resources.activate}
            </button>
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
            <RequirementEditor
              key={activity.id}
              activity={activity}
              existing={existing}
              resourceTypes={resourceTypes}
              t={t}
              onSave={onRequirement}
            />
          );
        })}
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

function ResourceSelector({ activity, selected, data, t, onChange }: any) {
  if (!activity || activity.resourceRequirement === "NONE") return null;
  const requirements = getRequiredResources(activity, data);
  const allowedTypeIds = new Set(requirements.map((item: any) => item.resourceTypeId));
  const resources = data.resources.filter(
    (resource: any) => resource.active && (allowedTypeIds.size === 0 || allowedTypeIds.has(resource.resourceTypeId))
  );

  return (
    <div className={styles.resourceSelector}>
      <div>
        <strong>{t.fields.resources}</strong>
        <p>{activity.resourceRequirement === "REQUIRED" ? t.resources.requiredHelp : t.resources.optionalHelp}</p>
      </div>
      <div className={styles.resourceOptions}>
        {resources.map((resource: any) => (
          <label key={resource.id}>
            <input
              type="checkbox"
              checked={selected.includes(resource.id)}
              onChange={(event) => {
                const next = event.target.checked
                  ? [...selected, resource.id]
                  : selected.filter((id: string) => id !== resource.id);
                onChange(next);
              }}
            />
            <span>{resource.name}<small>{resource.resourceTypeName}</small></span>
          </label>
        ))}
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
    const conflict = data.appointments.some((appointment: Appointment) =>
      appointment.status === "SCHEDULED" &&
      appointment.professionalId === professionalId &&
      overlaps(startsAt, endsAt, appointment.startsAt, appointment.endsAt)
    );
    if (conflict) return { available: false, reason: "Professional is already booked in this interval." };
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
