import type {
    Database,
} from "@/types/database.types";


export type Customer =
    Database["public"]["Tables"]["customers"]["Row"];


export type CustomerInsert =
    Database["public"]["Tables"]["customers"]["Insert"];


export type CustomerUpdate =
    Database["public"]["Tables"]["customers"]["Update"];


/* ============================================================
   CUSTOMER COMMERCIAL SUMMARY
   ============================================================ */

export type CustomerActivePlanSummary = {
    activityId: string;

    name: string;
};


/*
 * Used specifically by the customer listing.
 *
 * We intentionally do not place commercial information inside
 * the customers table itself.
 *
 * activePlans is computed from:
 *
 * customer_subscriptions
 *        +
 * activities
 */
export type CustomerListItem =
    Customer & {
        activePlans:
            CustomerActivePlanSummary[];
    };