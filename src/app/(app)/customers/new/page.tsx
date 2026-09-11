import {
    createCustomer,
} from "@/modules/customers/actions";

import {
    CustomerForm,
} from "@/modules/customers/components/CustomerForm";

import {
    getCurrentLocale,
} from "@/shared/i18n/getCurrentLocale";

import {
    getDictionary,
} from "@/shared/i18n/getDictionary";

type NewCustomerPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};

export default async function NewCustomerPage({
    searchParams,
}: NewCustomerPageProps) {
    const params =
        await searchParams;

    const locale =
        await getCurrentLocale();

    const dictionary =
        getDictionary(locale);

    const t =
        dictionary.customers.form;

    return (
        <div className="customer-form-page">
            <section className="page-heading">
                <div>
                    <span className="page-eyebrow">
                        {
                            dictionary
                                .customers
                                .eyebrow
                        }
                    </span>

                    <h1>
                        {t.createTitle}
                    </h1>

                    <p>
                        {
                            locale === "pt-BR"
                                ? "Cadastre um novo aluno na sua organização."
                                : "Add a new student to your organization."
                        }
                    </p>
                </div>
            </section>

            {params.error && (
                <div
                    className="form-error"
                    role="alert"
                >
                    {params.error}
                </div>
            )}

            <CustomerForm
                action={createCustomer}
                mode="create"
            />
        </div>
    );
}