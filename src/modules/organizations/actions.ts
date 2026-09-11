"use server";

import { redirect } from "next/navigation";

import {
    createClient,
} from "@/shared/database/supabase/server";


const ALLOWED_BUSINESS_TYPES = [
    "ACADEMY",
    "CLUB",
    "STUDIO",
    "INDEPENDENT_PROFESSIONAL",
    "CLINIC",
    "OTHER",
] as const;


const ALLOWED_COUNTRIES = [
    "BR",
    "US",
    "PT",
    "CA",
    "OTHER",
] as const;


const ALLOWED_CURRENCIES = [
    "BRL",
    "USD",
    "EUR",
    "CAD",
] as const;


const ALLOWED_TIMEZONES = [
    "America/Sao_Paulo",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "Europe/Lisbon",
] as const;


type BusinessType =
    (typeof ALLOWED_BUSINESS_TYPES)[number];

type Country =
    (typeof ALLOWED_COUNTRIES)[number];

type Currency =
    (typeof ALLOWED_CURRENCIES)[number];

type Timezone =
    (typeof ALLOWED_TIMEZONES)[number];


function isAllowedValue<
    T extends readonly string[],
>(
    values: T,
    value: string
): value is T[number] {
    return values.includes(
        value as T[number]
    );
}


function onboardingError(
    message: string
): never {
    redirect(
        `/onboarding?error=${encodeURIComponent(
            message
        )}`
    );
}


export async function completeOnboarding(
    formData: FormData
) {
    const supabase =
        await createClient();


    // =====================================================
    // FORM DATA
    // =====================================================

    const professionalName = String(
        formData.get(
            "professionalName"
        ) ?? ""
    ).trim();

    const organizationName = String(
        formData.get(
            "organizationName"
        ) ?? ""
    ).trim();

    const businessType = String(
        formData.get(
            "businessType"
        ) ?? ""
    ).trim();

    const phone = String(
        formData.get(
            "phone"
        ) ?? ""
    ).trim();

    const country = String(
        formData.get(
            "country"
        ) ?? ""
    ).trim();

    const timezone = String(
        formData.get(
            "timezone"
        ) ?? ""
    ).trim();

    const defaultCurrency = String(
        formData.get(
            "defaultCurrency"
        ) ?? ""
    ).trim();


    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (!professionalName) {
        onboardingError(
            "Informe o seu nome."
        );
    }

    if (!organizationName) {
        onboardingError(
            "Informe o nome do seu negócio."
        );
    }

    if (
        !isAllowedValue(
            ALLOWED_BUSINESS_TYPES,
            businessType
        )
    ) {
        onboardingError(
            "Selecione um tipo de negócio válido."
        );
    }

    if (
        !isAllowedValue(
            ALLOWED_COUNTRIES,
            country
        )
    ) {
        onboardingError(
            "Selecione um país válido."
        );
    }

    if (
        !isAllowedValue(
            ALLOWED_TIMEZONES,
            timezone
        )
    ) {
        onboardingError(
            "Selecione um fuso horário válido."
        );
    }

    if (
        !isAllowedValue(
            ALLOWED_CURRENCIES,
            defaultCurrency
        )
    ) {
        onboardingError(
            "Selecione uma moeda válida."
        );
    }


    // =====================================================
    // AUTHENTICATED USER
    // =====================================================

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
        redirect(
            "/login?error=Sua sessão expirou"
        );
    }


    // =====================================================
    // CREATE ORGANIZATION
    // =====================================================

    const {
        error,
    } =
        await supabase.rpc(
            "create_organization_onboarding",
            {
                p_organization_name:
                    organizationName,

                p_professional_name:
                    professionalName,

                p_business_type:
                    businessType as BusinessType,

                p_phone:
                    phone,

                p_country:
                    country as Country,

                p_timezone:
                    timezone as Timezone,

                p_default_currency:
                    defaultCurrency as Currency,
            }
        );


    if (error) {
        console.error(
            "Courtly onboarding error:",
            error
        );

        onboardingError(
            "Não foi possível criar sua organização. Verifique os dados e tente novamente."
        );
    }


    redirect(
        "/dashboard"
    );
}