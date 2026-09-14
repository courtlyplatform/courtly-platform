"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useI18n,
} from "@/shared/i18n/I18nProvider";

import {
  CourtlyAlert,
} from "@/shared/ui/CourtlyAlert";

import {
  ConfirmDialog,
} from "@/shared/ui/confirmDialog";

import type {
  Activity,
} from "../domain/activity";

import {
  saveActivityAction,
  toggleActivityAction,
} from "../application/activity-actions";


type ResourcePoolOption = {
  id: string;
  name: string;
  active: boolean;
  activeResourceCount: number;
};

type ResourceRequirement = {
  activityId: string;
  resourcePoolId: string;
  quantity: number;
};

type SpecialtyOption = {
  id: string;
  name: string;
  color: string;
  active: boolean;
};

type ResourceRequirementForm = {
  resourcePoolId: string;
  quantity: string;
};

type Props = {
  initialActivities: Activity[];
  resourcePools: ResourcePoolOption[];
  resourceRequirements: ResourceRequirement[];
  specialties: SpecialtyOption[];
};


type StatusFilter =
  | ""
  | "active"
  | "inactive";


type ActivityFormState = {
  id?: string;

  name: string;

  description: string;

  defaultDurationMinutes: string;

  defaultPrice: string;

  schedulingMode: Activity["schedulingMode"];

  professionalRequirement: Activity["professionalRequirement"];

  resourceRequirement: Activity["resourceRequirement"];

  specialtyId: string;

  resourceRequirements: ResourceRequirementForm[];
};


type Feedback = {
  type:
  | "success"
  | "error";

  message: string;
} | null;


type ActivityToDeactivate = {
  id: string;

  name: string;
} | null;


const EMPTY_FORM:
  ActivityFormState = {
  name: "",

  description: "",

  defaultDurationMinutes:
    "60",

  defaultPrice: "",

  schedulingMode: "NONE",

  professionalRequirement: "NONE",

  resourceRequirement: "NONE",

  specialtyId: "",

  resourceRequirements: [],
};


function normalizeSearchText(
  value: string
): string {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}


