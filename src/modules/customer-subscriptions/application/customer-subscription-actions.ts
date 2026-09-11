"use server";

import {
    revalidatePath,
} from "next/cache";

import {
    createClient,
} from "@/shared/database/supabase/server";

import {
    canManageCommercialData,
    getCurrentOrganizationCommercialContext,
} from "@/shared/auth/get-current-organization-commercial-context";

import {
    SupabaseActivityRepository,
} from "@/modules/activities/infrastructure/supabase-activity-repository";

import {
    SupabaseCustomerSubscriptionRepository,
} from "../infrastructure/supabase-customer-subscription-repository";

import {
    saveCustomerSubscription,
} from "./save-customer-subscription";

import {
    changeCustomerSubscriptionStatus,
} from "./change-customer-subscription-status";

import type {
    CurrencyCode,
    CustomerSubscriptionStatus,
    SubscriptionBillingCycle,
} from "../domain/customer-subscription";


/* ============================================================
   ACTION ERROR TYPES
   ============================================================ */

export type CustomerSubscriptionActionError =
    | "forbidden"
    | "customerNotFound"
    | "activityNotFound"
    | "inactiveActivity"
    | "duplicateOpenSubscription"
    | "endedImmutable"
    | "invalidData"
    | "saveFailed"
    | "statusUpdateFailed";


/* ============================================================
   ACTION RESULT
   ============================================================ */

export type CustomerSubscriptionActionResult =
    | {
        success: true;

        /*
         * True only when a NEW commercial subscription caused
         * an inactive customer to become active again.
         */
        customerReactivated:
            boolean;
    }
    | {
        success: false;

        error:
            CustomerSubscriptionActionError;
    };


/* ============================================================
   SAVE REQUEST
   ============================================================ */

type SaveSubscriptionRequest = {
    id?: string;

    customerId: string;

    activityId: string;

    amount: number;

    currencyCode:
        CurrencyCode;

    billingCycle:
        SubscriptionBillingCycle;

    startsAt: string;
};


/* ============================================================
   CREATE / UPDATE SUBSCRIPTION
   ============================================================ */

export async function saveCustomerSubscriptionAction(
    request:
        SaveSubscriptionRequest
): Promise<CustomerSubscriptionActionResult> {

    try {

        const supabase =
            await createClient();


        /* --------------------------------------------------------
           CURRENT ORGANIZATION
           -------------------------------------------------------- */

        const context =
            await getCurrentOrganizationCommercialContext(
                supabase
            );


        /* --------------------------------------------------------
           AUTHORIZATION
           -------------------------------------------------------- */

        if (
            !canManageCommercialData(
                context.role
            )
        ) {

            return {
                success:
                    false,

                error:
                    "forbidden",
            };
        }


        /* --------------------------------------------------------
           CUSTOMER VALIDATION
           -------------------------------------------------------- */

        const {
            data: customer,
            error: customerError,
        } =
            await supabase
                .from(
                    "customers"
                )
                .select(
                    "id, active"
                )
                .eq(
                    "id",
                    request.customerId
                )
                .eq(
                    "organization_id",
                    context.organizationId
                )
                .maybeSingle();


        if (
            customerError ||
            !customer
        ) {

            return {
                success:
                    false,

                error:
                    "customerNotFound",
            };
        }


        /*
         * We capture the state BEFORE saving.
         *
         * The database trigger will automatically reactivate
         * the customer when a new ACTIVE subscription is
         * inserted.
         */
        const customerWasInactive =
            !customer.active;


        /* --------------------------------------------------------
           ACTIVITY VALIDATION
           -------------------------------------------------------- */

        const activityRepository =
            new SupabaseActivityRepository(
                supabase
            );


        const activity =
            await activityRepository.findById(
                context.organizationId,
                request.activityId
            );


        if (!activity) {

            return {
                success:
                    false,

                error:
                    "activityNotFound",
            };
        }


        /*
         * A new commercial agreement cannot be created from an
         * inactive service.
         *
         * Existing contracts may still reference a service that
         * became inactive later.
         */
        if (
            !request.id &&
            !activity.active
        ) {

            return {
                success:
                    false,

                error:
                    "inactiveActivity",
            };
        }


        /* --------------------------------------------------------
           REPOSITORY
           -------------------------------------------------------- */

        const repository =
            new SupabaseCustomerSubscriptionRepository(
                supabase
            );


        /* --------------------------------------------------------
           CREATE / UPDATE
           -------------------------------------------------------- */

        await saveCustomerSubscription(
            repository,
            {
                id:
                    request.id,

                organizationId:
                    context.organizationId,

                customerId:
                    request.customerId,

                activityId:
                    request.activityId,

                amount:
                    request.amount,

                currencyCode:
                    request.currencyCode,

                billingCycle:
                    request.billingCycle,

                startsAt:
                    request.startsAt,
            }
        );


        /*
         * Only creating a NEW subscription can be considered an
         * automatic customer reactivation in this flow.
         */
        const customerReactivated =
            !request.id &&
            customerWasInactive;


        /* --------------------------------------------------------
           REVALIDATION
           -------------------------------------------------------- */

        revalidatePath(
            `/customers/${request.customerId}/edit`
        );


        /*
         * Important because the customer listing contains:
         *
         * - customer active/inactive state
         * - active commercial plans
         */
        revalidatePath(
            "/customers"
        );


        return {
            success:
                true,

            customerReactivated,
        };

    } catch (error) {

        console.error(
            "[CUSTOMER_SUBSCRIPTIONS] Failed to save subscription",
            error
        );


        return {
            success:
                false,

            error:
                mapSaveError(
                    error
                ),
        };
    }
}


