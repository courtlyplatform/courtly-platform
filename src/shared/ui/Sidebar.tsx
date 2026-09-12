"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";
import {
    usePathname,
} from "next/navigation";
import Image from "next/image";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    ThemeToggle,
} from "@/shared/theme/ThemeToggle";

import {
    createClient,
} from "@/shared/database/supabase/client";

import type {
    OrganizationRole,
} from "@/shared/auth/get-current-organization-commercial-context";

type NavigationItem = {
    href: string;
    icon: string;
    label: string;
    ownerOnly?: boolean;
    managerOnly?: boolean;
};

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

    const [
        role,
        setRole,
    ] = useState<OrganizationRole | null>(
        null
    );

    useEffect(
        () => {
            let mounted = true;

            async function loadRole() {
                const supabase =
                    createClient();

                const {
                    data: authData,
                } =
                    await supabase.auth.getUser();

                if (
                    !mounted ||
                    !authData.user
                ) {
                    return;
                }

                const {
                    data: membership,
                } = await supabase
                    .from("memberships")
                    .select("role")
                    .eq(
                        "user_id",
                        authData.user.id
                    )
                    .limit(1)
                    .maybeSingle();

                if (
                    mounted &&
                    membership?.role
                ) {
                    setRole(
                        membership.role as OrganizationRole
                    );
                }
            }

            void loadRole();

            return () => {
                mounted = false;
            };
        },
        []
    );

    const navigation: NavigationItem[] = [
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
            managerOnly: true,
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
            href: "/financial",
            icon: "$",
            label:
                dictionary
                    .navigation
                    .financial,
            ownerOnly: true,
        },
    ];

    const visibleNavigation =
        navigation.filter(
            (item) => {
                const ownerAllowed =
                    !item.ownerOnly ||
                    role === "OWNER";

                const managerAllowed =
                    !item.managerOnly ||
                    role === "OWNER" ||
                    role === "ADMIN";

                return (
                    ownerAllowed &&
                    managerAllowed
                );
            }
        );

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
                    {visibleNavigation.map(
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
