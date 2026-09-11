import {
    toggleCustomerStatus,
} from "@/modules/customers/actions";

import {
    CustomersView,
} from "@/modules/customers/components/CustomersView";

import {
    getCustomers,
} from "@/modules/customers/queries";

export default async function CustomersPage() {
    const customers =
        await getCustomers();

    return (
        <CustomersView
            customers={customers}
            toggleCustomerStatusAction={
                toggleCustomerStatus
            }
        />
    );
}