import Link from "next/link";
import { signUp } from "@/modules/auth/actions";

type SignUpPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};

export default async function SignUpPage({
    searchParams,
}: SignUpPageProps) {
    const { error } = await searchParams;

    return (
        <main>
            <h1>Crie sua conta</h1>

            <p>
                Comece a organizar suas aulas e seus alunos com o Courtly.
            </p>

            {error && (
                <p role="alert">
                    {error}
                </p>
            )}

            <form action={signUp}>
                <div>
                    <label htmlFor="email">
                        E-mail
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">
                        Senha
                    </label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        minLength={6}
                        required
                    />
                </div>

                <button type="submit">
                    Criar conta
                </button>
            </form>

            <p>
                Já possui uma conta?{" "}
                <Link href="/login">
                    Entrar
                </Link>
            </p>
        </main>
    );
}