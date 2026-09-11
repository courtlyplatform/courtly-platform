import Link from "next/link";

import {
    requestPasswordReset,
} from "@/modules/auth/actions";

import {
    AuthLayout,
} from "@/shared/ui/AuthLayout";


type ForgotPasswordPageProps = {
    searchParams: Promise<{
        error?: string;
        success?: string;
    }>;
};


export default async function ForgotPasswordPage({
    searchParams,
}: ForgotPasswordPageProps) {
    const {
        error,
        success,
    } =
        await searchParams;

    return (
        <AuthLayout>
            <div className="auth-card-heading">
                <span className="auth-card-eyebrow">
                    RECUPERAÇÃO
                </span>

                <h2>
                    Esqueceu sua senha?
                </h2>

                <p>
                    Informe seu e-mail.
                    Enviaremos as instruções
                    para definir uma nova senha.
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

            {success ? (
                <>
                    <div className="auth-alert auth-alert--success">
                        Se existir uma conta
                        associada a esse e-mail,
                        você receberá as
                        instruções de recuperação.
                    </div>

                    <Link
                        href="/login"
                        className="auth-primary-button"
                    >
                        Voltar para o login
                    </Link>
                </>
            ) : (
                <form
                    action={
                        requestPasswordReset
                    }
                    className="auth-form"
                >
                    <div className="auth-field">
                        <label htmlFor="email">
                            E-mail
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-primary-button"
                    >
                        Enviar recuperação
                    </button>
                </form>
            )}

            <p className="auth-footer-text">
                <Link
                    href="/login"
                    className="auth-inline-link"
                >
                    ← Voltar para entrar
                </Link>
            </p>
        </AuthLayout>
    );
}