import { PageHeader } from "@/shared/ui/PageHeader";

export default function DashboardPage() {
    return (
        <>
            <PageHeader
                title="Visão geral"
                description="Acompanhe sua operação em um só lugar."
            />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardCard
                    label="Clientes ativos"
                    value="—"
                />

                <DashboardCard
                    label="Aulas hoje"
                    value="—"
                />

                <DashboardCard
                    label="Presenças"
                    value="—"
                />

                <DashboardCard
                    label="Reposições"
                    value="—"
                />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <div className="min-h-80 rounded-xl border border-[#e3e8e5] bg-white p-6 xl:col-span-2">
                    <h2 className="font-semibold">
                        Próximas aulas
                    </h2>

                    <p className="mt-2 text-sm text-[#6c7773]">
                        Sua agenda aparecerá aqui.
                    </p>
                </div>

                <div className="min-h-80 rounded-xl border border-[#e3e8e5] bg-white p-6">
                    <h2 className="font-semibold">
                        Resumo
                    </h2>

                    <p className="mt-2 text-sm text-[#6c7773]">
                        Os indicadores da operação aparecerão aqui.
                    </p>
                </div>
            </div>
        </>
    );
}

function DashboardCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-[#e3e8e5] bg-white p-5">
            <p className="text-sm text-[#6c7773]">
                {label}
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
                {value}
            </p>
        </div>
    );
}