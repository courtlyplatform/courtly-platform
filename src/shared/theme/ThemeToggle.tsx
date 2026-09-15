"use client";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    useTheme,
} from "./ThemeProvider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
    const {
        theme,
        setTheme,
    } = useTheme();

    const {
        dictionary,
    } = useI18n();

    return (
        <div className={compact ? "theme-control theme-control--compact" : "theme-control"}>
            {!compact && (
                <span className="theme-control-title">{dictionary.theme.title}</span>
            )}

            <div
                className="theme-switcher"
                role="group"
                aria-label={
                    dictionary.theme.title
                }
            >
                <button
                    type="button"
                    className={
                        theme === "light"
                            ? "theme-option active"
                            : "theme-option"
                    }
                    onClick={() =>
                        setTheme("light")
                    }
                    aria-pressed={
                        theme === "light"
                    }
                    aria-label={
                        dictionary
                            .accessibility
                            .lightTheme
                    }
                >
                    <span aria-hidden="true">
                        ☀
                    </span>

                    {!compact && <span>{dictionary.theme.light}</span>}
                </button>

                <button
                    type="button"
                    className={
                        theme === "dark"
                            ? "theme-option active"
                            : "theme-option"
                    }
                    onClick={() =>
                        setTheme("dark")
                    }
                    aria-pressed={
                        theme === "dark"
                    }
                    aria-label={
                        dictionary
                            .accessibility
                            .darkTheme
                    }
                >
                    <span aria-hidden="true">
                        ◐
                    </span>

                    {!compact && <span>{dictionary.theme.dark}</span>}
                </button>
            </div>
        </div>
    );
}