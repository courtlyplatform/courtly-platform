import type {
    ChangeCustomerSubscriptionStatusInput,
    CreateCustomerSubscriptionInput,
    CustomerSubscription,
    UpdateCustomerSubscriptionInput,
} from "./customer-subscription";


export interface CustomerSubscriptionRepository {

    listByCustomer(
        organizationId: string,
        customerId: string
    ): Promise<CustomerSubscription[]>;


    findById(
        organizationId: string,
        subscriptionId: string
    ): Promise<CustomerSubscription | null>;


    create(
        input: CreateCustomerSubscriptionInput
    ): Promise<CustomerSubscription>;


    update(
        input: UpdateCustomerSubscriptionInput
    ): Promise<CustomerSubscription>;


    changeStatus(
        input: ChangeCustomerSubscriptionStatusInput
    ): Promise<CustomerSubscription>;
}