import type {
    Metadata,
} from "next";

import type {
    ReactNode,
} from "react";

import "./globals.css";

import {
    getCurrentLocale,
} from "@/shared/i18n/getCurrentLocale";

import {
    Providers,
} from "@/shared/Providers";

export const metadata: Metadata = {
    title: "Courtly",
    description:
        "Plataforma de gestão de aulas, alunos e atividades.",
};

type RootLayoutProps = {
    children: ReactNode;
};

export default async function RootLayout({
    children,
}: RootLayoutProps) {
    const locale =
        await getCurrentLocale();

    return (
        <html
            lang={locale}
            suppressHydrationWarning
        >
            <body>
                <Providers
                    initialLocale={locale}
                >
                    {children}
                </Providers>
            </body>
        </html>
    );
}