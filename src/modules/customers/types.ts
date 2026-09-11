import type { Database } from "@/types/database.types";

export type Customer =
    Database["public"]["Tables"]["customers"]["Row"];

export type CustomerInsert =
    Database["public"]["Tables"]["customers"]["Insert"];

export type CustomerUpdate =
    Database["public"]["Tables"]["customers"]["Update"];