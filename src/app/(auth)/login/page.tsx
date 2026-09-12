import Link from "next/link";

import {
    signIn,
} from "@/modules/auth/actions";

import {
    AuthLayout,
} from "@/shared/ui/AuthLayout";


type LoginPageProps = {
    searchParams: Promise<{
        error?: string;
        passwordUpdated?: string;
    }>;
};


export default async function LoginPage({
    searchParams,
}: LoginPageProps) {
    const {
        error,
        passwordUpdated,
    } =
        await searchParams;

    return (
        <AuthLayout>
            <div className="auth-card-heading">
                <span className="auth-card-eyebrow">
                    BEM-VINDO
                </span>

                <h2>
                    Entrar no Courtly
                </h2>

                <p>
                    Acesse sua organização e
                    continue de onde parou.
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

            {passwordUpdated && (
                <div
                    className="auth-alert auth-alert--success"
                    role="status"
                >
                    Senha atualizada.
                    Você já pode entrar novamente.
                </div>
            )}

            <form
                action={signIn}
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
                        placeholder="voce@exemplo.com"
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="auth-field">
                    <div className="auth-field-heading">
                        <label htmlFor="password">
                            Senha
                        </label>

                        <Link
                            href="/forgot-password"
                            className="auth-inline-link"
                        >
                            Esqueci minha senha
                        </Link>
                    </div>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Sua senha"
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="auth-primary-button"
                >
                    Entrar
                </button>
            </form>

            <div className="auth-divider">
                <span>
                    NOVA ORGANIZAÇÃO
                </span>
            </div>

            <p className="auth-footer-text">
                Quer administrar seu próprio
                espaço no Courtly?
                {" "}

                <Link
                    href="/signup"
                    className="auth-inline-link"
                >
                    Criar organização
                </Link>
            </p>

            <p className="auth-customer-note">
                É cliente?
                Utilize o acesso fornecido
                pela sua organização.
            </p>
        </AuthLayout>
    );
}