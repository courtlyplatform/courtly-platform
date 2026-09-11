"use client";

import {
    LanguageSwitcher,
} from "@/shared/i18n/LanguageSwitcher";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

type HeaderProps = {
    onMobileMenuOpen?: () => void;
};

export function Header({
    onMobileMenuOpen,
}: HeaderProps) {
    const {
        dictionary,
    } = useI18n();

    return (
        <header className="app-header">
            <button
                type="button"
                className="mobile-menu-button"
                onClick={
                    onMobileMenuOpen
                }
                aria-label="Open menu"
            >
                ☰
            </button>

            <div className="header-spacer" />

            <div className="header-actions">
                <LanguageSwitcher />

                <div
                    className="header-divider"
                    aria-hidden="true"
                />

                <div className="header-user">
                    <div className="header-user-info">
                        <strong>
                            Augusto Meireles
                        </strong>

                        <span>
                            {
                                dictionary
                                    .common
                                    .owner
                            }
                        </span>
                    </div>

                    <div
                        className="header-avatar"
                        aria-hidden="true"
                    >
                        AM
                    </div>
                </div>
            </div>
        </header>
    );
}