import { redirect } from "next/navigation";

import { OrganizationOnboardingClient } from "@/modules/organizations/ui/OrganizationOnboardingClient";
import { createClient } from "@/shared/database/supabase/server";

type OnboardingPageProps = {
    searchParams: Promise<{ error?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
    const { error } = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (membership) redirect("/dashboard");

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();

    const metadataName = typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : "";

    return (
        <OrganizationOnboardingClient
            professionalName={profile?.full_name || metadataName || user.email?.split("@")[0] || ""}
            profilePhone={profile?.phone ?? ""}
            userEmail={user.email ?? ""}
            errorCode={error}
        />
    );
}
