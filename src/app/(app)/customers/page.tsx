import { redirect } from "next/navigation";
import { createClient } from "@/shared/database/supabase/server";
import { can, getCurrentAccessContext } from "@/shared/auth/permissions";
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

    const supabase = await createClient();
    const access = await getCurrentAccessContext(supabase);
    if (!can(access, "CUSTOMERS_VIEW")) redirect("/dashboard");

    const customers =
        await getCustomers();


    return (
        <CustomersView
            customers={
                customers
            }
            toggleCustomerStatusAction={
                toggleCustomerStatus
            }
        />
    );
}