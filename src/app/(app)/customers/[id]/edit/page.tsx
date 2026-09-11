import Link from "next/link";
import { notFound } from "next/navigation";

import { getCustomerById } from "@/modules/customers/queries";
import { updateCustomer } from "@/modules/customers/actions";
import { CustomerForm } from "@/modules/customers/components/CustomerForm";

type EditCustomerPageProps = {
    params: Promise<{
        id: string;
    }>;

    searchParams: Promise<{
        error?: string;
    }>;
};

export default async function EditCustomerPage({
    params,
    searchParams,
}: EditCustomerPageProps) {

    const { id } = await params;
    const query = await searchParams;

    const customer =
        await getCustomerById(id);

    if (!customer) {
        notFound();
    }

    const updateAction = updateCustomer.bind(
        null,
        customer.id
    );

    return (
        <main>
            <h1>Editar aluno</h1>

            <p>
                Atualize as informações de{" "}
                <strong>{customer.name}</strong>.
            </p>

            {query.error && (
                <p>
                    {query.error}
                </p>
            )}

            <CustomerForm
                action={updateAction}
                customer={customer}
                mode="edit"
            />
        </main>
    );
}