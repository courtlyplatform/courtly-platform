import { updatePassword } from "@/modules/auth/actions";
import { getCurrentLocale } from "@/shared/i18n/getCurrentLocale";
import { getDictionary } from "@/shared/i18n/getDictionary";
import { AuthLayout } from "@/shared/ui/AuthLayout";

type ResetPasswordPageProps = { searchParams: Promise<{ error?: string }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
    const { error } = await searchParams;
    const locale = await getCurrentLocale();
    const t = getDictionary(locale).auth;
    const errorMessage = error ? (t.errors[error as keyof typeof t.errors] ?? t.errors.unexpected) : null;

    return (
        <AuthLayout>
            <div className="auth-card-heading">
                <span className="auth-card-eyebrow">{t.reset.eyebrow}</span>
                <h2>{t.reset.title}</h2>
                <p>{t.reset.description}</p>
            </div>

            {errorMessage && <div className="auth-alert auth-alert--error" role="alert">{errorMessage}</div>}

            <form action={updatePassword} className="auth-form">
                <div className="auth-field"><label htmlFor="password">{t.fields.newPassword}</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
                <div className="auth-field"><label htmlFor="confirmPassword">{t.fields.confirmNewPassword}</label><input id="confirmPassword" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></div>
                <button type="submit" className="auth-primary-button">{t.reset.submit}</button>
            </form>
        </AuthLayout>
    );
}
