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
} from "@/modules/activities/domain/activity";

import type {
    CurrencyCode,
    CustomerSubscription,
    CustomerSubscriptionStatus,
    SubscriptionBillingCycle,
} from "../domain/customer-subscription";

import {
    changeCustomerSubscriptionStatusAction,
    saveCustomerSubscriptionAction,
} from "../application/customer-subscription-actions";


type Props = {
    customerId: string;

    customerName: string;

    customerActive:
        boolean;

    initialSubscriptions:
        CustomerSubscription[];

    activities:
        Activity[];

    defaultCurrency:
        CurrencyCode;
};


type SubscriptionFormState = {
    id?: string;

    activityId: string;

    amount: string;

    currencyCode:
        CurrencyCode;

    billingCycle:
        SubscriptionBillingCycle;

    startsAt: string;
};


type Feedback = {
    type:
        | "success"
        | "error";

    message: string;
} | null;


type SubscriptionToEnd = {
    id: string;

    activityName: string;
} | null;


export function CustomerSubscriptionsClient({
    customerId,
    customerName,
    customerActive,
    initialSubscriptions,
    activities,
    defaultCurrency,
}: Props) {

    const router =
        useRouter();


    const {
        dictionary,
        locale,
    } =
        useI18n();


    const t =
        dictionary.customerSubscriptions;


    const [
        subscriptions,
        setSubscriptions,
    ] =
        useState<
            CustomerSubscription[]
        >(
            initialSubscriptions
        );


    const [
        modalOpen,
        setModalOpen,
    ] =
        useState(
            false
        );


    const [
        form,
        setForm,
    ] =
        useState<SubscriptionFormState>(
            createEmptyForm(
                defaultCurrency
            )
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


    const [
        feedback,
        setFeedback,
    ] =
        useState<Feedback>(
            null
        );


    const [
        subscriptionToEnd,
        setSubscriptionToEnd,
    ] =
        useState<SubscriptionToEnd>(
            null
        );


    const [
        isPending,
        startTransition,
    ] =
        useTransition();


    useEffect(
        () => {

            setSubscriptions(
                initialSubscriptions
            );

        },
        [
            initialSubscriptions,
        ]
    );


    const activityMap =
        useMemo(
            () => {

                return new Map(
                    activities.map(
                        (
                            activity
                        ) => [
                            activity.id,
                            activity,
                        ]
                    )
                );
            },
            [
                activities,
            ]
        );


    const availableActivities =
        useMemo(
            () => {

                const openActivityIds =
                    new Set(
                        subscriptions
                            .filter(
                                (
                                    subscription
                                ) =>
                                    subscription.status !==
                                    "ENDED"
                            )
                            .map(
                                (
                                    subscription
                                ) =>
                                    subscription.activityId
                            )
                    );


                return activities.filter(
                    (
                        activity
                    ) =>
                        activity.active &&
                        !openActivityIds.has(
                            activity.id
                        )
                );
            },
            [
                activities,
                subscriptions,
            ]
        );


    function openNewSubscription() {

        setFeedback(
            null
        );


        setModalError(
            null
        );


        setForm(
            createEmptyForm(
                defaultCurrency
            )
        );


        setModalOpen(
            true
        );
    }


    function openEditSubscription(
        subscription:
            CustomerSubscription
    ) {

        if (
            subscription.status ===
            "ENDED"
        ) {

            return;
        }


        setFeedback(
            null
        );


        setModalError(
            null
        );


        setForm({
            id:
                subscription.id,

            activityId:
                subscription.activityId,

            amount:
                formatEditableAmount(
                    subscription.amount,
                    locale
                ),

            currencyCode:
                subscription.currencyCode,

            billingCycle:
                subscription.billingCycle,

            startsAt:
                subscription.startsAt,
        });


        setModalOpen(
            true
        );
    }


    function closeModal() {

        if (
            isPending
        ) {

            return;
        }


        setModalOpen(
            false
        );


        setModalError(
            null
        );
    }


    function handleActivityChange(
        activityId: string
    ) {

        const activity =
            activityMap.get(
                activityId
            );


        setForm(
            (
                current
            ) => ({
                ...current,

                activityId,

                amount:
                    activity
                        ?.defaultPrice !==
                    null &&
                    activity
                        ?.defaultPrice !==
                    undefined
                        ? formatEditableAmount(
                              activity.defaultPrice,
                              locale
                          )
                        : "",
            })
        );
    }


    function handleSubmit(
        event:
            FormEvent
    ) {

        event.preventDefault();


        setModalError(
            null
        );


        const amount =
            parseAmount(
                form.amount
            );


        if (
            !form.activityId
        ) {

            setModalError(
                t.feedback.error
                    .activityRequired
            );


            return;
        }


        if (
            amount === null ||
            amount < 0
        ) {

            setModalError(
                t.feedback.error
                    .invalidAmount
            );


            return;
        }


        if (
            !form.startsAt
        ) {

            setModalError(
                t.feedback.error
                    .startDateRequired
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
                    await saveCustomerSubscriptionAction({
                        id:
                            form.id,

                        customerId,

                        activityId:
                            form.activityId,

                        amount,

                        currencyCode:
                            form.currencyCode,

                        billingCycle:
                            form.billingCycle,

                        startsAt:
                            form.startsAt,
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


                const successMessage =
                    editing
                        ? t.feedback
                            .success
                            .updated

                        : result.customerReactivated
                            ? t.feedback
                                .success
                                .createdAndReactivated

                            : t.feedback
                                .success
                                .created;


                setFeedback({
                    type:
                        "success",

                    message:
                        successMessage,
                });


                router.refresh();
            }
        );
    }


    function changeStatus(
        subscription:
            CustomerSubscription,

        status:
            CustomerSubscriptionStatus
    ) {

        if (
            isPending
        ) {

            return;
        }


        setFeedback(
            null
        );


        startTransition(
            async () => {

                const result =
                    await changeCustomerSubscriptionStatusAction(
                        customerId,
                        subscription.id,
                        status
                    );


                if (
                    !result.success
                ) {

                    setFeedback({
                        type:
                            "error",

                        message:
                            getActionErrorMessage(
                                result.error,
                                t
                            ),
                    });


                    return;
                }


                const successMessage =
                    status ===
                    "PAUSED"
                        ? t.feedback
                              .success
                              .paused

                        : status ===
                          "ACTIVE"
                            ? t.feedback
                                  .success
                                  .resumed

                            : t.feedback
                                  .success
                                  .ended;


                setFeedback({
                    type:
                        "success",

                    message:
                        successMessage,
                });


                setSubscriptionToEnd(
                    null
                );


                router.refresh();
            }
        );
    }


    return (
        <section className="customer-subscriptions">

            <div className="customer-subscriptions-heading">

                <div>

                    <h2>
                        {t.title}
                    </h2>


                    <p>
                        {
                            t.description.replace(
                                "{name}",
                                customerName
                            )
                        }
                    </p>

                </div>


                <button
                    type="button"
                    className="primary-button"
                    onClick={
                        openNewSubscription
                    }
                    disabled={
                        availableActivities.length ===
                        0
                    }
                >
                    + {t.addService}
                </button>

            </div>


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


            {subscriptions.length ===
            0 ? (

                <div className="customer-subscriptions-empty">

                    <h3>
                        {t.empty.title}
                    </h3>


                    <p>
                        {t.empty.description}
                    </p>


                    {availableActivities.length >
                        0 && (

                        <button
                            type="button"
                            className="primary-button"
                            onClick={
                                openNewSubscription
                            }
                        >
                            + {t.empty.action}
                        </button>

                    )}

                </div>

            ) : (

                <div className="customer-subscriptions-list">

                    {subscriptions.map(
                        (
                            subscription
                        ) => {

                            const activity =
                                activityMap.get(
                                    subscription.activityId
                                );


                            return (

                                <article
                                    key={
                                        subscription.id
                                    }
                                    className="customer-subscription-card"
                                >

                                    <div className="customer-subscription-card-header">

                                        <div>

                                            <span className="customer-subscription-service-label">
                                                {
                                                    t.service
                                                }
                                            </span>


                                            <h3>
                                                {
                                                    activity?.name ??
                                                    t.unknownService
                                                }
                                            </h3>

                                        </div>


                                        <span
                                            className={
                                                getStatusClassName(
                                                    subscription.status
                                                )
                                            }
                                        >
                                            {
                                                getStatusLabel(
                                                    subscription.status,
                                                    t
                                                )
                                            }
                                        </span>

                                    </div>


                                    <dl className="customer-subscription-details">

                                        <div>

                                            <dt>
                                                {
                                                    t.amount
                                                }
                                            </dt>


                                            <dd>
                                                {
                                                    formatCurrency(
                                                        subscription.amount,
                                                        subscription.currencyCode,
                                                        locale
                                                    )
                                                }
                                            </dd>

                                        </div>


                                        <div>

                                            <dt>
                                                {
                                                    t.billingCycle
                                                }
                                            </dt>


                                            <dd>
                                                {
                                                    getBillingCycleLabel(
                                                        subscription.billingCycle,
                                                        t
                                                    )
                                                }
                                            </dd>

                                        </div>


                                        <div>

                                            <dt>
                                                {
                                                    t.startsAt
                                                }
                                            </dt>


                                            <dd>
                                                {
                                                    formatDate(
                                                        subscription.startsAt,
                                                        locale
                                                    )
                                                }
                                            </dd>

                                        </div>


                                        <div>

                                            <dt>
                                                {
                                                    t.endsAt
                                                }
                                            </dt>


                                            <dd>
                                                {
                                                    subscription.endsAt
                                                        ? formatDate(
                                                              subscription.endsAt,
                                                              locale
                                                          )
                                                        : "—"
                                                }
                                            </dd>

                                        </div>

                                    </dl>


                                    {subscription.status !==
                                        "ENDED" && (

                                        <div className="customer-subscription-actions">

                                            <button
                                                type="button"
                                                className="action-link"
                                                disabled={
                                                    isPending
                                                }
                                                onClick={() =>
                                                    openEditSubscription(
                                                        subscription
                                                    )
                                                }
                                            >
                                                {
                                                    t.edit
                                                }
                                            </button>


                                            {subscription.status ===
                                            "ACTIVE" ? (

                                                <button
                                                    type="button"
                                                    className="action-button"
                                                    disabled={
                                                        isPending
                                                    }
                                                    onClick={() =>
                                                        changeStatus(
                                                            subscription,
                                                            "PAUSED"
                                                        )
                                                    }
                                                >
                                                    {
                                                        t.pause
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
                                                        changeStatus(
                                                            subscription,
                                                            "ACTIVE"
                                                        )
                                                    }
                                                >
                                                    {
                                                        t.resume
                                                    }
                                                </button>

                                            )}


                                            <button
                                                type="button"
                                                className="action-button action-button--danger"
                                                disabled={
                                                    isPending
                                                }
                                                onClick={() =>
                                                    setSubscriptionToEnd({
                                                        id:
                                                            subscription.id,

                                                        activityName:
                                                            activity?.name ??
                                                            t.unknownService,
                                                    })
                                                }
                                            >
                                                {
                                                    t.end
                                                }
                                            </button>

                                        </div>

                                    )}

                                </article>

                            );
                        }
                    )}

                </div>

            )}


            {modalOpen && (

                <div
                    className="customer-subscription-modal-backdrop"
                    role="presentation"
                >

                    <div
                        className="customer-subscription-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="customer-subscription-modal-title"
                    >

                        <div className="customer-subscription-modal-heading">

                            <div>

                                <span className="page-eyebrow">
                                    {
                                        t.modal
                                            .eyebrow
                                    }
                                </span>


                                <h2 id="customer-subscription-modal-title">
                                    {
                                        form.id
                                            ? t.modal
                                                  .editTitle

                                            : t.modal
                                                  .createTitle
                                    }
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="customer-subscription-modal-close"
                                onClick={
                                    closeModal
                                }
                                aria-label={
                                    t.modal.close
                                }
                            >
                                ×
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="customer-subscription-form"
                        >

                            {/* =================================================
                                INACTIVE CUSTOMER — AUTO REACTIVATION NOTICE

                                This notice is shown only when:

                                - a NEW subscription is being created;
                                - the customer is currently inactive.

                                Editing an existing subscription does not show
                                this message.
                               ================================================= */}

                            {!form.id &&
                                !customerActive && (

                                <div className="customer-reactivation-notice">

                                    <strong>
                                        {
                                            t.reactivationNotice
                                                .title
                                        }
                                    </strong>


                                    <p>
                                        {
                                            t.reactivationNotice
                                                .description
                                                .replace(
                                                    "{name}",
                                                    customerName
                                                )
                                        }
                                    </p>

                                </div>

                            )}


                            <div className="form-group">

                                <label htmlFor="subscription-activity">
                                    {
                                        t.service
                                    }
                                </label>


                                <select
                                    id="subscription-activity"
                                    value={
                                        form.activityId
                                    }
                                    disabled={
                                        Boolean(
                                            form.id
                                        )
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleActivityChange(
                                            event.target.value
                                        )
                                    }
                                >

                                    {!form.id && (

                                        <option value="">
                                            {
                                                t.selectService
                                            }
                                        </option>

                                    )}


                                    {form.id &&
                                        activityMap.has(
                                            form.activityId
                                        ) && (

                                        <option
                                            value={
                                                form.activityId
                                            }
                                        >
                                            {
                                                activityMap.get(
                                                    form.activityId
                                                )?.name
                                            }
                                        </option>

                                    )}


                                    {!form.id &&
                                        availableActivities.map(
                                            (
                                                activity
                                            ) => (

                                                <option
                                                    key={
                                                        activity.id
                                                    }
                                                    value={
                                                        activity.id
                                                    }
                                                >
                                                    {
                                                        activity.name
                                                    }
                                                </option>

                                            )
                                        )}

                                </select>

                            </div>


                            <div className="customer-subscription-form-row">

                                <div className="form-group">

                                    <label htmlFor="subscription-amount">
                                        {
                                            t.amount
                                        }
                                    </label>


                                    <input
                                        id="subscription-amount"
                                        type="text"
                                        inputMode="decimal"
                                        value={
                                            form.amount
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

                                                    amount:
                                                        sanitizeAmountInput(
                                                            event.target.value
                                                        ),
                                                })
                                            )
                                        }
                                    />

                                </div>


                                <div className="form-group">

                                    <label htmlFor="subscription-currency">
                                        {
                                            t.currency
                                        }
                                    </label>


                                    <select
                                        id="subscription-currency"
                                        value={
                                            form.currencyCode
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    currencyCode:
                                                        event.target.value as
                                                            CurrencyCode,
                                                })
                                            )
                                        }
                                    >

                                        <option value="BRL">
                                            BRL
                                        </option>


                                        <option value="USD">
                                            USD
                                        </option>


                                        <option value="EUR">
                                            EUR
                                        </option>


                                        <option value="CAD">
                                            CAD
                                        </option>

                                    </select>

                                </div>

                            </div>


                            <div className="customer-subscription-form-row">

                                <div className="form-group">

                                    <label htmlFor="subscription-cycle">
                                        {
                                            t.billingCycle
                                        }
                                    </label>


                                    <select
                                        id="subscription-cycle"
                                        value={
                                            form.billingCycle
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    billingCycle:
                                                        event.target.value as
                                                            SubscriptionBillingCycle,
                                                })
                                            )
                                        }
                                    >

                                        <option value="WEEKLY">
                                            {
                                                t.cycles
                                                    .weekly
                                            }
                                        </option>


                                        <option value="MONTHLY">
                                            {
                                                t.cycles
                                                    .monthly
                                            }
                                        </option>


                                        <option value="QUARTERLY">
                                            {
                                                t.cycles
                                                    .quarterly
                                            }
                                        </option>


                                        <option value="SEMIANNUAL">
                                            {
                                                t.cycles
                                                    .semiannual
                                            }
                                        </option>


                                        <option value="ANNUAL">
                                            {
                                                t.cycles
                                                    .annual
                                            }
                                        </option>


                                        <option value="ONE_TIME">
                                            {
                                                t.cycles
                                                    .oneTime
                                            }
                                        </option>

                                    </select>

                                </div>


                                <div className="form-group">

                                    <label htmlFor="subscription-start">
                                        {
                                            t.startsAt
                                        }
                                    </label>


                                    <input
                                        id="subscription-start"
                                        type="date"
                                        value={
                                            form.startsAt
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    startsAt:
                                                        event.target.value,
                                                })
                                            )
                                        }
                                    />

                                </div>

                            </div>


                            {modalError && (

                                <CourtlyAlert
                                    type="error"
                                    message={
                                        modalError
                                    }
                                />

                            )}


                            <div className="customer-subscription-form-actions">

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
                                    {
                                        isPending
                                            ? t.saving

                                            : form.id
                                                ? t.save

                                                : t.add
                                    }
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            <ConfirmDialog
                open={
                    subscriptionToEnd !==
                    null
                }
                title={
                    t.confirmation
                        .endTitle
                }
                description={
                    t.confirmation
                        .endDescription
                        .replace(
                            "{service}",
                            subscriptionToEnd
                                ?.activityName ??
                                ""
                        )
                }
                confirmLabel={
                    isPending
                        ? t.confirmation
                              .ending

                        : t.confirmation
                              .confirmEnd
                }
                cancelLabel={
                    t.cancel
                }
                variant="danger"
                onCancel={() => {

                    if (
                        !isPending
                    ) {

                        setSubscriptionToEnd(
                            null
                        );
                    }
                }}
                onConfirm={() => {

                    if (
                        !subscriptionToEnd
                    ) {

                        return;
                    }


                    const subscription =
                        subscriptions.find(
                            (
                                item
                            ) =>
                                item.id ===
                                subscriptionToEnd.id
                        );


                    if (
                        !subscription
                    ) {

                        return;
                    }


                    changeStatus(
                        subscription,
                        "ENDED"
                    );
                }}
            />

        </section>
    );
}


