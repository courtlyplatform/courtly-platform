import {
    notFound,
} from "next/navigation";

import {
    updateCustomer,
} from "@/modules/customers/actions";

import {
    CustomerForm,
} from "@/modules/customers/components/CustomerForm";

import {
    getCustomerById,
} from "@/modules/customers/queries";

import {
    getCurrentLocale,
} from "@/shared/i18n/getCurrentLocale";

import {
    getDictionary,
} from "@/shared/i18n/getDictionary";

import {
    CourtlyAlert,
} from "@/shared/ui/CourtlyAlert";


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
    const {
        id,
    } =
        await params;

    const query =
        await searchParams;

    const customer =
        await getCustomerById(
            id
        );

    if (!customer) {
        notFound();
    }


    const locale =
        await getCurrentLocale();

    const dictionary =
        getDictionary(
            locale
        );

    const t =
        dictionary
            .customers
            .form;

    const errors =
        dictionary
            .customers
            .feedback
            .error;


    const errorMessages:
        Record<string, string> = {
            nameRequired:
                errors.nameRequired,

            invalidDocumentType:
                errors.invalidDocumentType,

            invalidDocument:
                errors.invalidDocument,

            invalidData:
                errors.invalidData,

            organizationNotFound:
                errors.organizationNotFound,

            updateFailed:
                errors.updateFailed,
        };


    const errorMessage =
        query.error
            ? errorMessages[
                query.error
            ] ??
            errors.invalidData
            : null;


    const updateAction =
        updateCustomer.bind(
            null,
            customer.id
        );


    return (
        <main className="customer-form-page">
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
                        {t.editTitle}
                    </h1>

                    <p>
                        {locale ===
                        "pt-BR"
                            ? (
                                <>
                                    Atualize as
                                    informações de{" "}
                                    <strong>
                                        {
                                            customer.name
                                        }
                                    </strong>
                                    .
                                </>
                            )
                            : (
                                <>
                                    Update the
                                    information for{" "}
                                    <strong>
                                        {
                                            customer.name
                                        }
                                    </strong>
                                    .
                                </>
                            )}
                    </p>
                </div>
            </section>


            {errorMessage && (
                <CourtlyAlert
                    type="error"
                    message={
                        errorMessage
                    }
                />
            )}


            <CustomerForm
                action={
                    updateAction
                }
                customer={
                    customer
                }
                mode="edit"
            />
        </main>
    );
}