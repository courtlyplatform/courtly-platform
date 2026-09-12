"use server";

import {
    revalidatePath,
} from "next/cache";

import {
    redirect,
} from "next/navigation";

import {
    createClient,
} from "@/shared/database/supabase/server";

import {
    getCurrentOrganizationId,
} from "@/shared/auth/get-current-organization-id";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";

import {
    CustomerValidationError,
    parseCustomerFormData,
} from "./validation";


/* ============================================================
   CUSTOMER STATUS RESULT
   ============================================================ */

export type CustomerStatusResult =
    | {
        success: true;

        active: boolean;

        endedSubscriptions:
            number;
    }
    | {
        success: false;

        error:
            | "statusUpdateFailed"
            | "forbidden";
    };


/* ============================================================
   SET CUSTOMER STATUS RPC TYPES

   These types represent the PostgreSQL function:

       public.set_customer_active_status(
           p_customer_id uuid,
           p_active boolean
       )

   Once database.types.ts contains this RPC, this local adapter
   can later be removed and supabase.rpc(...) can be used
   directly with generated typing.
   ============================================================ */

type SetCustomerActiveStatusRpcArgs = {
    p_customer_id:
        string;

    p_active:
        boolean;
};


type SetCustomerActiveStatusRpcRow = {
    active:
        boolean;

    ended_subscriptions:
        number;
};


type SetCustomerActiveStatusRpcResponse = {
    data:
        SetCustomerActiveStatusRpcRow[] |
        null;

    error:
        {
            message:
                string;
        } |
        null;
};


type SetCustomerActiveStatusRpcClient = {
    rpc: (
        functionName:
            "set_customer_active_status",

        args:
            SetCustomerActiveStatusRpcArgs
    ) =>
        PromiseLike<
            SetCustomerActiveStatusRpcResponse
        >;
};


/* ============================================================
   VALIDATION ERROR
   ============================================================ */

function getValidationErrorCode(
    error: unknown
): string {

    if (
        error instanceof
        CustomerValidationError
    ) {
        return error.code;
    }


    return "invalidData";
}


/* ============================================================
   CREATE CUSTOMER
   ============================================================ */

export async function createCustomer(
    formData: FormData
): Promise<void> {

    const supabase =
        await createClient();

    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "CUSTOMERS_CREATE")) {
        redirect("/customers?error=forbidden");
    }


    let organizationId:
        string;


    try {

        organizationId =
            await getCurrentOrganizationId(
                supabase
            );

    } catch (error) {

        console.error(
            "Courtly create customer organization error:",
            error
        );


        redirect(
            "/customers/new?error=organizationNotFound"
        );
    }


    let customerData;


    try {

        customerData =
            parseCustomerFormData(
                formData
            );

    } catch (error) {

        const errorCode =
            getValidationErrorCode(
                error
            );


        redirect(
            `/customers/new?error=${encodeURIComponent(
                errorCode
            )}`
        );
    }


    const {
        error,
    } =
        await supabase
            .from(
                "customers"
            )
            .insert({
                organization_id:
                    organizationId,

                name:
                    customerData.name,

                document_type:
                    customerData.documentType,

                document_number:
                    customerData.documentNumber,

                email:
                    customerData.email,

                phone:
                    customerData.phone,

                birth_date:
                    customerData.birthDate,

                notes:
                    customerData.notes,

                active:
                    true,
            });


    if (error) {

        console.error(
            "Courtly create customer error:",
            error
        );


        redirect(
            "/customers/new?error=createFailed"
        );
    }


    revalidatePath(
        "/customers"
    );


    redirect(
        "/customers?success=customerCreated"
    );
}


/* ============================================================
   UPDATE CUSTOMER
   ============================================================ */

