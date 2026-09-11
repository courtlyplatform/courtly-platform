"use client";

import {
    useMemo,
    useState,
} from "react";

import Link from "next/link";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    ConfirmDialog,
} from "@/shared/ui/confirmDialog";

import {
    DOCUMENT_TYPE_OPTIONS,
    isDocumentType,
} from "@/modules/customers/documents/documentTypes";

import {
    formatDocument,
} from "@/modules/customers/documents/documentFormatter";

type Customer = {
    id: string;
    name: string;
    document_type: string | null;
    document_number: string | null;
    email: string | null;
    phone: string | null;
    active: boolean;
};

type CustomersViewProps = {
    customers: Customer[];

    toggleCustomerStatusAction: (
        customerId: string,
        active: boolean
    ) => Promise<void>;
};

type StatusFilter =
    | ""
    | "active"
    | "inactive";

type CustomerToDeactivate = {
    id: string;
    name: string;
} | null;

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

function normalizeDocumentSearch(
    value: string
): string {
    return value.replace(/\D/g, "");
}

export function CustomersView({
    customers,
    toggleCustomerStatusAction,
}: CustomersViewProps) {
    const {
        dictionary,
    } = useI18n();

    const [
        nameFilter,
        setNameFilter,
    ] = useState("");

    const [
        documentTypeFilter,
        setDocumentTypeFilter,
    ] = useState("");

    const [
        documentNumberFilter,
        setDocumentNumberFilter,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState<StatusFilter>("");

    /*
     * Stores the student selected for deactivation.
     *
     * When null, the confirmation dialog is closed.
     */
    const [
        customerToDeactivate,
        setCustomerToDeactivate,
    ] =
        useState<CustomerToDeactivate>(
            null
        );

    /*
     * Prevents multiple deactivation requests
     * while the current request is being processed.
     */
    const [
        isDeactivating,
        setIsDeactivating,
    ] = useState(false);

    const filteredCustomers =
        useMemo(() => {
            const normalizedNameFilter =
                normalizeSearchText(
                    nameFilter
                );

            const normalizedDocumentFilter =
                normalizeDocumentSearch(
                    documentNumberFilter
                );

            return customers.filter(
                (customer) => {
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
        }, [
            customers,
            nameFilter,
            documentTypeFilter,
            documentNumberFilter,
            statusFilter,
        ]);

    const hasActiveFilters =
        Boolean(
            nameFilter ||
            documentTypeFilter ||
            documentNumberFilter ||
            statusFilter
        );

    function clearFilters() {
        setNameFilter("");
        setDocumentTypeFilter("");
        setDocumentNumberFilter("");
        setStatusFilter("");
    }

    function getFormattedDocument(
        customer: Customer
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

    /*
     * Opens the confirmation dialog.
     *
     * No database operation happens here.
     */
    function requestCustomerDeactivation(
        customer: Customer
    ) {
        setCustomerToDeactivate({
            id: customer.id,
            name: customer.name,
        });
    }

    /*
     * Closes the confirmation dialog without
     * changing the student's status.
     */
    function cancelCustomerDeactivation() {
        if (isDeactivating) {
            return;
        }

        setCustomerToDeactivate(null);
    }

    /*
     * Only runs after the user explicitly
     * confirms the deactivation.
     */
    async function confirmCustomerDeactivation() {
        if (
            !customerToDeactivate ||
            isDeactivating
        ) {
            return;
        }

        try {
            setIsDeactivating(true);

            await toggleCustomerStatusAction(
                customerToDeactivate.id,
                false
            );

            setCustomerToDeactivate(null);
        } finally {
            setIsDeactivating(false);
        }
    }

    return (
        <main>
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
                EMPTY STATE
               ===================================== */}

            {customers.length === 0 ? (
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
                                    (option) => (
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
                                            .value as StatusFilter
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
                                                                    <form
                                                                        action={async () => {
                                                                            await toggleCustomerStatusAction(
                                                                                customer.id,
                                                                                true
                                                                            );
                                                                        }}
                                                                    >
                                                                        <button
                                                                            type="submit"
                                                                            className="action-button"
                                                                        >
                                                                            {
                                                                                dictionary
                                                                                    .customers
                                                                                    .actions
                                                                                    .reactivate
                                                                            }
                                                                        </button>
                                                                    </form>
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
                                                    <form
                                                        action={async () => {
                                                            await toggleCustomerStatusAction(
                                                                customer.id,
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        <button
                                                            type="submit"
                                                            className="secondary-button"
                                                        >
                                                            {
                                                                dictionary
                                                                    .customers
                                                                    .actions
                                                                    .reactivate
                                                            }
                                                        </button>
                                                    </form>
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
                        .deactivateDescription.replace(
                            "{name}",
                            customerToDeactivate
                                ?.name ?? ""
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