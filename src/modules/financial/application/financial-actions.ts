"use server";

import {
    revalidatePath,
} from "next/cache";

import {
    createClient,
} from "@/shared/database/supabase/server";

import {
    canManageFinancialData,
    getCurrentOrganizationFinancialContext,
} from "@/shared/auth/get-current-organization-financial-context";

import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import type {
    ExpenseRecurrenceCycle,
    FinancialEntryStatus,
} from "../domain/financial";

import {
    SupabaseFinancialRepository,
} from "../infrastructure/supabase-financial-repository";

import {
    expenseCategorySchema,
    expenseSchema,
    financialStatusSchema,
    manualRevenueSchema,
    periodReferenceSchema,
} from "./financial-schema";

export type FinancialActionError =
    | "forbidden"
    | "invalidData"
    | "duplicateCategory"
    | "saveFailed"
    | "statusUpdateFailed"
    | "syncFailed";

export type FinancialActionResult =
    | {
        success: true;
    }
    | {
        success: false;
        error: FinancialActionError;
    };

type SaveExpenseRequest = {
    id?: string;
    categoryId: string;
    description: string;
    amount: number;
    currencyCode: CurrencyCode;
    referenceDate: string;
    dueDate: string;
    notes?: string | null;
    recurring: boolean;
    recurrenceCycle?: ExpenseRecurrenceCycle;
};

type SaveManualRevenueRequest = {
    id?: string;
    description: string;
    amount: number;
    currencyCode: CurrencyCode;
    referenceDate: string;
    dueDate: string;
    notes?: string | null;
};

export async function syncFinancialPeriodAction(
    referenceDate: string
): Promise<FinancialActionResult> {
    try {
        const parsed =
            periodReferenceSchema.parse(
                referenceDate
            );

        const {
            repository,
        } = await getAuthorizedRepository();

        await repository.syncPeriod(
            parsed
        );

        revalidatePath("/financial");

        return {
            success: true,
        };
    } catch (error) {
        console.error(
            "[FINANCIAL] Failed to sync period",
            error
        );

        return {
            success: false,
            error:
                mapAuthorizationError(
                    error
                ) ?? "syncFailed",
        };
    }
}

export async function saveExpenseAction(
    request: SaveExpenseRequest
): Promise<FinancialActionResult> {
    try {
        const parsed =
            expenseSchema.parse(
                request
            );

        const {
            context,
            repository,
        } = await getAuthorizedRepository();

        await repository.saveExpense({
            ...parsed,
            organizationId:
                context.organizationId,
        });

        await repository.syncPeriod(
            parsed.referenceDate
        );

        revalidatePath("/financial");

        return {
            success: true,
        };
    } catch (error) {
        console.error(
            "[FINANCIAL] Failed to save expense",
            error
        );

        return {
            success: false,
            error:
                mapAuthorizationError(
                    error
                ) ??
                mapValidationError(
                    error
                ) ??
                "saveFailed",
        };
    }
}

export async function saveManualRevenueAction(
    request: SaveManualRevenueRequest
): Promise<FinancialActionResult> {
    try {
        const parsed =
            manualRevenueSchema.parse(
                request
            );

        const {
            context,
            repository,
        } = await getAuthorizedRepository();

        await repository.saveManualRevenue({
            ...parsed,
            organizationId:
                context.organizationId,
        });

        await repository.syncPeriod(
            parsed.referenceDate
        );

        revalidatePath("/financial");

        return {
            success: true,
        };
    } catch (error) {
        console.error(
            "[FINANCIAL] Failed to save manual revenue",
            error
        );

        return {
            success: false,
            error:
                mapAuthorizationError(
                    error
                ) ??
                mapValidationError(
                    error
                ) ??
                "saveFailed",
        };
    }
}

export async function createExpenseCategoryAction(
    name: string
): Promise<FinancialActionResult> {
    try {
        const parsed =
            expenseCategorySchema.parse({
                name,
            });

        const {
            context,
            repository,
        } = await getAuthorizedRepository();

        await repository.createCategory({
            organizationId:
                context.organizationId,
            name: parsed.name,
        });

        revalidatePath("/financial");

        return {
            success: true,
        };
    } catch (error) {
        console.error(
            "[FINANCIAL] Failed to create expense category",
            error
        );

        const message =
            error instanceof Error
                ? error.message.toLowerCase()
                : "";

        return {
            success: false,
            error:
                mapAuthorizationError(
                    error
                ) ??
                (
                    message.includes(
                        "duplicate"
                    ) ||
                    message.includes(
                        "uq_expense_categories"
                    )
                        ? "duplicateCategory"
                        : mapValidationError(
                              error
                          ) ??
                          "saveFailed"
                ),
        };
    }
}

export async function changeExpenseStatusAction(
    expenseId: string,
    status: FinancialEntryStatus
): Promise<FinancialActionResult> {
    return changeStatus(
        "expense",
        expenseId,
        status
    );
}

export async function changeRevenueStatusAction(
    revenueId: string,
    status: FinancialEntryStatus
): Promise<FinancialActionResult> {
    return changeStatus(
        "revenue",
        revenueId,
        status
    );
}

async function changeStatus(
    type: "expense" | "revenue",
    id: string,
    status: FinancialEntryStatus
): Promise<FinancialActionResult> {
    try {
        const parsedStatus =
            financialStatusSchema.parse(
                status
            );

        const {
            context,
            repository,
        } = await getAuthorizedRepository();

        if (type === "expense") {
            await repository.changeExpenseStatus(
                context.organizationId,
                id,
                parsedStatus
            );
        } else {
            await repository.changeRevenueStatus(
                context.organizationId,
                id,
                parsedStatus
            );
        }

        revalidatePath("/financial");

        return {
            success: true,
        };
    } catch (error) {
        console.error(
            `[FINANCIAL] Failed to change ${type} status`,
            error
        );

        return {
            success: false,
            error:
                mapAuthorizationError(
                    error
                ) ??
                "statusUpdateFailed",
        };
    }
}

async function getAuthorizedRepository() {
    const supabase =
        await createClient();

    const context =
        await getCurrentOrganizationFinancialContext(
            supabase
        );

    if (
        !canManageFinancialData(
            context.role
        )
    ) {
        throw new Error(
            "FINANCIAL_FORBIDDEN"
        );
    }

    return {
        context,
        repository:
            new SupabaseFinancialRepository(
                supabase
            ),
    };
}

function mapAuthorizationError(
    error: unknown
): FinancialActionError | null {
    const message =
        error instanceof Error
            ? error.message
            : "";

    if (
        message.includes(
            "FINANCIAL_FORBIDDEN"
        ) ||
        message.toLowerCase().includes(
            "not allowed"
        )
    ) {
        return "forbidden";
    }

    return null;
}

function mapValidationError(
    error: unknown
): FinancialActionError | null {
    const message =
        error instanceof Error
            ? error.message.toLowerCase()
            : "";

    if (
        message.includes("zod") ||
        message.includes("invalid") ||
        message.includes("required")
    ) {
        return "invalidData";
    }

    return null;
}
