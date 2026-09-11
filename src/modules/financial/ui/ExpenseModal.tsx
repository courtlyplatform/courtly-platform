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

import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import {
    saveExpenseAction,
} from "../application/financial-actions";

import type {
    ExpenseCategory,
    ExpenseRecurrenceCycle,
    FinancialExpense,
} from "../domain/financial";

import styles from "./financial.module.css";

type Props = {
    open: boolean;
    categories: ExpenseCategory[];
    defaultCurrency: CurrencyCode;
    periodStart: string;
    expense?: FinancialExpense | null;
    onClose: () => void;
};

type FormState = {
    categoryId: string;
    description: string;
    amount: string;
    currencyCode: CurrencyCode;
    referenceDate: string;
    dueDate: string;
    notes: string;
    recurring: boolean;
    recurrenceCycle:
        ExpenseRecurrenceCycle;
};

export function ExpenseModal({
    open,
    categories,
    defaultCurrency,
    periodStart,
    expense = null,
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

    const initialState =
        useMemo<FormState>(
            () => ({
                categoryId:
                    expense?.categoryId ??
                    categories[0]?.id ??
                    "",
                description:
                    expense?.description ??
                    "",
                amount:
                    expense
                        ? formatEditableAmount(
                              expense.amount,
                              locale
                          )
                        : "",
                currencyCode:
                    expense?.currencyCode ??
                    defaultCurrency,
                referenceDate:
                    expense?.referenceDate ??
                    getDefaultDate(
                        periodStart
                    ),
                dueDate:
                    expense?.dueDate ??
                    getDefaultDate(
                        periodStart
                    ),
                notes:
                    expense?.notes ?? "",
                recurring: false,
                recurrenceCycle:
                    "MONTHLY",
            }),
            [
                categories,
                defaultCurrency,
                expense,
                locale,
                periodStart,
            ]
        );

    const [
        form,
        setForm,
    ] = useState<FormState>(
        initialState
    );

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const [
        isPending,
        startTransition,
    ] = useTransition();

    useEffect(
        () => {
            if (open) {
                setForm(initialState);
                setError(null);
            }
        },
        [open, initialState]
    );

    if (!open) {
        return null;
    }

    function handleSubmit(
        event: FormEvent
    ) {
        event.preventDefault();
        setError(null);

        const amount =
            parseAmount(
                form.amount
            );

        if (
            !form.categoryId ||
            !form.description.trim() ||
            amount === null ||
            amount < 0 ||
            !form.referenceDate ||
            !form.dueDate
        ) {
            setError(
                t.feedback.error.invalidData
            );
            return;
        }

        startTransition(
            async () => {
                const result =
                    await saveExpenseAction({
                        id:
                            expense?.id,
                        categoryId:
                            form.categoryId,
                        description:
                            form.description,
                        amount,
                        currencyCode:
                            form.currencyCode,
                        referenceDate:
                            form.referenceDate,
                        dueDate:
                            form.dueDate,
                        notes:
                            form.notes,
                        recurring:
                            expense
                                ? false
                                : form.recurring,
                        recurrenceCycle:
                            form.recurring
                                ? form.recurrenceCycle
                                : undefined,
                    });

                if (result.success === false) {
                    setError(
                        getActionError(
                            result.error,
                            t
                        )
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
                className={
                    styles.modal
                }
                role="dialog"
                aria-modal="true"
                aria-labelledby="financial-expense-modal-title"
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
                                t.expenses.eyebrow
                            }
                        </span>

                        <h2 id="financial-expense-modal-title">
                            {expense
                                ? t.expenses.editTitle
                                : t.expenses.newTitle}
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
                    className={
                        styles.form
                    }
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div
                        className={
                            styles.formGroup
                        }
                    >
                        <label htmlFor="expense-description">
                            {
                                t.fields.description
                            }
                        </label>
                        <input
                            id="expense-description"
                            value={
                                form.description
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
                            <label htmlFor="expense-category">
                                {
                                    t.fields.category
                                }
                            </label>
                            <select
                                id="expense-category"
                                value={
                                    form.categoryId
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            categoryId:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            >
                                {categories.map(
                                    (category) => (
                                        <option
                                            key={
                                                category.id
                                            }
                                            value={
                                                category.id
                                            }
                                        >
                                            {getCategoryLabel(
                                                category,
                                                t
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div
                            className={
                                styles.formGroup
                            }
                        >
                            <label htmlFor="expense-amount">
                                {
                                    t.fields.amount
                                }
                            </label>
                            <input
                                id="expense-amount"
                                inputMode="decimal"
                                value={
                                    form.amount
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
                                                    event
                                                        .target
                                                        .value
                                                ),
                                        })
                                    )
                                }
                            />
                        </div>

                        <div
                            className={
                                styles.formGroup
                            }
                        >
                            <label htmlFor="expense-currency">
                                {
                                    t.fields.currency
                                }
                            </label>
                            <select
                                id="expense-currency"
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
                                                event
                                                    .target
                                                    .value as CurrencyCode,
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
                            <label htmlFor="expense-reference-date">
                                {
                                    t.fields.referenceDate
                                }
                            </label>
                            <input
                                id="expense-reference-date"
                                type="date"
                                value={
                                    form.referenceDate
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            referenceDate:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </div>

                        <div
                            className={
                                styles.formGroup
                            }
                        >
                            <label htmlFor="expense-due-date">
                                {
                                    t.fields.dueDate
                                }
                            </label>
                            <input
                                id="expense-due-date"
                                type="date"
                                value={
                                    form.dueDate
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            dueDate:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </div>
                    </div>

                    {!expense && (
                        <div
                            className={
                                styles.recurrenceBox
                            }
                        >
                            <label
                                className={
                                    styles.checkboxLabel
                                }
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        form.recurring
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                recurring:
                                                    event
                                                        .target
                                                        .checked,
                                            })
                                        )
                                    }
                                />
                                {
                                    t.expenses.recurring
                                }
                            </label>

                            {form.recurring && (
                                <div
                                    className={
                                        styles.formGroup
                                    }
                                >
                                    <label htmlFor="expense-recurrence-cycle">
                                        {
                                            t.fields.recurrence
                                        }
                                    </label>
                                    <select
                                        id="expense-recurrence-cycle"
                                        value={
                                            form.recurrenceCycle
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,
                                                    recurrenceCycle:
                                                        event
                                                            .target
                                                            .value as ExpenseRecurrenceCycle,
                                                })
                                            )
                                        }
                                    >
                                        <option value="WEEKLY">
                                            {
                                                t.cycles.weekly
                                            }
                                        </option>
                                        <option value="MONTHLY">
                                            {
                                                t.cycles.monthly
                                            }
                                        </option>
                                        <option value="QUARTERLY">
                                            {
                                                t.cycles.quarterly
                                            }
                                        </option>
                                        <option value="SEMIANNUAL">
                                            {
                                                t.cycles.semiannual
                                            }
                                        </option>
                                        <option value="ANNUAL">
                                            {
                                                t.cycles.annual
                                            }
                                        </option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        className={
                            styles.formGroup
                        }
                    >
                        <label htmlFor="expense-notes">
                            {t.fields.notes}
                        </label>
                        <textarea
                            id="expense-notes"
                            rows={3}
                            value={
                                form.notes
                            }
                            onChange={(
                                event
                            ) =>
                                setForm(
                                    (
                                        current
                                    ) => ({
                                        ...current,
                                        notes:
                                            event
                                                .target
                                                .value,
                                    })
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

function getDefaultDate(
    periodStart: string
): string {
    const today = new Date();
    const local = [
        today.getFullYear(),
        String(
            today.getMonth() + 1
        ).padStart(2, "0"),
        String(
            today.getDate()
        ).padStart(2, "0"),
    ].join("-");

    return local.slice(0, 7) ===
        periodStart.slice(0, 7)
        ? local
        : periodStart;
}

function sanitizeAmountInput(
    value: string
): string {
    return value.replace(
        /[^0-9,.]/g,
        ""
    );
}

function parseAmount(
    value: string
): number | null {
    const normalized =
        value.trim().replace(
            ",",
            "."
        );

    const parsed = Number(
        normalized
    );

    return normalized &&
        Number.isFinite(parsed)
        ? parsed
        : null;
}

function formatEditableAmount(
    amount: number,
    locale: string
): string {
    return new Intl.NumberFormat(
        locale,
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false,
        }
    ).format(amount);
}

function getActionError(
    error: string,
    t: any
): string {
    if (error === "forbidden") {
        return t.feedback.error.forbidden;
    }

    if (error === "invalidData") {
        return t.feedback.error.invalidData;
    }

    return t.feedback.error.saveFailed;
}

function getCategoryLabel(
    category: ExpenseCategory,
    t: any
): string {
    if (
        category.code &&
        category.code in
            t.categoryNames
    ) {
        return t.categoryNames[
            category.code
        ];
    }

    return category.name;
}
