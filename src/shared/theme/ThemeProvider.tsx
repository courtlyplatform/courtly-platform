"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

export type Theme =
    | "light"
    | "dark";

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
};

const ThemeContext =
    createContext<ThemeContextValue | null>(
        null
    );

const STORAGE_KEY = "courtly-theme";

type ThemeProviderProps = {
    children: ReactNode;
};

export function ThemeProvider({
    children,
}: ThemeProviderProps) {
    const [theme, setThemeState] =
        useState<Theme>("light");

    useEffect(() => {
        const storedTheme =
            window.localStorage.getItem(
                STORAGE_KEY
            ) as Theme | null;

        if (
            storedTheme === "light" ||
            storedTheme === "dark"
        ) {
            setThemeState(storedTheme);

            document.documentElement.dataset.theme =
                storedTheme;

            return;
        }

        const prefersDark =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

        const initialTheme: Theme =
            prefersDark
                ? "dark"
                : "light";

        setThemeState(initialTheme);

        document.documentElement.dataset.theme =
            initialTheme;
    }, []);

    function setTheme(
        newTheme: Theme
    ) {
        setThemeState(newTheme);

        window.localStorage.setItem(
            STORAGE_KEY,
            newTheme
        );

        document.documentElement.dataset.theme =
            newTheme;
    }

    function toggleTheme() {
        setTheme(
            theme === "light"
                ? "dark"
                : "light"
        );
    }

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context =
        useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider"
        );
    }

    return context;
}