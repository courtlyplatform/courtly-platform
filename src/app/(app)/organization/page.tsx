import { redirect } from "next/navigation";

import { OrganizationSettingsClient } from "@/modules/organizations/ui/OrganizationSettingsClient";
import { createClient } from "@/shared/database/supabase/server";

type Props = { searchParams: Promise<{ error?: string; success?: string }> };

export default async function OrganizationPage({ searchParams }: Props) {
    const { error, success } = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: membership } = await supabase
        .from("memberships")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (!membership) redirect("/onboarding");
    if (membership.role !== "OWNER") redirect("/dashboard");

    const { data: organization, error: organizationError } = await (supabase as any)
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .maybeSingle();

    if (organizationError || !organization) redirect("/dashboard");

    return (
        <OrganizationSettingsClient
            errorCode={error}
            success={success === "1"}
            organization={{
                displayName: organization.display_name ?? organization.name,
                legalName: organization.legal_name,
                businessType: organization.business_type,
                slug: organization.slug,
                countryCode: organization.country_code ?? String(organization.country ?? "BR"),
                timezone: organization.timezone,
                defaultLocale: organization.default_locale ?? "pt-BR",
                currencyCode: organization.currency_code ?? String(organization.default_currency ?? "BRL"),
                registrationType: organization.registration_type,
                registrationNumber: organization.registration_number,
                contactEmail: organization.contact_email,
                replyToEmail: organization.reply_to_email,
                phoneCountryCode: organization.phone_country_code,
                phoneNumber: organization.phone_number ?? organization.phone,
                websiteUrl: organization.website_url,
                addressLine1: organization.address_line_1,
                addressLine2: organization.address_line_2,
                city: organization.city,
                region: organization.region,
                postalCode: organization.postal_code,
                primaryColor: organization.primary_color ?? "#3FAF95",
                secondaryColor: organization.secondary_color ?? "#0E342C",
                customDomain: organization.custom_domain,
                customDomainStatus: organization.custom_domain_status ?? "NOT_CONFIGURED",
                customEmailDomain: organization.custom_email_domain,
                customEmailDomainStatus: organization.custom_email_domain_status ?? "NOT_CONFIGURED",
            }}
        />
    );
}
