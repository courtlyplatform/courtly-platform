import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
    children: ReactNode;
    href?: string;
    type?: "button" | "submit";
    variant?: "primary" | "secondary" | "danger";
};

export function Button({
    children,
    href,
    type = "button",
    variant = "primary",
}: ButtonProps) {
    const styles = {
        primary:
            "bg-[#173f35] text-white hover:bg-[#103229]",
        secondary:
            "border border-[#dfe5e2] bg-white text-[#17201d] hover:bg-[#f6f7f8]",
        danger:
            "bg-[#fef3f2] text-[#b42318] hover:bg-[#fee4e2]",
    };

    const className = `
        inline-flex
        h-10
        items-center
        justify-center
        rounded-lg
        px-4
        text-sm
        font-medium
        transition
        ${styles[variant]}
    `;

    if (href) {
        return (
            <Link
                href={href}
                className={className}
            >
                {children}
            </Link>
        );
    }

    return (
        <button
            type={type}
            className={className}
        >
            {children}
        </button>
    );
}