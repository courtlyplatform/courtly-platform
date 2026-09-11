"use client";

import type {
    ReactNode,
} from "react";

import type {
    Locale,
} from "@/shared/i18n/config";

import {
    I18nProvider,
} from "@/shared/i18n/I18nProvider";

import {
    ThemeProvider,
} from "@/shared/theme/ThemeProvider";

type ProvidersProps = {
    children: ReactNode;
    initialLocale: Locale;
};

export function Providers({
    children,
    initialLocale,
}: ProvidersProps) {
    return (
        <ThemeProvider>
            <I18nProvider
                initialLocale={initialLocale}
            >
                {children}
            </I18nProvider>
        </ThemeProvider>
    );
}