import {
    createClient,
} from "@/shared/database/supabase/server";

import {
    getCurrentOrganizationCommercialContext,
    canManageCommercialData,
} from "@/shared/auth/get-current-organization-commercial-context";

import type {
    Customer,
    CustomerActivePlanSummary,
    CustomerListItem,
} from "./types";


type ActiveSubscriptionRow = {
    customer_id: string;

    activity_id: string;
};


type ActivityNameRow = {
    id: string;

    name: string;
};


/* ============================================================
   CUSTOMERS LIST
   ============================================================ */

export async function getCustomers():
Promise<CustomerListItem[]> {

    const supabase =
        await createClient();


    const context =
        await getCurrentOrganizationCommercialContext(
            supabase
        );


    const {
        data: customers,
        error: customersError,
    } =
        await supabase
            .from(
                "customers"
            )
            .select(
                "*"
            )
            .eq(
                "organization_id",
                context.organizationId
            )
            .order(
                "name",
                {
                    ascending:
                        true,
                }
            );


    if (customersError) {

        throw new Error(
            `Erro ao buscar clientes: ${customersError.message}`
        );
    }


    const customerRows =
        customers ?? [];


    /*
     * Commercial data remains visible only to OWNER / ADMIN.
     *
     * This matches the RLS strategy already adopted for
     * customer_subscriptions.
     */
    if (
        !canManageCommercialData(
            context.role
        )
    ) {

        return customerRows.map(
            (
                customer
            ) => ({
                ...customer,

                activePlans:
                    [],
            })
        );
    }


    /* ========================================================
       ACTIVE SUBSCRIPTIONS
       ======================================================== */

    const {
        data: subscriptionData,
        error: subscriptionError,
    } =
        await supabase
            .from(
                "customer_subscriptions"
            )
            .select(
                "customer_id, activity_id"
            )
            .eq(
                "organization_id",
                context.organizationId
            )
            .eq(
                "status",
                "ACTIVE"
            );


    if (subscriptionError) {

        throw new Error(
            `Erro ao buscar planos ativos dos clientes: ${subscriptionError.message}`
        );
    }


    const subscriptions =
        (
            subscriptionData ??
            []
        ) as
            ActiveSubscriptionRow[];


    /*
     * No active subscription means there is no reason
     * to issue another query for activities.
     */
    if (
        subscriptions.length ===
        0
    ) {

        return customerRows.map(
            (
                customer
            ) => ({
                ...customer,

                activePlans:
                    [],
            })
        );
    }


    /* ========================================================
       ACTIVITY NAMES
       ======================================================== */

    const activityIds =
        Array.from(
            new Set(
                subscriptions.map(
                    (
                        subscription
                    ) =>
                        subscription.activity_id
                )
            )
        );


    const {
        data: activityData,
        error: activityError,
    } =
        await supabase
            .from(
                "activities"
            )
            .select(
                "id, name"
            )
            .eq(
                "organization_id",
                context.organizationId
            )
            .in(
                "id",
                activityIds
            );


    if (activityError) {

        throw new Error(
            `Erro ao buscar serviços dos clientes: ${activityError.message}`
        );
    }


    const activities =
        (
            activityData ??
            []
        ) as
            ActivityNameRow[];


    const activityNameById =
        new Map<
            string,
            string
        >(
            activities.map(
                (
                    activity
                ) => [
                    activity.id,
                    activity.name,
                ]
            )
        );


    /* ========================================================
       GROUP ACTIVE PLANS BY CUSTOMER
       ======================================================== */

    const plansByCustomer =
        new Map<
            string,
            CustomerActivePlanSummary[]
        >();


    for (
        const subscription
        of subscriptions
    ) {

        const activityName =
            activityNameById.get(
                subscription.activity_id
            );


        if (!activityName) {
            continue;
        }


        const currentPlans =
            plansByCustomer.get(
                subscription.customer_id
            ) ??
            [];


        currentPlans.push({
            activityId:
                subscription.activity_id,

            name:
                activityName,
        });


        plansByCustomer.set(
            subscription.customer_id,
            currentPlans
        );
    }


    return customerRows.map(
        (
            customer
        ) => ({
            ...customer,

            activePlans:
                plansByCustomer.get(
                    customer.id
                ) ??
                [],
        })
    );
}


/* ============================================================
   CUSTOMER BY ID
   ============================================================ */

export async function getCustomerById(
    id: string
): Promise<Customer | null> {

    const supabase =
        await createClient();


    const context =
        await getCurrentOrganizationCommercialContext(
            supabase
        );


    const {
        data,
        error,
    } =
        await supabase
            .from(
                "customers"
            )
            .select(
                "*"
            )
            .eq(
                "id",
                id
            )
            .eq(
                "organization_id",
                context.organizationId
            )
            .maybeSingle();


    if (error) {

        throw new Error(
            `Erro ao buscar cliente: ${error.message}`
        );
    }


    return data;
}