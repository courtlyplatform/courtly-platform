"use server";

import {
    revalidatePath,
} from "next/cache";

import {
    redirect,
} from "next/navigation";

import {
    createClient,
} from "@/shared/database/supabase/server";


function getApplicationUrl(): string {
    return (
        process.env.NEXT_PUBLIC_SITE_URL ??
        "http://localhost:3000"
    );
}


export async function signUp(
    formData: FormData
) {
    const supabase =
        await createClient();

    const fullName =
        String(
            formData.get("fullName") ??
                ""
        ).trim();

    const email =
        String(
            formData.get("email") ??
                ""
        ).trim();

    const password =
        String(
            formData.get("password") ??
                ""
        );

    const confirmPassword =
        String(
            formData.get(
                "confirmPassword"
            ) ?? ""
        );

    if (
        !fullName ||
        !email ||
        !password
    ) {
        redirect(
            "/signup?error=" +
                encodeURIComponent(
                    "Preencha todos os campos obrigatórios."
                )
        );
    }

    if (password.length < 8) {
        redirect(
            "/signup?error=" +
                encodeURIComponent(
                    "A senha deve possuir pelo menos 8 caracteres."
                )
        );
    }

    if (
        password !==
        confirmPassword
    ) {
        redirect(
            "/signup?error=" +
                encodeURIComponent(
                    "As senhas não coincidem."
                )
        );
    }

    const {
        error,
    } =
        await supabase.auth.signUp({
            email,
            password,

            options: {
                data: {
                    full_name:
                        fullName,
                },
            },
        });

    if (error) {
        redirect(
            `/signup?error=${encodeURIComponent(
                error.message
            )}`
        );
    }

    /*
     * IMPORTANT:
     *
     * Signup does NOT assign OWNER directly.
     *
     * The organization onboarding flow is
     * responsible for creating the organization
     * and its OWNER membership atomically.
     */
    redirect("/onboarding");
}


export async function signIn(
    formData: FormData
) {
    const supabase =
        await createClient();

    const email =
        String(
            formData.get("email") ??
                ""
        ).trim();

    const password =
        String(
            formData.get("password") ??
                ""
        );

    if (!email || !password) {
        redirect(
            "/login?error=" +
                encodeURIComponent(
                    "Preencha todos os campos."
                )
        );
    }

    const {
        error,
    } =
        await supabase.auth
            .signInWithPassword({
                email,
                password,
            });

    if (error) {
        redirect(
            "/login?error=" +
                encodeURIComponent(
                    "E-mail ou senha inválidos."
                )
        );
    }

    const {
        data: membership,
        error: membershipError,
    } =
        await supabase
            .from("memberships")
            .select(
                "id, role"
            )
            .limit(1)
            .maybeSingle();

    if (membershipError) {
        redirect(
            `/login?error=${encodeURIComponent(
                membershipError.message
            )}`
        );
    }

    if (!membership) {
        redirect(
            "/onboarding"
        );
    }

    redirect("/dashboard");
}


export async function signOut() {
    const supabase =
        await createClient();

    await supabase.auth.signOut();

    redirect("/login");
}


export async function requestPasswordReset(
    formData: FormData
) {
    const supabase =
        await createClient();

    const email =
        String(
            formData.get("email") ??
                ""
        ).trim();

    if (!email) {
        redirect(
            "/forgot-password?error=" +
                encodeURIComponent(
                    "Informe seu e-mail."
                )
        );
    }

    const {
        error,
    } =
        await supabase.auth
            .resetPasswordForEmail(
                email,
                {
                    redirectTo:
                        `${getApplicationUrl()}/reset-password`,
                }
            );

    if (error) {
        redirect(
            `/forgot-password?error=${encodeURIComponent(
                error.message
            )}`
        );
    }

    /*
     * Deliberately generic response.
     * We do not reveal whether the email exists.
     */
    redirect(
        "/forgot-password?success=1"
    );
}


export async function updatePassword(
    formData: FormData
) {
    const supabase =
        await createClient();

    const password =
        String(
            formData.get("password") ??
                ""
        );

    const confirmPassword =
        String(
            formData.get(
                "confirmPassword"
            ) ?? ""
        );

    if (password.length < 8) {
        redirect(
            "/reset-password?error=" +
                encodeURIComponent(
                    "A senha deve possuir pelo menos 8 caracteres."
                )
        );
    }

    if (
        password !==
        confirmPassword
    ) {
        redirect(
            "/reset-password?error=" +
                encodeURIComponent(
                    "As senhas não coincidem."
                )
        );
    }

    const {
        error,
    } =
        await supabase.auth.updateUser({
            password,
        });

    if (error) {
        redirect(
            `/reset-password?error=${encodeURIComponent(
                error.message
            )}`
        );
    }

    redirect(
        "/login?passwordUpdated=1"
    );
}


export async function updateProfile(
    formData: FormData
) {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const fullName =
        String(
            formData.get("fullName") ??
                ""
        ).trim();

    const phone =
        String(
            formData.get("phone") ??
                ""
        )
            .replace(/\D/g, "")
            .slice(0, 15);

    if (!fullName) {
        redirect(
            "/profile?error=" +
                encodeURIComponent(
                    "Informe seu nome."
                )
        );
    }

    const {
        error,
    } =
        await supabase
            .from("profiles")
            .upsert({
                user_id:
                    user.id,

                full_name:
                    fullName,

                phone:
                    phone || null,

                updated_at:
                    new Date()
                        .toISOString(),
            });

    if (error) {
        redirect(
            `/profile?error=${encodeURIComponent(
                error.message
            )}`
        );
    }

    revalidatePath(
        "/profile"
    );

    revalidatePath(
        "/",
        "layout"
    );

    redirect(
        "/profile?success=profile"
    );
}


