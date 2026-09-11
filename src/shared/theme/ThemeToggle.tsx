"use client";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    useTheme,
} from "./ThemeProvider";

export function ThemeToggle() {
    const {
        theme,
        setTheme,
    } = useTheme();

    const {
        dictionary,
    } = useI18n();

    return (
        <div className="theme-control">
            <span className="theme-control-title">
                {dictionary.theme.title}
            </span>

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

                    <span>
                        {
                            dictionary
                                .theme
                                .light
                        }
                    </span>
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

                    <span>
                        {
                            dictionary
                                .theme
                                .dark
                        }
                    </span>
                </button>
            </div>
        </div>
    );
}