import type {
    SupabaseClient,
} from "@supabase/supabase-js";

import type {
    CurrencyCode,
    SubscriptionBillingCycle,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import type {
    DateRange,
    FinancialRepository,
} from "../domain/financial-repository";

import type {
    CreateExpenseCategoryInput,
    ExpenseCategory,
    FinancialEntryStatus,
    FinancialExpense,
    FinancialRevenue,
    SaveExpenseInput,
    SaveManualRevenueInput,
} from "../domain/financial";

type ExpenseCategoryRow = {
    id: string;
    organization_id: string;
    code: string | null;
    name: string;
    description: string | null;
    system: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
};

type FinancialExpenseRow = {
    id: string;
    organization_id: string;
    category_id: string;
    recurrence_id: string | null;
    description: string;
    amount: number | string;
    currency_code: CurrencyCode;
    reference_date: string;
    due_date: string;
    paid_at: string | null;
    status: FinancialEntryStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

type FinancialRevenueRow = {
    id: string;
    organization_id: string;
    customer_id: string | null;
    customer_subscription_id: string | null;
    activity_id: string | null;
    source: "SUBSCRIPTION" | "MANUAL";
    description: string;
    amount: number | string;
    currency_code: CurrencyCode;
    reference_date: string;
    due_date: string;
    paid_at: string | null;
    status: FinancialEntryStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

type CustomerFinancialIdentityRow = {
    id: string;
    name: string;
    document_type: string | null;
    document_number: string | null;
};

type ActivityNameRow = {
    id: string;
    name: string;
};

type ActiveSubscriptionRow = {
    customer_id: string;
    amount: number | string;
    currency_code: CurrencyCode;
    billing_cycle: SubscriptionBillingCycle;
};

const CATEGORY_FIELDS = `
    id,
    organization_id,
    code,
    name,
    description,
    system,
    active,
    created_at,
    updated_at
`;

const EXPENSE_FIELDS = `
    id,
    organization_id,
    category_id,
    recurrence_id,
    description,
    amount,
    currency_code,
    reference_date,
    due_date,
    paid_at,
    status,
    notes,
    created_at,
    updated_at
`;

const REVENUE_FIELDS = `
    id,
    organization_id,
    customer_id,
    customer_subscription_id,
    activity_id,
    source,
    description,
    amount,
    currency_code,
    reference_date,
    due_date,
    paid_at,
    status,
    notes,
    created_at,
    updated_at
`;

export class SupabaseFinancialRepository
implements FinancialRepository {
    constructor(
        private readonly supabase: SupabaseClient
    ) {}

    async syncPeriod(
        referenceDate: string
    ): Promise<void> {
        const {
            error,
        } = await this.supabase.rpc(
            "sync_financial_period",
            {
                p_reference_date:
                    referenceDate,
            }
        );

        if (error) {
            throw new Error(
                `Failed to sync financial period: ${error.message}`
            );
        }
    }

    async listRevenues(
        organizationId: string,
        range: DateRange
    ): Promise<FinancialRevenue[]> {

        const {
            data,
            error,
        } =
            await this.supabase
                .from(
                    "financial_revenues"
                )
                .select(
                    REVENUE_FIELDS
                )
                .eq(
                    "organization_id",
                    organizationId
                )
                .gte(
                    "reference_date",
                    range.start
                )
                .lte(
                    "reference_date",
                    range.end
                )
                .order(
                    "reference_date",
                    {
                        ascending:
                            false,
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                );


        if (error) {

            throw new Error(
                `Failed to list financial revenues: ${error.message}`
            );
        }


        const rows =
            (
                data ??
                []
            ) as
                FinancialRevenueRow[];


        if (
            rows.length ===
            0
        ) {

            return [];
        }


        /* ========================================================
        CUSTOMERS
        ======================================================== */

        const customerIds =
            Array.from(
                new Set(
                    rows
                        .map(
                            (
                                row
                            ) =>
                                row.customer_id
                        )
                        .filter(
                            (
                                id
                            ): id is string =>
                                Boolean(
                                    id
                                )
                        )
                )
            );


        const customerById =
            new Map<
                string,
                CustomerFinancialIdentityRow
            >();


        if (
            customerIds.length >
            0
        ) {

            const {
                data:
                    customerData,

                error:
                    customerError,
            } =
                await this.supabase
                    .from(
                        "customers"
                    )
                    .select(
                        `
                        id,
                        name,
                        document_type,
                        document_number
                        `
                    )
                    .eq(
                        "organization_id",
                        organizationId
                    )
                    .in(
                        "id",
                        customerIds
                    );


            if (
                customerError
            ) {

                throw new Error(
                    `Failed to resolve financial revenue customers: ${customerError.message}`
                );
            }


            for (
                const customer
                of (
                    customerData ??
                    []
                ) as
                    CustomerFinancialIdentityRow[]
            ) {

                customerById.set(
                    customer.id,
                    customer
                );
            }
        }


        /* ========================================================
        ACTIVITIES / SERVICES
        ======================================================== */

        const activityIds =
            Array.from(
                new Set(
                    rows
                        .map(
                            (
                                row
                            ) =>
                                row.activity_id
                        )
                        .filter(
                            (
                                id
                            ): id is string =>
                                Boolean(
                                    id
                                )
                        )
                )
            );


        const activityNameById =
            new Map<
                string,
                string
            >();


        if (
            activityIds.length >
            0
        ) {

            const {
                data:
                    activityData,

                error:
                    activityError,
            } =
                await this.supabase
                    .from(
                        "activities"
                    )
                    .select(
                        "id, name"
                    )
                    .eq(
                        "organization_id",
                        organizationId
                    )
                    .in(
                        "id",
                        activityIds
                    );


            if (
                activityError
            ) {

                throw new Error(
                    `Failed to resolve financial revenue activities: ${activityError.message}`
                );
            }


            for (
                const activity
                of (
                    activityData ??
                    []
                ) as
                    ActivityNameRow[]
            ) {

                activityNameById.set(
                    activity.id,
                    activity.name
                );
            }
        }


        /* ========================================================
        DOMAIN MAPPING
        ======================================================== */

        return rows.map(
            (
                row
            ) => {

                const baseRevenue =
                    mapRevenue(
                        row
                    );


                const customer =
                    row.customer_id
                        ? customerById.get(
                            row.customer_id
                        ) ??
                        null

                        : null;


                return {
                    ...baseRevenue,

                    customerName:
                        customer?.name ??
                        null,

                    customerDocumentType:
                        customer
                            ?.document_type ??
                        null,

                    customerDocumentNumber:
                        customer
                            ?.document_number ??
                        null,

                    activityName:
                        row.activity_id
                            ? activityNameById.get(
                                row.activity_id
                            ) ??
                            null

                            : null,
                };
            }
        );
    }

    async listExpenses(
        organizationId: string,
        range: DateRange
    ): Promise<FinancialExpense[]> {
        const {
            data,
            error,
        } = await this.supabase
            .from("financial_expenses")
            .select(EXPENSE_FIELDS)
            .eq(
                "organization_id",
                organizationId
            )
            .gte(
                "reference_date",
                range.start
            )
            .lte(
                "reference_date",
                range.end
            )
            .order(
                "reference_date",
                {
                    ascending: false,
                }
            )
            .order(
                "created_at",
                {
                    ascending: false,
                }
            );

        if (error) {
            throw new Error(
                `Failed to list financial expenses: ${error.message}`
            );
        }

        return (
            (data ?? []) as FinancialExpenseRow[]
        ).map(mapExpense);
    }

    async listCategories(
        organizationId: string
    ): Promise<ExpenseCategory[]> {
        const {
            data,
            error,
        } = await this.supabase
            .from("expense_categories")
            .select(CATEGORY_FIELDS)
            .eq(
                "organization_id",
                organizationId
            )
            .eq(
                "active",
                true
            )
            .order(
                "system",
                {
                    ascending: false,
                }
            )
            .order("name");

        if (error) {
            throw new Error(
                `Failed to list expense categories: ${error.message}`
            );
        }

        return (
            (data ?? []) as ExpenseCategoryRow[]
        ).map(mapCategory);
    }

    async calculateMrr(
        organizationId: string,
        currencyCode: CurrencyCode
    ): Promise<{
        mrr: number;
        activeSubscriptions: number;
        activeCustomers: number;
    }> {
        const {
            data,
            error,
        } = await this.supabase
            .from("customer_subscriptions")
            .select(
                "customer_id, amount, currency_code, billing_cycle"
            )
            .eq(
                "organization_id",
                organizationId
            )
            .eq(
                "status",
                "ACTIVE"
            )
            .eq(
                "currency_code",
                currencyCode
            );

        if (error) {
            throw new Error(
                `Failed to calculate MRR: ${error.message}`
            );
        }

        const rows =
            (data ?? []) as ActiveSubscriptionRow[];

        const mrr = rows.reduce(
            (total, item) =>
                total + monthlyEquivalent(
                    Number(item.amount),
                    item.billing_cycle
                ),
            0
        );

        return {
            mrr,
            activeSubscriptions:
                rows.length,
            activeCustomers:
                new Set(
                    rows.map(
                        (item) =>
                            item.customer_id
                    )
                ).size,
        };
    }

    async createCategory(
        input: CreateExpenseCategoryInput
    ): Promise<ExpenseCategory> {
        const {
            data,
            error,
        } = await this.supabase
            .from("expense_categories")
            .insert({
                organization_id:
                    input.organizationId,
                name:
                    input.name.trim(),
                system: false,
                active: true,
            })
            .select(CATEGORY_FIELDS)
            .single();

        if (error) {
            throw new Error(
                `Failed to create expense category: ${error.message}`
            );
        }

        return mapCategory(
            data as ExpenseCategoryRow
        );
    }

    async saveExpense(
        input: SaveExpenseInput
    ): Promise<void> {
        if (input.id) {
            const {
                error,
            } = await this.supabase
                .from("financial_expenses")
                .update({
                    category_id:
                        input.categoryId,
                    description:
                        input.description.trim(),
                    amount:
                        input.amount,
                    currency_code:
                        input.currencyCode,
                    reference_date:
                        input.referenceDate,
                    due_date:
                        input.dueDate,
                    notes:
                        normalizeOptionalText(
                            input.notes
                        ),
                })
                .eq(
                    "organization_id",
                    input.organizationId
                )
                .eq("id", input.id);

            if (error) {
                throw new Error(
                    `Failed to update financial expense: ${error.message}`
                );
            }

            return;
        }

        if (input.recurring) {
            if (!input.recurrenceCycle) {
                throw new Error(
                    "RECURRENCE_CYCLE_REQUIRED"
                );
            }

            const {
                error,
            } = await this.supabase
                .from("expense_recurrences")
                .insert({
                    organization_id:
                        input.organizationId,
                    category_id:
                        input.categoryId,
                    description:
                        input.description.trim(),
                    amount:
                        input.amount,
                    currency_code:
                        input.currencyCode,
                    recurrence_cycle:
                        input.recurrenceCycle,
                    starts_at:
                        input.referenceDate,
                    first_due_date:
                        input.dueDate,
                    active: true,
                    notes:
                        normalizeOptionalText(
                            input.notes
                        ),
                });

            if (error) {
                throw new Error(
                    `Failed to create expense recurrence: ${error.message}`
                );
            }

            await this.syncPeriod(
                input.referenceDate
            );

            return;
        }

        const status: FinancialEntryStatus =
            input.dueDate < getToday()
                ? "OVERDUE"
                : "PENDING";

        const {
            error,
        } = await this.supabase
            .from("financial_expenses")
            .insert({
                organization_id:
                    input.organizationId,
                category_id:
                    input.categoryId,
                recurrence_id: null,
                description:
                    input.description.trim(),
                amount:
                    input.amount,
                currency_code:
                    input.currencyCode,
                reference_date:
                    input.referenceDate,
                due_date:
                    input.dueDate,
                status,
                notes:
                    normalizeOptionalText(
                        input.notes
                    ),
            });

        if (error) {
            throw new Error(
                `Failed to create financial expense: ${error.message}`
            );
        }
    }

    async saveManualRevenue(
        input: SaveManualRevenueInput
    ): Promise<void> {
        if (input.id) {
            const {
                error,
            } = await this.supabase
                .from("financial_revenues")
                .update({
                    customer_id:
                        input.customerId ?? null,
                    activity_id:
                        input.activityId ?? null,
                    description:
                        input.description.trim(),
                    amount:
                        input.amount,
                    currency_code:
                        input.currencyCode,
                    reference_date:
                        input.referenceDate,
                    due_date:
                        input.dueDate,
                    notes:
                        normalizeOptionalText(
                            input.notes
                        ),
                })
                .eq(
                    "organization_id",
                    input.organizationId
                )
                .eq("id", input.id)
                .eq("source", "MANUAL");

            if (error) {
                throw new Error(
                    `Failed to update manual revenue: ${error.message}`
                );
            }

            return;
        }

        const status: FinancialEntryStatus =
            input.dueDate < getToday()
                ? "OVERDUE"
                : "PENDING";

        const {
            error,
        } = await this.supabase
            .from("financial_revenues")
            .insert({
                organization_id:
                    input.organizationId,
                customer_id:
                    input.customerId ?? null,
                customer_subscription_id:
                    null,
                activity_id:
                    input.activityId ?? null,
                source:
                    "MANUAL",
                description:
                    input.description.trim(),
                amount:
                    input.amount,
                currency_code:
                    input.currencyCode,
                reference_date:
                    input.referenceDate,
                due_date:
                    input.dueDate,
                status,
                notes:
                    normalizeOptionalText(
                        input.notes
                    ),
            });

        if (error) {
            throw new Error(
                `Failed to create manual revenue: ${error.message}`
            );
        }
    }

    async changeExpenseStatus(
        organizationId: string,
        expenseId: string,
        status: FinancialEntryStatus
    ): Promise<void> {
        const {
            error,
        } = await this.supabase
            .from("financial_expenses")
            .update({
                status,
                paid_at:
                    status === "PAID"
                        ? new Date().toISOString()
                        : null,
            })
            .eq(
                "organization_id",
                organizationId
            )
            .eq("id", expenseId);

        if (error) {
            throw new Error(
                `Failed to change expense status: ${error.message}`
            );
        }
    }

    async changeRevenueStatus(
        organizationId: string,
        revenueId: string,
        status: FinancialEntryStatus
    ): Promise<void> {
        const {
            error,
        } = await this.supabase
            .from("financial_revenues")
            .update({
                status,
                paid_at:
                    status === "PAID"
                        ? new Date().toISOString()
                        : null,
            })
            .eq(
                "organization_id",
                organizationId
            )
            .eq("id", revenueId);

        if (error) {
            throw new Error(
                `Failed to change revenue status: ${error.message}`
            );
        }
    }
}

function mapCategory(
    row: ExpenseCategoryRow
): ExpenseCategory {
    return {
        id: row.id,
        organizationId:
            row.organization_id,
        code: row.code,
        name: row.name,
        description:
            row.description,
        system: row.system,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapExpense(
    row: FinancialExpenseRow
): FinancialExpense {
    return {
        id: row.id,
        organizationId:
            row.organization_id,
        categoryId:
            row.category_id,
        recurrenceId:
            row.recurrence_id,
        description:
            row.description,
        amount: Number(row.amount),
        currencyCode:
            row.currency_code,
        referenceDate:
            row.reference_date,
        dueDate: row.due_date,
        paidAt: row.paid_at,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapRevenue(
    row:
        FinancialRevenueRow
): FinancialRevenue {

    return {
        id:
            row.id,

        organizationId:
            row.organization_id,

        customerId:
            row.customer_id,

        customerName:
            null,

        customerDocumentType:
            null,

        customerDocumentNumber:
            null,

        customerSubscriptionId:
            row.customer_subscription_id,

        activityId:
            row.activity_id,

        activityName:
            null,

        source:
            row.source,

        description:
            row.description,

        amount:
            Number(
                row.amount
            ),

        currencyCode:
            row.currency_code,

        referenceDate:
            row.reference_date,

        dueDate:
            row.due_date,

        paidAt:
            row.paid_at,

        status:
            row.status,

        notes:
            row.notes,

        createdAt:
            row.created_at,

        updatedAt:
            row.updated_at,
    };
}

function monthlyEquivalent(
    amount: number,
    cycle: SubscriptionBillingCycle
): number {
    switch (cycle) {
        case "WEEKLY":
            return amount * 52 / 12;
        case "MONTHLY":
            return amount;
        case "QUARTERLY":
            return amount / 3;
        case "SEMIANNUAL":
            return amount / 6;
        case "ANNUAL":
            return amount / 12;
        case "ONE_TIME":
            return 0;
    }
}

function normalizeOptionalText(
    value?: string | null
): string | null {
    const normalized =
        value?.trim() ?? "";

    return normalized || null;
}

function getToday(): string {
    const now = new Date();

    return [
        now.getFullYear(),
        String(
            now.getMonth() + 1
        ).padStart(2, "0"),
        String(
            now.getDate()
        ).padStart(2, "0"),
    ].join("-");
}