export async function changePassword(
    formData: FormData
) {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const password =
        String(
            formData.get("password") ??
                ""
        );

    const confirmPassword =
        String(
            formData.get(
                "confirmPassword"
            ) ?? ""
        );

    if (password.length < 8) {
        redirect(
            "/profile?error=" +
                encodeURIComponent(
                    "A nova senha deve possuir pelo menos 8 caracteres."
                )
        );
    }

    if (
        password !==
        confirmPassword
    ) {
        redirect(
            "/profile?error=" +
                encodeURIComponent(
                    "As senhas não coincidem."
                )
        );
    }

    const {
        error,
    } =
        await supabase.auth
            .updateUser({
                password,
            });

    if (error) {
        redirect(
            `/profile?error=${encodeURIComponent(
                error.message
            )}`
        );
    }

    redirect(
        "/profile?success=password"
    );
}


export async function uploadAvatar(
    formData: FormData
) {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const file =
        formData.get("avatar");

    if (
        !(file instanceof File) ||
        file.size === 0
    ) {
        redirect(
            "/profile?error=" +
                encodeURIComponent(
                    "Selecione uma imagem."
                )
        );
    }

    if (
        file.size >
        5 * 1024 * 1024
    ) {
        redirect(
            "/profile?error=" +
                encodeURIComponent(
                    "A imagem deve possuir no máximo 5 MB."
                )
        );
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {
        redirect(
            "/profile?error=" +
                encodeURIComponent(
                    "Utilize uma imagem JPG, PNG ou WEBP."
                )
        );
    }

    const extension =
        file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
              ? "webp"
              : "jpg";

    /*
     * Every upload receives a new filename.
     * This prevents browser/CDN cache issues
     * when replacing the avatar.
     */
    const path =
        `${user.id}/avatar-${Date.now()}.${extension}`;

    /*
     * Store the previous avatar path.
     * We only remove it AFTER the new avatar
     * has been successfully uploaded and saved.
     */
    const {
        data: currentProfile,
        error: profileReadError,
    } =
        await supabase
            .from("profiles")
            .select("avatar_path")
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();

    if (profileReadError) {
        redirect(
            `/profile?error=${encodeURIComponent(
                profileReadError.message
            )}`
        );
    }

    /*
     * 1. Upload the new avatar first.
     */
    const {
        error: uploadError,
    } =
        await supabase.storage
            .from("avatars")
            .upload(
                path,
                file,
                {
                    upsert: false,
                    contentType:
                        file.type,
                }
            );

    if (uploadError) {
        redirect(
            `/profile?error=${encodeURIComponent(
                uploadError.message
            )}`
        );
    }

    /*
     * 2. Point the profile to the new avatar.
     */
    const {
        error: profileUpdateError,
    } =
        await supabase
            .from("profiles")
            .upsert({
                user_id:
                    user.id,

                avatar_path:
                    path,

                updated_at:
                    new Date()
                        .toISOString(),
            });

    if (profileUpdateError) {
        /*
         * The DB update failed.
         * Remove the newly uploaded orphan file.
         */
        await supabase.storage
            .from("avatars")
            .remove([
                path,
            ]);

        redirect(
            `/profile?error=${encodeURIComponent(
                profileUpdateError.message
            )}`
        );
    }

    /*
     * 3. Only now remove the previous avatar.
     */
    if (
        currentProfile?.avatar_path &&
        currentProfile.avatar_path !== path
    ) {
        await supabase.storage
            .from("avatars")
            .remove([
                currentProfile.avatar_path,
            ]);
    }

    revalidatePath(
        "/profile"
    );

    revalidatePath(
        "/",
        "layout"
    );

    redirect(
        "/profile?success=avatar"
    );
}


export async function removeAvatar() {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const {
        data: profile,
        error: profileReadError,
    } =
        await supabase
            .from("profiles")
            .select("avatar_path")
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();

    if (profileReadError) {
        redirect(
            `/profile?error=${encodeURIComponent(
                profileReadError.message
            )}`
        );
    }

    if (profile?.avatar_path) {
        const {
            error: storageError,
        } =
            await supabase.storage
                .from("avatars")
                .remove([
                    profile.avatar_path,
                ]);

        if (storageError) {
            redirect(
                `/profile?error=${encodeURIComponent(
                    storageError.message
                )}`
            );
        }
    }

    const {
        error: profileUpdateError,
    } =
        await supabase
            .from("profiles")
            .update({
                avatar_path:
                    null,

                updated_at:
                    new Date()
                        .toISOString(),
            })
            .eq(
                "user_id",
                user.id
            );

    if (profileUpdateError) {
        redirect(
            `/profile?error=${encodeURIComponent(
                profileUpdateError.message
            )}`
        );
    }

    revalidatePath(
        "/profile"
    );

    revalidatePath(
        "/",
        "layout"
    );

    redirect(
        "/profile?success=avatarRemoved"
    );
}