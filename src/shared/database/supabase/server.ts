import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";

function getSupabaseServerConfig() {
    const url = (
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        process.env.SUPABASE_URL ??
        ""
    )
        .trim()
        .replace(/\/+$/, "");

    const key = (
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.SUPABASE_ANON_KEY ??
        ""
    ).trim();

    if (!url) {
        throw new Error(
            "Supabase URL is not configured. Define NEXT_PUBLIC_SUPABASE_URL in .env.local."
        );
    }

    if (!key) {
        throw new Error(
            "Supabase public key is not configured. Define NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local."
        );
    }

    let parsedUrl: URL;

    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL is invalid. Use the complete Supabase project URL, for example https://<project-ref>.supabase.co."
        );
    }

    if (
        parsedUrl.protocol !== "https:" &&
        parsedUrl.hostname !== "localhost" &&
        parsedUrl.hostname !== "127.0.0.1"
    ) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL must use HTTPS for a remote Supabase project."
        );
    }

    return {
        url,
        key,
    };
}

export async function createClient() {
    const cookieStore = await cookies();
    const { url, key } = getSupabaseServerConfig();

    return createServerClient<Database>(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },

            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(
                        ({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        }
                    );
                } catch {
                    // Cookie writes are unavailable while rendering
                    // some Server Components. Server Actions and Route
                    // Handlers can still persist them normally.
                }
            },
        },
    });
}
