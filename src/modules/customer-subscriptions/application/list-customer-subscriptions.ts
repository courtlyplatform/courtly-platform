import type {
    CustomerSubscription,
} from "../domain/customer-subscription";

import type {
    CustomerSubscriptionRepository,
} from "../domain/customer-subscription-repository";


export async function listCustomerSubscriptions(
    repository:
        CustomerSubscriptionRepository,

    organizationId: string,

    customerId: string
): Promise<CustomerSubscription[]> {

    return repository.listByCustomer(
        organizationId,
        customerId
    );
}