"use client";

import {
    useMemo,
    useState,
    useTransition,
} from "react";

import {
    formatDocument,
} from "@/modules/customers/documents/documentFormatter";

import {
    isDocumentType,
} from "@/modules/customers/documents/documentTypes";

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
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import {
    changeExpenseStatusAction,
    changeRevenueStatusAction,
    syncFinancialPeriodAction,
} from "../application/financial-actions";

import type {
    ExpenseCategory,
    FinancialEntryStatus,
    FinancialExpense,
    FinancialPageData,
    FinancialRevenue,
} from "../domain/financial";

import {
    ExpenseModal,
} from "./ExpenseModal";

import {
    FinancialCharts,
} from "./FinancialCharts";

import {
    FinancialSummaryCards,
} from "./FinancialSummaryCards";

import {
    RevenueModal,
} from "./RevenueModal";

import styles from "./financial.module.css";

type Props = {
    initialData: FinancialPageData;
    defaultCurrency: CurrencyCode;
};

type Tab =
    | "overview"
    | "revenues"
    | "expenses"
    | "reports";

type Feedback = {
    type: "success" | "error";
    message: string;
} | null;

type RevenueStatusConfirmation = {
    revenue: FinancialRevenue;
    status: "PAID" | "CANCELLED";
} | null;

function getRevenueCustomerDocument(
    revenue: FinancialRevenue
): string | null {
    if (
        !revenue.customerDocumentType ||
        !revenue.customerDocumentNumber
    ) {
        return null;
    }

    if (
        isDocumentType(
            revenue.customerDocumentType
        )
    ) {
        return formatDocument(
            revenue.customerDocumentType,
            revenue.customerDocumentNumber
        );
    }

    return `${revenue.customerDocumentType}: ${revenue.customerDocumentNumber}`;
}

