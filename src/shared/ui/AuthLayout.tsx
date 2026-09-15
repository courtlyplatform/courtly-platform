import Image from "next/image";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { getCurrentLocale } from "@/shared/i18n/getCurrentLocale";
import { getDictionary } from "@/shared/i18n/getDictionary";

type AuthLayoutProps = {
    children: ReactNode;
};

export async function AuthLayout({ children }: AuthLayoutProps) {
    const locale = await getCurrentLocale();
    const t = getDictionary(locale).authLayout;

    return (
        <main className="auth-page">
            <section className="auth-brand-panel">
                <div className="auth-brand-content">
                    <div className="auth-logo-area">
                        <div className="auth-logo-glow" aria-hidden="true" />

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

                        <h1>{t.headline}</h1>
                        <p>{t.description}</p>
                    </div>

                    <div className="auth-brand-footer">
                        <span className="auth-brand-footer-line" aria-hidden="true" />
                        Courtly Platform
                    </div>
                </div>
            </section>

            <section className="auth-form-panel">
                <div className="auth-language-area public-preferences">
                    <ThemeToggle compact />
                    <LanguageSwitcher />
                </div>

                <div className="auth-form-container">
                    {children}
                </div>
            </section>
        </main>
    );
}
