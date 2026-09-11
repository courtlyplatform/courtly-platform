"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    ThemeToggle,
} from "@/shared/theme/ThemeToggle";

type SidebarProps = {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
};

export function Sidebar({
    collapsed,
    onToggle,
    mobileOpen = false,
    onMobileClose,
}: SidebarProps) {
    const pathname =
        usePathname();

    const {
        dictionary,
    } = useI18n();

    const navigation = [
        {
            href: "/dashboard",
            icon: "⌂",
            label:
                dictionary
                    .navigation
                    .overview,
        },
        {
            href: "/customers",
            icon: "♟",
            label:
                dictionary
                    .navigation
                    .customers,
        },
        {
            href: "/services",
            icon: "◇",
            label:
                dictionary
                    .navigation
                    .services,
        },
        {
            href: "/scheduling",
            icon: "□",
            label:
                dictionary
                    .navigation
                    .scheduling,
        },
        {
            href: "/attendance",
            icon: "✓",
            label:
                dictionary
                    .navigation
                    .attendance,
        },
        {
            href: "/makeups",
            icon: "↻",
            label:
                dictionary
                    .navigation
                    .makeups,
        },
        {
            href: "/payments",
            icon: "$",
            label:
                dictionary
                    .navigation
                    .payments,
        },
    ];

    const sidebarClassName = [
        "sidebar",
        collapsed
            ? "sidebar--collapsed"
            : "",
        mobileOpen
            ? "sidebar--mobile-open"
            : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <>
            {mobileOpen && (
                <button
                    type="button"
                    className="sidebar-overlay"
                    onClick={
                        onMobileClose
                    }
                    aria-label="Close menu"
                />
            )}

            <aside
                className={
                    sidebarClassName
                }
            >
                <div className="sidebar-brand">
                    <div className="sidebar-brand-content">
                        <div className="sidebar-logo">
                            <Image
                                src="/images/courtly-logo.png"
                                alt="Courtly"
                                width={42}
                                height={42}
                                className="sidebar-logo-image"
                                priority
                            />
                        </div>

                        {!collapsed && (
                            <div className="sidebar-brand-text">
                                <strong>
                                    {
                                        dictionary
                                            .common
                                            .appName
                                    }
                                </strong>

                                <span>
                                    {
                                        dictionary
                                            .common
                                            .appDescription
                                    }
                                </span>
                            </div>
                        )}
                    </div>

                    {mobileOpen && (
                        <button
                            type="button"
                            className="sidebar-mobile-close"
                            onClick={
                                onMobileClose
                            }
                            aria-label="Close menu"
                        >
                            ×
                        </button>
                    )}
                </div>

                <nav
                    className="sidebar-nav"
                    aria-label={
                        dictionary
                            .accessibility
                            .mainNavigation
                    }
                >
                    {navigation.map(
                        (item) => {
                            const active =
                                pathname ===
                                    item.href ||
                                pathname.startsWith(
                                    `${item.href}/`
                                );

                            return (
                                <Link
                                    key={
                                        item.href
                                    }
                                    href={
                                        item.href
                                    }
                                    onClick={
                                        onMobileClose
                                    }
                                    className={
                                        active
                                            ? "sidebar-link sidebar-link--active"
                                            : "sidebar-link"
                                    }
                                    title={
                                        collapsed
                                            ? item.label
                                            : undefined
                                    }
                                >
                                    <span
                                        className="sidebar-icon"
                                        aria-hidden="true"
                                    >
                                        {
                                            item.icon
                                        }
                                    </span>

                                    {!collapsed && (
                                        <span>
                                            {
                                                item.label
                                            }
                                        </span>
                                    )}
                                </Link>
                            );
                        }
                    )}
                </nav>

                <div className="sidebar-footer">
                    {!collapsed && (
                        <ThemeToggle />
                    )}

                    <button
                        type="button"
                        className="sidebar-collapse"
                        onClick={
                            onToggle
                        }
                        aria-label={
                            collapsed
                                ? dictionary
                                      .navigation
                                      .expandMenu
                                : dictionary
                                      .navigation
                                      .collapseMenu
                        }
                        title={
                            collapsed
                                ? dictionary
                                      .navigation
                                      .expandMenu
                                : dictionary
                                      .navigation
                                      .collapseMenu
                        }
                    >
                        <span aria-hidden="true">
                            {
                                collapsed
                                    ? "›"
                                    : "‹"
                            }
                        </span>

                        {!collapsed && (
                            <span>
                                {
                                    dictionary
                                        .navigation
                                        .collapseMenu
                                }
                            </span>
                        )}
                    </button>

                    {!collapsed && (
                        <span className="sidebar-version">
                            Courtly MVP
                        </span>
                    )}
                </div>
            </aside>
        </>
    );
}