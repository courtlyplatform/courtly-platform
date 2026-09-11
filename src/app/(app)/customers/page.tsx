import Link from "next/link";

import {
    getCustomers,
} from "@/modules/customers/queries";

import {
    toggleCustomerStatus,
} from "@/modules/customers/actions";

import {
    getDictionary,
} from "@/shared/i18n/getDictionary";

import {
    getCurrentLocale,
} from "@/shared/i18n/getCurrentLocale";

export default async function CustomersPage() {
    const customers = await getCustomers();

    const locale = await getCurrentLocale();
    const dictionary = getDictionary(locale);

    const t = dictionary.customers;

    return (
        <div className="customers-page">

            {/* =================================================
                PAGE HEADER
               ================================================= */}

            <section className="page-heading">
                <div>
                    <span className="page-eyebrow">
                        {t.eyebrow}
                    </span>

                    <h1>
                        {t.title}
                    </h1>

                    <p>
                        {t.description}
                    </p>
                </div>

                <Link
                    href="/customers/new"
                    className="primary-button"
                >
                    + {t.newCustomer}
                </Link>
            </section>


            {/* =================================================
                EMPTY STATE
               ================================================= */}

            {customers.length === 0 ? (
                <section className="empty-state">

                    <div className="empty-state-icon">
                        ♙
                    </div>

                    <h2>
                        {t.empty.title}
                    </h2>

                    <p>
                        {t.empty.description}
                    </p>

                    <Link
                        href="/customers/new"
                        className="primary-button"
                    >
                        {t.empty.action}
                    </Link>

                </section>
            ) : (
                <>

                    {/* =========================================
                        DESKTOP / TABLET
                       ========================================= */}

                    <section className="customers-table-card">

                        <div className="table-scroll">

                            <table className="customers-table">

                                <thead>
                                    <tr>
                                        <th>
                                            {t.table.name}
                                        </th>

                                        <th>
                                            {t.table.email}
                                        </th>

                                        <th>
                                            {t.table.phone}
                                        </th>

                                        <th>
                                            {t.table.status}
                                        </th>

                                        <th className="actions-column">
                                            {t.table.actions}
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {customers.map(
                                        (customer) => (
                                            <tr key={customer.id}>

                                                <td>
                                                    <strong>
                                                        {customer.name}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {customer.email ??
                                                        t.notProvided}
                                                </td>

                                                <td>
                                                    {customer.phone ??
                                                        t.notProvided}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            customer.active
                                                                ? "status-badge status-badge--active"
                                                                : "status-badge status-badge--inactive"
                                                        }
                                                    >
                                                        {customer.active
                                                            ? t.status.active
                                                            : t.status.inactive}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="table-actions">

                                                        <Link
                                                            href={`/customers/${customer.id}/edit`}
                                                            className="action-link"
                                                        >
                                                            {t.actions.edit}
                                                        </Link>

                                                        <form
                                                            action={async () => {
                                                                "use server";

                                                                await toggleCustomerStatus(
                                                                    customer.id,
                                                                    !customer.active
                                                                );
                                                            }}
                                                        >
                                                            <button
                                                                type="submit"
                                                                className="action-button"
                                                            >
                                                                {customer.active
                                                                    ? t.actions.deactivate
                                                                    : t.actions.reactivate}
                                                            </button>
                                                        </form>

                                                    </div>
                                                </td>

                                            </tr>
                                        )
                                    )}
                                </tbody>

                            </table>

                        </div>

                    </section>


                    {/* =========================================
                        MOBILE
                       ========================================= */}

                    <section className="customers-mobile-list">

                        {customers.map((customer) => (

                            <article
                                key={customer.id}
                                className="customer-mobile-card"
                            >

                                <div className="customer-mobile-header">

                                    <div>
                                        <span className="customer-label">
                                            {t.customer}
                                        </span>

                                        <h2>
                                            {customer.name}
                                        </h2>
                                    </div>

                                    <span
                                        className={
                                            customer.active
                                                ? "status-badge status-badge--active"
                                                : "status-badge status-badge--inactive"
                                        }
                                    >
                                        {customer.active
                                            ? t.status.active
                                            : t.status.inactive}
                                    </span>

                                </div>


                                <dl className="customer-details">

                                    <div>
                                        <dt>
                                            {t.table.email}
                                        </dt>

                                        <dd>
                                            {customer.email ??
                                                t.notProvided}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>
                                            {t.table.phone}
                                        </dt>

                                        <dd>
                                            {customer.phone ??
                                                t.notProvided}
                                        </dd>
                                    </div>

                                </dl>


                                <div className="customer-mobile-actions">

                                    <Link
                                        href={`/customers/${customer.id}/edit`}
                                        className="secondary-button"
                                    >
                                        {t.actions.edit}
                                    </Link>

                                    <form
                                        action={async () => {
                                            "use server";

                                            await toggleCustomerStatus(
                                                customer.id,
                                                !customer.active
                                            );
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            className="secondary-button"
                                        >
                                            {customer.active
                                                ? t.actions.deactivate
                                                : t.actions.reactivate}
                                        </button>
                                    </form>

                                </div>

                            </article>

                        ))}

                    </section>

                </>
            )}

        </div>
    );
}