import Link from "next/link";

import { signIn } from "@/modules/auth/actions";
import { getCurrentLocale } from "@/shared/i18n/getCurrentLocale";
import { getDictionary } from "@/shared/i18n/getDictionary";
import { AuthLayout } from "@/shared/ui/AuthLayout";

type LoginPageProps = {
    searchParams: Promise<{ error?: string; passwordUpdated?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { error, passwordUpdated } = await searchParams;
    const locale = await getCurrentLocale();
    const t = getDictionary(locale).auth;
    const errorMessage = error ? (t.errors[error as keyof typeof t.errors] ?? t.errors.unexpected) : null;

    return (
        <AuthLayout>
            <div className="auth-card-heading">
                <span className="auth-card-eyebrow">{t.login.eyebrow}</span>
                <h2>{t.login.title}</h2>
                <p>{t.login.description}</p>
            </div>

            {errorMessage && <div className="auth-alert auth-alert--error" role="alert">{errorMessage}</div>}
            {passwordUpdated && <div className="auth-alert auth-alert--success" role="status">{t.login.passwordUpdated}</div>}

            <form action={signIn} className="auth-form">
                <div className="auth-field">
                    <label htmlFor="email">{t.fields.email}</label>
                    <input id="email" name="email" type="email" placeholder={t.placeholders.email} autoComplete="email" required />
                </div>
                <div className="auth-field">
                    <div className="auth-field-heading">
                        <label htmlFor="password">{t.fields.password}</label>
                        <Link href="/forgot-password" className="auth-inline-link">{t.login.forgotPassword}</Link>
                    </div>
                    <input id="password" name="password" type="password" placeholder={t.placeholders.password} autoComplete="current-password" required />
                </div>
                <button type="submit" className="auth-primary-button">{t.login.submit}</button>
            </form>

            <div className="auth-divider"><span>{t.login.newOrganization}</span></div>
            <p className="auth-footer-text">{t.login.createPrompt} <Link href="/signup" className="auth-inline-link">{t.login.createOrganization}</Link></p>
            <p className="auth-customer-note">{t.login.customerNote}</p>
        </AuthLayout>
    );
}
