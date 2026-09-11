import Link from "next/link";

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
    createClient,
} from "@/shared/database/supabase/server";

import {
    getCurrentOrganizationCommercialContext,
    canManageCommercialData,
} from "@/shared/auth/get-current-organization-commercial-context";

import {
    SupabaseActivityRepository,
} from "@/modules/activities/infrastructure/supabase-activity-repository";

import {
    listActivities,
} from "@/modules/activities/application/list-activities";

import {
    SupabaseCustomerSubscriptionRepository,
} from "@/modules/customer-subscriptions/infrastructure/supabase-customer-subscription-repository";

import {
    listCustomerSubscriptions,
} from "@/modules/customer-subscriptions/application/list-customer-subscriptions";

import {
    CustomerSubscriptionsClient,
} from "@/modules/customer-subscriptions/ui/CustomerSubscriptionsClient";

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

        tab?: string;
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


    const activeTab =
        query.tab === "services"
            ? "services"
            : "personal";


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
        dictionary.customers.form;


    const errors =
        dictionary
            .customers
            .feedback
            .error;


    const errorMessages:
        Record<
            string,
            string
        > = {

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


    const supabase =
        await createClient();


    const commercialContext =
        await getCurrentOrganizationCommercialContext(
            supabase
        );


    const canManageCommercial =
        canManageCommercialData(
            commercialContext.role
        );


    let activities:
        Awaited<
            ReturnType<
                typeof listActivities
            >
        > = [];


    let subscriptions:
        Awaited<
            ReturnType<
                typeof listCustomerSubscriptions
            >
        > = [];


    if (
        activeTab ===
            "services" &&
        canManageCommercial
    ) {

        const activityRepository =
            new SupabaseActivityRepository(
                supabase
            );


        const subscriptionRepository =
            new SupabaseCustomerSubscriptionRepository(
                supabase
            );


        [
            activities,
            subscriptions,
        ] =
            await Promise.all([
                listActivities(
                    activityRepository,
                    commercialContext.organizationId
                ),

                listCustomerSubscriptions(
                    subscriptionRepository,
                    commercialContext.organizationId,
                    customer.id
                ),
            ]);
    }


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
                                    Gerencie as
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
                                    Manage the
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


            <nav
                className="customer-edit-tabs"
                aria-label={
                    locale ===
                    "pt-BR"
                        ? "Seções do aluno"
                        : "Student sections"
                }
            >
                <Link
                    href={
                        `/customers/${customer.id}/edit?tab=personal`
                    }
                    className={
                        activeTab ===
                        "personal"
                            ? "customer-edit-tab customer-edit-tab--active"
                            : "customer-edit-tab"
                    }
                >
                    {
                        dictionary
                            .customerSubscriptions
                            .tabs
                            .personal
                    }
                </Link>


                <Link
                    href={
                        `/customers/${customer.id}/edit?tab=services`
                    }
                    className={
                        activeTab ===
                        "services"
                            ? "customer-edit-tab customer-edit-tab--active"
                            : "customer-edit-tab"
                    }
                >
                    {
                        dictionary
                            .customerSubscriptions
                            .tabs
                            .services
                    }
                </Link>
            </nav>


            {activeTab ===
                "personal" && (
                <>
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
                </>
            )}


            {activeTab ===
                "services" && (
                <>
                    {!canManageCommercial ? (
                        <CourtlyAlert
                            type="error"
                            message={
                                dictionary
                                    .customerSubscriptions
                                    .feedback
                                    .error
                                    .forbidden
                            }
                        />
                    ) : (
                        <CustomerSubscriptionsClient
                            customerId={
                                customer.id
                            }
                            customerName={
                                customer.name
                            }
                            customerActive={
                                customer.active
                            }
                            initialSubscriptions={
                                subscriptions
                            }
                            activities={
                                activities
                            }
                            defaultCurrency={
                                commercialContext
                                    .defaultCurrency
                            }
                        />
                    )}
                </>
            )}
        </main>
    );
}