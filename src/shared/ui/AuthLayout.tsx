import Image from "next/image";

import type {
    ReactNode,
} from "react";


type AuthLayoutProps = {
    children: ReactNode;
};


export function AuthLayout({
    children,
}: AuthLayoutProps) {
    return (
        <main className="auth-page">
            <section className="auth-brand-panel">
                <div className="auth-brand-content">

                    <div className="auth-logo-area">
                        <div
                            className="auth-logo-glow"
                            aria-hidden="true"
                        />

                        <div className="auth-logo-ring">
                            <Image
                                src="/images/logo.png"
                                alt="Courtly"
                                width={220}
                                height={220}
                                className="auth-brand-logo"
                                priority
                            />
                        </div>
                    </div>

                    <div className="auth-brand-copy">
                        <span className="auth-eyebrow">
                            MOVE • IMPROVE • LIVE BETTER
                        </span>

                        <h1>
                            Gestão que acompanha
                            o seu movimento.
                        </h1>

                        <p>
                            Organize clientes,
                            profissionais, agenda,
                            presença e pagamentos
                            em um único lugar.
                        </p>
                    </div>

                    <div className="auth-brand-footer">
                        <span
                            className="auth-brand-footer-line"
                            aria-hidden="true"
                        />

                        Courtly Platform
                    </div>
                </div>
            </section>

            <section className="auth-form-panel">
                <div className="auth-form-container">
                    {children}
                </div>
            </section>
        </main>
    );
}