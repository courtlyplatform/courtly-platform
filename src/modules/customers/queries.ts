import { createClient } from "@/shared/database/supabase/server";

import type { Customer } from "./types";

async function getCurrentOrganizationId(): Promise<string> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("Usuário não autenticado.");
    }

    const { data: membership, error } = await supabase
        .from("memberships")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (error || !membership) {
        throw new Error(
            "Organização do usuário não encontrada."
        );
    }

    return membership.organization_id;
}

export async function getCustomers(): Promise<Customer[]> {
    const supabase = await createClient();

    const organizationId =
        await getCurrentOrganizationId();

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name", {
            ascending: true,
        });

    if (error) {
        throw new Error(
            `Erro ao buscar alunos: ${error.message}`
        );
    }

    return data ?? [];
}

export async function getCustomerById(
    id: string
): Promise<Customer | null> {
    const supabase = await createClient();

    const organizationId =
        await getCurrentOrganizationId();

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (error) {
        throw new Error(
            `Erro ao buscar aluno: ${error.message}`
        );
    }

    return data;
}