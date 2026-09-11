import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import type {
    ExpenseCategoryTotal,
    FinancialMonthlyPoint,
} from "../domain/financial";

import styles from "./financial.module.css";

type Props = {
    history: FinancialMonthlyPoint[];
    expensesByCategory:
        ExpenseCategoryTotal[];
    currency: CurrencyCode;
    locale: string;
    labels: {
        evolution: string;
        categoryExpenses: string;
        revenue: string;
        expenses: string;
        profit: string;
        noData: string;
    };
    resolveCategoryName: (
        code: string | null,
        fallback: string
    ) => string;
};

export function FinancialCharts({
    history,
    expensesByCategory,
    currency,
    locale,
    labels,
    resolveCategoryName,
}: Props) {
    const maxHistory = Math.max(
        1,
        ...history.flatMap(
            (item) => [
                item.revenue,
                item.expenses,
                Math.max(
                    0,
                    item.profit
                ),
            ]
        )
    );

    const maxCategory = Math.max(
        1,
        ...expensesByCategory.map(
            (item) =>
                item.amount
        )
    );

    return (
        <section
            className={
                styles.chartsGrid
            }
        >
            <article
                className={
                    styles.chartCard
                }
            >
                <div
                    className={
                        styles.cardHeading
                    }
                >
                    <h2>
                        {labels.evolution}
                    </h2>

                    <div
                        className={
                            styles.legend
                        }
                    >
                        <span>
                            {labels.revenue}
                        </span>
                        <span>
                            {labels.expenses}
                        </span>
                        <span>
                            {labels.profit}
                        </span>
                    </div>
                </div>

                <div
                    className={
                        styles.barChart
                    }
                >
                    {history.map(
                        (item) => (
                            <div
                                key={
                                    item.period
                                }
                                className={
                                    styles.barGroup
                                }
                            >
                                <div
                                    className={
                                        styles.barArea
                                    }
                                >
                                    <div
                                        className={`${styles.bar} ${styles.barRevenue}`}
                                        style={{
                                            height:
                                                `${Math.max(
                                                    3,
                                                    item.revenue /
                                                        maxHistory *
                                                        100
                                                )}%`,
                                        }}
                                        title={
                                            formatCurrency(
                                                item.revenue,
                                                currency,
                                                locale
                                            )
                                        }
                                    />

                                    <div
                                        className={`${styles.bar} ${styles.barExpense}`}
                                        style={{
                                            height:
                                                `${Math.max(
                                                    3,
                                                    item.expenses /
                                                        maxHistory *
                                                        100
                                                )}%`,
                                        }}
                                        title={
                                            formatCurrency(
                                                item.expenses,
                                                currency,
                                                locale
                                            )
                                        }
                                    />

                                    <div
                                        className={`${styles.bar} ${styles.barProfit}`}
                                        style={{
                                            height:
                                                `${Math.max(
                                                    3,
                                                    Math.max(
                                                        0,
                                                        item.profit
                                                    ) /
                                                        maxHistory *
                                                        100
                                                )}%`,
                                        }}
                                        title={
                                            formatCurrency(
                                                item.profit,
                                                currency,
                                                locale
                                            )
                                        }
                                    />
                                </div>

                                <small>
                                    {formatMonth(
                                        item.period,
                                        locale
                                    )}
                                </small>
                            </div>
                        )
                    )}
                </div>
            </article>

            <article
                className={
                    styles.chartCard
                }
            >
                <div
                    className={
                        styles.cardHeading
                    }
                >
                    <h2>
                        {
                            labels.categoryExpenses
                        }
                    </h2>
                </div>

                {expensesByCategory.length ===
                0 ? (
                    <div
                        className={
                            styles.chartEmpty
                        }
                    >
                        {labels.noData}
                    </div>
                ) : (
                    <div
                        className={
                            styles.categoryChart
                        }
                    >
                        {expensesByCategory.map(
                            (item) => (
                                <div
                                    key={
                                        item.categoryId
                                    }
                                    className={
                                        styles.categoryRow
                                    }
                                >
                                    <div
                                        className={
                                            styles.categoryRowTop
                                        }
                                    >
                                        <span>
                                            {resolveCategoryName(
                                                item.categoryCode,
                                                item.categoryName
                                            )}
                                        </span>
                                        <strong>
                                            {formatCurrency(
                                                item.amount,
                                                currency,
                                                locale
                                            )}
                                        </strong>
                                    </div>

                                    <div
                                        className={
                                            styles.categoryTrack
                                        }
                                    >
                                        <div
                                            className={
                                                styles.categoryFill
                                            }
                                            style={{
                                                width:
                                                    `${item.amount /
                                                        maxCategory *
                                                        100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </article>
        </section>
    );
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

function formatMonth(
    period: string,
    locale: string
): string {
    return new Intl.DateTimeFormat(
        locale,
        {
            month: "short",
            timeZone: "UTC",
        }
    ).format(
        new Date(
            `${period}T00:00:00Z`
        )
    );
}
