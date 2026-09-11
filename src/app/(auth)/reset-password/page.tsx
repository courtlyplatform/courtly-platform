import {
    updatePassword,
} from "@/modules/auth/actions";

import {
    AuthLayout,
} from "@/shared/ui/AuthLayout";


type ResetPasswordPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};


export default async function ResetPasswordPage({
    searchParams,
}: ResetPasswordPageProps) {
    const {
        error,
    } =
        await searchParams;

    return (
        <AuthLayout>
            <div className="auth-card-heading">
                <span className="auth-card-eyebrow">
                    SEGURANÇA
                </span>

                <h2>
                    Defina sua nova senha
                </h2>

                <p>
                    Utilize pelo menos
                    8 caracteres.
                </p>
            </div>

            {error && (
                <div
                    className="auth-alert auth-alert--error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            <form
                action={updatePassword}
                className="auth-form"
            >
                <div className="auth-field">
                    <label htmlFor="password">
                        Nova senha
                    </label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        minLength={8}
                        autoComplete="new-password"
                        required
                    />
                </div>

                <div className="auth-field">
                    <label htmlFor="confirmPassword">
                        Confirmar nova senha
                    </label>

                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        minLength={8}
                        autoComplete="new-password"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="auth-primary-button"
                >
                    Atualizar senha
                </button>
            </form>
        </AuthLayout>
    );
}