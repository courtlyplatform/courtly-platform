"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import Link from "next/link";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    LanguageSwitcher,
} from "@/shared/i18n/LanguageSwitcher";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    createClient,
} from "@/shared/database/supabase/client";


type HeaderProps = {
    onMobileMenuOpen?: () => void;
};


type HeaderUser = {
    name: string;
    role: string | null;
    avatarUrl: string | null;
};


function getInitials(
    name: string
): string {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "U";
    }

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        (
            parts[0][0] ??
            ""
        ) +
        (
            parts[
                parts.length - 1
            ][0] ??
            ""
        )
    ).toUpperCase();
}


export function Header({
    onMobileMenuOpen,
}: HeaderProps) {
    const {
        dictionary,
    } = useI18n();

    const router =
        useRouter();

    const searchParams =
    useSearchParams();

    const searchParamsKey =
        searchParams.toString();

    const menuRef =
        useRef<HTMLDivElement>(
            null
        );

    const [
        menuOpen,
        setMenuOpen,
    ] = useState(false);

    const [
        currentUser,
        setCurrentUser,
    ] =
        useState<HeaderUser | null>(
            null
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);


    function getRoleLabel(
        role: string | null
    ): string {
        switch (
            role?.toUpperCase()
        ) {
            case "OWNER":
                return (
                    dictionary
                        .common
                        .owner
                );

            case "ADMIN":
                return "Administrador";

            case "PROFESSIONAL":
                return "Profissional";

            case "CUSTOMER":
                return "Cliente";

            default:
                return "Usuário";
        }
    }


    useEffect(() => {
        const supabase =
            createClient();

        async function loadCurrentUser() {
            try {
                const {
                    data: {
                        user,
                    },
                    error: userError,
                } =
                    await supabase.auth
                        .getUser();

                if (
                    userError ||
                    !user
                ) {
                    setCurrentUser(
                        null
                    );

                    return;
                }

                const [
                    profileResult,
                    membershipResult,
                ] =
                    await Promise.all([
                        supabase
                            .from(
                                "profiles"
                            )
                            .select(
                                "full_name, avatar_path"
                            )
                            .eq(
                                "user_id",
                                user.id
                            )
                            .maybeSingle(),

                        supabase
                            .from(
                                "memberships"
                            )
                            .select(
                                "role"
                            )
                            .eq(
                                "user_id",
                                user.id
                            )
                            .limit(1)
                            .maybeSingle(),
                    ]);

                const metadataName =
                    typeof user
                        .user_metadata
                        ?.full_name ===
                    "string"
                        ? user
                              .user_metadata
                              .full_name
                        : null;

                const name =
                    profileResult
                        .data
                        ?.full_name ||
                    metadataName ||
                    user.email
                        ?.split(
                            "@"
                        )[0] ||
                    "Usuário";

                const avatarPath =
                    profileResult
                        .data
                        ?.avatar_path ??
                    null;

                let avatarUrl:
                    string | null =
                    null;

                if (avatarPath) {
                    const {
                        data,
                    } =
                        supabase
                            .storage
                            .from(
                                "avatars"
                            )
                            .getPublicUrl(
                                avatarPath
                            );

                    avatarUrl =
                        data.publicUrl;
                }

                setCurrentUser({
                    name,

                    role:
                        membershipResult
                            .data
                            ?.role ??
                        null,

                    avatarUrl,
                });
            } finally {
                setLoading(
                    false
                );
            }
        }

        void loadCurrentUser();
    }, [searchParamsKey]);


    useEffect(() => {
        function handleOutsideClick(
            event: MouseEvent
        ) {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                )
            ) {
                setMenuOpen(
                    false
                );
            }
        }

        function handleEscape(
            event: KeyboardEvent
        ) {
            if (
                event.key ===
                "Escape"
            ) {
                setMenuOpen(
                    false
                );
            }
        }

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);


    async function handleSignOut() {
        const supabase =
            createClient();

        setMenuOpen(
            false
        );

        await supabase.auth
            .signOut();

        router.replace(
            "/login"
        );

        router.refresh();
    }


    const displayName =
        currentUser?.name ??
        "";

    const roleLabel =
        getRoleLabel(
            currentUser?.role ??
                null
        );

    const initials =
        getInitials(
            displayName ||
                "Usuário"
        );


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

            <div
                className="header-spacer"
            />

            <div
                className="header-actions"
            >
                <LanguageSwitcher />

                <div
                    className="header-divider"
                    aria-hidden="true"
                />

                <div
                    className="header-user-menu"
                    ref={menuRef}
                >
                    <button
                        type="button"
                        className="header-user header-user-button"
                        onClick={() =>
                            setMenuOpen(
                                (
                                    current
                                ) =>
                                    !current
                            )
                        }
                        aria-expanded={
                            menuOpen
                        }
                        aria-haspopup="menu"
                        aria-label="Abrir menu do usuário"
                    >
                        <div
                            className="header-user-info"
                        >
                            <strong>
                                {loading
                                    ? "..."
                                    : displayName}
                            </strong>

                            <span>
                                {loading
                                    ? ""
                                    : roleLabel}
                            </span>
                        </div>

                        <div
                            className="header-avatar"
                            aria-hidden="true"
                        >
                            {currentUser
                                ?.avatarUrl ? (
                                <img
                                    src={
                                        currentUser
                                            .avatarUrl
                                    }
                                    alt=""
                                />
                            ) : (
                                initials
                            )}
                        </div>

                        <span
                            className={
                                menuOpen
                                    ? "header-user-chevron header-user-chevron--open"
                                    : "header-user-chevron"
                            }
                            aria-hidden="true"
                        >
                            ▾
                        </span>
                    </button>

                    {menuOpen && (
                        <div
                            className="header-profile-menu"
                            role="menu"
                        >
                            <div
                                className="header-profile-menu-user"
                            >
                                <strong>
                                    {
                                        displayName
                                    }
                                </strong>

                                <span>
                                    {
                                        roleLabel
                                    }
                                </span>
                            </div>

                            <div
                                className="header-profile-menu-divider"
                                aria-hidden="true"
                            />

                            <Link
                                href="/profile"
                                className="header-profile-menu-item"
                                role="menuitem"
                                onClick={() =>
                                    setMenuOpen(
                                        false
                                    )
                                }
                            >
                                <span
                                    aria-hidden="true"
                                >
                                    ♙
                                </span>

                                Meu perfil
                            </Link>

                            <button
                                type="button"
                                className="header-profile-menu-item header-profile-menu-logout"
                                role="menuitem"
                                onClick={
                                    handleSignOut
                                }
                            >
                                <span
                                    aria-hidden="true"
                                >
                                    ↪
                                </span>

                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}