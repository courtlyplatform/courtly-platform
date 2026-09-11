"use client";

import {
    useState,
    type ReactNode,
} from "react";

import {
    Header,
} from "@/shared/ui/Header";

import {
    Sidebar,
} from "@/shared/ui/Sidebar";

type AppShellProps = {
    children: ReactNode;
};

export function AppShell({
    children,
}: AppShellProps) {
    const [
        collapsed,
        setCollapsed,
    ] = useState(false);

    const [
        mobileOpen,
        setMobileOpen,
    ] = useState(false);

    function toggleSidebar() {
        setCollapsed(
            (current) => !current
        );
    }

    function openMobileSidebar() {
        setMobileOpen(true);
    }

    function closeMobileSidebar() {
        setMobileOpen(false);
    }

    return (
        <div className="app-shell">
            <Sidebar
                collapsed={collapsed}
                onToggle={
                    toggleSidebar
                }
                mobileOpen={
                    mobileOpen
                }
                onMobileClose={
                    closeMobileSidebar
                }
            />

            <div
                className={
                    collapsed
                        ? "app-content app-content--collapsed"
                        : "app-content"
                }
            >
                <Header
                    onMobileMenuOpen={
                        openMobileSidebar
                    }
                />

                <main className="app-main">
                    {children}
                </main>
            </div>
        </div>
    );
}