export async function updateCustomer(
    customerId: string,
    formData: FormData
): Promise<void> {

    const supabase =
        await createClient();

    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "CUSTOMERS_EDIT")) {
        redirect(`/customers/${customerId}/edit?error=forbidden`);
    }


    let organizationId:
        string;


    try {

        organizationId =
            await getCurrentOrganizationId(
                supabase
            );

    } catch (error) {

        console.error(
            "Courtly update customer organization error:",
            error
        );


        redirect(
            `/customers/${customerId}/edit?error=organizationNotFound`
        );
    }


    let customerData;


    try {

        customerData =
            parseCustomerFormData(
                formData
            );

    } catch (error) {

        const errorCode =
            getValidationErrorCode(
                error
            );


        redirect(
            `/customers/${customerId}/edit?error=${encodeURIComponent(
                errorCode
            )}`
        );
    }


    const {
        error,
    } =
        await supabase
            .from(
                "customers"
            )
            .update({
                name:
                    customerData.name,

                document_type:
                    customerData.documentType,

                document_number:
                    customerData.documentNumber,

                email:
                    customerData.email,

                phone:
                    customerData.phone,

                birth_date:
                    customerData.birthDate,

                notes:
                    customerData.notes,
            })
            .eq(
                "id",
                customerId
            )
            .eq(
                "organization_id",
                organizationId
            );


    if (error) {

        console.error(
            "Courtly update customer error:",
            error
        );


        redirect(
            `/customers/${customerId}/edit?error=updateFailed`
        );
    }


    revalidatePath(
        "/customers"
    );


    revalidatePath(
        `/customers/${customerId}/edit`
    );


    redirect(
        "/customers?success=customerUpdated"
    );
}


/* ============================================================
   CUSTOMER LIFECYCLE STATUS
   ============================================================ */

/*
 * IMPORTANT:
 *
 * Never update customers.active directly here.
 *
 * The database RPC performs customer lifecycle changes
 * atomically with the commercial subscription lifecycle.
 *
 *
 * DEACTIVATE
 * ------------------------------------------------------------
 *
 * customer.active
 *      true -> false
 *
 * customer_subscriptions
 *      ACTIVE -> ENDED
 *      PAUSED -> ENDED
 *
 *
 * REACTIVATE
 * ------------------------------------------------------------
 *
 * customer.active
 *      false -> true
 *
 * Existing ENDED subscriptions remain ENDED.
 *
 * A returning customer must receive a new commercial
 * subscription.
 */
export async function toggleCustomerStatus(
    customerId: string,

    active: boolean
): Promise<CustomerStatusResult> {

    try {

        const supabase =
            await createClient();


        /*
         * database.types.ts may temporarily not contain the
         * newly-created RPC yet.
         *
         * We narrow only this specific RPC instead of using
         * "any" or disabling TypeScript validation.
         */
        const customerStatusRpcClient =
            supabase as unknown as
                SetCustomerActiveStatusRpcClient;


        const {
            data,
            error,
        } =
            await customerStatusRpcClient.rpc(
                "set_customer_active_status",
                {
                    p_customer_id:
                        customerId,

                    p_active:
                        active,
                }
            );


        /* ====================================================
           RPC ERROR
           ==================================================== */

        if (error) {

            console.error(
                "Courtly customer status RPC error:",
                error
            );


            const normalized =
                error.message
                    .toLowerCase();


            if (
                normalized.includes(
                    "not allowed"
                ) ||
                normalized.includes(
                    "not authorized"
                ) ||
                normalized.includes(
                    "permission"
                )
            ) {

                return {
                    success:
                        false,

                    error:
                        "forbidden",
                };
            }


            return {
                success:
                    false,

                error:
                    "statusUpdateFailed",
            };
        }


        /* ====================================================
           RPC RESULT
           ==================================================== */

        const rpcResult =
            data?.[0] ??
            null;


        /*
         * The database function always returns one row.
         *
         * If no row is returned unexpectedly, we fail rather
         * than assuming the operation succeeded.
         */
        if (!rpcResult) {

            console.error(
                "Courtly customer status RPC returned no result."
            );


            return {
                success:
                    false,

                error:
                    "statusUpdateFailed",
            };
        }


        const endedSubscriptions =
            Number(
                rpcResult
                    .ended_subscriptions
            );


        /* ====================================================
           REVALIDATION
           ==================================================== */

        revalidatePath(
            "/customers"
        );


        revalidatePath(
            `/customers/${customerId}/edit`
        );


        /* ====================================================
           SUCCESS
           ==================================================== */

        return {
            success:
                true,

            active:
                rpcResult.active,

            endedSubscriptions:
                Number.isFinite(
                    endedSubscriptions
                )
                    ? endedSubscriptions
                    : 0,
        };

    } catch (error) {

        console.error(
            "Courtly customer status unexpected error:",
            error
        );


        return {
            success:
                false,

            error:
                "statusUpdateFailed",
        };
    }
}