export function FinancialClient({
    initialData,
    defaultCurrency,
}: Props) {
    const router =
        useRouter();

    const {
        dictionary,
        locale,
    } = useI18n();

    const t =
        dictionary.financial;

    const [tab, setTab] =
        useState<Tab>("overview");

    const [
        expenseModalOpen,
        setExpenseModalOpen,
    ] = useState(false);

    const [
        revenueModalOpen,
        setRevenueModalOpen,
    ] = useState(false);

    const [
        expenseToEdit,
        setExpenseToEdit,
    ] = useState<FinancialExpense | null>(
        null
    );

    const [
        revenueToEdit,
        setRevenueToEdit,
    ] = useState<FinancialRevenue | null>(
        null
    );

    const [feedback, setFeedback] =
        useState<Feedback>(null);

    const [
        revenueStatusConfirmation,
        setRevenueStatusConfirmation,
    ] =
        useState<
            RevenueStatusConfirmation
        >(null);

    const [isPending, startTransition] =
        useTransition();

    const periodValue =
        initialData.periodStart.slice(
            0,
            7
        );

    const categoryById =
        useMemo(
            () =>
                new Map<
                    string,
                    ExpenseCategory
                >(
                    initialData.categories.map(
                        (category) => [
                            category.id,
                            category,
                        ]
                    )
                ),
            [initialData.categories]
        );

    function changePeriod(
        value: string
    ) {
        if (!value) {
            return;
        }

        router.push(
            `/financial?period=${encodeURIComponent(
                value
            )}`
        );
    }

    function synchronize() {
        setFeedback(null);

        startTransition(
            async () => {
                const result =
                    await syncFinancialPeriodAction(
                        initialData.periodStart
                    );

                if (result.success === false) {
                    setFeedback({
                        type: "error",
                        message:
                            result.error ===
                            "forbidden"
                                ? t.feedback.error.forbidden
                                : t.feedback.error.syncFailed,
                    });
                    return;
                }

                setFeedback({
                    type: "success",
                    message:
                        t.feedback.success.synced,
                });

                router.refresh();
            }
        );
    }

    function changeRevenueStatus(
        revenue: FinancialRevenue,
        status: FinancialEntryStatus
    ) {
        setFeedback(null);

        startTransition(
            async () => {
                const result =
                    await changeRevenueStatusAction(
                        revenue.id,
                        status
                    );

                if (result.success === false) {
                    setFeedback({
                        type: "error",
                        message:
                            result.error ===
                            "forbidden"
                                ? t.feedback.error.forbidden
                                : t.feedback.error.statusUpdateFailed,
                    });
                    return;
                }

                setFeedback({
                    type: "success",
                    message:
                        t.feedback.success.statusUpdated,
                });

                router.refresh();
            }
        );
    }

    function requestRevenueStatusChange(
        revenue: FinancialRevenue,
        status: "PAID" | "CANCELLED"
    ) {
        setRevenueStatusConfirmation({
            revenue,
            status,
        });
    }

    function confirmRevenueStatusChange() {
        if (
            !revenueStatusConfirmation
        ) {
            return;
        }

        const {
            revenue,
            status,
        } =
            revenueStatusConfirmation;

        setRevenueStatusConfirmation(
            null
        );

        changeRevenueStatus(
            revenue,
            status
        );
    }

    function getRevenueConfirmationDescription(
        revenue: FinancialRevenue,
        status: "PAID" | "CANCELLED"
    ): string {
        const customer =
            revenue.customerName ??
            t.confirmation
                .unknownCustomer;

        const document =
            getRevenueCustomerDocument(
                revenue
            ) ??
            t.confirmation
                .documentNotProvided;

        const service =
            revenue.activityName ??
            t.confirmation
                .serviceNotProvided;

        const amount =
            formatCurrency(
                revenue.amount,
                revenue.currencyCode,
                locale
            );

        const template =
            status === "PAID"
                ? t.confirmation
                      .markPaidDescription
                : t.confirmation
                      .cancelDescription;

        return template
            .replace(
                "{customer}",
                customer
            )
            .replace(
                "{document}",
                document
            )
            .replace(
                "{service}",
                service
            )
            .replace(
                "{amount}",
                amount
            );
    }

    function changeExpenseStatus(
        expense: FinancialExpense,
        status: FinancialEntryStatus
    ) {
        setFeedback(null);

        startTransition(
            async () => {
                const result =
                    await changeExpenseStatusAction(
                        expense.id,
                        status
                    );

                if (result.success === false) {
                    setFeedback({
                        type: "error",
                        message:
                            result.error ===
                            "forbidden"
                                ? t.feedback.error.forbidden
                                : t.feedback.error.statusUpdateFailed,
                    });
                    return;
                }

                setFeedback({
                    type: "success",
                    message:
                        t.feedback.success.statusUpdated,
                });

                router.refresh();
            }
        );
    }

    function openNewExpense() {
        setExpenseToEdit(null);
        setExpenseModalOpen(true);
    }

    function openEditExpense(
        expense: FinancialExpense
    ) {
        setExpenseToEdit(expense);
        setExpenseModalOpen(true);
    }

    function openNewRevenue() {
        setRevenueToEdit(null);
        setRevenueModalOpen(true);
    }

    function openEditRevenue(
        revenue: FinancialRevenue
    ) {
        if (
            revenue.source !==
            "MANUAL"
        ) {
            return;
        }

        setRevenueToEdit(revenue);
        setRevenueModalOpen(true);
    }

    const tabs: {
        id: Tab;
        label: string;
    }[] = [
        {
            id: "overview",
            label: t.tabs.overview,
        },
        {
            id: "revenues",
            label: t.tabs.revenues,
        },
        {
            id: "expenses",
            label: t.tabs.expenses,
        },
        {
            id: "reports",
            label: t.tabs.reports,
        },
    ];

    return (
        <main
            className={styles.page}
        >
            <section
                className={
                    styles.pageHeader
                }
            >
                <div>
                    <span
                        className={
                            styles.eyebrow
                        }
                    >
                        {t.eyebrow}
                    </span>

                    <h1>{t.title}</h1>
                    <p>
                        {t.description}
                    </p>
                </div>

                <div
                    className={
                        styles.headerActions
                    }
                >
                    <label
                        className={
                            styles.periodField
                        }
                    >
                        <span>
                            {t.period}
                        </span>
                        <input
                            type="month"
                            value={
                                periodValue
                            }
                            onChange={(
                                event
                            ) =>
                                changePeriod(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </label>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={
                            synchronize
                        }
                        disabled={
                            isPending
                        }
                    >
                        {isPending
                            ? t.actions.syncing
                            : t.actions.sync}
                    </button>
                </div>
            </section>

            {feedback && (
                <CourtlyAlert
                    type={
                        feedback.type
                    }
                    message={
                        feedback.message
                    }
                />
            )}

            <nav
                className={styles.tabs}
                aria-label={
                    t.accessibility.sections
                }
            >
                {tabs.map(
                    (item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={
                                tab ===
                                item.id
                                    ? `${styles.tab} ${styles.tabActive}`
                                    : styles.tab
                            }
                            onClick={() =>
                                setTab(
                                    item.id
                                )
                            }
                        >
                            {item.label}
                        </button>
                    )
                )}
            </nav>

            {tab === "overview" && (
                <>
                    <FinancialSummaryCards
                        summary={
                            initialData.summary
                        }
                        currency={
                            defaultCurrency
                        }
                        locale={locale}
                        labels={
                            t.cards
                        }
                    />

                    <section
                        className={
                            styles.kpiStrip
                        }
                    >
                        <div>
                            <span>
                                {
                                    t.kpis.activeCustomers
                                }
                            </span>
                            <strong>
                                {
                                    initialData
                                        .summary
                                        .activeCustomers
                                }
                            </strong>
                        </div>
                        <div>
                            <span>
                                {
                                    t.kpis.activeSubscriptions
                                }
                            </span>
                            <strong>
                                {
                                    initialData
                                        .summary
                                        .activeSubscriptions
                                }
                            </strong>
                        </div>
                        <div>
                            <span>
                                {
                                    t.kpis.overdueRevenue
                                }
                            </span>
                            <strong>
                                {formatCurrency(
                                    initialData
                                        .summary
                                        .overdueRevenue,
                                    defaultCurrency,
                                    locale
                                )}
                            </strong>
                        </div>
                        <div>
                            <span>
                                {
                                    t.kpis.totalExpenses
                                }
                            </span>
                            <strong>
                                {formatCurrency(
                                    initialData
                                        .summary
                                        .totalExpenses,
                                    defaultCurrency,
                                    locale
                                )}
                            </strong>
                        </div>
                    </section>

                    <FinancialCharts
                        history={
                            initialData.monthlyHistory
                        }
                        expensesByCategory={
                            initialData.expensesByCategory
                        }
                        currency={
                            defaultCurrency
                        }
                        locale={locale}
                        labels={
                            t.charts
                        }
                        resolveCategoryName={(
                            code,
                            fallback
                        ) =>
                            resolveCategoryName(
                                code,
                                fallback,
                                t
                            )
                        }
                    />
                </>
            )}

            {tab === "revenues" && (
                <section
                    className={
                        styles.sectionCard
                    }
                >
                    <div
                        className={
                            styles.sectionHeading
                        }
                    >
                        <div>
                            <h2>
                                {
                                    t.revenues.title
                                }
                            </h2>
                            <p>
                                {
                                    t.revenues.description
                                }
                            </p>
                        </div>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={
                                openNewRevenue
                            }
                        >
                            +{" "}
                            {
                                t.revenues.newAction
                            }
                        </button>
                    </div>

                    {initialData.revenues.length ===
                    0 ? (
                        <EmptyMessage
                            text={
                                t.revenues.empty
                            }
                        />
                    ) : (
                        <div
                            className={
                                styles.tableScroll
                            }
                        >
                            <table
                                className={
                                    styles.table
                                }
                            >
                                <thead>
                                    <tr>
                                        <th>
                                            {
                                                t.table.description
                                            }
                                        </th>

                                        <th>
                                            {
                                                t.table.customer
                                            }
                                        </th>

                                        <th>
                                            {
                                                t.table.service
                                            }
                                        </th>

                                        <th>
                                            {
                                                t.table.source
                                            }
                                        </th>

                                        <th>
                                            {
                                                t.table.referenceDate
                                            }
                                        </th>

                                        <th>
                                            {
                                                t.table.dueDate
                                            }
                                        </th>

                                        <th>
                                            {
                                                t.table.amount
                                            }
                                        </th>

                                        <th>
                                            {
                                                t.table.status
                                            }
                                        </th>

                                        <th>
                                            {
                                                t.table.actions
                                            }
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {initialData.revenues.map(
                                        (
                                            revenue
                                        ) => {
                                            const customerDocument =
                                                getRevenueCustomerDocument(
                                                    revenue
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        revenue.id
                                                    }
                                                >
                                                    <td>
                                                        <strong>
                                                            {
                                                                revenue.description
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {revenue.customerName ? (
                                                            <div
                                                                className={
                                                                    styles
                                                                        .customerIdentity
                                                                }
                                                            >
                                                                <strong>
                                                                    {
                                                                        revenue
                                                                            .customerName
                                                                    }
                                                                </strong>

                                                                {customerDocument && (
                                                                    <span
                                                                        className={
                                                                            styles
                                                                                .customerDocument
                                                                        }
                                                                    >
                                                                        {" - "}
                                                                        {
                                                                            customerDocument
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    styles
                                                                        .mutedValue
                                                                }
                                                            >
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {revenue.activityName ? (
                                                            <strong>
                                                                {
                                                                    revenue.activityName
                                                                }
                                                            </strong>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    styles.mutedValue
                                                                }
                                                            >
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {
                                                            revenue.source ===
                                                            "SUBSCRIPTION"
                                                                ? t.sources.subscription
                                                                : t.sources.manual
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            revenue.referenceDate,
                                                            locale
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            revenue.dueDate,
                                                            locale
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatCurrency(
                                                            revenue.amount,
                                                            revenue.currencyCode,
                                                            locale
                                                        )}
                                                    </td>

                                                    <td>
                                                        <StatusBadge
                                                            status={
                                                                revenue.status
                                                            }
                                                            t={t}
                                                        />
                                                    </td>

                                                    <td>
                                                        <div
                                                            className={
                                                                styles.rowActions
                                                            }
                                                        >
                                                            {revenue.source ===
                                                                "MANUAL" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openEditRevenue(
                                                                            revenue
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                >
                                                                    {
                                                                        t.actions.edit
                                                                    }
                                                                </button>
                                                            )}

                                                            {revenue.status !==
                                                                "PAID" &&
                                                                revenue.status !==
                                                                    "CANCELLED" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        requestRevenueStatusChange(
                                                                            revenue,
                                                                            "PAID"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                >
                                                                    {
                                                                        t.actions.markPaid
                                                                    }
                                                                </button>
                                                            )}

                                                            {revenue.status ===
                                                                "PAID" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        changeRevenueStatus(
                                                                            revenue,
                                                                            "PENDING"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                >
                                                                    {
                                                                        t.actions.markPending
                                                                    }
                                                                </button>
                                                            )}

                                                            {revenue.status !==
                                                                "CANCELLED" && (
                                                                <button
                                                                    type="button"
                                                                    className={
                                                                        styles.dangerAction
                                                                    }
                                                                    onClick={() =>
                                                                        requestRevenueStatusChange(
                                                                            revenue,
                                                                            "CANCELLED"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                >
                                                                    {
                                                                        t.actions.cancelEntry
                                                                    }
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {tab === "expenses" && (
                <section
                    className={
                        styles.sectionCard
                    }
                >
                    <div
                        className={
                            styles.sectionHeading
                        }
                    >
                        <div>
                            <h2>
                                {
                                    t.expenses.title
                                }
                            </h2>
                            <p>
                                {
                                    t.expenses.description
                                }
                            </p>
                        </div>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={
                                openNewExpense
                            }
                        >
                            +{" "}
                            {
                                t.expenses.newAction
                            }
                        </button>
                    </div>

                    {initialData.expenses.length ===
                    0 ? (
                        <EmptyMessage
                            text={
                                t.expenses.empty
                            }
                        />
                    ) : (
                        <div
                            className={
                                styles.tableScroll
                            }
                        >
                            <table
                                className={
                                    styles.table
                                }
                            >
                                <thead>
                                    <tr>
                                        <th>
                                            {
                                                t.table.description
                                            }
                                        </th>
                                        <th>
                                            {
                                                t.table.category
                                            }
                                        </th>
                                        <th>
                                            {
                                                t.table.referenceDate
                                            }
                                        </th>
                                        <th>
                                            {
                                                t.table.dueDate
                                            }
                                        </th>
                                        <th>
                                            {
                                                t.table.amount
                                            }
                                        </th>
                                        <th>
                                            {
                                                t.table.status
                                            }
                                        </th>
                                        <th>
                                            {
                                                t.table.actions
                                            }
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialData.expenses.map(
                                        (expense) => {
                                            const category =
                                                categoryById.get(
                                                    expense.categoryId
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        expense.id
                                                    }
                                                >
                                                    <td>
                                                        <strong>
                                                            {
                                                                expense.description
                                                            }
                                                        </strong>
                                                        {expense.recurrenceId && (
                                                            <small
                                                                className={
                                                                    styles.inlineHint
                                                                }
                                                            >
                                                                {
                                                                    t.expenses.recurringBadge
                                                                }
                                                            </small>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {resolveCategoryName(
                                                            category?.code ??
                                                                null,
                                                            category?.name ??
                                                                "—",
                                                            t
                                                        )}
                                                    </td>
                                                    <td>
                                                        {formatDate(
                                                            expense.referenceDate,
                                                            locale
                                                        )}
                                                    </td>
                                                    <td>
                                                        {formatDate(
                                                            expense.dueDate,
                                                            locale
                                                        )}
                                                    </td>
                                                    <td>
                                                        {formatCurrency(
                                                            expense.amount,
                                                            expense.currencyCode,
                                                            locale
                                                        )}
                                                    </td>
                                                    <td>
                                                        <StatusBadge
                                                            status={
                                                                expense.status
                                                            }
                                                            t={t}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div
                                                            className={
                                                                styles.rowActions
                                                            }
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditExpense(
                                                                        expense
                                                                    )
                                                                }
                                                                disabled={
                                                                    isPending
                                                                }
                                                            >
                                                                {
                                                                    t.actions.edit
                                                                }
                                                            </button>

                                                            {expense.status !==
                                                                "PAID" &&
                                                                expense.status !==
                                                                    "CANCELLED" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        changeExpenseStatus(
                                                                            expense,
                                                                            "PAID"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                >
                                                                    {
                                                                        t.actions.markPaid
                                                                    }
                                                                </button>
                                                            )}

                                                            {expense.status ===
                                                                "PAID" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        changeExpenseStatus(
                                                                            expense,
                                                                            "PENDING"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                >
                                                                    {
                                                                        t.actions.markPending
                                                                    }
                                                                </button>
                                                            )}

                                                            {expense.status !==
                                                                "CANCELLED" && (
                                                                <button
                                                                    type="button"
                                                                    className={
                                                                        styles.dangerAction
                                                                    }
                                                                    onClick={() =>
                                                                        changeExpenseStatus(
                                                                            expense,
                                                                            "CANCELLED"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isPending
                                                                    }
                                                                >
                                                                    {
                                                                        t.actions.cancelEntry
                                                                    }
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {tab === "reports" && (
                <section
                    className={
                        styles.sectionCard
                    }
                >
                    <div
                        className={
                            styles.sectionHeading
                        }
                    >
                        <div>
                            <h2>
                                {
                                    t.reports.title
                                }
                            </h2>
                            <p>
                                {
                                    t.reports.description
                                }
                            </p>
                        </div>
                    </div>

                    <div
                        className={
                            styles.tableScroll
                        }
                    >
                        <table
                            className={
                                styles.table
                            }
                        >
                            <thead>
                                <tr>
                                    <th>
                                        {
                                            t.reports.period
                                        }
                                    </th>
                                    <th>
                                        {
                                            t.cards.billedRevenue
                                        }
                                    </th>
                                    <th>
                                        {
                                            t.cards.receivedRevenue
                                        }
                                    </th>
                                    <th>
                                        {
                                            t.cards.expenses
                                        }
                                    </th>
                                    <th>
                                        {
                                            t.cards.netProfit
                                        }
                                    </th>
                                    <th>
                                        {
                                            t.cards.margin
                                        }
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {initialData.reports.map(
                                    (row) => (
                                        <tr
                                            key={
                                                row.period
                                            }
                                        >
                                            <td>
                                                {formatMonthYear(
                                                    row.period,
                                                    locale
                                                )}
                                            </td>
                                            <td>
                                                {formatCurrency(
                                                    row.billedRevenue,
                                                    defaultCurrency,
                                                    locale
                                                )}
                                            </td>
                                            <td>
                                                {formatCurrency(
                                                    row.receivedRevenue,
                                                    defaultCurrency,
                                                    locale
                                                )}
                                            </td>
                                            <td>
                                                {formatCurrency(
                                                    row.expenses,
                                                    defaultCurrency,
                                                    locale
                                                )}
                                            </td>
                                            <td>
                                                {formatCurrency(
                                                    row.profit,
                                                    defaultCurrency,
                                                    locale
                                                )}
                                            </td>
                                            <td>
                                                {new Intl.NumberFormat(
                                                    locale,
                                                    {
                                                        maximumFractionDigits:
                                                            1,
                                                    }
                                                ).format(
                                                    row.margin
                                                )}
                                                %
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <p
                        className={
                            styles.reportHint
                        }
                    >
                        {
                            t.reports.hint
                        }
                    </p>
                </section>
            )}

            <ExpenseModal
                open={
                    expenseModalOpen
                }
                categories={
                    initialData.categories
                }
                defaultCurrency={
                    defaultCurrency
                }
                periodStart={
                    initialData.periodStart
                }
                expense={
                    expenseToEdit
                }
                onClose={() => {
                    setExpenseModalOpen(
                        false
                    );
                    setExpenseToEdit(
                        null
                    );
                }}
            />

            <RevenueModal
                open={
                    revenueModalOpen
                }
                defaultCurrency={
                    defaultCurrency
                }
                periodStart={
                    initialData.periodStart
                }
                revenue={
                    revenueToEdit
                }
                onClose={() => {
                    setRevenueModalOpen(
                        false
                    );
                    setRevenueToEdit(
                        null
                    );
                }}
            />

            <ConfirmDialog
                open={
                    revenueStatusConfirmation
                        ?.status ===
                    "PAID"
                }
                title={
                    t.confirmation
                        .markPaidTitle
                }
                description={
                    revenueStatusConfirmation
                        ?.status ===
                    "PAID"
                        ? getRevenueConfirmationDescription(
                              revenueStatusConfirmation
                                  .revenue,
                              "PAID"
                          )
                        : ""
                }
                confirmLabel={
                    t.confirmation
                        .confirmPaid
                }
                cancelLabel={
                    t.confirmation
                        .goBack
                }
                onCancel={() => {
                    if (
                        !isPending
                    ) {
                        setRevenueStatusConfirmation(
                            null
                        );
                    }
                }}
                onConfirm={() => {
                    confirmRevenueStatusChange();
                }}
            />

            <ConfirmDialog
                open={
                    revenueStatusConfirmation
                        ?.status ===
                    "CANCELLED"
                }
                title={
                    t.confirmation
                        .cancelTitle
                }
                description={
                    revenueStatusConfirmation
                        ?.status ===
                    "CANCELLED"
                        ? getRevenueConfirmationDescription(
                              revenueStatusConfirmation
                                  .revenue,
                              "CANCELLED"
                          )
                        : ""
                }
                confirmLabel={
                    t.confirmation
                        .confirmCancel
                }
                cancelLabel={
                    t.confirmation
                        .goBack
                }
                variant="danger"
                onCancel={() => {
                    if (
                        !isPending
                    ) {
                        setRevenueStatusConfirmation(
                            null
                        );
                    }
                }}
                onConfirm={() => {
                    confirmRevenueStatusChange();
                }}
            />
        </main>
    );
}

function EmptyMessage({
    text,
}: {
    text: string;
}) {
    return (
        <div
            className={
                styles.emptyState
            }
        >
            {text}
        </div>
    );
}

function StatusBadge({
    status,
    t,
}: {
    status: FinancialEntryStatus;
    t: any;
}) {
    return (
        <span
            className={`${styles.statusBadge} ${getStatusClass(
                status
            )}`}
        >
            {status === "PAID"
                ? t.status.paid
                : status === "PENDING"
                    ? t.status.pending
                    : status === "OVERDUE"
                        ? t.status.overdue
                        : t.status.cancelled}
        </span>
    );
}

function getStatusClass(
    status: FinancialEntryStatus
): string {
    if (status === "PAID") {
        return styles.statusPaid;
    }
    if (status === "OVERDUE") {
        return styles.statusOverdue;
    }
    if (status === "CANCELLED") {
        return styles.statusCancelled;
    }
    return styles.statusPending;
}

function resolveCategoryName(
    code: string | null,
    fallback: string,
    t: any
): string {
    if (
        code &&
        code in t.categoryNames
    ) {
        return t.categoryNames[code];
    }

    return fallback;
}

function formatCurrency(
    amount: number,
    currency: CurrencyCode,
    locale: string
): string {
    return new Intl.NumberFormat(
        locale,
        {
            style: "currency",
            currency,
        }
    ).format(amount);
}

function formatDate(
    value: string,
    locale: string
): string {
    return new Intl.DateTimeFormat(
        locale,
        {
            timeZone: "UTC",
        }
    ).format(
        new Date(
            `${value}T00:00:00Z`
        )
    );
}

function formatMonthYear(
    value: string,
    locale: string
): string {
    return new Intl.DateTimeFormat(
        locale,
        {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        }
    ).format(
        new Date(
            `${value}T00:00:00Z`
        )
    );
}
