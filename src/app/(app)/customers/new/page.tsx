import { redirect } from "next/navigation";
import { createClient } from "@/shared/database/supabase/server";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";
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

import {
    CourtlyAlert,
} from "@/shared/ui/CourtlyAlert";


type NewCustomerPageProps = {
    searchParams: Promise<{
        error?: string;
        returnTo?: string;
    }>;
};


export default async function NewCustomerPage({
    searchParams,
}: NewCustomerPageProps) {
    const supabase = await createClient();
    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "CUSTOMERS_CREATE")) redirect("/customers");

    const params =
        await searchParams;

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

            createFailed:
                errors.createFailed,
        };


    const errorMessage =
        params.error
            ? errorMessages[
                params.error
            ] ??
            errors.invalidData
            : null;


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
                            locale ===
                            "pt-BR"
                                ? "Cadastre um novo cliente na sua organização."
                                : "Add a new client to your organization."
                        }
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
                action={createCustomer}
                mode="create"
                returnTo={params.returnTo?.startsWith("/") && !params.returnTo.startsWith("//") ? params.returnTo : null}
            />
        </div>
    );
}