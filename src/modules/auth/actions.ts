"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/database/supabase/server";

export async function signUp(formData: FormData) {
    const supabase = await createClient();

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
        redirect("/signup?error=Preencha todos os campos");
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        redirect(
            `/signup?error=${encodeURIComponent(error.message)}`
        );
    }

    redirect("/onboarding");
}

export async function signIn(formData: FormData) {
    const supabase = await createClient();

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
        redirect("/login?error=Preencha todos os campos");
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        redirect(
            `/login?error=${encodeURIComponent(error.message)}`
        );
    }

    const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("id")
        .limit(1)
        .maybeSingle();

    if (membershipError) {
        redirect(
            `/login?error=${encodeURIComponent(membershipError.message)}`
        );
    }

    if (!membership) {
        redirect("/onboarding");
    }

    redirect("/dashboard");
}