import Link from "next/link";

import { signUp } from "@/modules/auth/actions";
import { getCurrentLocale } from "@/shared/i18n/getCurrentLocale";
import { getDictionary } from "@/shared/i18n/getDictionary";
import { AuthLayout } from "@/shared/ui/AuthLayout";

type SignUpPageProps = { searchParams: Promise<{ error?: string }> };

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
    const { error } = await searchParams;
    const locale = await getCurrentLocale();
    const t = getDictionary(locale).auth;
    const errorMessage = error ? (t.errors[error as keyof typeof t.errors] ?? t.errors.unexpected) : null;

    return (
        <AuthLayout>
            <div className="auth-card-heading">
                <span className="auth-card-eyebrow">{t.signup.eyebrow}</span>
                <h2>{t.signup.title}</h2>
                <p>{t.signup.description}</p>
            </div>

            <div className="auth-owner-notice">
                <strong>{t.signup.ownerNoticeTitle}</strong>
                <span>{t.signup.ownerNoticeDescription}</span>
            </div>

            {errorMessage && <div className="auth-alert auth-alert--error" role="alert">{errorMessage}</div>}

            <form action={signUp} className="auth-form">
                <div className="auth-field"><label htmlFor="fullName">{t.fields.fullName}</label><input id="fullName" name="fullName" type="text" autoComplete="name" required /></div>
                <div className="auth-field"><label htmlFor="email">{t.fields.email}</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
                <div className="auth-field"><label htmlFor="password">{t.fields.password}</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
                <div className="auth-field"><label htmlFor="confirmPassword">{t.fields.confirmPassword}</label><input id="confirmPassword" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></div>
                <button type="submit" className="auth-primary-button">{t.signup.submit}</button>
            </form>

            <p className="auth-footer-text">{t.signup.haveAccount} <Link href="/login" className="auth-inline-link">{t.signup.signIn}</Link></p>
        </AuthLayout>
    );
}
