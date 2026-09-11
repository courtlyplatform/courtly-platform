import Link from "next/link";
import { signIn } from "@/modules/auth/actions";

type LoginPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};

export default async function LoginPage({
    searchParams,
}: LoginPageProps) {
    const { error } = await searchParams;

    return (
        <main>
            <h1>Entrar no Courtly</h1>

            {error && (
                <p role="alert">
                    {error}
                </p>
            )}

            <form action={signIn}>
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
                        required
                    />
                </div>

                <button type="submit">
                    Entrar
                </button>
            </form>

            <p>
                Ainda não possui uma conta?{" "}
                <Link href="/signup">
                    Criar conta
                </Link>
            </p>
        </main>
    );
}