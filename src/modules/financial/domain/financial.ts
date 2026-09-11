import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";

export type FinancialEntryStatus =
    | "PENDING"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";

export type FinancialRevenueSource =
    | "SUBSCRIPTION"
    | "MANUAL";

export type ExpenseRecurrenceCycle =
    | "WEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "SEMIANNUAL"
    | "ANNUAL";

export type FinancialPeriodStatus =
    | "OPEN"
    | "CLOSED";

export type ExpenseCategory = {
    id: string;
    organizationId: string;
    code: string | null;
    name: string;
    description: string | null;
    system: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ExpenseRecurrence = {
    id: string;
    organizationId: string;
    categoryId: string;
    description: string;
    amount: number;
    currencyCode: CurrencyCode;
    recurrenceCycle: ExpenseRecurrenceCycle;
    startsAt: string;
    endsAt: string | null;
    active: boolean;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export type FinancialExpense = {
    id: string;
    organizationId: string;
    categoryId: string;
    recurrenceId: string | null;
    description: string;
    amount: number;
    currencyCode: CurrencyCode;
    referenceDate: string;
    dueDate: string;
    paidAt: string | null;
    status: FinancialEntryStatus;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export type FinancialRevenue = {
    id: string;
    organizationId: string;
    customerId: string | null;
    customerName: string | null;
    customerDocumentType: string | null;
    customerDocumentNumber: string | null;
    customerSubscriptionId: string | null;
    activityId: string | null;
    activityName: string | null;
    source: FinancialRevenueSource;
    description: string;
    amount: number;
    currencyCode: CurrencyCode;
    referenceDate: string;
    dueDate: string;
    paidAt: string | null;
    status: FinancialEntryStatus;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export type FinancialSummary = {
    mrr: number;
    billedRevenue: number;
    receivedRevenue: number;
    receivableRevenue: number;
    overdueRevenue: number;
    totalExpenses: number;
    paidExpenses: number;
    netProfit: number;
    netMargin: number;
    activeCustomers: number;
    activeSubscriptions: number;
};

export type FinancialMonthlyPoint = {
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
};

export type ExpenseCategoryTotal = {
    categoryId: string;
    categoryCode: string | null;
    categoryName: string;
    amount: number;
};

export type FinancialReportRow = {
    period: string;
    billedRevenue: number;
    receivedRevenue: number;
    expenses: number;
    profit: number;
    margin: number;
};

export type FinancialPageData = {
    periodStart: string;
    periodEnd: string;
    summary: FinancialSummary;
    revenues: FinancialRevenue[];
    expenses: FinancialExpense[];
    categories: ExpenseCategory[];
    monthlyHistory: FinancialMonthlyPoint[];
    expensesByCategory: ExpenseCategoryTotal[];
    reports: FinancialReportRow[];
};

export type CreateExpenseCategoryInput = {
    organizationId: string;
    name: string;
};

export type SaveExpenseInput = {
    id?: string;
    organizationId: string;
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

export type SaveManualRevenueInput = {
    id?: string;
    organizationId: string;
    customerId?: string | null;
    activityId?: string | null;
    description: string;
    amount: number;
    currencyCode: CurrencyCode;
    referenceDate: string;
    dueDate: string;
    notes?: string | null;
};
