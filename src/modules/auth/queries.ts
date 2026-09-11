import {
    createClient,
} from "@/shared/database/supabase/server";


export type CurrentUserProfile = {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatarPath: string | null;
    avatarUrl: string | null;
    role: string | null;
};


export async function getCurrentUserProfile():
Promise<CurrentUserProfile | null> {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const [
        profileResult,
        membershipResult,
    ] =
        await Promise.all([
            supabase
                .from("profiles")
                .select(
                    "full_name, phone, avatar_path"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle(),

            supabase
                .from("memberships")
                .select("role")
                .eq(
                    "user_id",
                    user.id
                )
                .limit(1)
                .maybeSingle(),
        ]);

    const profile =
        profileResult.data;

    const membership =
        membershipResult.data;

    let avatarUrl:
        string | null =
        null;

    if (profile?.avatar_path) {
        const {
            data,
        } =
            supabase.storage
                .from("avatars")
                .getPublicUrl(
                    profile.avatar_path
                );

        avatarUrl =
            `${data.publicUrl}?v=${encodeURIComponent(
                profile.avatar_path
            )}`;
    }

    const metadataName =
        typeof user.user_metadata
            ?.full_name === "string"
            ? user.user_metadata
                  .full_name
            : null;

    return {
        id:
            user.id,

        email:
            user.email ?? "",

        fullName:
            profile?.full_name ||
            metadataName ||
            user.email?.split("@")[0] ||
            "Usuário",

        phone:
            profile?.phone ??
            null,

        avatarPath:
            profile?.avatar_path ??
            null,

        avatarUrl,

        role:
            membership?.role ??
            null,
    };
}