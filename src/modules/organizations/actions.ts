"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/database/supabase/server";

export async function completeOnboarding(formData: FormData) {
    const supabase = await createClient();

    const professionalName = String(
        formData.get("professionalName") ?? ""
    ).trim();

    const organizationName = String(
        formData.get("organizationName") ?? ""
    ).trim();

    if (!professionalName || !organizationName) {
        redirect(
            "/onboarding?error=Preencha todos os campos obrigatórios"
        );
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        redirect("/login?error=Sua sessão expirou");
    }

    const { error } = await supabase.rpc(
        "create_organization_onboarding",
        {
            p_organization_name: organizationName,
            p_professional_name: professionalName,
        }
    );

    if (error) {
        redirect(
            `/onboarding?error=${encodeURIComponent(error.message)}`
        );
    }

    redirect("/dashboard");
}