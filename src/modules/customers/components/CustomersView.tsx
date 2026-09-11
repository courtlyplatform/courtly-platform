"use client";

import {
    useMemo,
    useState,
} from "react";

import Link from "next/link";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    ConfirmDialog,
} from "@/shared/ui/confirmDialog";

import {
    CourtlyAlert,
} from "@/shared/ui/CourtlyAlert";

import type {
    CustomerStatusResult,
} from "@/modules/customers/actions";

import type {
    CustomerListItem,
} from "@/modules/customers/types";

import {
    DOCUMENT_TYPE_OPTIONS,
    isDocumentType,
} from "@/modules/customers/documents/documentTypes";

import {
    formatDocument,
} from "@/modules/customers/documents/documentFormatter";


type CustomersViewProps = {
    customers:
        CustomerListItem[];

    toggleCustomerStatusAction: (
        customerId: string,
        active: boolean
    ) =>
        Promise<CustomerStatusResult>;
};


type StatusFilter =
    | ""
    | "active"
    | "inactive";


type CustomerToDeactivate = {
    id: string;

    name: string;
} | null;


type StatusFeedback = {
    type:
        | "success"
        | "error";

    message: string;
} | null;


/* ============================================================
   SEARCH NORMALIZATION
   ============================================================ */

function normalizeSearchText(
    value: string
): string {

    return value
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}


function normalizeDocumentSearch(
    value: string
): string {

    return value.replace(
        /\D/g,
        ""
    );
}


/* ============================================================
   CUSTOMERS VIEW
   ============================================================ */

