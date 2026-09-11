import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import type {
    FinancialRepository,
} from "../domain/financial-repository";

import type {
    ExpenseCategoryTotal,
    FinancialExpense,
    FinancialMonthlyPoint,
    FinancialPageData,
    FinancialReportRow,
    FinancialRevenue,
    FinancialSummary,
} from "../domain/financial";

export async function getFinancialPageData(
    repository: FinancialRepository,
    organizationId: string,
    defaultCurrency: CurrencyCode,
    referenceDate: string
): Promise<FinancialPageData> {
    const selectedPeriod =
        getMonthRange(referenceDate);

    await repository.syncPeriod(
        selectedPeriod.start
    );

    const historyStart =
        shiftMonth(
            selectedPeriod.start,
            -11
        );

    const [
        revenues,
        expenses,
        categories,
        mrr,
        historyRevenues,
        historyExpenses,
    ] = await Promise.all([
        repository.listRevenues(
            organizationId,
            selectedPeriod
        ),
        repository.listExpenses(
            organizationId,
            selectedPeriod
        ),
        repository.listCategories(
            organizationId
        ),
        repository.calculateMrr(
            organizationId,
            defaultCurrency
        ),
        repository.listRevenues(
            organizationId,
            {
                start: historyStart,
                end: selectedPeriod.end,
            }
        ),
        repository.listExpenses(
            organizationId,
            {
                start: historyStart,
                end: selectedPeriod.end,
            }
        ),
    ]);

    const currencyRevenues =
        revenues.filter(
            (item) =>
                item.currencyCode ===
                defaultCurrency
        );

    const currencyExpenses =
        expenses.filter(
            (item) =>
                item.currencyCode ===
                defaultCurrency
        );

    const summary = buildSummary(
        currencyRevenues,
        currencyExpenses,
        mrr
    );

    const monthlyHistory =
        buildMonthlyHistory(
            historyRevenues,
            historyExpenses,
            defaultCurrency,
            selectedPeriod.start,
            6
        );

    const reports =
        buildReports(
            historyRevenues,
            historyExpenses,
            defaultCurrency,
            selectedPeriod.start,
            12
        );

    const expensesByCategory =
        buildExpensesByCategory(
            currencyExpenses,
            categories
        );

    return {
        periodStart:
            selectedPeriod.start,
        periodEnd:
            selectedPeriod.end,
        summary,
        revenues,
        expenses,
        categories,
        monthlyHistory,
        expensesByCategory,
        reports,
    };
}

function buildSummary(
    revenues: FinancialRevenue[],
    expenses: FinancialExpense[],
    mrr: {
        mrr: number;
        activeSubscriptions: number;
        activeCustomers: number;
    }
): FinancialSummary {
    const validRevenues =
        revenues.filter(
            (item) =>
                item.status !==
                "CANCELLED"
        );

    const validExpenses =
        expenses.filter(
            (item) =>
                item.status !==
                "CANCELLED"
        );

    const billedRevenue = sum(
        validRevenues
    );

    const receivedRevenue = sum(
        validRevenues.filter(
            (item) =>
                item.status ===
                "PAID"
        )
    );

    const receivableRevenue = sum(
        validRevenues.filter(
            (item) =>
                item.status ===
                    "PENDING" ||
                item.status ===
                    "OVERDUE"
        )
    );

    const overdueRevenue = sum(
        validRevenues.filter(
            (item) =>
                item.status ===
                "OVERDUE"
        )
    );

    const totalExpenses = sum(
        validExpenses
    );

    const paidExpenses = sum(
        validExpenses.filter(
            (item) =>
                item.status ===
                "PAID"
        )
    );

    const netProfit =
        receivedRevenue -
        paidExpenses;

    const netMargin =
        receivedRevenue > 0
            ? netProfit /
              receivedRevenue *
              100
            : 0;

    return {
        mrr: mrr.mrr,
        billedRevenue,
        receivedRevenue,
        receivableRevenue,
        overdueRevenue,
        totalExpenses,
        paidExpenses,
        netProfit,
        netMargin,
        activeCustomers:
            mrr.activeCustomers,
        activeSubscriptions:
            mrr.activeSubscriptions,
    };
}

function buildMonthlyHistory(
    revenues: FinancialRevenue[],
    expenses: FinancialExpense[],
    currency: CurrencyCode,
    selectedPeriodStart: string,
    count: number
): FinancialMonthlyPoint[] {
    const rows:
        FinancialMonthlyPoint[] = [];

    for (
        let offset = -(count - 1);
        offset <= 0;
        offset += 1
    ) {
        const period = shiftMonth(
            selectedPeriodStart,
            offset
        );

        const range =
            getMonthRange(period);

        const received = sum(
            revenues.filter(
                (item) =>
                    item.currencyCode ===
                        currency &&
                    item.status ===
                        "PAID" &&
                    inRange(
                        item.referenceDate,
                        range.start,
                        range.end
                    )
            )
        );

        const paidExpenses = sum(
            expenses.filter(
                (item) =>
                    item.currencyCode ===
                        currency &&
                    item.status ===
                        "PAID" &&
                    inRange(
                        item.referenceDate,
                        range.start,
                        range.end
                    )
            )
        );

        rows.push({
            period,
            revenue: received,
            expenses: paidExpenses,
            profit:
                received -
                paidExpenses,
        });
    }

    return rows;
}

