import type {
    SupabaseClient,
} from "@supabase/supabase-js";

import type {
    ChangeCustomerSubscriptionStatusInput,
    CreateCustomerSubscriptionInput,
    CurrencyCode,
    CustomerSubscription,
    CustomerSubscriptionStatus,
    SubscriptionBillingCycle,
    UpdateCustomerSubscriptionInput,
} from "../domain/customer-subscription";

import type {
    CustomerSubscriptionRepository,
} from "../domain/customer-subscription-repository";


type SubscriptionRow = {
    id: string;

    organization_id: string;

    customer_id: string;

    activity_id: string;

    amount:
        number | string;

    currency_code:
        CurrencyCode;

    billing_cycle:
        SubscriptionBillingCycle;

    status:
        CustomerSubscriptionStatus;

    starts_at: string;

    ends_at:
        string | null;

    created_at: string;

    updated_at: string;
};


const SELECT_FIELDS = `
    id,
    organization_id,
    customer_id,
    activity_id,
    amount,
    currency_code,
    billing_cycle,
    status,
    starts_at,
    ends_at,
    created_at,
    updated_at
`;


export class SupabaseCustomerSubscriptionRepository
implements CustomerSubscriptionRepository {

    constructor(
        private readonly supabase:
            SupabaseClient
    ) {}


    async listByCustomer(
        organizationId: string,
        customerId: string
    ): Promise<CustomerSubscription[]> {

        const {
            data,
            error,
        } =
            await this.supabase
                .from(
                    "customer_subscriptions"
                )
                .select(
                    SELECT_FIELDS
                )
                .eq(
                    "organization_id",
                    organizationId
                )
                .eq(
                    "customer_id",
                    customerId
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                );


        if (error) {
            throw new Error(
                `Failed to list customer subscriptions: ${error.message}`
            );
        }


        return (
            data as
                SubscriptionRow[]
        ).map(
            mapSubscriptionToDomain
        );
    }


    async findById(
        organizationId: string,
        subscriptionId: string
    ): Promise<CustomerSubscription | null> {

        const {
            data,
            error,
        } =
            await this.supabase
                .from(
                    "customer_subscriptions"
                )
                .select(
                    SELECT_FIELDS
                )
                .eq(
                    "organization_id",
                    organizationId
                )
                .eq(
                    "id",
                    subscriptionId
                )
                .maybeSingle();


        if (error) {
            throw new Error(
                `Failed to find customer subscription: ${error.message}`
            );
        }


        if (!data) {
            return null;
        }


        return mapSubscriptionToDomain(
            data as
                SubscriptionRow
        );
    }


    async create(
        input:
            CreateCustomerSubscriptionInput
    ): Promise<CustomerSubscription> {

        const {
            data,
            error,
        } =
            await this.supabase
                .from(
                    "customer_subscriptions"
                )
                .insert({
                    organization_id:
                        input.organizationId,

                    customer_id:
                        input.customerId,

                    activity_id:
                        input.activityId,

                    amount:
                        input.amount,

                    currency_code:
                        input.currencyCode,

                    billing_cycle:
                        input.billingCycle,

                    starts_at:
                        input.startsAt,

                    status:
                        "ACTIVE",
                })
                .select(
                    SELECT_FIELDS
                )
                .single();


        if (error) {
            throw new Error(
                `Failed to create customer subscription: ${error.message}`
            );
        }


        return mapSubscriptionToDomain(
            data as
                SubscriptionRow
        );
    }


    async update(
        input:
            UpdateCustomerSubscriptionInput
    ): Promise<CustomerSubscription> {

        const {
            data,
            error,
        } =
            await this.supabase
                .from(
                    "customer_subscriptions"
                )
                .update({
                    amount:
                        input.amount,

                    currency_code:
                        input.currencyCode,

                    billing_cycle:
                        input.billingCycle,

                    starts_at:
                        input.startsAt,
                })
                .eq(
                    "organization_id",
                    input.organizationId
                )
                .eq(
                    "id",
                    input.id
                )
                .select(
                    SELECT_FIELDS
                )
                .single();


        if (error) {
            throw new Error(
                `Failed to update customer subscription: ${error.message}`
            );
        }


        return mapSubscriptionToDomain(
            data as
                SubscriptionRow
        );
    }


    async changeStatus(
        input:
            ChangeCustomerSubscriptionStatusInput
    ): Promise<CustomerSubscription> {

        const {
            data,
            error,
        } =
            await this.supabase
                .from(
                    "customer_subscriptions"
                )
                .update({
                    status:
                        input.status,

                    ends_at:
                        input.endsAt,
                })
                .eq(
                    "organization_id",
                    input.organizationId
                )
                .eq(
                    "id",
                    input.id
                )
                .select(
                    SELECT_FIELDS
                )
                .single();


        if (error) {
            throw new Error(
                `Failed to update customer subscription status: ${error.message}`
            );
        }


        return mapSubscriptionToDomain(
            data as
                SubscriptionRow
        );
    }
}


function mapSubscriptionToDomain(
    row:
        SubscriptionRow
): CustomerSubscription {

    return {
        id:
            row.id,

        organizationId:
            row.organization_id,

        customerId:
            row.customer_id,

        activityId:
            row.activity_id,

        amount:
            Number(
                row.amount
            ),

        currencyCode:
            row.currency_code,

        billingCycle:
            row.billing_cycle,

        status:
            row.status,

        startsAt:
            row.starts_at,

        endsAt:
            row.ends_at,

        createdAt:
            row.created_at,

        updatedAt:
            row.updated_at,
    };
}