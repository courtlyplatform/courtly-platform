import { completeOnboarding } from "@/modules/organizations/actions";

type OnboardingPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};

export default async function OnboardingPage({
    searchParams,
}: OnboardingPageProps) {
    const { error } = await searchParams;

    return (
        <main>
            <h1>Bem-vindo ao Courtly</h1>

            <p>
                Vamos configurar seu espaço.
            </p>

            {error && (
                <p role="alert">
                    {error}
                </p>
            )}

            <form action={completeOnboarding}>
                <div>
                    <label htmlFor="professionalName">
                        Seu nome
                    </label>

                    <input
                        id="professionalName"
                        name="professionalName"
                        type="text"
                        placeholder="Augusto Meireles"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="organizationName">
                        Nome do seu negócio
                    </label>

                    <input
                        id="organizationName"
                        name="organizationName"
                        type="text"
                        placeholder="Augusto Tennis"
                        required
                    />
                </div>

                <button type="submit">
                    Continuar
                </button>
            </form>
        </main>
    );
}