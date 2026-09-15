"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/database/supabase/server";
import { BUSINESS_TYPES, LOCALES, normalizeSlug, type BusinessType, type OrganizationLocale } from "./organization-options";

function stringValue(formData: FormData, name: string): string {
    return String(formData.get(name) ?? "").trim();
}

function optionalValue(formData: FormData, name: string): string | null {
    return stringValue(formData, name) || null;
}

function validCountryCode(value: string): boolean {
    return /^[A-Z]{2}$/.test(value);
}

function validCurrencyCode(value: string): boolean {
    return /^[A-Z]{3}$/.test(value);
}

function validColor(value: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(value);
}

function validTimezone(value: string): boolean {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
        return true;
    } catch {
        return false;
    }
}

function buildPayload(formData: FormData) {
    const displayName = stringValue(formData, "displayName");
    const legalName = optionalValue(formData, "legalName");
    const businessType = stringValue(formData, "businessType");
    const countryCode = stringValue(formData, "countryCode").toUpperCase();
    const timezone = stringValue(formData, "timezone");
    const defaultLocale = stringValue(formData, "defaultLocale");
    const currencyCode = stringValue(formData, "currencyCode").toUpperCase();
    const primaryColor = stringValue(formData, "primaryColor") || "#3FAF95";
    const secondaryColor = stringValue(formData, "secondaryColor") || "#0E342C";
    const slug = normalizeSlug(stringValue(formData, "slug") || displayName);

    if (!displayName) throw new Error("displayNameRequired");
    if (!BUSINESS_TYPES.includes(businessType as BusinessType)) throw new Error("businessTypeInvalid");
    if (!validCountryCode(countryCode)) throw new Error("countryInvalid");
    if (!validTimezone(timezone)) throw new Error("timezoneInvalid");
    if (!LOCALES.includes(defaultLocale as OrganizationLocale)) throw new Error("localeInvalid");
    if (!validCurrencyCode(currencyCode)) throw new Error("currencyInvalid");
    if (!slug) throw new Error("slugInvalid");
    if (!validColor(primaryColor) || !validColor(secondaryColor)) throw new Error("colorInvalid");

    return {
        displayName,
        legalName,
        businessType: businessType as BusinessType,
        countryCode,
        timezone,
        defaultLocale: defaultLocale as OrganizationLocale,
        currencyCode,
        slug,
        registrationType: optionalValue(formData, "registrationType"),
        registrationNumber: optionalValue(formData, "registrationNumber"),
        contactEmail: optionalValue(formData, "contactEmail"),
        replyToEmail: optionalValue(formData, "replyToEmail"),
        phoneCountryCode: optionalValue(formData, "phoneCountryCode"),
        phoneNumber: optionalValue(formData, "phoneNumber"),
        websiteUrl: optionalValue(formData, "websiteUrl"),
        addressLine1: optionalValue(formData, "addressLine1"),
        addressLine2: optionalValue(formData, "addressLine2"),
        city: optionalValue(formData, "city"),
        region: optionalValue(formData, "region"),
        postalCode: optionalValue(formData, "postalCode"),
        primaryColor,
        secondaryColor,
    };
}

function onboardingError(code: string): never {
    redirect(`/onboarding?error=${encodeURIComponent(code)}`);
}

export async function completeOnboarding(formData: FormData) {
    // Defense in depth: only the explicit final (branding) step may create the tenant.
    // This prevents accidental/implicit form submissions from an earlier onboarding step.
    if (stringValue(formData, "onboardingStage") !== "FINAL") {
        onboardingError("invalidData");
    }

    const supabase = await createClient();
    let payload: ReturnType<typeof buildPayload>;

    try {
        payload = buildPayload(formData);
    } catch (error) {
        onboardingError(error instanceof Error ? error.message : "invalidData");
    }

    const professionalName = stringValue(formData, "professionalName");
    if (!professionalName) onboardingError("professionalNameRequired");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) redirect("/login?error=sessionExpired");

    const { error } = await (supabase as any).rpc("create_organization_onboarding", {
        p_display_name: payload.displayName,
        p_legal_name: payload.legalName,
        p_professional_name: professionalName,
        p_business_type: payload.businessType,
        p_country_code: payload.countryCode,
        p_timezone: payload.timezone,
        p_default_locale: payload.defaultLocale,
        p_currency_code: payload.currencyCode,
        p_slug: payload.slug,
        p_registration_type: payload.registrationType,
        p_registration_number: payload.registrationNumber,
        p_contact_email: payload.contactEmail,
        p_reply_to_email: payload.replyToEmail,
        p_phone_country_code: payload.phoneCountryCode,
        p_phone_number: payload.phoneNumber,
        p_website_url: payload.websiteUrl,
        p_address_line_1: payload.addressLine1,
        p_address_line_2: payload.addressLine2,
        p_city: payload.city,
        p_region: payload.region,
        p_postal_code: payload.postalCode,
        p_primary_color: payload.primaryColor,
        p_secondary_color: payload.secondaryColor,
    });

    if (error) {
        console.error("[organizations/onboarding]", error);
        onboardingError(error.code === "23505" ? "slugAlreadyUsed" : "createFailed");
    }

    redirect("/dashboard");
}

export async function updateOrganization(formData: FormData) {
    const supabase = await createClient();
    let payload: ReturnType<typeof buildPayload>;

    try {
        payload = buildPayload(formData);
    } catch (error) {
        redirect(`/organization?error=${encodeURIComponent(error instanceof Error ? error.message : "invalidData")}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?error=sessionExpired");

    const { data: membership } = await supabase
        .from("memberships")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (!membership || membership.role !== "OWNER") {
        redirect("/organization?error=forbidden");
    }

    const { error } = await (supabase as any)
        .from("organizations")
        .update({
            name: payload.displayName,
            display_name: payload.displayName,
            legal_name: payload.legalName,
            business_type: payload.businessType,
            country: (["BR", "US", "PT", "CA"].includes(payload.countryCode) ? payload.countryCode : "OTHER"),
            country_code: payload.countryCode,
            timezone: payload.timezone,
            default_currency: (["BRL", "USD", "EUR", "CAD"].includes(payload.currencyCode) ? payload.currencyCode : "USD"),
            default_locale: payload.defaultLocale,
            currency_code: payload.currencyCode,
            slug: payload.slug,
            registration_type: payload.registrationType,
            registration_number: payload.registrationNumber,
            contact_email: payload.contactEmail,
            reply_to_email: payload.replyToEmail,
            phone: payload.phoneNumber,
            phone_country_code: payload.phoneCountryCode,
            phone_number: payload.phoneNumber,
            website_url: payload.websiteUrl,
            address_line_1: payload.addressLine1,
            address_line_2: payload.addressLine2,
            city: payload.city,
            region: payload.region,
            postal_code: payload.postalCode,
            primary_color: payload.primaryColor,
            secondary_color: payload.secondaryColor,
        })
        .eq("id", membership.organization_id);

    if (error) {
        console.error("[organizations/update]", error);
        redirect(`/organization?error=${error.code === "23505" ? "slugAlreadyUsed" : "updateFailed"}`);
    }

    revalidatePath("/organization");
    revalidatePath("/", "layout");
    redirect("/organization?success=1");
}