/* ============================================================
   EMPTY FORM
   ============================================================ */

function createEmptyForm(
    defaultCurrency:
        CurrencyCode
): SubscriptionFormState {

    return {
        activityId:
            "",

        amount:
            "",

        currencyCode:
            defaultCurrency,

        billingCycle:
            "MONTHLY",

        startsAt:
            getLocalDate(),
    };
}


/* ============================================================
   LOCAL DATE
   ============================================================ */

function getLocalDate(): string {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() +
            1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}


/* ============================================================
   AMOUNT INPUT
   ============================================================ */

function sanitizeAmountInput(
    value: string
): string {

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
        firstSeparator ===
        -1
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
                firstSeparator +
                1
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


function parseAmount(
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
        !normalized
    ) {

        return null;
    }


    const number =
        Number(
            normalized
        );


    return Number.isFinite(
        number
    )
        ? number
        : null;
}


/* ============================================================
   FORMATTING
   ============================================================ */

function formatEditableAmount(
    amount: number,

    locale: string
): string {

    return new Intl.NumberFormat(
        locale,
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2,

            useGrouping:
                false,
        }
    ).format(
        amount
    );
}


function formatCurrency(
    amount: number,

    currency:
        CurrencyCode,

    locale: string
): string {

    return new Intl.NumberFormat(
        locale,
        {
            style:
                "currency",

            currency,
        }
    ).format(
        amount
    );
}


