import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

import type {
    CreateExpenseCategoryInput,
    ExpenseCategory,
    FinancialEntryStatus,
    FinancialExpense,
    FinancialRevenue,
    SaveExpenseInput,
    SaveManualRevenueInput,
} from "./financial";

export type DateRange = {
    start: string;
    end: string;
};

export interface FinancialRepository {
    syncPeriod(
        referenceDate: string
    ): Promise<void>;

    listRevenues(
        organizationId: string,
        range: DateRange
    ): Promise<FinancialRevenue[]>;

    listExpenses(
        organizationId: string,
        range: DateRange
    ): Promise<FinancialExpense[]>;

    listCategories(
        organizationId: string
    ): Promise<ExpenseCategory[]>;

    calculateMrr(
        organizationId: string,
        currencyCode: CurrencyCode
    ): Promise<{
        mrr: number;
        activeSubscriptions: number;
        activeCustomers: number;
    }>;

    createCategory(
        input: CreateExpenseCategoryInput
    ): Promise<ExpenseCategory>;

    saveExpense(
        input: SaveExpenseInput
    ): Promise<void>;

    saveManualRevenue(
        input: SaveManualRevenueInput
    ): Promise<void>;

    changeExpenseStatus(
        organizationId: string,
        expenseId: string,
        status: FinancialEntryStatus
    ): Promise<void>;

    changeRevenueStatus(
        organizationId: string,
        revenueId: string,
        status: FinancialEntryStatus
    ): Promise<void>;
}
