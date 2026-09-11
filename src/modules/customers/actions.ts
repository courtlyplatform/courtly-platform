"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/database/supabase/server";
import { parseCustomerFormData } from "./validation";

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

export async function createCustomer(
    formData: FormData
): Promise<void> {
    const supabase = await createClient();

    const organizationId =
        await getCurrentOrganizationId();

    let customerData;

    try {
        customerData =
            parseCustomerFormData(formData);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Dados inválidos.";

        redirect(
            `/customers/new?error=${encodeURIComponent(
                message
            )}`
        );
    }

    const { error } = await supabase
        .from("customers")
        .insert({
            organization_id: organizationId,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            birth_date: customerData.birthDate,
            notes: customerData.notes,
            active: true,
        });

    if (error) {
        redirect(
            `/customers/new?error=${encodeURIComponent(
                error.message
            )}`
        );
    }

    revalidatePath("/customers");

    redirect("/customers");
}

export async function updateCustomer(
    customerId: string,
    formData: FormData
): Promise<void> {
    const supabase = await createClient();

    const organizationId =
        await getCurrentOrganizationId();

    let customerData;

    try {
        customerData =
            parseCustomerFormData(formData);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Dados inválidos.";

        redirect(
            `/customers/${customerId}/edit?error=${encodeURIComponent(
                message
            )}`
        );
    }

    const { error } = await supabase
        .from("customers")
        .update({
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            birth_date: customerData.birthDate,
            notes: customerData.notes,
        })
        .eq("id", customerId)
        .eq("organization_id", organizationId);

    if (error) {
        redirect(
            `/customers/${customerId}/edit?error=${encodeURIComponent(
                error.message
            )}`
        );
    }

    revalidatePath("/customers");
    revalidatePath(
        `/customers/${customerId}/edit`
    );

    redirect("/customers");
}

export async function toggleCustomerStatus(
    customerId: string,
    active: boolean
): Promise<void> {
    const supabase = await createClient();

    const organizationId =
        await getCurrentOrganizationId();

    const { error } = await supabase
        .from("customers")
        .update({
            active,
        })
        .eq("id", customerId)
        .eq("organization_id", organizationId);

    if (error) {
        throw new Error(
            `Erro ao alterar status do aluno: ${error.message}`
        );
    }

    revalidatePath("/customers");
}