function buildReports(
    revenues: FinancialRevenue[],
    expenses: FinancialExpense[],
    currency: CurrencyCode,
    selectedPeriodStart: string,
    count: number
): FinancialReportRow[] {
    const rows:
        FinancialReportRow[] = [];

    for (
        let offset = -(count - 1);
        offset <= 0;
        offset += 1
    ) {
        const period = shiftMonth(
            selectedPeriodStart,
            offset
        );

        const range =
            getMonthRange(period);

        const monthRevenues =
            revenues.filter(
                (item) =>
                    item.currencyCode ===
                        currency &&
                    item.status !==
                        "CANCELLED" &&
                    inRange(
                        item.referenceDate,
                        range.start,
                        range.end
                    )
            );

        const monthExpenses =
            expenses.filter(
                (item) =>
                    item.currencyCode ===
                        currency &&
                    item.status !==
                        "CANCELLED" &&
                    inRange(
                        item.referenceDate,
                        range.start,
                        range.end
                    )
            );

        const billedRevenue =
            sum(monthRevenues);

        const receivedRevenue =
            sum(
                monthRevenues.filter(
                    (item) =>
                        item.status ===
                        "PAID"
                )
            );

        const paidExpenses =
            sum(
                monthExpenses.filter(
                    (item) =>
                        item.status ===
                        "PAID"
                )
            );

        const profit =
            receivedRevenue -
            paidExpenses;

        rows.push({
            period,
            billedRevenue,
            receivedRevenue,
            expenses:
                paidExpenses,
            profit,
            margin:
                receivedRevenue > 0
                    ? profit /
                      receivedRevenue *
                      100
                    : 0,
        });
    }

    return rows.reverse();
}

function buildExpensesByCategory(
    expenses: FinancialExpense[],
    categories: {
        id: string;
        code: string | null;
        name: string;
    }[]
): ExpenseCategoryTotal[] {
    const categoryById =
        new Map(
            categories.map(
                (category) => [
                    category.id,
                    category,
                ]
            )
        );

    const totals =
        new Map<string, number>();

    for (const expense of expenses) {
        if (
            expense.status ===
            "CANCELLED"
        ) {
            continue;
        }

        totals.set(
            expense.categoryId,
            (
                totals.get(
                    expense.categoryId
                ) ?? 0
            ) + expense.amount
        );
    }

    return Array.from(
        totals.entries()
    )
        .map(
            ([categoryId, amount]) => {
                const category =
                    categoryById.get(
                        categoryId
                    );

                return {
                    categoryId,
                    categoryCode:
                        category?.code ??
                        null,
                    categoryName:
                        category?.name ??
                        "—",
                    amount,
                };
            }
        )
        .sort(
            (a, b) =>
                b.amount - a.amount
        );
}

function sum(
    items: {
        amount: number;
    }[]
): number {
    return items.reduce(
        (total, item) =>
            total + item.amount,
        0
    );
}

function inRange(
    value: string,
    start: string,
    end: string
): boolean {
    return (
        value >= start &&
        value <= end
    );
}

export function getMonthRange(
    referenceDate: string
): {
    start: string;
    end: string;
} {
    const [
        yearText,
        monthText,
    ] = referenceDate.split("-");

    const year = Number(yearText);
    const month = Number(monthText);

    const start = `${year}-${String(
        month
    ).padStart(2, "0")}-01`;

    const endDate = new Date(
        Date.UTC(
            year,
            month,
            0
        )
    );

    const end = [
        endDate.getUTCFullYear(),
        String(
            endDate.getUTCMonth() + 1
        ).padStart(2, "0"),
        String(
            endDate.getUTCDate()
        ).padStart(2, "0"),
    ].join("-");

    return {
        start,
        end,
    };
}

export function shiftMonth(
    periodStart: string,
    offset: number
): string {
    const [
        yearText,
        monthText,
    ] = periodStart.split("-");

    const date = new Date(
        Date.UTC(
            Number(yearText),
            Number(monthText) - 1 +
                offset,
            1
        )
    );

    return [
        date.getUTCFullYear(),
        String(
            date.getUTCMonth() + 1
        ).padStart(2, "0"),
        "01",
    ].join("-");
}
