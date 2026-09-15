export const BUSINESS_TYPES = [
    "ACADEMY",
    "CLUB",
    "STUDIO",
    "INDEPENDENT_PROFESSIONAL",
    "CLINIC",
    "OTHER",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const LOCALES = ["pt-BR", "en-US"] as const;
export type OrganizationLocale = (typeof LOCALES)[number];

export type CountryPreset = {
    countryCode: string;
    locale: OrganizationLocale;
    currencyCode: string;
    timezone: string;
    phoneCountryCode: string;
    registrationType: string;
};

export const COUNTRY_PRESETS: Record<string, CountryPreset> = {
    BR: { countryCode: "BR", locale: "pt-BR", currencyCode: "BRL", timezone: "America/Sao_Paulo", phoneCountryCode: "+55", registrationType: "CNPJ" },
    US: { countryCode: "US", locale: "en-US", currencyCode: "USD", timezone: "America/New_York", phoneCountryCode: "+1", registrationType: "EIN" },
    PT: { countryCode: "PT", locale: "pt-BR", currencyCode: "EUR", timezone: "Europe/Lisbon", phoneCountryCode: "+351", registrationType: "NIF" },
    CA: { countryCode: "CA", locale: "en-US", currencyCode: "CAD", timezone: "America/Toronto", phoneCountryCode: "+1", registrationType: "BN" },
    GB: { countryCode: "GB", locale: "en-US", currencyCode: "GBP", timezone: "Europe/London", phoneCountryCode: "+44", registrationType: "CRN" },
    ES: { countryCode: "ES", locale: "en-US", currencyCode: "EUR", timezone: "Europe/Madrid", phoneCountryCode: "+34", registrationType: "NIF" },
    MX: { countryCode: "MX", locale: "en-US", currencyCode: "MXN", timezone: "America/Mexico_City", phoneCountryCode: "+52", registrationType: "RFC" },
    AR: { countryCode: "AR", locale: "en-US", currencyCode: "ARS", timezone: "America/Argentina/Buenos_Aires", phoneCountryCode: "+54", registrationType: "CUIT" },
};

export const COUNTRY_SUGGESTIONS = [
    "BR", "US", "PT", "CA", "GB", "ES", "FR", "DE", "IT", "MX", "AR", "CL", "CO", "AU", "NZ", "IE", "NL", "CH", "JP",
] as const;

export const CURRENCY_SUGGESTIONS = [
    "BRL", "USD", "EUR", "CAD", "GBP", "AUD", "NZD", "JPY", "MXN", "ARS", "CLP", "COP", "CHF",
] as const;

export const TIMEZONE_SUGGESTIONS = [
    "America/Sao_Paulo",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "America/Mexico_City",
    "America/Argentina/Buenos_Aires",
    "Europe/Lisbon",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
    "Australia/Sydney",
    "Pacific/Auckland",
    "Asia/Tokyo",
] as const;

export function normalizeSlug(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}
