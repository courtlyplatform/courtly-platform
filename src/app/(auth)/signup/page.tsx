import Link from "next/link";

import {
    signUp,
} from "@/modules/auth/actions";

import {
    AuthLayout,
} from "@/shared/ui/AuthLayout";


type SignUpPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};


export default async function SignUpPage({
    searchParams,
}: SignUpPageProps) {
    const {
        error,
    } =
        await searchParams;

    return (
        <AuthLayout>
            <div className="auth-card-heading">
                <span className="auth-card-eyebrow">
                    PARA GESTORES
                </span>

                <h2>
                    Crie sua organização
                </h2>

                <p>
                    Sua conta será a responsável
                    pela nova organização e terá
                    o papel de proprietário.
                </p>
            </div>

            <div className="auth-owner-notice">
                <strong>
                    Este cadastro não é destinado
                    a clientes.
                </strong>

                <span>
                    Profissionais e clientes serão
                    vinculados posteriormente à
                    organização por fluxos
                    específicos.
                </span>
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
                action={signUp}
                className="auth-form"
            >
                <div className="auth-field">
                    <label htmlFor="fullName">
                        Seu nome
                    </label>

                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        required
                    />
                </div>

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

                <div className="auth-field">
                    <label htmlFor="password">
                        Senha
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
                        Confirmar senha
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
                    Continuar
                </button>
            </form>

            <p className="auth-footer-text">
                Já possui uma conta?
                {" "}

                <Link
                    href="/login"
                    className="auth-inline-link"
                >
                    Entrar
                </Link>
            </p>
        </AuthLayout>
    );
}