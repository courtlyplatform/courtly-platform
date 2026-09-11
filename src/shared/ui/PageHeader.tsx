import type { ReactNode } from "react";

type PageHeaderProps = {
    title: string;
    description?: string;
    action?: ReactNode;
};

export function PageHeader({
    title,
    description,
    action,
}: PageHeaderProps) {
    return (
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#17201d]">
                    {title}
                </h1>

                {description && (
                    <p className="mt-1 text-sm text-[#6c7773]">
                        {description}
                    </p>
                )}
            </div>

            {action}
        </div>
    );
}