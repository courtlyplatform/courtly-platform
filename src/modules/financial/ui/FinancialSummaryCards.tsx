import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import type {
    FinancialSummary,
} from "../domain/financial";

import styles from "./financial.module.css";

type Props = {
    summary: FinancialSummary;
    currency: CurrencyCode;
    locale: string;
    labels: {
        mrr: string;
        billedRevenue: string;
        receivedRevenue: string;
        receivableRevenue: string;
        expenses: string;
        netProfit: string;
        margin: string;
    };
};

export function FinancialSummaryCards({
    summary,
    currency,
    locale,
    labels,
}: Props) {
    const cards = [
        {
            label: labels.mrr,
            value: formatCurrency(
                summary.mrr,
                currency,
                locale
            ),
        },
        {
            label:
                labels.billedRevenue,
            value: formatCurrency(
                summary.billedRevenue,
                currency,
                locale
            ),
        },
        {
            label:
                labels.receivedRevenue,
            value: formatCurrency(
                summary.receivedRevenue,
                currency,
                locale
            ),
        },
        {
            label:
                labels.receivableRevenue,
            value: formatCurrency(
                summary.receivableRevenue,
                currency,
                locale
            ),
        },
        {
            label: labels.expenses,
            value: formatCurrency(
                summary.paidExpenses,
                currency,
                locale
            ),
        },
        {
            label:
                labels.netProfit,
            value: formatCurrency(
                summary.netProfit,
                currency,
                locale
            ),
            detail: `${labels.margin}: ${new Intl.NumberFormat(
                locale,
                {
                    maximumFractionDigits:
                        1,
                }
            ).format(
                summary.netMargin
            )}%`,
        },
    ];

    return (
        <section
            className={
                styles.summaryGrid
            }
        >
            {cards.map(
                (card) => (
                    <article
                        key={
                            card.label
                        }
                        className={
                            styles.summaryCard
                        }
                    >
                        <span>
                            {card.label}
                        </span>

                        <strong>
                            {card.value}
                        </strong>

                        {card.detail && (
                            <small>
                                {
                                    card.detail
                                }
                            </small>
                        )}
                    </article>
                )
            )}
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
