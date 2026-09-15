import Link from "next/link";

import { requestPasswordReset } from "@/modules/auth/actions";
import { getCurrentLocale } from "@/shared/i18n/getCurrentLocale";
import { getDictionary } from "@/shared/i18n/getDictionary";
import { AuthLayout } from "@/shared/ui/AuthLayout";

type ForgotPasswordPageProps = { searchParams: Promise<{ error?: string; success?: string }> };

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
    const { error, success } = await searchParams;
    const locale = await getCurrentLocale();
    const t = getDictionary(locale).auth;
    const errorMessage = error ? (t.errors[error as keyof typeof t.errors] ?? t.errors.unexpected) : null;

    return (
        <AuthLayout>
            <div className="auth-card-heading">
                <span className="auth-card-eyebrow">{t.forgot.eyebrow}</span>
                <h2>{t.forgot.title}</h2>
                <p>{t.forgot.description}</p>
            </div>

            {errorMessage && <div className="auth-alert auth-alert--error" role="alert">{errorMessage}</div>}

            {success ? (
                <>
                    <div className="auth-alert auth-alert--success">{t.forgot.success}</div>
                    <Link href="/login" className="auth-primary-button">{t.forgot.backToLogin}</Link>
                </>
            ) : (
                <form action={requestPasswordReset} className="auth-form">
                    <div className="auth-field"><label htmlFor="email">{t.fields.email}</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
                    <button type="submit" className="auth-primary-button">{t.forgot.submit}</button>
                </form>
            )}

            <p className="auth-footer-text"><Link href="/login" className="auth-inline-link">← {t.forgot.back}</Link></p>
        </AuthLayout>
    );
}
