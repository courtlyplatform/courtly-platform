export type SubscriptionBillingCycle =
    | "WEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "SEMIANNUAL"
    | "ANNUAL"
    | "ONE_TIME";


export type CustomerSubscriptionStatus =
    | "ACTIVE"
    | "PAUSED"
    | "ENDED";


export type CurrencyCode =
    | "BRL"
    | "USD"
    | "EUR"
    | "CAD";


export type CustomerSubscription = {
    id: string;

    organizationId: string;

    customerId: string;

    activityId: string;

    amount: number;

    currencyCode: CurrencyCode;

    billingCycle: SubscriptionBillingCycle;

    status: CustomerSubscriptionStatus;

    startsAt: string;

    endsAt: string | null;

    createdAt: string;

    updatedAt: string;
};


export type CreateCustomerSubscriptionInput = {
    organizationId: string;

    customerId: string;

    activityId: string;

    amount: number;

    currencyCode: CurrencyCode;

    billingCycle: SubscriptionBillingCycle;

    startsAt: string;
};


export type UpdateCustomerSubscriptionInput = {
    id: string;

    organizationId: string;

    amount: number;

    currencyCode: CurrencyCode;

    billingCycle: SubscriptionBillingCycle;

    startsAt: string;
};


export type ChangeCustomerSubscriptionStatusInput = {
    id: string;

    organizationId: string;

    status:
        | "ACTIVE"
        | "PAUSED"
        | "ENDED";

    endsAt: string | null;
};