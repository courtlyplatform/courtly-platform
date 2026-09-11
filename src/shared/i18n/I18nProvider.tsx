"use client";

import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    LOCALE_COOKIE_NAME,
    type Locale,
} from "./config";

import {
    getDictionary,
    type Dictionary,
} from "./getDictionary";

type I18nContextValue = {
    locale: Locale;
    dictionary: Dictionary;
    setLocale: (locale: Locale) => void;
};

const I18nContext =
    createContext<I18nContextValue | null>(
        null
    );

type I18nProviderProps = {
    children: ReactNode;
    initialLocale: Locale;
};

export function I18nProvider({
    children,
    initialLocale,
}: I18nProviderProps) {
    const [
        locale,
        setLocaleState,
    ] = useState<Locale>(
        initialLocale
    );

    function setLocale(
        newLocale: Locale
    ) {
        setLocaleState(newLocale);

        document.cookie =
            `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

        document.documentElement.lang =
            newLocale;

        window.location.reload();
    }

    const dictionary =
        useMemo(
            () =>
                getDictionary(locale),
            [locale]
        );

    const value =
        useMemo<I18nContextValue>(
            () => ({
                locale,
                dictionary,
                setLocale,
            }),
            [
                locale,
                dictionary,
            ]
        );

    return (
        <I18nContext.Provider
            value={value}
        >
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context =
        useContext(I18nContext);

    if (!context) {
        throw new Error(
            "useI18n must be used inside I18nProvider"
        );
    }

    return context;
}