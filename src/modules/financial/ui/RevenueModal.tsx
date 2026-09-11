"use client";

import {
    type FormEvent,
    useEffect,
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

import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import {
    saveManualRevenueAction,
} from "../application/financial-actions";

import type {
    FinancialRevenue,
} from "../domain/financial";

import styles from "./financial.module.css";

type Props = {
    open: boolean;
    defaultCurrency: CurrencyCode;
    periodStart: string;
    revenue?: FinancialRevenue | null;
    onClose: () => void;
};

export function RevenueModal({
    open,
    defaultCurrency,
    periodStart,
    revenue = null,
    onClose,
}: Props) {
    const router =
        useRouter();

    const {
        dictionary,
        locale,
    } = useI18n();

    const t =
        dictionary.financial;

    const [description, setDescription] =
        useState(
            revenue?.description ?? ""
        );
    const [amount, setAmount] =
        useState(
            revenue
                ? new Intl.NumberFormat(
                      locale,
                      {
                          minimumFractionDigits:
                              2,
                          maximumFractionDigits:
                              2,
                          useGrouping: false,
                      }
                  ).format(
                      revenue.amount
                  )
                : ""
        );
    const [currencyCode, setCurrencyCode] =
        useState<CurrencyCode>(
            revenue?.currencyCode ??
                defaultCurrency
        );
    const [referenceDate, setReferenceDate] =
        useState(
            revenue?.referenceDate ??
                periodStart
        );
    const [dueDate, setDueDate] =
        useState(
            revenue?.dueDate ??
                periodStart
        );
    const [notes, setNotes] =
        useState(
            revenue?.notes ?? ""
        );
    const [error, setError] =
        useState<string | null>(null);
    const [isPending, startTransition] =
        useTransition();

    useEffect(
        () => {
            if (!open) {
                return;
            }

            setDescription(
                revenue?.description ?? ""
            );
            setAmount(
                revenue
                    ? new Intl.NumberFormat(
                          locale,
                          {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                              useGrouping: false,
                          }
                      ).format(
                          revenue.amount
                      )
                    : ""
            );
            setCurrencyCode(
                revenue?.currencyCode ??
                    defaultCurrency
            );
            setReferenceDate(
                revenue?.referenceDate ??
                    periodStart
            );
            setDueDate(
                revenue?.dueDate ??
                    periodStart
            );
            setNotes(
                revenue?.notes ?? ""
            );
            setError(null);
        },
        [
            defaultCurrency,
            locale,
            open,
            periodStart,
            revenue,
        ]
    );

    if (!open) {
        return null;
    }

    function handleSubmit(
        event: FormEvent
    ) {
        event.preventDefault();
        setError(null);

        const parsedAmount =
            Number(
                amount
                    .trim()
                    .replace(",", ".")
            );

        if (
            !description.trim() ||
            !Number.isFinite(
                parsedAmount
            ) ||
            parsedAmount < 0 ||
            !referenceDate ||
            !dueDate
        ) {
            setError(
                t.feedback.error.invalidData
            );
            return;
        }

        startTransition(
            async () => {
                const result =
                    await saveManualRevenueAction({
                        id: revenue?.id,
                        description,
                        amount:
                            parsedAmount,
                        currencyCode,
                        referenceDate,
                        dueDate,
                        notes,
                    });

                if (result.success === false) {
                    setError(
                        result.error ===
                        "forbidden"
                            ? t.feedback.error.forbidden
                            : t.feedback.error.saveFailed
                    );
                    return;
                }

                onClose();
                router.refresh();
            }
        );
    }

    return (
        <div
            className={
                styles.modalBackdrop
            }
            role="presentation"
        >
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="financial-revenue-modal-title"
            >
                <div
                    className={
                        styles.modalHeading
                    }
                >
                    <div>
                        <span
                            className={
                                styles.eyebrow
                            }
                        >
                            {
                                t.revenues.eyebrow
                            }
                        </span>
                        <h2 id="financial-revenue-modal-title">
                            {revenue
                                ? t.revenues.editTitle
                                : t.revenues.newTitle}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className={
                            styles.iconButton
                        }
                        onClick={onClose}
                        disabled={isPending}
                        aria-label={
                            t.actions.close
                        }
                    >
                        ×
                    </button>
                </div>

                <form
                    className={styles.form}
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div
                        className={
                            styles.formGroup
                        }
                    >
                        <label htmlFor="revenue-description">
                            {
                                t.fields.description
                            }
                        </label>
                        <input
                            id="revenue-description"
                            value={description}
                            onChange={(
                                event
                            ) =>
                                setDescription(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div
                        className={
                            styles.formRow
                        }
                    >
                        <div
                            className={
                                styles.formGroup
                            }
                        >
                            <label htmlFor="revenue-amount">
                                {
                                    t.fields.amount
                                }
                            </label>
                            <input
                                id="revenue-amount"
                                inputMode="decimal"
                                value={amount}
                                onChange={(
                                    event
                                ) =>
                                    setAmount(
                                        event.target.value.replace(
                                            /[^0-9,.]/g,
                                            ""
                                        )
                                    )
                                }
                            />
                        </div>

                        <div
                            className={
                                styles.formGroup
                            }
                        >
                            <label htmlFor="revenue-currency">
                                {
                                    t.fields.currency
                                }
                            </label>
                            <select
                                id="revenue-currency"
                                value={
                                    currencyCode
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCurrencyCode(
                                        event.target
                                            .value as CurrencyCode
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

                    <div
                        className={
                            styles.formRow
                        }
                    >
                        <div
                            className={
                                styles.formGroup
                            }
                        >
                            <label htmlFor="revenue-reference-date">
                                {
                                    t.fields.referenceDate
                                }
                            </label>
                            <input
                                id="revenue-reference-date"
                                type="date"
                                value={
                                    referenceDate
                                }
                                onChange={(
                                    event
                                ) =>
                                    setReferenceDate(
                                        event.target
                                            .value
                                    )
                                }
                            />
                        </div>

                        <div
                            className={
                                styles.formGroup
                            }
                        >
                            <label htmlFor="revenue-due-date">
                                {
                                    t.fields.dueDate
                                }
                            </label>
                            <input
                                id="revenue-due-date"
                                type="date"
                                value={dueDate}
                                onChange={(
                                    event
                                ) =>
                                    setDueDate(
                                        event.target
                                            .value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div
                        className={
                            styles.formGroup
                        }
                    >
                        <label htmlFor="revenue-notes">
                            {t.fields.notes}
                        </label>
                        <textarea
                            id="revenue-notes"
                            rows={3}
                            value={notes}
                            onChange={(
                                event
                            ) =>
                                setNotes(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </div>

                    {error && (
                        <CourtlyAlert
                            type="error"
                            message={error}
                        />
                    )}

                    <div
                        className={
                            styles.formActions
                        }
                    >
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={
                                onClose
                            }
                            disabled={
                                isPending
                            }
                        >
                            {
                                t.actions.cancel
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
                                ? t.actions.saving
                                : t.actions.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