function formatDate(
    value: string,

    locale: string
): string {

    return new Intl.DateTimeFormat(
        locale,
        {
            timeZone:
                "UTC",
        }
    ).format(
        new Date(
            `${value}T00:00:00Z`
        )
    );
}


/* ============================================================
   STATUS
   ============================================================ */

function getStatusClassName(
    status:
        CustomerSubscriptionStatus
): string {

    if (
        status ===
        "ACTIVE"
    ) {

        return "status-badge status-badge--active";
    }


    if (
        status ===
        "PAUSED"
    ) {

        return "status-badge status-badge--paused";
    }


    return "status-badge status-badge--ended";
}


function getStatusLabel(
    status:
        CustomerSubscriptionStatus,

    t: any
): string {

    if (
        status ===
        "ACTIVE"
    ) {

        return t.status.active;
    }


    if (
        status ===
        "PAUSED"
    ) {

        return t.status.paused;
    }


    return t.status.ended;
}


/* ============================================================
   BILLING CYCLE
   ============================================================ */

function getBillingCycleLabel(
    cycle:
        SubscriptionBillingCycle,

    t: any
): string {

    const labels = {
        WEEKLY:
            t.cycles.weekly,

        MONTHLY:
            t.cycles.monthly,

        QUARTERLY:
            t.cycles.quarterly,

        SEMIANNUAL:
            t.cycles.semiannual,

        ANNUAL:
            t.cycles.annual,

        ONE_TIME:
            t.cycles.oneTime,
    };


    return labels[
        cycle
    ];
}


/* ============================================================
   ACTION ERROR MESSAGE
   ============================================================ */

function getActionErrorMessage(
    error: string,

    t: any
): string {

    const messages:
        Record<
            string,
            string
        > = {

        forbidden:
            t.feedback.error.forbidden,

        customerNotFound:
            t.feedback.error.customerNotFound,

        activityNotFound:
            t.feedback.error.activityNotFound,

        inactiveActivity:
            t.feedback.error.inactiveActivity,

        duplicateOpenSubscription:
            t.feedback.error.duplicateOpenSubscription,

        endedImmutable:
            t.feedback.error.endedImmutable,

        invalidData:
            t.feedback.error.invalidData,

        saveFailed:
            t.feedback.error.saveFailed,

        statusUpdateFailed:
            t.feedback.error.statusUpdateFailed,
    };


    return (
        messages[
            error
        ] ??
        t.feedback.error.unexpected
    );
}