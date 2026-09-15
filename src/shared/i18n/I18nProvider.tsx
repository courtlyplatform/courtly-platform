"use client";

import {
    createContext,
    useContext,
    useMemo,
    useState,
    useTransition,
    type ReactNode,
} from "react";

import {
    useRouter,
} from "next/navigation";

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
    const router = useRouter();

    const [
        locale,
        setLocaleState,
    ] = useState<Locale>(
        initialLocale
    );

    const [, startTransition] =
        useTransition();

    function setLocale(
        newLocale: Locale
    ) {
        setLocaleState(newLocale);

        document.cookie =
            `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

        document.documentElement.lang =
            newLocale;

        // The auth pages are Server Components and read the locale from the
        // cookie. Updating only React state changes client components (such as
        // the toggle), but does not re-render those Server Components.
        // Refresh the current route after persisting the cookie so Next.js
        // renders the whole page again using the newly selected locale.
        startTransition(() => {
            router.refresh();
        });
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