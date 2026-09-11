"use client";

import Link from "next/link";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

type Customer = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    active: boolean;
};

type CustomersViewProps = {
    customers: Customer[];
    toggleCustomerStatusAction: (
        customerId: string,
        active: boolean
    ) => Promise<void>;
};

export function CustomersView({
    customers,
    toggleCustomerStatusAction,
}: CustomersViewProps) {
    const {
        dictionary,
    } = useI18n();

    return (
        <main>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">
                        {
                            dictionary
                                .customers
                                .eyebrow
                        }
                    </span>

                    <h1>
                        {
                            dictionary
                                .customers
                                .title
                        }
                    </h1>

                    <p>
                        {
                            dictionary
                                .customers
                                .description
                        }
                    </p>
                </div>

                <Link
                    href="/customers/new"
                    className="primary-button"
                >
                    +{" "}
                    {
                        dictionary
                            .customers
                            .newCustomer
                    }
                </Link>
            </div>

            {customers.length === 0 ? (
                <div className="empty-state">
                    <h2>
                        {
                            dictionary
                                .customers
                                .empty
                                .title
                        }
                    </h2>

                    <p>
                        {
                            dictionary
                                .customers
                                .empty
                                .description
                        }
                    </p>

                    <Link
                        href="/customers/new"
                        className="primary-button"
                    >
                        {
                            dictionary
                                .customers
                                .empty
                                .action
                        }
                    </Link>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    {
                                        dictionary
                                            .customers
                                            .table
                                            .name
                                    }
                                </th>

                                <th>
                                    {
                                        dictionary
                                            .customers
                                            .table
                                            .email
                                    }
                                </th>

                                <th>
                                    {
                                        dictionary
                                            .customers
                                            .table
                                            .phone
                                    }
                                </th>

                                <th>
                                    {
                                        dictionary
                                            .customers
                                            .table
                                            .status
                                    }
                                </th>

                                <th>
                                    {
                                        dictionary
                                            .customers
                                            .table
                                            .actions
                                    }
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {customers.map(
                                (customer) => (
                                    <tr
                                        key={
                                            customer.id
                                        }
                                    >
                                        <td>
                                            <strong>
                                                {
                                                    customer.name
                                                }
                                            </strong>
                                        </td>

                                        <td>
                                            {
                                                customer.email ??
                                                dictionary
                                                    .common
                                                    .notProvided
                                            }
                                        </td>

                                        <td>
                                            {
                                                customer.phone ??
                                                dictionary
                                                    .common
                                                    .notProvided
                                            }
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    customer.active
                                                        ? "status-badge active"
                                                        : "status-badge"
                                                }
                                            >
                                                {
                                                    customer.active
                                                        ? dictionary
                                                              .customers
                                                              .status
                                                              .active
                                                        : dictionary
                                                              .customers
                                                              .status
                                                              .inactive
                                                }
                                            </span>
                                        </td>

                                        <td>
                                            <div className="table-actions">
                                                <Link
                                                    href={`/customers/${customer.id}/edit`}
                                                >
                                                    {
                                                        dictionary
                                                            .customers
                                                            .actions
                                                            .edit
                                                    }
                                                </Link>

                                                <form
                                                    action={async () => {
                                                        await toggleCustomerStatusAction(
                                                            customer.id,
                                                            !customer.active
                                                        );
                                                    }}
                                                >
                                                    <button
                                                        type="submit"
                                                        className="link-button"
                                                    >
                                                        {
                                                            customer.active
                                                                ? dictionary
                                                                      .customers
                                                                      .actions
                                                                      .deactivate
                                                                : dictionary
                                                                      .customers
                                                                      .actions
                                                                      .reactivate
                                                        }
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
            )}
        </main>
    );
}