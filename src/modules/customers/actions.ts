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
    CustomerValidationError,
    parseCustomerFormData,
} from "./validation";


export type CustomerStatusResult =
    | {
        success: true;
        active: boolean;
    }
    | {
        success: false;
        error: "statusUpdateFailed";
    };


async function getCurrentOrganizationId():
Promise<string> {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
        error: userError,
    } =
        await supabase.auth.getUser();

    if (
        userError ||
        !user
    ) {
        throw new Error(
            "Unauthenticated user."
        );
    }

    const {
        data: membership,
        error,
    } =
        await supabase
            .from("memberships")
            .select(
                "organization_id"
            )
            .eq(
                "user_id",
                user.id
            )
            .limit(1)
            .single();

    if (
        error ||
        !membership
    ) {
        throw new Error(
            "User organization not found."
        );
    }

    return (
        membership.organization_id
    );
}


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


export async function createCustomer(
    formData: FormData
): Promise<void> {
    const supabase =
        await createClient();

    let organizationId:
        string;

    try {
        organizationId =
            await getCurrentOrganizationId();
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
            .from("customers")
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


export async function updateCustomer(
    customerId: string,
    formData: FormData
): Promise<void> {
    const supabase =
        await createClient();

    let organizationId:
        string;

    try {
        organizationId =
            await getCurrentOrganizationId();
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
            .from("customers")
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


export async function toggleCustomerStatus(
    customerId: string,
    active: boolean
): Promise<CustomerStatusResult> {
    try {
        const supabase =
            await createClient();

        const organizationId =
            await getCurrentOrganizationId();

        const {
            error,
        } =
            await supabase
                .from("customers")
                .update({
                    active,
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
                "Courtly customer status update error:",
                error
            );

            return {
                success: false,
                error:
                    "statusUpdateFailed",
            };
        }


        revalidatePath(
            "/customers"
        );


        return {
            success: true,
            active,
        };
    } catch (error) {
        console.error(
            "Courtly customer status unexpected error:",
            error
        );

        return {
            success: false,
            error:
                "statusUpdateFailed",
        };
    }
}