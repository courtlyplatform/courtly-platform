"use client";

import {
    useI18n,
} from "./I18nProvider";

export function LanguageSwitcher() {
    const {
        locale,
        setLocale,
        dictionary,
    } = useI18n();

    return (
        <div
            className="language-switcher"
            aria-label={
                dictionary
                    .header
                    .language
            }
        >
            <button
                type="button"
                className={
                    locale === "pt-BR"
                        ? "language-option active"
                        : "language-option"
                }
                onClick={() =>
                    setLocale("pt-BR")
                }
                aria-pressed={
                    locale === "pt-BR"
                }
                aria-label={
                    dictionary
                        .header
                        .portuguese
                }
                title={
                    dictionary
                        .header
                        .portuguese
                }
            >
                <span
                    className="language-flag"
                    aria-hidden="true"
                >
                    🇧🇷
                </span>
            </button>

            <button
                type="button"
                className={
                    locale === "en-US"
                        ? "language-option active"
                        : "language-option"
                }
                onClick={() =>
                    setLocale("en-US")
                }
                aria-pressed={
                    locale === "en-US"
                }
                aria-label={
                    dictionary
                        .header
                        .english
                }
                title={
                    dictionary
                        .header
                        .english
                }
            >
                <span
                    className="language-flag"
                    aria-hidden="true"
                >
                    🇺🇸
                </span>
            </button>
        </div>
    );
}