import {
    z,
} from "zod";


export const currencyCodes = [
    "BRL",
    "USD",
    "EUR",
    "CAD",
] as const;


export const billingCycles = [
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "SEMIANNUAL",
    "ANNUAL",
    "ONE_TIME",
] as const;


export const customerSubscriptionSchema =
    z.object({

        activityId:
            z.string()
                .uuid(
                    "Invalid activity."
                ),

        amount:
            z.number()
                .finite()
                .nonnegative(
                    "Amount cannot be negative."
                )
                .max(
                    9999999999.99,
                    "Amount is too high."
                ),

        currencyCode:
            z.enum(
                currencyCodes
            ),

        billingCycle:
            z.enum(
                billingCycles
            ),

        startsAt:
            z.string()
                .regex(
                    /^\d{4}-\d{2}-\d{2}$/,
                    "Invalid start date."
                ),
    });


export type CustomerSubscriptionFormData =
    z.infer<
        typeof customerSubscriptionSchema
    >;