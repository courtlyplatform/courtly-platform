import type {
    SupabaseClient,
} from "@supabase/supabase-js";

import type {
    CurrencyCode,
} from "@/modules/customer-subscriptions/domain/customer-subscription";


export type OrganizationRole =
    | "OWNER"
    | "ADMIN"
    | "PROFESSIONAL"
    | "CUSTOMER";


export type CurrentOrganizationCommercialContext = {
    organizationId: string;

    role:
        OrganizationRole;

    defaultCurrency:
        CurrencyCode;
};


export async function getCurrentOrganizationCommercialContext(
    supabase:
        SupabaseClient
): Promise<CurrentOrganizationCommercialContext> {

    const {
        data: authData,
        error: authError,
    } =
        await supabase.auth.getUser();


    if (
        authError ||
        !authData.user
    ) {
        throw new Error(
            "User is not authenticated."
        );
    }


    const {
        data: membership,
        error: membershipError,
    } =
        await supabase
            .from(
                "memberships"
            )
            .select(
                "organization_id, role"
            )
            .eq(
                "user_id",
                authData.user.id
            )
            .limit(
                1
            )
            .maybeSingle();


    if (
        membershipError ||
        !membership
    ) {
        throw new Error(
            "Organization membership not found."
        );
    }


    const {
        data: organization,
        error: organizationError,
    } =
        await supabase
            .from(
                "organizations"
            )
            .select(
                "default_currency"
            )
            .eq(
                "id",
                membership.organization_id
            )
            .maybeSingle();


    if (
        organizationError ||
        !organization
    ) {
        throw new Error(
            "Organization not found."
        );
    }


    return {
        organizationId:
            membership.organization_id,

        role:
            membership.role as
                OrganizationRole,

        defaultCurrency:
            organization.default_currency as
                CurrencyCode,
    };
}


export function canManageCommercialData(
    role:
        OrganizationRole
): boolean {

    return (
        role === "OWNER" ||
        role === "ADMIN"
    );
}