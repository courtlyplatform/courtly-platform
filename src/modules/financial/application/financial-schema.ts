import {
    z,
} from "zod";

import {
    currencyCodes,
} from "@/modules/customer-subscriptions/application/customer-subscription-schema";

export const financialEntryStatuses = [
    "PENDING",
    "PAID",
    "OVERDUE",
    "CANCELLED",
] as const;

export const expenseRecurrenceCycles = [
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "SEMIANNUAL",
    "ANNUAL",
] as const;

const dateSchema =
    z.string().regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Invalid date."
    );

export const expenseSchema =
    z.object({
        id:
            z.string()
                .uuid()
                .optional(),

        categoryId:
            z.string()
                .uuid(),

        description:
            z.string()
                .trim()
                .min(1)
                .max(180),

        amount:
            z.number()
                .finite()
                .nonnegative()
                .max(9999999999.99),

        currencyCode:
            z.enum(currencyCodes),

        referenceDate:
            dateSchema,

        dueDate:
            dateSchema,

        notes:
            z.string()
                .trim()
                .max(2000)
                .optional()
                .nullable(),

        recurring:
            z.boolean(),

        recurrenceCycle:
            z.enum(
                expenseRecurrenceCycles
            )
                .optional(),
    })
    .superRefine(
        (value, context) => {
            if (
                value.recurring &&
                !value.recurrenceCycle
            ) {
                context.addIssue({
                    code:
                        z.ZodIssueCode.custom,
                    path: [
                        "recurrenceCycle",
                    ],
                    message:
                        "Recurrence cycle is required.",
                });
            }
        }
    );

export const manualRevenueSchema =
    z.object({
        id:
            z.string()
                .uuid()
                .optional(),

        customerId:
            z.string()
                .uuid()
                .optional()
                .nullable(),

        activityId:
            z.string()
                .uuid()
                .optional()
                .nullable(),

        description:
            z.string()
                .trim()
                .min(1)
                .max(180),

        amount:
            z.number()
                .finite()
                .nonnegative()
                .max(9999999999.99),

        currencyCode:
            z.enum(currencyCodes),

        referenceDate:
            dateSchema,

        dueDate:
            dateSchema,

        notes:
            z.string()
                .trim()
                .max(2000)
                .optional()
                .nullable(),
    });

export const expenseCategorySchema =
    z.object({
        name:
            z.string()
                .trim()
                .min(1)
                .max(120),
    });

export const periodReferenceSchema =
    dateSchema;

export const financialStatusSchema =
    z.enum(financialEntryStatuses);
