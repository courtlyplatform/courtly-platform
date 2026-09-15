"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { updateOrganization } from "@/modules/organizations/actions";
import {
    BUSINESS_TYPES,
    COUNTRY_PRESETS,
    COUNTRY_SUGGESTIONS,
    CURRENCY_SUGGESTIONS,
    TIMEZONE_SUGGESTIONS,
} from "@/modules/organizations/organization-options";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { CourtlyAlert } from "@/shared/ui/CourtlyAlert";
import styles from "./organization.module.css";

type OrganizationFormData = {
    displayName: string;
    legalName: string | null;
    businessType: string | null;
    slug: string;
    countryCode: string;
    timezone: string;
    defaultLocale: string;
    currencyCode: string;
    registrationType: string | null;
    registrationNumber: string | null;
    contactEmail: string | null;
    replyToEmail: string | null;
    phoneCountryCode: string | null;
    phoneNumber: string | null;
    websiteUrl: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    primaryColor: string;
    secondaryColor: string;
    customDomain: string | null;
    customDomainStatus: string;
    customEmailDomain: string | null;
    customEmailDomainStatus: string;
};

type Props = {
    organization: OrganizationFormData;
    errorCode?: string;
    success?: boolean;
};

export function OrganizationSettingsClient({ organization, errorCode, success }: Props) {
    const { dictionary } = useI18n();
    const router = useRouter();
    const clearFeedback = useCallback(() => router.replace("/organization", { scroll: false }), [router]);
    const t = dictionary.organizations;
    const [countryCode, setCountryCode] = useState(organization.countryCode);
    const [timezone, setTimezone] = useState(organization.timezone);
    const [defaultLocale, setDefaultLocale] = useState(organization.defaultLocale);
    const [currencyCode, setCurrencyCode] = useState(organization.currencyCode);
    const [phoneCountryCode, setPhoneCountryCode] = useState(organization.phoneCountryCode ?? "");
    const [registrationType, setRegistrationType] = useState(organization.registrationType ?? "");

    const timezoneOptions = useMemo(() => {
        try {
            const supported = (Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
            return Array.from(new Set([...TIMEZONE_SUGGESTIONS, ...supported]));
        } catch {
            return [...TIMEZONE_SUGGESTIONS];
        }
    }, []);

    const errorMessage = errorCode
        ? (t.errors[errorCode as keyof typeof t.errors] ?? t.errors.invalidData)
        : null;

    function applyCountryPreset(nextCountry: string) {
        const code = nextCountry.trim().toUpperCase().slice(0, 2);
        setCountryCode(code);
        const preset = COUNTRY_PRESETS[code];
        if (!preset) return;
        setTimezone(preset.timezone);
        setDefaultLocale(preset.locale);
        setCurrencyCode(preset.currencyCode);
        setPhoneCountryCode(preset.phoneCountryCode);
        setRegistrationType(preset.registrationType);
    }

    return (
        <main className={styles.page}>
            <div className={styles.heading}>
                <div>
                    <span>{t.settings.eyebrow}</span>
                    <h1>{t.settings.title}</h1>
                    <p>{t.settings.description}</p>
                </div>
            </div>

            {errorMessage && <CourtlyAlert type="error" message={errorMessage} autoDismissMs={30_000} onClose={clearFeedback} />}
            {success && <CourtlyAlert type="success" message={t.feedback.updated} autoDismissMs={30_000} onClose={clearFeedback} />}

            <form action={updateOrganization} className={styles.form}>
                <section className={styles.card}>
                    <div className={styles.cardHeading}><span>01</span><div><h2>{t.sections.identity.title}</h2><p>{t.sections.identity.description}</p></div></div>
                    <div className={styles.grid}>
                        <label><span>{t.fields.displayName}</span><input name="displayName" defaultValue={organization.displayName} required /></label>
                        <label><span>{t.fields.legalName}</span><input name="legalName" defaultValue={organization.legalName ?? ""} /></label>
                        <label><span>{t.fields.businessType}</span><select name="businessType" defaultValue={organization.businessType ?? "OTHER"}>{BUSINESS_TYPES.map((value) => <option key={value} value={value}>{t.businessTypes[value]}</option>)}</select></label>
                        <label><span>{t.fields.slug}</span><input name="slug" defaultValue={organization.slug} required /><small>{t.help.slug}</small></label>
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeading}><span>02</span><div><h2>{t.sections.regional.title}</h2><p>{t.sections.regional.description}</p></div></div>
                    <div className={styles.grid}>
                        <label><span>{t.fields.country}</span><input name="countryCode" list="settings-country-codes" value={countryCode} onChange={(e) => applyCountryPreset(e.target.value)} maxLength={2} required /><datalist id="settings-country-codes">{COUNTRY_SUGGESTIONS.map((value) => <option key={value} value={value} />)}</datalist></label>
                        <label><span>{t.fields.timezone}</span><input name="timezone" list="settings-timezones" value={timezone} onChange={(e) => setTimezone(e.target.value)} required /><datalist id="settings-timezones">{timezoneOptions.map((value) => <option key={value} value={value} />)}</datalist></label>
                        <label><span>{t.fields.defaultLocale}</span><select name="defaultLocale" value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)}><option value="pt-BR">Português (Brasil)</option><option value="en-US">English (US)</option></select></label>
                        <label><span>{t.fields.currency}</span><input name="currencyCode" list="settings-currencies" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} maxLength={3} required /><datalist id="settings-currencies">{CURRENCY_SUGGESTIONS.map((value) => <option key={value} value={value} />)}</datalist></label>
                        <label><span>{t.fields.registrationType}</span><input name="registrationType" value={registrationType} onChange={(e) => setRegistrationType(e.target.value)} /></label>
                        <label><span>{t.fields.registrationNumber}</span><input name="registrationNumber" defaultValue={organization.registrationNumber ?? ""} /></label>
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeading}><span>03</span><div><h2>{t.sections.contact.title}</h2><p>{t.sections.contact.description}</p></div></div>
                    <div className={styles.grid}>
                        <label><span>{t.fields.contactEmail}</span><input type="email" name="contactEmail" defaultValue={organization.contactEmail ?? ""} /></label>
                        <label><span>{t.fields.replyToEmail}</span><input type="email" name="replyToEmail" defaultValue={organization.replyToEmail ?? ""} /></label>
                        <label><span>{t.fields.phoneCountryCode}</span><input name="phoneCountryCode" value={phoneCountryCode} onChange={(e) => setPhoneCountryCode(e.target.value)} /></label>
                        <label><span>{t.fields.phone}</span><input name="phoneNumber" defaultValue={organization.phoneNumber ?? ""} /></label>
                        <label className={styles.wide}><span>{t.fields.website}</span><input type="url" name="websiteUrl" defaultValue={organization.websiteUrl ?? ""} placeholder="https://" /></label>
                        <label><span>{t.fields.addressLine1}</span><input name="addressLine1" defaultValue={organization.addressLine1 ?? ""} /></label>
                        <label><span>{t.fields.addressLine2}</span><input name="addressLine2" defaultValue={organization.addressLine2 ?? ""} /></label>
                        <label><span>{t.fields.city}</span><input name="city" defaultValue={organization.city ?? ""} /></label>
                        <label><span>{t.fields.region}</span><input name="region" defaultValue={organization.region ?? ""} /></label>
                        <label><span>{t.fields.postalCode}</span><input name="postalCode" defaultValue={organization.postalCode ?? ""} /></label>
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeading}><span>04</span><div><h2>{t.sections.branding.title}</h2><p>{t.sections.branding.description}</p></div></div>
                    <div className={styles.grid}>
                        <label><span>{t.fields.primaryColor}</span><input type="color" name="primaryColor" defaultValue={organization.primaryColor} /></label>
                        <label><span>{t.fields.secondaryColor}</span><input type="color" name="secondaryColor" defaultValue={organization.secondaryColor} /></label>
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeading}><span>05</span><div><h2>{t.sections.enterprise.title}</h2><p>{t.sections.enterprise.description}</p></div></div>
                    <div className={styles.enterpriseGrid}>
                        <article><div><strong>{t.fields.customDomain}</strong><span>{organization.customDomain ?? t.future.notConfigured}</span></div><em>{t.domainStatuses[organization.customDomainStatus as keyof typeof t.domainStatuses] ?? organization.customDomainStatus}</em></article>
                        <article><div><strong>{t.fields.customEmailDomain}</strong><span>{organization.customEmailDomain ?? t.future.notConfigured}</span></div><em>{t.domainStatuses[organization.customEmailDomainStatus as keyof typeof t.domainStatuses] ?? organization.customEmailDomainStatus}</em></article>
                    </div>
                    <p className={styles.futureNote}>{t.future.description}</p>
                </section>

                <div className={styles.actions}><button type="submit">{t.actions.save}</button></div>
            </form>
        </main>
    );
}
