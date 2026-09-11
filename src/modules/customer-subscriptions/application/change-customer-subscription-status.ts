import type {
    CustomerSubscription,
    CustomerSubscriptionStatus,
} from "../domain/customer-subscription";

import type {
    CustomerSubscriptionRepository,
} from "../domain/customer-subscription-repository";


type Params = {
    organizationId: string;

    subscriptionId: string;

    status:
        | "ACTIVE"
        | "PAUSED"
        | "ENDED";
};


export async function changeCustomerSubscriptionStatus(
    repository:
        CustomerSubscriptionRepository,

    params: Params
): Promise<CustomerSubscription> {

    const current =
        await repository.findById(
            params.organizationId,
            params.subscriptionId
        );


    if (!current) {
        throw new Error(
            "SUBSCRIPTION_NOT_FOUND"
        );
    }


    if (
        current.status ===
        "ENDED"
    ) {
        throw new Error(
            "ENDED_SUBSCRIPTION_IMMUTABLE"
        );
    }


    validateTransition(
        current.status,
        params.status
    );


    const endsAt =
        params.status === "ENDED"
            ? getLocalDate()
            : null;


    return repository.changeStatus({
        id:
            params.subscriptionId,

        organizationId:
            params.organizationId,

        status:
            params.status,

        endsAt,
    });
}


function validateTransition(
    current:
        CustomerSubscriptionStatus,

    next:
        CustomerSubscriptionStatus
): void {

    if (
        current === next
    ) {
        return;
    }


    if (
        current === "ACTIVE" &&
        (
            next === "PAUSED" ||
            next === "ENDED"
        )
    ) {
        return;
    }


    if (
        current === "PAUSED" &&
        (
            next === "ACTIVE" ||
            next === "ENDED"
        )
    ) {
        return;
    }


    throw new Error(
        "INVALID_SUBSCRIPTION_STATUS_TRANSITION"
    );
}


function getLocalDate(): string {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}