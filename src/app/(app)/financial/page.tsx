import {
    redirect,
} from "next/navigation";

import {
    createClient,
} from "@/shared/database/supabase/server";

import {
    canManageFinancialData,
    getCurrentOrganizationFinancialContext,
} from "@/shared/auth/get-current-organization-financial-context";

import {
    SupabaseFinancialRepository,
} from "@/modules/financial/infrastructure/supabase-financial-repository";

import {
    getFinancialPageData,
} from "@/modules/financial/application/get-financial-page-data";

import {
    FinancialClient,
} from "@/modules/financial/ui/FinancialClient";

type FinancialPageProps = {
    searchParams: Promise<{
        period?: string;
    }>;
};

export default async function FinancialPage({
    searchParams,
}: FinancialPageProps) {
    const query =
        await searchParams;

    const supabase =
        await createClient();

    const context =
        await getCurrentOrganizationFinancialContext(
            supabase
        );

    if (
        !canManageFinancialData(
            context.role
        )
    ) {
        redirect("/dashboard");
    }

    const referenceDate =
        normalizePeriod(
            query.period
        );

    const repository =
        new SupabaseFinancialRepository(
            supabase
        );

    const data =
        await getFinancialPageData(
            repository,
            context.organizationId,
            context.defaultCurrency,
            referenceDate
        );

    return (
        <FinancialClient
            initialData={data}
            defaultCurrency={
                context.defaultCurrency
            }
        />
    );
}

function normalizePeriod(
    value?: string
): string {
    if (
        value &&
        /^\d{4}-\d{2}$/.test(value)
    ) {
        const month = Number(
            value.slice(5, 7)
        );

        if (
            month >= 1 &&
            month <= 12
        ) {
            return `${value}-01`;
        }
    }

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/Sao_Paulo",
                year: "numeric",
                month: "2-digit",
            }
        ).formatToParts(
            new Date()
        );

    const year =
        parts.find(
            (part) =>
                part.type === "year"
        )?.value ?? "2026";

    const month =
        parts.find(
            (part) =>
                part.type === "month"
        )?.value ?? "01";

    return `${year}-${month}-01`;
}