export function CustomersView({
    customers,
    toggleCustomerStatusAction,
}: CustomersViewProps) {

    const router =
        useRouter();


    const {
        dictionary,
    } =
        useI18n();


    const searchParams =
        useSearchParams();


    /* ========================================================
       URL FEEDBACK
       ======================================================== */

    const successCode =
        searchParams.get(
            "success"
        );


    const successMessages:
        Record<
            string,
            string
        > = {

        customerCreated:
            dictionary
                .customers
                .feedback
                .success
                .customerCreated,

        customerUpdated:
            dictionary
                .customers
                .feedback
                .success
                .customerUpdated,
    };


    const successMessage =
        successCode
            ? successMessages[
                  successCode
              ] ??
              null

            : null;


    /* ========================================================
       LOCAL STATUS FEEDBACK
       ======================================================== */

    const [
        statusFeedback,
        setStatusFeedback,
    ] =
        useState<StatusFeedback>(
            null
        );


    /* ========================================================
       FILTERS
       ======================================================== */

    const [
        nameFilter,
        setNameFilter,
    ] =
        useState(
            ""
        );


    const [
        documentTypeFilter,
        setDocumentTypeFilter,
    ] =
        useState(
            ""
        );


    const [
        documentNumberFilter,
        setDocumentNumberFilter,
    ] =
        useState(
            ""
        );


    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState<StatusFilter>(
            ""
        );


    /* ========================================================
       DEACTIVATION STATE
       ======================================================== */

    const [
        customerToDeactivate,
        setCustomerToDeactivate,
    ] =
        useState<CustomerToDeactivate>(
            null
        );


    const [
        isDeactivating,
        setIsDeactivating,
    ] =
        useState(
            false
        );


    /* ========================================================
       REACTIVATION STATE
       ======================================================== */

    const [
        reactivatingCustomerId,
        setReactivatingCustomerId,
    ] =
        useState<
            string | null
        >(
            null
        );


    /* ========================================================
       FILTERED CUSTOMERS
       ======================================================== */

    const filteredCustomers =
        useMemo(
            () => {

                const normalizedNameFilter =
                    normalizeSearchText(
                        nameFilter
                    );


                const normalizedDocumentFilter =
                    normalizeDocumentSearch(
                        documentNumberFilter
                    );


                return customers.filter(
                    (
                        customer
                    ) => {

                        const normalizedCustomerName =
                            normalizeSearchText(
                                customer.name
                            );


                        const matchesName =
                            !normalizedNameFilter ||
                            normalizedCustomerName.includes(
                                normalizedNameFilter
                            );


                        const matchesDocumentType =
                            !documentTypeFilter ||
                            customer.document_type ===
                                documentTypeFilter;


                        const normalizedCustomerDocument =
                            normalizeDocumentSearch(
                                customer.document_number ??
                                    ""
                            );


                        const matchesDocumentNumber =
                            !normalizedDocumentFilter ||
                            normalizedCustomerDocument.includes(
                                normalizedDocumentFilter
                            );


                        const matchesStatus =
                            !statusFilter ||
                            (
                                statusFilter ===
                                    "active" &&
                                customer.active
                            ) ||
                            (
                                statusFilter ===
                                    "inactive" &&
                                !customer.active
                            );


                        return (
                            matchesName &&
                            matchesDocumentType &&
                            matchesDocumentNumber &&
                            matchesStatus
                        );
                    }
                );
            },
            [
                customers,
                nameFilter,
                documentTypeFilter,
                documentNumberFilter,
                statusFilter,
            ]
        );


    const hasActiveFilters =
        Boolean(
            nameFilter ||
            documentTypeFilter ||
            documentNumberFilter ||
            statusFilter
        );


    /* ========================================================
       HELPERS
       ======================================================== */

    function clearFilters() {

        setNameFilter(
            ""
        );

        setDocumentTypeFilter(
            ""
        );

        setDocumentNumberFilter(
            ""
        );

        setStatusFilter(
            ""
        );
    }


    function getFormattedDocument(
        customer:
            CustomerListItem
    ): string {

        if (
            !customer.document_type ||
            !customer.document_number ||
            !isDocumentType(
                customer.document_type
            )
        ) {

            return dictionary
                .customers
                .notProvided;
        }


        return formatDocument(
            customer.document_type,
            customer.document_number
        );
    }


    function getPlanCountLabel(
        customer:
            CustomerListItem
    ): string {

        const count =
            customer
                .activePlans
                .length;


        if (
            count ===
            0
        ) {

            return dictionary
                .customers
                .plans
                .none;
        }


        const template =
            count === 1
                ? dictionary
                      .customers
                      .plans
                      .activeSingular

                : dictionary
                      .customers
                      .plans
                      .activePlural;


        return template.replace(
            "{count}",
            String(
                count
            )
        );
    }


    function getPlanNames(
        customer:
            CustomerListItem
    ): string {

        const plans =
            customer.activePlans;


        if (
            plans.length ===
            0
        ) {
            return "";
        }


        const visibleNames =
            plans
                .slice(
                    0,
                    2
                )
                .map(
                    (
                        plan
                    ) =>
                        plan.name
                );


        if (
            plans.length <=
            2
        ) {
            return visibleNames.join(
                ", "
            );
        }


        const remaining =
            plans.length -
            2;


        const moreLabel =
            dictionary
                .customers
                .plans
                .more
                .replace(
                    "{count}",
                    String(
                        remaining
                    )
                );


        return `${visibleNames.join(
            ", "
        )} ${moreLabel}`;
    }


    /* ========================================================
       DEACTIVATION
       ======================================================== */

    function requestCustomerDeactivation(
        customer:
            CustomerListItem
    ) {

        setStatusFeedback(
            null
        );


        setCustomerToDeactivate({
            id:
                customer.id,

            name:
                customer.name,
        });
    }


    function cancelCustomerDeactivation() {

        if (
            isDeactivating
        ) {
            return;
        }


        setCustomerToDeactivate(
            null
        );
    }


    async function confirmCustomerDeactivation() {

        if (
            !customerToDeactivate ||
            isDeactivating
        ) {
            return;
        }


        try {

            setIsDeactivating(
                true
            );


            setStatusFeedback(
                null
            );


            const result =
                await toggleCustomerStatusAction(
                    customerToDeactivate.id,
                    false
                );


            if (
                !result.success
            ) {

                setStatusFeedback({
                    type:
                        "error",

                    message:
                        result.error ===
                        "forbidden"

                            ? dictionary
                                  .customers
                                  .feedback
                                  .error
                                  .forbidden

                            : dictionary
                                  .customers
                                  .feedback
                                  .error
                                  .statusUpdateFailed,
                });


                setCustomerToDeactivate(
                    null
                );


                return;
            }


            const successText =
                dictionary
                    .customers
                    .feedback
                    .success
                    .customerDeactivated
                    .replace(
                        "{count}",
                        String(
                            result
                                .endedSubscriptions
                        )
                    );


            setStatusFeedback({
                type:
                    "success",

                message:
                    successText,
            });


            setCustomerToDeactivate(
                null
            );


            /*
             * Important:
             *
             * getCustomers() now also calculates the active
             * commercial plans. Refreshing the route updates:
             *
             * - customer status
             * - active plan counter
             */
            router.refresh();

        } catch (error) {

            console.error(
                "Courtly customer deactivation error:",
                error
            );


            setStatusFeedback({
                type:
                    "error",

                message:
                    dictionary
                        .customers
                        .feedback
                        .error
                        .statusUpdateFailed,
            });


            setCustomerToDeactivate(
                null
            );

        } finally {

            setIsDeactivating(
                false
            );
        }
    }


    /* ========================================================
       REACTIVATION
       ======================================================== */

    async function reactivateCustomer(
        customer:
            CustomerListItem
    ) {

        if (
            reactivatingCustomerId
        ) {
            return;
        }


        try {

            setReactivatingCustomerId(
                customer.id
            );


            setStatusFeedback(
                null
            );


            const result =
                await toggleCustomerStatusAction(
                    customer.id,
                    true
                );


            if (
                !result.success
            ) {

                setStatusFeedback({
                    type:
                        "error",

                    message:
                        result.error ===
                        "forbidden"

                            ? dictionary
                                  .customers
                                  .feedback
                                  .error
                                  .forbidden

                            : dictionary
                                  .customers
                                  .feedback
                                  .error
                                  .statusUpdateFailed,
                });


                return;
            }


            setStatusFeedback({
                type:
                    "success",

                message:
                    dictionary
                        .customers
                        .feedback
                        .success
                        .customerReactivated,
            });


            /*
             * Reactivation intentionally does NOT reactivate
             * previous subscriptions.
             */
            router.refresh();

        } catch (error) {

            console.error(
                "Courtly customer reactivation error:",
                error
            );


            setStatusFeedback({
                type:
                    "error",

                message:
                    dictionary
                        .customers
                        .feedback
                        .error
                        .statusUpdateFailed,
            });

        } finally {

            setReactivatingCustomerId(
                null
            );
        }
    }


    /* ========================================================
       RENDER
       ======================================================== */

    return (
        <main className="customers-page">

            {/* =====================================
                PAGE HEADER
               ===================================== */}

            <div className="page-heading">

                <div>
                    <span className="page-eyebrow">
                        {
                            dictionary
                                .customers
                                .eyebrow
                        }
                    </span>

                    <h1>
                        {
                            dictionary
                                .customers
                                .title
                        }
                    </h1>

                    <p>
                        {
                            dictionary
                                .customers
                                .description
                        }
                    </p>
                </div>


                <Link
                    href="/customers/new"
                    className="primary-button"
                >
                    +{" "}
                    {
                        dictionary
                            .customers
                            .newCustomer
                    }
                </Link>
            </div>


            {/* =====================================
                CREATE / UPDATE FEEDBACK
               ===================================== */}

            {successMessage && (
                <CourtlyAlert
                    type="success"
                    message={
                        successMessage
                    }
                />
            )}


            {/* =====================================
                STATUS FEEDBACK
               ===================================== */}

            {statusFeedback && (
                <CourtlyAlert
                    key={
                        `${statusFeedback.type}-${statusFeedback.message}`
                    }
                    type={
                        statusFeedback.type
                    }
                    message={
                        statusFeedback.message
                    }
                />
            )}


            {/* =====================================
                EMPTY STATE
               ===================================== */}

            {customers.length ===
            0 ? (

                <div className="empty-state">

                    <h2>
                        {
                            dictionary
                                .customers
                                .empty
                                .title
                        }
                    </h2>

                    <p>
                        {
                            dictionary
                                .customers
                                .empty
                                .description
                        }
                    </p>

                    <Link
                        href="/customers/new"
                        className="primary-button"
                    >
                        {
                            dictionary
                                .customers
                                .empty
                                .action
                        }
                    </Link>
                </div>

            ) : (
                <>

                    {/* =================================
                        FILTERS
                       ================================= */}

                    <section className="customer-filters">

                        <div className="customer-filter-field">

                            <label htmlFor="customer-name-filter">
                                {
                                    dictionary
                                        .customers
                                        .filters
                                        .name
                                }
                            </label>

                            <input
                                id="customer-name-filter"
                                type="search"
                                value={
                                    nameFilter
                                }
                                placeholder={
                                    dictionary
                                        .customers
                                        .filters
                                        .namePlaceholder
                                }
                                onChange={(
                                    event
                                ) =>
                                    setNameFilter(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            />
                        </div>


                        <div className="customer-filter-field">

                            <label htmlFor="customer-document-type-filter">
                                {
                                    dictionary
                                        .customers
                                        .filters
                                        .documentType
                                }
                            </label>

                            <select
                                id="customer-document-type-filter"
                                value={
                                    documentTypeFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDocumentTypeFilter(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            >
                                <option value="">
                                    {
                                        dictionary
                                            .customers
                                            .filters
                                            .allDocumentTypes
                                    }
                                </option>

                                {DOCUMENT_TYPE_OPTIONS.map(
                                    (
                                        option
                                    ) => (
                                        <option
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>


                        <div className="customer-filter-field">

                            <label htmlFor="customer-document-number-filter">
                                {
                                    dictionary
                                        .customers
                                        .filters
                                        .documentNumber
                                }
                            </label>

                            <input
                                id="customer-document-number-filter"
                                type="search"
                                inputMode="numeric"
                                value={
                                    documentNumberFilter
                                }
                                placeholder={
                                    dictionary
                                        .customers
                                        .filters
                                        .documentNumberPlaceholder
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDocumentNumberFilter(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            />
                        </div>


                        <div className="customer-filter-field">

                            <label htmlFor="customer-status-filter">
                                {
                                    dictionary
                                        .customers
                                        .filters
                                        .status
                                }
                            </label>

                            <select
                                id="customer-status-filter"
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
                                        dictionary
                                            .customers
                                            .filters
                                            .allStatuses
                                    }
                                </option>

                                <option value="active">
                                    {
                                        dictionary
                                            .customers
                                            .filters
                                            .active
                                    }
                                </option>

                                <option value="inactive">
                                    {
                                        dictionary
                                            .customers
                                            .filters
                                            .inactive
                                    }
                                </option>
                            </select>
                        </div>


                        <button
                            type="button"
                            className="customer-filters-clear"
                            onClick={
                                clearFilters
                            }
                            disabled={
                                !hasActiveFilters
                            }
                        >
                            {
                                dictionary
                                    .customers
                                    .filters
                                    .clear
                            }
                        </button>
                    </section>


                    {/* =================================
                        NO FILTER RESULTS
                       ================================= */}

                    {filteredCustomers.length ===
                    0 ? (

                        <div className="customers-filter-empty">
                            {
                                dictionary
                                    .customers
                                    .filters
                                    .noResults
                            }
                        </div>

                    ) : (
                        <>

                            {/* =========================
                                DESKTOP / TABLET
                               ========================= */}

                            <section className="customers-table-card">

                                <div className="table-scroll">

                                    <table className="customers-table">

                                        <thead>
                                            <tr>

                                                <th>
                                                    {
                                                        dictionary
                                                            .customers
                                                            .table
                                                            .name
                                                    }
                                                </th>

                                                <th>
                                                    {
                                                        dictionary
                                                            .customers
                                                            .table
                                                            .documentType
                                                    }
                                                </th>

                                                <th>
                                                    {
                                                        dictionary
                                                            .customers
                                                            .table
                                                            .documentNumber
                                                    }
                                                </th>

                                                <th>
                                                    {
                                                        dictionary
                                                            .customers
                                                            .table
                                                            .email
                                                    }
                                                </th>

                                                <th>
                                                    {
                                                        dictionary
                                                            .customers
                                                            .table
                                                            .phone
                                                    }
                                                </th>

                                                <th>
                                                    {
                                                        dictionary
                                                            .customers
                                                            .table
                                                            .plans
                                                    }
                                                </th>

                                                <th>
                                                    {
                                                        dictionary
                                                            .customers
                                                            .table
                                                            .status
                                                    }
                                                </th>

                                                <th className="actions-column">
                                                    {
                                                        dictionary
                                                            .customers
                                                            .table
                                                            .actions
                                                    }
                                                </th>
                                            </tr>
                                        </thead>


                                        <tbody>

                                            {filteredCustomers.map(
                                                (
                                                    customer
                                                ) => (

                                                    <tr
                                                        key={
                                                            customer.id
                                                        }
                                                    >

                                                        <td>
                                                            <strong>
                                                                {
                                                                    customer.name
                                                                }
                                                            </strong>
                                                        </td>


                                                        <td>
                                                            {
                                                                customer.document_type ??
                                                                dictionary
                                                                    .customers
                                                                    .notProvided
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                getFormattedDocument(
                                                                    customer
                                                                )
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                customer.email ??
                                                                dictionary
                                                                    .customers
                                                                    .notProvided
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                customer.phone ??
                                                                dictionary
                                                                    .customers
                                                                    .notProvided
                                                            }
                                                        </td>


                                                        {/* =====================
                                                            PLANS / SERVICES
                                                           ===================== */}

                                                        <td className="customer-plans-cell">

                                                            <Link
                                                                href={`/customers/${customer.id}/edit?tab=services`}
                                                                className="customer-plans-link"
                                                            >

                                                                <strong>
                                                                    {
                                                                        getPlanCountLabel(
                                                                            customer
                                                                        )
                                                                    }
                                                                </strong>


                                                                {customer
                                                                    .activePlans
                                                                    .length >
                                                                    0 && (

                                                                    <span>
                                                                        {
                                                                            getPlanNames(
                                                                                customer
                                                                            )
                                                                        }
                                                                    </span>
                                                                )}


                                                                <small>
                                                                    {
                                                                        dictionary
                                                                            .customers
                                                                            .plans
                                                                            .view
                                                                    }{" "}
                                                                    →
                                                                </small>

                                                            </Link>
                                                        </td>


                                                        <td>

                                                            <span
                                                                className={
                                                                    customer.active
                                                                        ? "status-badge status-badge--active"
                                                                        : "status-badge status-badge--inactive"
                                                                }
                                                            >
                                                                {
                                                                    customer.active
                                                                        ? dictionary
                                                                              .customers
                                                                              .status
                                                                              .active

                                                                        : dictionary
                                                                              .customers
                                                                              .status
                                                                              .inactive
                                                                }
                                                            </span>
                                                        </td>


                                                        <td>

                                                            <div className="table-actions">

                                                                <Link
                                                                    href={`/customers/${customer.id}/edit`}
                                                                    className="action-link"
                                                                >
                                                                    {
                                                                        dictionary
                                                                            .customers
                                                                            .actions
                                                                            .edit
                                                                    }
                                                                </Link>


                                                                {customer.active ? (

                                                                    <button
                                                                        type="button"
                                                                        className="action-button"
                                                                        disabled={
                                                                            isDeactivating
                                                                        }
                                                                        onClick={() =>
                                                                            requestCustomerDeactivation(
                                                                                customer
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            dictionary
                                                                                .customers
                                                                                .actions
                                                                                .deactivate
                                                                        }
                                                                    </button>

                                                                ) : (

                                                                    <button
                                                                        type="button"
                                                                        className="action-button"
                                                                        disabled={
                                                                            reactivatingCustomerId ===
                                                                            customer.id
                                                                        }
                                                                        onClick={() => {
                                                                            void reactivateCustomer(
                                                                                customer
                                                                            );
                                                                        }}
                                                                    >
                                                                        {
                                                                            dictionary
                                                                                .customers
                                                                                .actions
                                                                                .reactivate
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

                            <section className="customers-mobile-list">

                                {filteredCustomers.map(
                                    (
                                        customer
                                    ) => (

                                        <article
                                            key={
                                                customer.id
                                            }
                                            className="customer-mobile-card"
                                        >

                                            <div className="customer-mobile-header">

                                                <div>
                                                    <span className="customer-label">
                                                        {
                                                            dictionary
                                                                .customers
                                                                .customer
                                                        }
                                                    </span>

                                                    <h2>
                                                        {
                                                            customer.name
                                                        }
                                                    </h2>
                                                </div>


                                                <span
                                                    className={
                                                        customer.active
                                                            ? "status-badge status-badge--active"
                                                            : "status-badge status-badge--inactive"
                                                    }
                                                >
                                                    {
                                                        customer.active
                                                            ? dictionary
                                                                  .customers
                                                                  .status
                                                                  .active

                                                            : dictionary
                                                                  .customers
                                                                  .status
                                                                  .inactive
                                                    }
                                                </span>
                                            </div>


                                            <dl className="customer-details">

                                                <div>
                                                    <dt>
                                                        {
                                                            dictionary
                                                                .customers
                                                                .table
                                                                .documentType
                                                        }
                                                    </dt>

                                                    <dd>
                                                        {
                                                            customer.document_type ??
                                                            dictionary
                                                                .customers
                                                                .notProvided
                                                        }
                                                    </dd>
                                                </div>


                                                <div>
                                                    <dt>
                                                        {
                                                            dictionary
                                                                .customers
                                                                .table
                                                                .documentNumber
                                                        }
                                                    </dt>

                                                    <dd>
                                                        {
                                                            getFormattedDocument(
                                                                customer
                                                            )
                                                        }
                                                    </dd>
                                                </div>


                                                <div>
                                                    <dt>
                                                        {
                                                            dictionary
                                                                .customers
                                                                .table
                                                                .email
                                                        }
                                                    </dt>

                                                    <dd>
                                                        {
                                                            customer.email ??
                                                            dictionary
                                                                .customers
                                                                .notProvided
                                                        }
                                                    </dd>
                                                </div>


                                                <div>
                                                    <dt>
                                                        {
                                                            dictionary
                                                                .customers
                                                                .table
                                                                .phone
                                                        }
                                                    </dt>

                                                    <dd>
                                                        {
                                                            customer.phone ??
                                                            dictionary
                                                                .customers
                                                                .notProvided
                                                        }
                                                    </dd>
                                                </div>


                                                {/* =================
                                                    MOBILE PLANS
                                                   ================= */}

                                                <div className="customer-mobile-plans">
                                                    <dt>
                                                        {
                                                            dictionary
                                                                .customers
                                                                .table
                                                                .plans
                                                        }
                                                    </dt>

                                                    <dd>

                                                        <Link
                                                            href={`/customers/${customer.id}/edit?tab=services`}
                                                            className="customer-mobile-plans-link"
                                                        >

                                                            <strong>
                                                                {
                                                                    getPlanCountLabel(
                                                                        customer
                                                                    )
                                                                }
                                                            </strong>


                                                            {customer
                                                                .activePlans
                                                                .length >
                                                                0 && (

                                                                <span>
                                                                    {
                                                                        getPlanNames(
                                                                            customer
                                                                        )
                                                                    }
                                                                </span>
                                                            )}


                                                            <small>
                                                                {
                                                                    dictionary
                                                                        .customers
                                                                        .plans
                                                                        .view
                                                                }{" "}
                                                                →
                                                            </small>

                                                        </Link>
                                                    </dd>
                                                </div>

                                            </dl>


                                            <div className="customer-mobile-actions">

                                                <Link
                                                    href={`/customers/${customer.id}/edit`}
                                                    className="secondary-button"
                                                >
                                                    {
                                                        dictionary
                                                            .customers
                                                            .actions
                                                            .edit
                                                    }
                                                </Link>


                                                {customer.active ? (

                                                    <button
                                                        type="button"
                                                        className="secondary-button"
                                                        disabled={
                                                            isDeactivating
                                                        }
                                                        onClick={() =>
                                                            requestCustomerDeactivation(
                                                                customer
                                                            )
                                                        }
                                                    >
                                                        {
                                                            dictionary
                                                                .customers
                                                                .actions
                                                                .deactivate
                                                        }
                                                    </button>

                                                ) : (

                                                    <button
                                                        type="button"
                                                        className="secondary-button"
                                                        disabled={
                                                            reactivatingCustomerId ===
                                                            customer.id
                                                        }
                                                        onClick={() => {
                                                            void reactivateCustomer(
                                                                customer
                                                            );
                                                        }}
                                                    >
                                                        {
                                                            dictionary
                                                                .customers
                                                                .actions
                                                                .reactivate
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
                DEACTIVATION CONFIRMATION
               ===================================== */}

            <ConfirmDialog
                open={
                    customerToDeactivate !==
                    null
                }
                title={
                    dictionary
                        .customers
                        .confirmation
                        .deactivateTitle
                }
                description={
                    dictionary
                        .customers
                        .confirmation
                        .deactivateDescription
                        .replace(
                            "{name}",
                            customerToDeactivate
                                ?.name ??
                                ""
                        )
                }
                confirmLabel={
                    isDeactivating
                        ? dictionary
                              .customers
                              .confirmation
                              .deactivating

                        : dictionary
                              .customers
                              .confirmation
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
                    cancelCustomerDeactivation
                }
                onConfirm={() => {
                    void confirmCustomerDeactivation();
                }}
            />
        </main>
    );
}