export function ServicesClient({
  initialActivities,
  resourcePools,
  resourceRequirements,
  specialties,
}: Props) {
  const router =
    useRouter();

  const {
    dictionary,
    locale,
  } =
    useI18n();

  const t =
    dictionary.services;


  const [
    activities,
    setActivities,
  ] =
    useState<Activity[]>(
      initialActivities
    );


  /*
   * Keeps local state synchronized
   * after router.refresh().
   */
  useEffect(
    () => {
      setActivities(
        initialActivities
      );
    },
    [
      initialActivities,
    ]
  );


  /* =====================================
     FILTER STATE
     ===================================== */

  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    durationFilter,
    setDurationFilter,
  ] =
    useState("");


  const [
    minPriceFilter,
    setMinPriceFilter,
  ] =
    useState("");


  const [
    maxPriceFilter,
    setMaxPriceFilter,
  ] =
    useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      ""
    );


  /* =====================================
     MODAL / FORM STATE
     ===================================== */

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);


  const [
    form,
    setForm,
  ] =
    useState<ActivityFormState>(
      EMPTY_FORM
    );


  const [
    modalError,
    setModalError,
  ] =
    useState<
      string | null
    >(
      null
    );


  /* =====================================
     FEEDBACK STATE
     ===================================== */

  const [
    feedback,
    setFeedback,
  ] =
    useState<Feedback>(
      null
    );


  /* =====================================
     DEACTIVATION STATE
     ===================================== */

  const [
    activityToDeactivate,
    setActivityToDeactivate,
  ] =
    useState<ActivityToDeactivate>(
      null
    );


  const [
    isPending,
    startTransition,
  ] =
    useTransition();


  /* =====================================
     AVAILABLE DURATIONS
     ===================================== */

  const availableDurations =
    useMemo(
      () => {
        return Array.from(
          new Set(
            activities.map(
              (
                activity
              ) =>
                activity
                  .defaultDurationMinutes
            )
          )
        ).sort(
          (
            a,
            b
          ) =>
            a -
            b
        );
      },
      [
        activities,
      ]
    );


  /* =====================================
     FILTERED ACTIVITIES
     ===================================== */

  const filteredActivities =
    useMemo(
      () => {
        const normalizedSearch =
          normalizeSearchText(
            search
          );


        const selectedDuration =
          durationFilter
            ? Number(
              durationFilter
            )
            : null;


        const minimumPrice =
          parseFilterPrice(
            minPriceFilter
          );


        const maximumPrice =
          parseFilterPrice(
            maxPriceFilter
          );


        /*
         * If the user typed the complete name of
         * an existing service, Courtly prioritizes
         * exact service-name matching.
         *
         * Example:
         *
         * "Tennis"
         *
         * Tennis        -> exact
         * Beach Tennis  -> partial
         *
         * Result:
         * Tennis only.
         *
         * While typing:
         *
         * "Ten"
         *
         * there is no exact match, therefore the
         * regular partial search remains active.
         */
        const hasExactNameMatch =
          normalizedSearch !==
          "" &&
          activities.some(
            (
              activity
            ) =>
              normalizeSearchText(
                activity.name
              ) ===
              normalizedSearch
          );


        return activities.filter(
          (
            activity
          ) => {
            /* =============================
               SEARCH
               ============================= */

            const normalizedName =
              normalizeSearchText(
                activity.name
              );


            const normalizedDescription =
              normalizeSearchText(
                activity
                  .description ??
                ""
              );


            let matchesSearch =
              true;


            if (
              normalizedSearch
            ) {
              if (
                hasExactNameMatch
              ) {
                /*
                 * A service exists whose complete
                 * name is exactly what was typed.
                 */
                matchesSearch =
                  normalizedName ===
                  normalizedSearch;
              } else {
                /*
                 * No exact service exists yet.
                 *
                 * Keep the current flexible
                 * search behavior while typing.
                 */
                matchesSearch =
                  normalizedName.includes(
                    normalizedSearch
                  ) ||
                  normalizedDescription.includes(
                    normalizedSearch
                  );
              }
            }


            /* =============================
               STATUS
               ============================= */

            const matchesStatus =
              !statusFilter ||
              (
                statusFilter ===
                "active" &&
                activity.active
              ) ||
              (
                statusFilter ===
                "inactive" &&
                !activity.active
              );


            /* =============================
               DURATION
               ============================= */

            const matchesDuration =
              selectedDuration ===
              null ||
              activity
                .defaultDurationMinutes ===
              selectedDuration;


            /* =============================
               PRICE
               ============================= */

            const hasPriceFilter =
              minimumPrice !==
              null ||
              maximumPrice !==
              null;


            let matchesPrice =
              true;


            if (
              hasPriceFilter
            ) {
              if (
                activity
                  .defaultPrice ===
                null
              ) {
                matchesPrice =
                  false;
              } else {
                if (
                  minimumPrice !==
                  null &&
                  activity
                    .defaultPrice <
                  minimumPrice
                ) {
                  matchesPrice =
                    false;
                }


                if (
                  maximumPrice !==
                  null &&
                  activity
                    .defaultPrice >
                  maximumPrice
                ) {
                  matchesPrice =
                    false;
                }
              }
            }


            return (
              matchesSearch &&
              matchesStatus &&
              matchesDuration &&
              matchesPrice
            );
          }
        );
      },
      [
        activities,
        search,
        statusFilter,
        durationFilter,
        minPriceFilter,
        maxPriceFilter,
      ]
    );


  const hasActiveFilters =
    Boolean(
      search ||
      statusFilter ||
      durationFilter ||
      minPriceFilter ||
      maxPriceFilter
    );


  function clearFilters() {
    setSearch("");

    setDurationFilter(
      ""
    );

    setMinPriceFilter(
      ""
    );

    setMaxPriceFilter(
      ""
    );

    setStatusFilter(
      ""
    );
  }


  /* =====================================
     CREATE / EDIT MODAL
     ===================================== */

  function openNewActivity() {
    setModalError(
      null
    );

    setFeedback(
      null
    );

    setForm(
      EMPTY_FORM
    );

    setModalOpen(
      true
    );
  }


  function openEditActivity(
    activity: Activity
  ) {
    setModalError(
      null
    );

    setFeedback(
      null
    );

    setForm({
      id:
        activity.id,

      name:
        activity.name,

      description:
        activity.description ??
        "",

      defaultDurationMinutes:
        String(
          activity
            .defaultDurationMinutes
        ),

      defaultPrice:
        activity.defaultPrice ===
          null
          ? ""
          : String(
            activity
              .defaultPrice
          ),

      schedulingMode:
        activity.schedulingMode,

      professionalRequirement:
        activity.professionalRequirement,

      resourceRequirement:
        activity.resourceRequirement,

      specialtyId:
        activity.specialtyId ?? "",

      resourceRequirements:
        resourceRequirements
          .filter((item) => item.activityId === activity.id)
          .map((item) => ({
            resourcePoolId: item.resourcePoolId,
            quantity: String(item.quantity),
          })),
    });

    setModalOpen(
      true
    );
  }


  function closeModal() {
    if (isPending) {
      return;
    }

    setModalOpen(
      false
    );

    setModalError(
      null
    );

    setForm(
      EMPTY_FORM
    );
  }


  function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setModalError(
      null
    );


    const duration =
      Number(
        form
          .defaultDurationMinutes
      );


    const price =
      parsePrice(
        form.defaultPrice
      );


    if (
      !form.name.trim()
    ) {
      setModalError(
        t.validation
          .nameRequired
      );

      return;
    }


    if (
      !Number.isInteger(
        duration
      ) ||
      duration <= 0
    ) {
      setModalError(
        t.validation
          .invalidDuration
      );

      return;
    }


    if (
      price !== null &&
      (
        Number.isNaN(
          price
        ) ||
        price < 0
      )
    ) {
      setModalError(
        t.validation
          .invalidPrice
      );

      return;
    }


    if (
      form.schedulingMode !== "NONE" &&
      form.resourceRequirement === "REQUIRED" &&
      form.resourceRequirements.length === 0
    ) {
      setModalError(
        locale === "pt-BR"
          ? "Adicione pelo menos um tipo de recurso obrigatório para este serviço."
          : "Add at least one required resource type for this service."
      );
      return;
    }

    if (
      form.resourceRequirements.some((requirement) =>
        !requirement.resourcePoolId ||
        !Number.isInteger(Number(requirement.quantity)) ||
        Number(requirement.quantity) <= 0
      )
    ) {
      setModalError(
        locale === "pt-BR"
          ? "Revise os tipos de recurso e as quantidades informadas."
          : "Review the selected resource types and quantities."
      );
      return;
    }

    const editing =
      Boolean(
        form.id
      );


    startTransition(
      async () => {
        const result =
          await saveActivityAction({
            id:
              form.id,

            name:
              form.name
                .trim(),

            description:
              form
                .description
                .trim() ||
              null,

            defaultDurationMinutes:
              duration,

            defaultPrice:
              price,

            schedulingMode:
              form.schedulingMode,

            professionalRequirement:
              form.schedulingMode === "NONE"
                ? "NONE"
                : form.professionalRequirement,

            resourceRequirement:
              form.schedulingMode === "NONE"
                ? "NONE"
                : form.resourceRequirement,

            specialtyId:
              form.specialtyId || null,

            resourceRequirements:
              form.schedulingMode === "NONE" || form.resourceRequirement === "NONE"
                ? []
                : form.resourceRequirements.map((requirement) => ({
                  resourcePoolId: requirement.resourcePoolId,
                  quantity: Number(requirement.quantity),
                })),
          });


        if (
          !result.success
        ) {
          setModalError(
            getActionErrorMessage(
              result.error,
              t
            )
          );

          return;
        }


        setModalOpen(
          false
        );


        setForm(
          EMPTY_FORM
        );


        setFeedback({
          type:
            "success",

          message:
            editing
              ? t.feedback
                .success
                .serviceUpdated
              : t.feedback
                .success
                .serviceCreated,
        });


        router.refresh();
      }
    );
  }


  /* =====================================
     DEACTIVATE
     ===================================== */

  function requestDeactivation(
    activity: Activity
  ) {
    setFeedback(
      null
    );

    setActivityToDeactivate({
      id:
        activity.id,

      name:
        activity.name,
    });
  }


  function cancelDeactivation() {
    if (isPending) {
      return;
    }

    setActivityToDeactivate(
      null
    );
  }


  function confirmDeactivation() {
    if (
      !activityToDeactivate ||
      isPending
    ) {
      return;
    }


    startTransition(
      async () => {
        const result =
          await toggleActivityAction(
            activityToDeactivate.id,
            false
          );


        if (
          !result.success
        ) {
          setActivityToDeactivate(
            null
          );


          setFeedback({
            type:
              "error",

            message:
              t.feedback
                .error
                .statusUpdateFailed,
          });

          return;
        }


        const id =
          activityToDeactivate.id;


        setActivities(
          (
            current
          ) =>
            current.map(
              (
                activity
              ) =>
                activity.id ===
                  id
                  ? {
                    ...activity,

                    active:
                      false,
                  }
                  : activity
            )
        );


        setActivityToDeactivate(
          null
        );


        setFeedback({
          type:
            "success",

          message:
            t.feedback
              .success
              .serviceDeactivated,
        });


        router.refresh();
      }
    );
  }


  /* =====================================
     REACTIVATE
     ===================================== */

  function reactivateActivity(
    activity: Activity
  ) {
    if (isPending) {
      return;
    }


    setFeedback(
      null
    );


    startTransition(
      async () => {
        const result =
          await toggleActivityAction(
            activity.id,
            true
          );


        if (
          !result.success
        ) {
          setFeedback({
            type:
              "error",

            message:
              t.feedback
                .error
                .statusUpdateFailed,
          });

          return;
        }


        setActivities(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                  activity.id
                  ? {
                    ...item,

                    active:
                      true,
                  }
                  : item
            )
        );


        setFeedback({
          type:
            "success",

          message:
            t.feedback
              .success
              .serviceReactivated,
        });


        router.refresh();
      }
    );
  }


  return (
    <main className="services-page">
      {/* =====================================
                PAGE HEADER
               ===================================== */}

      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            {
              t.eyebrow
            }
          </span>

          <h1>
            {
              t.title
            }
          </h1>

          <p>
            {
              t.description
            }
          </p>
        </div>


        <button
          type="button"
          className="primary-button"
          onClick={
            openNewActivity
          }
        >
          +{" "}
          {
            t.new
          }
        </button>
      </div>


      {/* =====================================
                FEEDBACK
               ===================================== */}

      {feedback && (
        <CourtlyAlert
          key={
            `${feedback.type}-${feedback.message}`
          }
          type={
            feedback.type
          }
          message={
            feedback.message
          }
        />
      )}


      {/* =====================================
                EMPTY DATABASE
               ===================================== */}

      {activities.length ===
        0 ? (
        <div className="empty-state">
          <h2>
            {
              t.empty
                .title
            }
          </h2>

          <p>
            {
              t.empty
                .description
            }
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={
              openNewActivity
            }
          >
            {
              t.empty
                .action
            }
          </button>
        </div>
      ) : (
        <>
          {/* =================================
                        FILTERS
                       ================================= */}

          <section className="services-filters-panel">
            {/* SEARCH */}

            <div className="service-filter-field">
              <label htmlFor="service-search-filter">
                {
                  t.filters
                    .name
                }
              </label>

              <input
                id="service-search-filter"
                type="search"
                value={
                  search
                }
                placeholder={
                  t.filters
                    .namePlaceholder
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
              />
            </div>


            {/* DURATION */}

            <div className="service-filter-field">
              <label htmlFor="service-duration-filter">
                {
                  t.filters
                    .duration
                }
              </label>

              <select
                id="service-duration-filter"
                value={
                  durationFilter
                }
                onChange={(
                  event
                ) =>
                  setDurationFilter(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="">
                  {
                    t.filters
                      .allDurations
                  }
                </option>

                {availableDurations.map(
                  (
                    duration
                  ) => (
                    <option
                      key={
                        duration
                      }
                      value={
                        duration
                      }
                    >
                      {
                        formatDuration(
                          duration,
                          t.minutes
                        )
                      }
                    </option>
                  )
                )}
              </select>
            </div>


            {/* MIN PRICE */}

            <div className="service-filter-field">
              <label htmlFor="service-min-price-filter">
                {
                  t.filters
                    .minPrice
                }
              </label>

              <div className="service-filter-price-input">
                <span>
                  R$
                </span>

                <input
                  id="service-min-price-filter"
                  type="text"
                  inputMode="decimal"
                  value={
                    minPriceFilter
                  }
                  placeholder={
                    t.filters
                      .minPricePlaceholder
                  }
                  onChange={(
                    event
                  ) =>
                    setMinPriceFilter(
                      sanitizePriceInput(
                        event
                          .target
                          .value
                      )
                    )
                  }
                />
              </div>
            </div>


            {/* MAX PRICE */}

            <div className="service-filter-field">
              <label htmlFor="service-max-price-filter">
                {
                  t.filters
                    .maxPrice
                }
              </label>

              <div className="service-filter-price-input">
                <span>
                  R$
                </span>

                <input
                  id="service-max-price-filter"
                  type="text"
                  inputMode="decimal"
                  value={
                    maxPriceFilter
                  }
                  placeholder={
                    t.filters
                      .maxPricePlaceholder
                  }
                  onChange={(
                    event
                  ) =>
                    setMaxPriceFilter(
                      sanitizePriceInput(
                        event
                          .target
                          .value
                      )
                    )
                  }
                />
              </div>
            </div>


            {/* STATUS */}

            <div className="service-filter-field">
              <label htmlFor="service-status-filter">
                {
                  t.filters
                    .status
                }
              </label>

              <select
                id="service-status-filter"
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event
                      .target
                      .value as
                    StatusFilter
                  )
                }
              >
                <option value="">
                  {
                    t.filters
                      .allStatuses
                  }
                </option>

                <option value="active">
                  {
                    t.filters
                      .active
                  }
                </option>

                <option value="inactive">
                  {
                    t.filters
                      .inactive
                  }
                </option>
              </select>
            </div>


            {/* CLEAR */}

            <button
              type="button"
              className="services-filters-clear"
              disabled={
                !hasActiveFilters
              }
              onClick={
                clearFilters
              }
            >
              {
                t.filters
                  .clear
              }
            </button>
          </section>


          {/* =================================
                        EMPTY FILTER RESULT
                       ================================= */}

          {filteredActivities.length ===
            0 ? (
            <div className="services-filter-empty">
              {
                t.filters
                  .noResults
              }
            </div>
          ) : (
            <>
              {/* =========================
                                DESKTOP / TABLET
                               ========================= */}

              <section className="services-table-card">
                <div className="table-scroll">
                  <table className="services-table">
                    <thead>
                      <tr>
                        <th>
                          {
                            t.table
                              .name
                          }
                        </th>

                        <th>
                          {
                            t.table
                              .description
                          }
                        </th>

                        <th>
                          {
                            t.table
                              .duration
                          }
                        </th>

                        <th>
                          {
                            t.table
                              .price
                          }
                        </th>

                        <th>
                          {
                            t.table
                              .status
                          }
                        </th>

                        <th className="actions-column">
                          {
                            t.table
                              .actions
                          }
                        </th>
                      </tr>
                    </thead>


                    <tbody>
                      {filteredActivities.map(
                        (
                          activity
                        ) => (
                          <tr
                            key={
                              activity.id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  activity.name
                                }
                              </strong>
                            </td>


                            <td>
                              <span className="service-description-cell">
                                {
                                  activity.description ||
                                  "—"
                                }
                              </span>
                            </td>


                            <td>
                              {
                                formatDuration(
                                  activity
                                    .defaultDurationMinutes,
                                  t.minutes
                                )
                              }
                            </td>


                            <td>
                              {activity.defaultPrice ===
                                null
                                ? t.noPrice
                                : formatCurrency(
                                  activity
                                    .defaultPrice,
                                  locale
                                )}
                            </td>


                            <td>
                              <span
                                className={
                                  activity.active
                                    ? "status-badge status-badge--active"
                                    : "status-badge status-badge--inactive"
                                }
                              >
                                {activity.active
                                  ? t.active
                                  : t.inactive}
                              </span>
                            </td>


                            <td>
                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="action-link"
                                  onClick={() =>
                                    openEditActivity(
                                      activity
                                    )
                                  }
                                >
                                  {
                                    t.editAction
                                  }
                                </button>


                                {activity.active ? (
                                  <button
                                    type="button"
                                    className="action-button"
                                    disabled={
                                      isPending
                                    }
                                    onClick={() =>
                                      requestDeactivation(
                                        activity
                                      )
                                    }
                                  >
                                    {
                                      t.deactivate
                                    }
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="action-button"
                                    disabled={
                                      isPending
                                    }
                                    onClick={() =>
                                      reactivateActivity(
                                        activity
                                      )
                                    }
                                  >
                                    {
                                      t.activate
                                    }
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>


              {/* =========================
                                MOBILE
                               ========================= */}

              <section className="services-mobile-list">
                {filteredActivities.map(
                  (
                    activity
                  ) => (
                    <article
                      key={
                        activity.id
                      }
                      className="service-mobile-card"
                    >
                      <div className="service-mobile-header">
                        <div>
                          <span className="service-mobile-label">
                            {
                              t.service
                            }
                          </span>

                          <h2>
                            {
                              activity.name
                            }
                          </h2>
                        </div>

                        <span
                          className={
                            activity.active
                              ? "status-badge status-badge--active"
                              : "status-badge status-badge--inactive"
                          }
                        >
                          {activity.active
                            ? t.active
                            : t.inactive}
                        </span>
                      </div>


                      <dl className="service-mobile-details">
                        <div>
                          <dt>
                            {
                              t.table
                                .description
                            }
                          </dt>

                          <dd>
                            {
                              activity.description ||
                              "—"
                            }
                          </dd>
                        </div>


                        <div>
                          <dt>
                            {
                              t.table
                                .duration
                            }
                          </dt>

                          <dd>
                            {
                              formatDuration(
                                activity
                                  .defaultDurationMinutes,
                                t.minutes
                              )
                            }
                          </dd>
                        </div>


                        <div>
                          <dt>
                            {
                              t.table
                                .price
                            }
                          </dt>

                          <dd>
                            {activity.defaultPrice ===
                              null
                              ? t.noPrice
                              : formatCurrency(
                                activity
                                  .defaultPrice,
                                locale
                              )}
                          </dd>
                        </div>
                      </dl>


                      <div className="service-mobile-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            openEditActivity(
                              activity
                            )
                          }
                        >
                          {
                            t.editAction
                          }
                        </button>


                        {activity.active ? (
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={
                              isPending
                            }
                            onClick={() =>
                              requestDeactivation(
                                activity
                              )
                            }
                          >
                            {
                              t.deactivate
                            }
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={
                              isPending
                            }
                            onClick={() =>
                              reactivateActivity(
                                activity
                              )
                            }
                          >
                            {
                              t.activate
                            }
                          </button>
                        )}
                      </div>
                    </article>
                  )
                )}
              </section>
            </>
          )}
        </>
      )}


      {/* =====================================
                CREATE / EDIT MODAL
               ===================================== */}

      {modalOpen && (
        <div
          className="service-modal-overlay"
          role="presentation"
        >
          <section
            className="service-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
          >
            <header className="service-modal-header">
              <div>
                <span className="service-modal-eyebrow">
                  {
                    t.eyebrow
                  }
                </span>

                <h2 id="service-modal-title">
                  {form.id
                    ? t.edit
                    : t.new}
                </h2>

                <p>
                  {
                    t.modalDescription
                  }
                </p>
              </div>


              <button
                type="button"
                className="service-modal-close"
                aria-label={
                  t.close
                }
                title={
                  t.close
                }
                disabled={
                  isPending
                }
                onClick={
                  closeModal
                }
              >
                ×
              </button>
            </header>


            <form
              className="service-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="form-group">
                <label htmlFor="service-name">
                  {
                    t.name
                  }{" "}
                  *
                </label>

                <input
                  id="service-name"
                  autoFocus
                  type="text"
                  maxLength={
                    120
                  }
                  value={
                    form.name
                  }
                  placeholder={
                    t.namePlaceholder
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        name:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </div>


              <div className="form-group">
                <label htmlFor="service-description">
                  {
                    t.serviceDescription
                  }
                </label>

                <textarea
                  id="service-description"
                  rows={
                    4
                  }
                  maxLength={
                    500
                  }
                  value={
                    form.description
                  }
                  placeholder={
                    t.descriptionPlaceholder
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </div>


              <div className="service-form-row">
                <div className="form-group">
                  <label htmlFor="service-duration">
                    {
                      t.duration
                    }{" "}
                    *
                  </label>

                  <div className="service-input-with-addon">
                    <input
                      id="service-duration"
                      type="number"
                      min={
                        1
                      }
                      step={
                        1
                      }
                      value={
                        form
                          .defaultDurationMinutes
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            defaultDurationMinutes:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />

                    <span>
                      {
                        t.minutes
                      }
                    </span>
                  </div>

                  <small>
                    {
                      t.durationHelp
                    }
                  </small>
                </div>


                <div className="form-group">
                  <label htmlFor="service-price">
                    {
                      t.price
                    }
                  </label>

                  <div className="service-input-with-addon service-input-with-addon--prefix">
                    <span>
                      R$
                    </span>

                    <input
                      id="service-price"
                      type="text"
                      inputMode="decimal"
                      value={
                        form
                          .defaultPrice
                      }
                      placeholder={
                        locale ===
                          "pt-BR"
                          ? "0,00"
                          : "0.00"
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            defaultPrice:
                              sanitizePriceInput(
                                event
                                  .target
                                  .value
                              ),
                          })
                        )
                      }
                    />
                  </div>

                  <small>
                    {
                      t.priceHelp
                    }
                  </small>
                </div>
              </div>


              <div className="service-form-row">
                <div className="form-group">
                  <label htmlFor="service-scheduling-mode">
                    {t.scheduling.mode}
                  </label>
                  <select
                    id="service-scheduling-mode"
                    value={form.schedulingMode}
                    onChange={(event) => {
                      const schedulingMode = event.target.value as Activity["schedulingMode"];
                      setForm((current) => ({
                        ...current,
                        schedulingMode,
                        professionalRequirement:
                          schedulingMode === "NONE" ? "NONE" : current.professionalRequirement,
                        resourceRequirement:
                          schedulingMode === "NONE" ? "NONE" : current.resourceRequirement,
                      }));
                    }}
                  >
                    <option value="NONE">{t.scheduling.none}</option>
                    <option value="OPTIONAL">{t.scheduling.optional}</option>
                    <option value="REQUIRED">{t.scheduling.required}</option>
                  </select>
                  <small>{t.scheduling.modeHelp}</small>
                </div>

                {form.schedulingMode !== "NONE" && (
                  <div className="form-group">
                    <label htmlFor="service-professional-requirement">
                      {t.scheduling.professional}
                    </label>
                    <select
                      id="service-professional-requirement"
                      value={form.professionalRequirement}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          professionalRequirement: event.target.value as Activity["professionalRequirement"],
                        }))
                      }
                    >
                      <option value="NONE">{t.scheduling.none}</option>
                      <option value="OPTIONAL">{t.scheduling.optional}</option>
                      <option value="REQUIRED">{t.scheduling.required}</option>
                    </select>
                  </div>
                )}
              </div>

              {form.schedulingMode !== "NONE" && (
                <div className="form-group">
                  <label htmlFor="service-resource-requirement">
                    {t.scheduling.resource}
                  </label>
                  <select
                    id="service-resource-requirement"
                    value={form.resourceRequirement}
                    onChange={(event) => {
                      const resourceRequirement = event.target.value as Activity["resourceRequirement"];
                      setForm((current) => ({
                        ...current,
                        resourceRequirement,
                        resourceRequirements: resourceRequirement === "NONE" ? [] : current.resourceRequirements,
                      }));
                    }}
                  >
                    <option value="NONE">{t.scheduling.none}</option>
                    <option value="OPTIONAL">{t.scheduling.optional}</option>
                    <option value="REQUIRED">{t.scheduling.required}</option>
                  </select>
                  <small>{t.scheduling.resourceHelp}</small>
                </div>
              )}

              {form.schedulingMode !== "NONE" && (
                <div className="service-config-section">
                  <div className="service-config-section__header">
                    <div>
                      <span className="service-config-eyebrow">
                        {locale === "pt-BR" ? "Modalidade e aparência" : "Modality and appearance"}
                      </span>
                      <h3>{locale === "pt-BR" ? "Especialidade / modalidade" : "Specialty / modality"}</h3>
                      <p>
                        {locale === "pt-BR"
                          ? "Opcional. A cor da especialidade será usada no compromisso da agenda."
                          : "Optional. The specialty color will be used on the calendar appointment."}
                      </p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="service-specialty">
                      {locale === "pt-BR" ? "Especialidade" : "Specialty"}
                    </label>
                    <select
                      id="service-specialty"
                      value={form.specialtyId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, specialtyId: event.target.value }))
                      }
                    >
                      <option value="">
                        {locale === "pt-BR" ? "Sem especialidade / cor padrão" : "No specialty / default color"}
                      </option>
                      {specialties.filter((item) => item.active).map((specialty) => (
                        <option key={specialty.id} value={specialty.id}>
                          {specialty.name} · {specialty.color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {form.schedulingMode !== "NONE" && form.resourceRequirement !== "NONE" && (
                <div className="service-config-section">
                  <div className="service-config-section__header">
                    <div>
                      <span className="service-config-eyebrow">
                        {locale === "pt-BR" ? "Capacidade física" : "Physical capacity"}
                      </span>
                      <h3>{locale === "pt-BR" ? "Recursos necessários" : "Required resources"}</h3>
                      <p>
                        {locale === "pt-BR"
                          ? "Informe quantas unidades deste tipo UM agendamento consome. O Courtly escolherá automaticamente um recurso físico disponível do pool."
                          : "Define how many units of each type ONE appointment consumes. Courtly automatically assigns an available physical resource from the pool."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="secondary-button service-add-requirement"
                      disabled={resourcePools.filter((item) => item.active).length === 0}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          resourceRequirements: [
                            ...current.resourceRequirements,
                            { resourcePoolId: "", quantity: "1" },
                          ],
                        }))
                      }
                    >
                      + {locale === "pt-BR" ? "Adicionar recurso" : "Add resource"}
                    </button>
                  </div>

                  {resourcePools.filter((item) => item.active).length === 0 ? (
                    <div className="service-resource-empty">
                      {locale === "pt-BR"
                        ? "Nenhum pool de recursos foi cadastrado. Configure os pools em Agenda > Recursos antes de tornar este requisito obrigatório."
                        : "No resource pool has been registered. Configure pools in Scheduling > Resources before making this requirement mandatory."}
                    </div>
                  ) : form.resourceRequirements.length === 0 ? (
                    <div className="service-resource-empty">
                      {locale === "pt-BR"
                        ? "Nenhum recurso configurado para este serviço."
                        : "No resource configured for this service."}
                    </div>
                  ) : (
                    <div className="service-resource-requirements">
                      {form.resourceRequirements.map((requirement, index) => {
                        const selectedType = resourcePools.find((item) => item.id === requirement.resourcePoolId);
                        return (
                          <div className="service-resource-requirement" key={`${requirement.resourcePoolId}-${index}`}>
                            <div className="form-group">
                              <label>
                                {locale === "pt-BR" ? "Pool de recursos" : "Resource pool"}
                              </label>
                              <select
                                value={requirement.resourcePoolId}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    resourceRequirements: current.resourceRequirements.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, resourcePoolId: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                              >
                                <option value="">
                                  {locale === "pt-BR" ? "Selecione o tipo" : "Select type"}
                                </option>
                                {resourcePools.filter((item) => item.active).map((resourcePool) => (
                                  <option
                                    key={resourcePool.id}
                                    value={resourcePool.id}
                                    disabled={form.resourceRequirements.some(
                                      (item, itemIndex) => itemIndex !== index && item.resourcePoolId === resourcePool.id
                                    )}
                                  >
                                    {resourcePool.name} · {resourcePool.activeResourceCount} {locale === "pt-BR" ? "ativos" : "active"}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group service-resource-quantity">
                              <label>
                                {locale === "pt-BR" ? "Quantidade por agendamento" : "Quantity per appointment"}
                              </label>
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={requirement.quantity}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    resourceRequirements: current.resourceRequirements.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, quantity: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </div>

                            <div className="service-resource-pool">
                              <span>{locale === "pt-BR" ? "Pool atual" : "Current pool"}</span>
                              <strong>
                                {selectedType
                                  ? `${selectedType.activeResourceCount} ${locale === "pt-BR" ? "recursos físicos ativos" : "active physical resources"}`
                                  : "—"}
                              </strong>
                              {selectedType && Number(requirement.quantity) > selectedType.activeResourceCount && (
                                <small className="service-resource-warning">
                                  {locale === "pt-BR"
                                    ? "A quantidade por agendamento é maior que o pool disponível."
                                    : "Quantity per appointment is greater than the available pool."}
                                </small>
                              )}
                            </div>

                            <button
                              type="button"
                              className="service-resource-remove"
                              aria-label={locale === "pt-BR" ? "Remover requisito" : "Remove requirement"}
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  resourceRequirements: current.resourceRequirements.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="service-resource-example">
                    <strong>{locale === "pt-BR" ? "Como funciona" : "How it works"}</strong>
                    <p>
                      {locale === "pt-BR"
                        ? "Ex.: Beach Tennis, Futevôlei e Vôlei podem exigir 1 × Quadra de Areia. Se as 3 quadras físicas estiverem ocupadas, qualquer novo serviço que dependa desse mesmo tipo será bloqueado naquele horário."
                        : "Example: Beach Tennis, Footvolley and Volleyball can require 1 × Sand Court. If all 3 physical courts are busy, any new service depending on that same type is blocked for the time slot."}
                    </p>
                  </div>
                </div>
              )}

              {modalError && (
                <CourtlyAlert
                  type="error"
                  message={
                    modalError
                  }
                />
              )}


              <div className="service-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    isPending
                  }
                  onClick={
                    closeModal
                  }
                >
                  {
                    t.cancel
                  }
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    isPending
                  }
                >
                  {isPending
                    ? t.saving
                    : form.id
                      ? t.save
                      : t.create}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}


      {/* =====================================
                DEACTIVATION CONFIRMATION
               ===================================== */}

      <ConfirmDialog
        open={
          activityToDeactivate !==
          null
        }
        title={
          t.confirmation
            .deactivateTitle
        }
        description={
          t.confirmation
            .deactivateDescription
            .replace(
              "{name}",
              activityToDeactivate
                ?.name ??
              ""
            )
        }
        confirmLabel={
          isPending
            ? t.confirmation
              .deactivating
            : t.confirmation
              .confirmDeactivate
        }
        cancelLabel={
          dictionary
            .common
            .actions
            .cancel
        }
        variant="danger"
        onCancel={
          cancelDeactivation
        }
        onConfirm={
          confirmDeactivation
        }
      />
    </main>
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

function parsePrice(
  value: string
): number | null {
  const normalized =
    value
      .trim()
      .replace(
        ",",
        "."
      );

  if (
    normalized === ""
  ) {
    return null;
  }


  const parsed =
    Number(
      normalized
    );


  return Number.isNaN(
    parsed
  )
    ? NaN
    : parsed;
}


function parseFilterPrice(
  value: string
): number | null {
  const normalized =
    value
      .trim()
      .replace(
        ",",
        "."
      );

  if (
    normalized === ""
  ) {
    return null;
  }


  const parsed =
    Number(
      normalized
    );


  return Number.isNaN(
    parsed
  )
    ? null
    : parsed;
}


function sanitizePriceInput(
  value: string
): string {
  /*
   * Allows only digits and a single
   * decimal separator.
   *
   * Accepted:
   *
   * 100
   * 100,50
   * 100.50
   */

  const sanitized =
    value.replace(
      /[^0-9,.]/g,
      ""
    );


  const firstSeparator =
    sanitized.search(
      /[,.]/
    );


  if (
    firstSeparator === -1
  ) {
    return sanitized;
  }


  const integerPart =
    sanitized.slice(
      0,
      firstSeparator
    );


  const decimalPart =
    sanitized
      .slice(
        firstSeparator + 1
      )
      .replace(
        /[,.]/g,
        ""
      )
      .slice(
        0,
        2
      );


  const separator =
    sanitized[
    firstSeparator
    ];


  return `${integerPart}${separator}${decimalPart}`;
}


function formatCurrency(
  value: number,
  locale: string
): string {
  return new Intl.NumberFormat(
    locale,
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    value
  );
}


function formatDuration(
  minutes: number,
  minutesLabel: string
): string {
  if (
    minutes < 60
  ) {
    return `${minutes} ${minutesLabel}`;
  }


  const hours =
    Math.floor(
      minutes / 60
    );


  const remainingMinutes =
    minutes % 60;


  if (
    remainingMinutes ===
    0
  ) {
    return `${hours}h`;
  }


  return `${hours}h ${remainingMinutes}${minutesLabel}`;
}


function getActionErrorMessage(
  error:
    | string
    | undefined,

  t: {
    feedback: {
      error: {
        saveFailed: string;

        duplicateName: string;

        unexpected: string;
      };
    };
  }
): string {
  const normalized =
    error
      ?.toLowerCase() ??
    "";


  if (
    normalized.includes(
      "já existe"
    ) ||
    normalized.includes(
      "duplicate"
    ) ||
    normalized.includes(
      "uq_activities_organization_name"
    )
  ) {
    return t.feedback
      .error
      .duplicateName;
  }


  return t.feedback
    .error
    .saveFailed;
}