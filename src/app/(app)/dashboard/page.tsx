import { getCurrentLocale } from "@/shared/i18n/getCurrentLocale";
import { getDictionary } from "@/shared/i18n/getDictionary";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function DashboardPage() {
    const locale = await getCurrentLocale();
    const t = getDictionary(locale).dashboard;

    return (
        <>
            <PageHeader title={t.title} description={t.description} />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardCard label={t.cards.activeCustomers} value="—" />
                <DashboardCard label={t.cards.todayAppointments} value="—" />
                <DashboardCard label={t.cards.attendance} value="—" />
                <DashboardCard label={t.cards.makeups} value="—" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <div className="min-h-80 rounded-xl border border-[#e3e8e5] bg-white p-6 xl:col-span-2">
                    <h2 className="font-semibold">{t.upcomingTitle}</h2>
                    <p className="mt-2 text-sm text-[#6c7773]">{t.upcomingDescription}</p>
                </div>
                <div className="min-h-80 rounded-xl border border-[#e3e8e5] bg-white p-6">
                    <h2 className="font-semibold">{t.summaryTitle}</h2>
                    <p className="mt-2 text-sm text-[#6c7773]">{t.summaryDescription}</p>
                </div>
            </div>
        </>
    );
}

function DashboardCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-[#e3e8e5] bg-white p-5">
            <p className="text-sm text-[#6c7773]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
    );
}
