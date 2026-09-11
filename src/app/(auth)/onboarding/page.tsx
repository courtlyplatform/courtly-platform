import Image from "next/image";
import { redirect } from "next/navigation";

import {
    completeOnboarding,
} from "@/modules/organizations/actions";

import {
    createClient,
} from "@/shared/database/supabase/server";


type OnboardingPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};


export default async function OnboardingPage({
    searchParams,
}: OnboardingPageProps) {
    const { error } =
        await searchParams;

    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();


    if (!user) {
        redirect("/login");
    }


    // =====================================================
    // CURRENT USER
    // =====================================================

    const {
        data: profile,
    } =
        await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


    const metadataName =
        typeof user.user_metadata
            ?.full_name === "string"
            ? user.user_metadata
                  .full_name
            : "";


    const professionalName =
        profile?.full_name ||
        metadataName ||
        user.email?.split("@")[0] ||
        "";


    const profilePhone =
        profile?.phone ?? "";


    return (
        <main className="onboarding-page">
            <section className="onboarding-brand-panel">
                <div className="onboarding-brand-content">

                    <div className="onboarding-logo-area">
                        <div
                            className="onboarding-logo-glow"
                            aria-hidden="true"
                        />

                        <div className="onboarding-logo-ring">
                            <Image
                                src="/images/logo.png"
                                alt="Courtly"
                                width={190}
                                height={190}
                                className="onboarding-logo"
                                priority
                            />
                        </div>
                    </div>


                    <div className="onboarding-brand-copy">
                        <span className="onboarding-brand-eyebrow">
                            MOVE • IMPROVE • LIVE BETTER
                        </span>

                        <h1>
                            Seu espaço.
                            <br />
                            Sua gestão.
                        </h1>

                        <p>
                            Configure as informações
                            principais da sua organização
                            para começar a utilizar o
                            Courtly.
                        </p>
                    </div>


                    <div className="onboarding-brand-footer">
                        <span
                            className="onboarding-brand-footer-line"
                            aria-hidden="true"
                        />

                        Courtly Platform
                    </div>
                </div>
            </section>


            <section className="onboarding-form-panel">
                <div className="onboarding-container">

                    <div className="onboarding-heading">
                        <span className="onboarding-eyebrow">
                            CONFIGURAÇÃO INICIAL
                        </span>

                        <h2>
                            Configure sua organização
                        </h2>

                        <p>
                            Olá,{" "}
                            <strong>
                                {professionalName}
                            </strong>
                            . Conte-nos um pouco sobre
                            o seu negócio.
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


                    <div className="onboarding-info">
                        <span
                            className="onboarding-info-icon"
                            aria-hidden="true"
                        >
                            ✓
                        </span>

                        <div>
                            <strong>
                                Você será o proprietário
                                desta organização
                            </strong>

                            <span>
                                Depois você poderá convidar
                                administradores e profissionais
                                para fazer parte da equipe.
                            </span>
                        </div>
                    </div>


                    <form
                        action={completeOnboarding}
                        className="onboarding-form"
                    >
                        <div className="onboarding-form-section">
                            <div className="onboarding-section-heading">
                                <span>
                                    01
                                </span>

                                <div>
                                    <h3>
                                        Organização
                                    </h3>

                                    <p>
                                        Identifique o seu negócio
                                        dentro do Courtly.
                                    </p>
                                </div>
                            </div>


                            <div className="onboarding-field">
                                <label htmlFor="organizationName">
                                    Nome do negócio
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="organizationName"
                                    name="organizationName"
                                    type="text"
                                    placeholder="Ex.: Augusto Tennis"
                                    maxLength={150}
                                    autoComplete="organization"
                                    required
                                />
                            </div>


                            <div className="onboarding-field">
                                <label htmlFor="businessType">
                                    Tipo de negócio
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="businessType"
                                    name="businessType"
                                    defaultValue=""
                                    required
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        Selecione o tipo do seu negócio
                                    </option>

                                    <option value="ACADEMY">
                                        Academia / Escola
                                    </option>

                                    <option value="CLUB">
                                        Clube
                                    </option>

                                    <option value="STUDIO">
                                        Estúdio
                                    </option>

                                    <option value="INDEPENDENT_PROFESSIONAL">
                                        Profissional independente
                                    </option>

                                    <option value="CLINIC">
                                        Clínica
                                    </option>

                                    <option value="OTHER">
                                        Outro
                                    </option>
                                </select>
                            </div>
                        </div>


                        <div className="onboarding-form-section">
                            <div className="onboarding-section-heading">
                                <span>
                                    02
                                </span>

                                <div>
                                    <h3>
                                        Contato
                                    </h3>

                                    <p>
                                        Informe como sua organização
                                        pode ser identificada e
                                        contatada.
                                    </p>
                                </div>
                            </div>


                            <div className="onboarding-grid">
                                <div className="onboarding-field">
                                    <label htmlFor="professionalName">
                                        Seu nome
                                        <span aria-hidden="true">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="professionalName"
                                        name="professionalName"
                                        type="text"
                                        defaultValue={
                                            professionalName
                                        }
                                        maxLength={150}
                                        autoComplete="name"
                                        required
                                    />
                                </div>


                                <div className="onboarding-field">
                                    <label htmlFor="phone">
                                        Telefone / WhatsApp
                                    </label>

                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        defaultValue={
                                            profilePhone
                                        }
                                        placeholder="+55 (19) 99999-9999"
                                        maxLength={30}
                                        autoComplete="tel"
                                    />

                                    <small>
                                        Opcional
                                    </small>
                                </div>
                            </div>
                        </div>


                        <div className="onboarding-form-section">
                            <div className="onboarding-section-heading">
                                <span>
                                    03
                                </span>

                                <div>
                                    <h3>
                                        Região e moeda
                                    </h3>

                                    <p>
                                        Essas informações serão usadas
                                        como padrão na sua organização.
                                    </p>
                                </div>
                            </div>


                            <div className="onboarding-grid">
                                <div className="onboarding-field">
                                    <label htmlFor="country">
                                        País
                                        <span aria-hidden="true">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="country"
                                        name="country"
                                        defaultValue="BR"
                                        required
                                    >
                                        <option value="BR">
                                            Brasil
                                        </option>

                                        <option value="US">
                                            Estados Unidos
                                        </option>

                                        <option value="PT">
                                            Portugal
                                        </option>

                                        <option value="CA">
                                            Canadá
                                        </option>

                                        <option value="OTHER">
                                            Outro
                                        </option>
                                    </select>
                                </div>


                                <div className="onboarding-field">
                                    <label htmlFor="timezone">
                                        Fuso horário
                                        <span aria-hidden="true">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="timezone"
                                        name="timezone"
                                        defaultValue="America/Sao_Paulo"
                                        required
                                    >
                                        <option value="America/Sao_Paulo">
                                            São Paulo — GMT-3
                                        </option>

                                        <option value="America/New_York">
                                            New York — Eastern Time
                                        </option>

                                        <option value="America/Chicago">
                                            Chicago — Central Time
                                        </option>

                                        <option value="America/Denver">
                                            Denver — Mountain Time
                                        </option>

                                        <option value="America/Los_Angeles">
                                            Los Angeles — Pacific Time
                                        </option>

                                        <option value="America/Toronto">
                                            Toronto — Eastern Time
                                        </option>

                                        <option value="Europe/Lisbon">
                                            Lisboa
                                        </option>
                                    </select>
                                </div>
                            </div>


                            <div className="onboarding-field">
                                <label htmlFor="defaultCurrency">
                                    Moeda padrão
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="defaultCurrency"
                                    name="defaultCurrency"
                                    defaultValue="BRL"
                                    required
                                >
                                    <option value="BRL">
                                        BRL — Real brasileiro (R$)
                                    </option>

                                    <option value="USD">
                                        USD — Dólar americano ($)
                                    </option>

                                    <option value="EUR">
                                        EUR — Euro (€)
                                    </option>

                                    <option value="CAD">
                                        CAD — Dólar canadense (CA$)
                                    </option>
                                </select>

                                <small>
                                    Será utilizada como moeda padrão
                                    para futuros valores, planos e
                                    pagamentos.
                                </small>
                            </div>
                        </div>


                        <div className="onboarding-actions">
                            <div className="onboarding-actions-copy">
                                <strong>
                                    Tudo pronto?
                                </strong>

                                <span>
                                    Você poderá alterar essas
                                    configurações posteriormente.
                                </span>
                            </div>

                            <button
                                type="submit"
                                className="onboarding-submit"
                            >
                                Criar minha organização

                                <span aria-hidden="true">
                                    →
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}