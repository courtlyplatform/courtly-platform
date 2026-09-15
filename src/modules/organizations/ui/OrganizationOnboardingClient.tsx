"use client";

import { useMemo, useState, type FormEvent } from "react";

import { completeOnboarding } from "@/modules/organizations/actions";
import {
    BUSINESS_TYPES,
    COUNTRY_PRESETS,
    COUNTRY_SUGGESTIONS,
    CURRENCY_SUGGESTIONS,
    TIMEZONE_SUGGESTIONS,
    normalizeSlug,
} from "@/modules/organizations/organization-options";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";

type Props = {
    professionalName: string;
    profilePhone: string;
    userEmail: string;
    errorCode?: string;
};

export function OrganizationOnboardingClient({ professionalName, profilePhone, userEmail, errorCode }: Props) {
    const { dictionary } = useI18n();
    const t = dictionary.organizations;
    const [step, setStep] = useState(1);
    const [displayName, setDisplayName] = useState("");
    const [countryCode, setCountryCode] = useState("BR");
    const [timezone, setTimezone] = useState("America/Sao_Paulo");
    const [defaultLocale, setDefaultLocale] = useState("pt-BR");
    const [currencyCode, setCurrencyCode] = useState("BRL");
    const [phoneCountryCode, setPhoneCountryCode] = useState("+55");
    const [registrationType, setRegistrationType] = useState("CNPJ");
    const [slug, setSlug] = useState("");

    const errorMessage = errorCode
        ? (t.errors[errorCode as keyof typeof t.errors] ?? t.errors.invalidData)
        : null;

    const timezoneOptions = useMemo(() => {
        try {
            const supported = (Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
            return Array.from(new Set([...TIMEZONE_SUGGESTIONS, ...supported]));
        } catch {
            return [...TIMEZONE_SUGGESTIONS];
        }
    }, []);

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

    function guardFinalSubmission(event: FormEvent<HTMLFormElement>) {
        if (step !== 4) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    function changeDisplayName(value: string) {
        setDisplayName(value);
        setSlug((current) => current ? current : normalizeSlug(value));
    }

    return (
        <main className="onboarding-page">
            <section className="onboarding-brand-panel">
                <div className="onboarding-brand-content">
                    <div className="onboarding-brand-copy">
                        <span className="onboarding-brand-eyebrow">MOVE • IMPROVE • LIVE BETTER</span>
                        <h1>{t.onboarding.brandTitle}</h1>
                        <p>{t.onboarding.brandDescription}</p>
                    </div>
                    <div className="onboarding-brand-footer"><span className="onboarding-brand-footer-line" aria-hidden="true" />Courtly Platform</div>
                </div>
            </section>

            <section className="onboarding-form-panel">
                <div className="auth-language-area public-preferences"><ThemeToggle compact /><LanguageSwitcher /></div>
                <div className="onboarding-container onboarding-container--wide">
                    <div className="onboarding-heading">
                        <span className="onboarding-eyebrow">{t.onboarding.eyebrow}</span>
                        <h2>{t.onboarding.title}</h2>
                        <p>{t.onboarding.greeting.replace("{name}", professionalName)}</p>
                    </div>

                    <div className="organization-stepper" aria-label={t.onboarding.progressLabel}>
                        {[1, 2, 3, 4].map((item) => (
                            <button key={item} type="button" className={item === step ? "organization-step active" : item < step ? "organization-step done" : "organization-step"} onClick={() => setStep(item)}>
                                <span>{item}</span>{t.onboarding.steps[item - 1]}
                            </button>
                        ))}
                    </div>

                    {errorMessage && <div className="auth-alert auth-alert--error" role="alert">{errorMessage}</div>}

                    <form action={completeOnboarding} className="onboarding-form" onSubmit={guardFinalSubmission}>
                        <input type="hidden" name="professionalName" value={professionalName} />
                        {step === 4 && <input type="hidden" name="onboardingStage" value="FINAL" />}

                        <section className={step === 1 ? "onboarding-form-section" : "onboarding-form-section organization-hidden-step"}>
                            <div className="onboarding-section-heading"><span>01</span><div><h3>{t.sections.identity.title}</h3><p>{t.sections.identity.description}</p></div></div>
                            <div className="onboarding-grid">
                                <div className="onboarding-field"><label htmlFor="displayName">{t.fields.displayName}</label><input id="displayName" name="displayName" value={displayName} onChange={(e) => changeDisplayName(e.target.value)} required /></div>
                                <div className="onboarding-field"><label htmlFor="legalName">{t.fields.legalName}</label><input id="legalName" name="legalName" /></div>
                                <div className="onboarding-field"><label htmlFor="businessType">{t.fields.businessType}</label><select id="businessType" name="businessType" defaultValue="ACADEMY">{BUSINESS_TYPES.map((value) => <option key={value} value={value}>{t.businessTypes[value]}</option>)}</select></div>
                                <div className="onboarding-field"><label htmlFor="slug">{t.fields.slug}</label><input id="slug" name="slug" value={slug} onChange={(e) => setSlug(normalizeSlug(e.target.value))} required /><small>{t.help.slug}</small></div>
                            </div>
                        </section>

                        <section className={step === 2 ? "onboarding-form-section" : "onboarding-form-section organization-hidden-step"}>
                            <div className="onboarding-section-heading"><span>02</span><div><h3>{t.sections.regional.title}</h3><p>{t.sections.regional.description}</p></div></div>
                            <div className="onboarding-grid">
                                <div className="onboarding-field"><label htmlFor="countryCode">{t.fields.country}</label><input id="countryCode" name="countryCode" list="country-codes" value={countryCode} onChange={(e) => applyCountryPreset(e.target.value)} maxLength={2} required /><datalist id="country-codes">{COUNTRY_SUGGESTIONS.map((value) => <option key={value} value={value} />)}</datalist><small>{t.help.country}</small></div>
                                <div className="onboarding-field"><label htmlFor="timezone">{t.fields.timezone}</label><input id="timezone" name="timezone" list="timezones" value={timezone} onChange={(e) => setTimezone(e.target.value)} required /><datalist id="timezones">{timezoneOptions.map((value) => <option key={value} value={value} />)}</datalist></div>
                                <div className="onboarding-field"><label htmlFor="defaultLocale">{t.fields.defaultLocale}</label><select id="defaultLocale" name="defaultLocale" value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)}><option value="pt-BR">Português (Brasil)</option><option value="en-US">English (US)</option></select></div>
                                <div className="onboarding-field"><label htmlFor="currencyCode">{t.fields.currency}</label><input id="currencyCode" name="currencyCode" list="currency-codes" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} maxLength={3} required /><datalist id="currency-codes">{CURRENCY_SUGGESTIONS.map((value) => <option key={value} value={value} />)}</datalist></div>
                                <div className="onboarding-field"><label htmlFor="registrationType">{t.fields.registrationType}</label><input id="registrationType" name="registrationType" value={registrationType} onChange={(e) => setRegistrationType(e.target.value)} /></div>
                                <div className="onboarding-field"><label htmlFor="registrationNumber">{t.fields.registrationNumber}</label><input id="registrationNumber" name="registrationNumber" /></div>
                            </div>
                        </section>

                        <section className={step === 3 ? "onboarding-form-section" : "onboarding-form-section organization-hidden-step"}>
                            <div className="onboarding-section-heading"><span>03</span><div><h3>{t.sections.contact.title}</h3><p>{t.sections.contact.description}</p></div></div>
                            <div className="onboarding-grid">
                                <div className="onboarding-field"><label htmlFor="contactEmail">{t.fields.contactEmail}</label><input id="contactEmail" name="contactEmail" type="email" defaultValue={userEmail} /></div>
                                <div className="onboarding-field"><label htmlFor="replyToEmail">{t.fields.replyToEmail}</label><input id="replyToEmail" name="replyToEmail" type="email" defaultValue={userEmail} /></div>
                                <div className="onboarding-field"><label htmlFor="phoneCountryCode">{t.fields.phoneCountryCode}</label><input id="phoneCountryCode" name="phoneCountryCode" value={phoneCountryCode} onChange={(e) => setPhoneCountryCode(e.target.value)} /></div>
                                <div className="onboarding-field"><label htmlFor="phoneNumber">{t.fields.phone}</label><input id="phoneNumber" name="phoneNumber" defaultValue={profilePhone} /></div>
                                <div className="onboarding-field"><label htmlFor="websiteUrl">{t.fields.website}</label><input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://" /></div>
                                <div className="onboarding-field"><label htmlFor="addressLine1">{t.fields.addressLine1}</label><input id="addressLine1" name="addressLine1" /></div>
                                <div className="onboarding-field"><label htmlFor="addressLine2">{t.fields.addressLine2}</label><input id="addressLine2" name="addressLine2" /></div>
                                <div className="onboarding-field"><label htmlFor="city">{t.fields.city}</label><input id="city" name="city" /></div>
                                <div className="onboarding-field"><label htmlFor="region">{t.fields.region}</label><input id="region" name="region" /></div>
                                <div className="onboarding-field"><label htmlFor="postalCode">{t.fields.postalCode}</label><input id="postalCode" name="postalCode" /></div>
                            </div>
                        </section>

                        <section className={step === 4 ? "onboarding-form-section" : "onboarding-form-section organization-hidden-step"}>
                            <div className="onboarding-section-heading"><span>04</span><div><h3>{t.sections.branding.title}</h3><p>{t.sections.branding.description}</p></div></div>
                            <div className="onboarding-grid">
                                <div className="onboarding-field"><label htmlFor="primaryColor">{t.fields.primaryColor}</label><input id="primaryColor" name="primaryColor" type="color" defaultValue="#3FAF95" /></div>
                                <div className="onboarding-field"><label htmlFor="secondaryColor">{t.fields.secondaryColor}</label><input id="secondaryColor" name="secondaryColor" type="color" defaultValue="#0E342C" /></div>
                            </div>
                            <div className="organization-future-card"><strong>{t.future.title}</strong><p>{t.future.description}</p><span>{t.future.items}</span></div>
                        </section>

                        <div className="onboarding-actions organization-step-actions">
                            <button type="button" className="organization-secondary-button" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))}>{t.actions.back}</button>
                            {step < 4 ? (
                                <button type="button" className="onboarding-submit" onClick={() => setStep((value) => Math.min(4, value + 1))}>{t.actions.continue}<span>→</span></button>
                            ) : (
                                <button type="submit" className="onboarding-submit">{t.actions.create}<span>→</span></button>
                            )}
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}