/* ============================================================
   CHANGE SUBSCRIPTION STATUS
   ============================================================ */

export async function changeCustomerSubscriptionStatusAction(
    customerId: string,

    subscriptionId: string,

    status:
        CustomerSubscriptionStatus
): Promise<CustomerSubscriptionActionResult> {

    try {

        const supabase =
            await createClient();


        /* --------------------------------------------------------
           CURRENT ORGANIZATION
           -------------------------------------------------------- */

        const context =
            await getCurrentOrganizationCommercialContext(
                supabase
            );


        /* --------------------------------------------------------
           AUTHORIZATION
           -------------------------------------------------------- */

        if (
            !canManageCommercialData(
                context.role
            )
        ) {

            return {
                success:
                    false,

                error:
                    "forbidden",
            };
        }


        /* --------------------------------------------------------
           REPOSITORY
           -------------------------------------------------------- */

        const repository =
            new SupabaseCustomerSubscriptionRepository(
                supabase
            );


        /* --------------------------------------------------------
           STATUS CHANGE
           -------------------------------------------------------- */

        await changeCustomerSubscriptionStatus(
            repository,
            {
                organizationId:
                    context.organizationId,

                subscriptionId,

                status,
            }
        );


        /* --------------------------------------------------------
           REVALIDATION
           -------------------------------------------------------- */

        revalidatePath(
            `/customers/${customerId}/edit`
        );


        revalidatePath(
            "/customers"
        );


        return {
            success:
                true,

            customerReactivated:
                false,
        };

    } catch (error) {

        console.error(
            "[CUSTOMER_SUBSCRIPTIONS] Failed to change subscription status",
            error
        );


        const message =
            error instanceof Error
                ? error.message
                : "";


        if (
            message.includes(
                "ENDED_SUBSCRIPTION_IMMUTABLE"
            )
        ) {

            return {
                success:
                    false,

                error:
                    "endedImmutable",
            };
        }


        return {
            success:
                false,

            error:
                "statusUpdateFailed",
        };
    }
}


/* ============================================================
   SAVE ERROR MAPPING
   ============================================================ */

function mapSaveError(
    error: unknown
): CustomerSubscriptionActionError {

    const message =
        error instanceof Error
            ? error.message
            : "";


    const normalized =
        message.toLowerCase();


    if (
        normalized.includes(
            "uq_customer_subscriptions_open_customer_activity"
        ) ||
        normalized.includes(
            "duplicate key"
        )
    ) {

        return "duplicateOpenSubscription";
    }


    if (
        message.includes(
            "ENDED_SUBSCRIPTION_IMMUTABLE"
        )
    ) {

        return "endedImmutable";
    }


    if (
        normalized.includes(
            "validation"
        ) ||
        normalized.includes(
            "zod"
        )
    ) {

        return "invalidData";
    }


    return "saveFailed";
}