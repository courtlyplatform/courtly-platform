import type {
    CustomerSubscription,
    CurrencyCode,
    SubscriptionBillingCycle,
} from "../domain/customer-subscription";

import type {
    CustomerSubscriptionRepository,
} from "../domain/customer-subscription-repository";

import {
    customerSubscriptionSchema,
} from "./customer-subscription-schema";


type Params = {
    id?: string;

    organizationId: string;

    customerId: string;

    activityId: string;

    amount: number;

    currencyCode: CurrencyCode;

    billingCycle:
        SubscriptionBillingCycle;

    startsAt: string;
};


export async function saveCustomerSubscription(
    repository:
        CustomerSubscriptionRepository,

    params: Params
): Promise<CustomerSubscription> {

    const validated =
        customerSubscriptionSchema.parse({
            activityId:
                params.activityId,

            amount:
                params.amount,

            currencyCode:
                params.currencyCode,

            billingCycle:
                params.billingCycle,

            startsAt:
                params.startsAt,
        });


    if (!params.id) {

        return repository.create({
            organizationId:
                params.organizationId,

            customerId:
                params.customerId,

            activityId:
                validated.activityId,

            amount:
                validated.amount,

            currencyCode:
                validated.currencyCode,

            billingCycle:
                validated.billingCycle,

            startsAt:
                validated.startsAt,
        });
    }


    const existing =
        await repository.findById(
            params.organizationId,
            params.id
        );


    if (!existing) {
        throw new Error(
            "SUBSCRIPTION_NOT_FOUND"
        );
    }


    /*
     * Historical contracts are immutable after they end.
     *
     * If a client returns later, Courtly creates a new
     * subscription instead of rewriting the old contract.
     */
    if (
        existing.status ===
        "ENDED"
    ) {
        throw new Error(
            "ENDED_SUBSCRIPTION_IMMUTABLE"
        );
    }


    return repository.update({
        id:
            params.id,

        organizationId:
            params.organizationId,

        amount:
            validated.amount,

        currencyCode:
            validated.currencyCode,

        billingCycle:
            validated.billingCycle,

        startsAt:
            validated.startsAt,
    });
}