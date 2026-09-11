import {
    redirect,
} from "next/navigation";

import {
    changePassword,
    removeAvatar,
    updateProfile,
} from "@/modules/auth/actions";

import {
    AvatarEditor,
} from "@/modules/auth/components/AvatarEditor";

import {
    getCurrentUserProfile,
} from "@/modules/auth/queries";

import {
    getCurrentLocale,
} from "@/shared/i18n/getCurrentLocale";

import {
    getDictionary,
} from "@/shared/i18n/getDictionary";

import {
    CourtlyAlert,
} from "@/shared/ui/CourtlyAlert";


type ProfilePageProps = {
    searchParams: Promise<{
        error?: string;
        success?: string;
    }>;
};


type ProfileDictionary =
    ReturnType<
        typeof getDictionary
    >["profile"];


function getRoleLabel(
    role: string | null,
    dictionary: ProfileDictionary
): string {
    switch (
        role?.toUpperCase()
    ) {
        case "OWNER":
            return dictionary
                .roles
                .owner;

        case "ADMIN":
            return dictionary
                .roles
                .admin;

        case "PROFESSIONAL":
            return dictionary
                .roles
                .professional;

        case "CUSTOMER":
            return dictionary
                .roles
                .customer;

        default:
            return dictionary
                .roles
                .user;
    }
}


function getInitials(
    name: string
): string {
    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (
        parts.length === 0
    ) {
        return "U";
    }

    if (
        parts.length === 1
    ) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        (
            parts[0][0] ??
            ""
        ) +
        (
            parts[
                parts.length - 1
            ][0] ??
            ""
        )
    ).toUpperCase();
}


function getSuccessMessage(
    success: string | undefined,
    dictionary: ProfileDictionary
): string | null {
    switch (success) {
        case "profile":
            return dictionary
                .feedback
                .success
                .profileUpdated;

        case "password":
            return dictionary
                .feedback
                .success
                .passwordUpdated;

        case "avatar":
            return dictionary
                .feedback
                .success
                .avatarUpdated;

        case "avatarRemoved":
            return dictionary
                .feedback
                .success
                .avatarRemoved;

        default:
            return success
                ? dictionary
                    .feedback
                    .success
                    .changesSaved
                : null;
    }
}


function getErrorMessage(
    error: string | undefined,
    dictionary: ProfileDictionary
): string | null {
    if (!error) {
        return null;
    }

    const messages:
        Record<string, string> = {
            nameRequired:
                dictionary
                    .feedback
                    .error
                    .nameRequired,

            passwordTooShort:
                dictionary
                    .feedback
                    .error
                    .passwordTooShort,

            passwordsDoNotMatch:
                dictionary
                    .feedback
                    .error
                    .passwordsDoNotMatch,

            avatarRequired:
                dictionary
                    .feedback
                    .error
                    .avatarRequired,

            avatarTooLarge:
                dictionary
                    .feedback
                    .error
                    .avatarTooLarge,

            invalidAvatarType:
                dictionary
                    .feedback
                    .error
                    .invalidAvatarType,

            profileUpdateFailed:
                dictionary
                    .feedback
                    .error
                    .profileUpdateFailed,

            passwordUpdateFailed:
                dictionary
                    .feedback
                    .error
                    .passwordUpdateFailed,

            avatarUploadFailed:
                dictionary
                    .feedback
                    .error
                    .avatarUploadFailed,

            avatarRemoveFailed:
                dictionary
                    .feedback
                    .error
                    .avatarRemoveFailed,
        };

    return (
        messages[error] ??
        dictionary
            .feedback
            .error
            .unexpected
    );
}


export default async function ProfilePage({
    searchParams,
}: ProfilePageProps) {
    const profile =
        await getCurrentUserProfile();

    if (!profile) {
        redirect("/login");
    }

    const locale =
        await getCurrentLocale();

    const dictionary =
        getDictionary(
            locale
        );

    const t =
        dictionary.profile;

    const {
        error,
        success,
    } =
        await searchParams;

    const successMessage =
        getSuccessMessage(
            success,
            t
        );

    const errorMessage =
        getErrorMessage(
            error,
            t
        );

    const initials =
        getInitials(
            profile.fullName
        );

    const roleLabel =
        getRoleLabel(
            profile.role,
            t
        );


    return (
        <main className="profile-page">
            <div className="page-heading">
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
            </div>


            {errorMessage && (
                <CourtlyAlert
                    type="error"
                    message={
                        errorMessage
                    }
                    closeLabel={
                        t.avatar
                            .editor
                            .close
                    }
                />
            )}


            {successMessage && (
                <CourtlyAlert
                    type="success"
                    message={
                        successMessage
                    }
                    closeLabel={
                        t.avatar
                            .editor
                            .close
                    }
                />
            )}


            <div className="profile-layout">
                <aside className="profile-avatar-card">
                    <AvatarEditor
                        avatarUrl={
                            profile.avatarUrl
                        }
                        fullName={
                            profile.fullName
                        }
                        initials={
                            initials
                        }
                    />

                    <div className="profile-avatar-identity">
                        <h2>
                            {profile.fullName}
                        </h2>

                        <span className="profile-role-badge">
                            {roleLabel}
                        </span>

                        <p>
                            {profile.email}
                        </p>
                    </div>


                    {profile.avatarPath && (
                        <form
                            action={
                                removeAvatar
                            }
                            className="profile-remove-avatar-form"
                        >
                            <button
                                type="submit"
                                className="profile-remove-avatar"
                            >
                                {
                                    t.avatar
                                        .removePhoto
                                }
                            </button>
                        </form>
                    )}
                </aside>


                <div className="profile-content">
                    <section className="profile-card">
                        <div className="profile-card-heading">
                            <div className="profile-card-icon">
                                ♙
                            </div>

                            <div>
                                <h2>
                                    {
                                        t.personalInformation
                                            .title
                                    }
                                </h2>

                                <p>
                                    {
                                        t.personalInformation
                                            .description
                                    }
                                </p>
                            </div>
                        </div>


                        <form
                            action={
                                updateProfile
                            }
                            className="profile-form"
                        >
                            <div className="profile-form-grid">
                                <div className="form-group">
                                    <label htmlFor="fullName">
                                        {
                                            t.personalInformation
                                                .name
                                        }
                                    </label>

                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        defaultValue={
                                            profile.fullName
                                        }
                                        autoComplete="name"
                                        required
                                    />
                                </div>


                                <div className="form-group">
                                    <label htmlFor="phone">
                                        {
                                            t.personalInformation
                                                .phone
                                        }
                                    </label>

                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        inputMode="tel"
                                        maxLength={15}
                                        defaultValue={
                                            profile.phone ??
                                            ""
                                        }
                                        autoComplete="tel"
                                        placeholder={
                                            t.personalInformation
                                                .phonePlaceholder
                                        }
                                    />
                                </div>


                                <div className="form-group">
                                    <label htmlFor="profileEmail">
                                        {
                                            t.personalInformation
                                                .email
                                        }
                                    </label>

                                    <input
                                        id="profileEmail"
                                        type="email"
                                        value={
                                            profile.email
                                        }
                                        disabled
                                        readOnly
                                    />

                                    <small>
                                        {
                                            t.personalInformation
                                                .emailHelp
                                        }
                                    </small>
                                </div>


                                <div className="form-group">
                                    <label htmlFor="profileRole">
                                        {
                                            t.personalInformation
                                                .role
                                        }
                                    </label>

                                    <input
                                        id="profileRole"
                                        type="text"
                                        value={
                                            roleLabel
                                        }
                                        disabled
                                        readOnly
                                    />

                                    <small>
                                        {
                                            t.personalInformation
                                                .roleHelp
                                        }
                                    </small>
                                </div>
                            </div>


                            <div className="profile-form-actions">
                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    {
                                        t.personalInformation
                                            .save
                                    }
                                </button>
                            </div>
                        </form>
                    </section>


                    <section className="profile-card">
                        <div className="profile-card-heading">
                            <div className="profile-card-icon">
                                ◈
                            </div>

                            <div>
                                <h2>
                                    {
                                        t.security
                                            .title
                                    }
                                </h2>

                                <p>
                                    {
                                        t.security
                                            .description
                                    }
                                </p>
                            </div>
                        </div>


                        <form
                            action={
                                changePassword
                            }
                            className="profile-form"
                        >
                            <div className="profile-form-grid">
                                <div className="form-group">
                                    <label htmlFor="newPassword">
                                        {
                                            t.security
                                                .newPassword
                                        }
                                    </label>

                                    <input
                                        id="newPassword"
                                        name="password"
                                        type="password"
                                        minLength={8}
                                        autoComplete="new-password"
                                        placeholder={
                                            t.security
                                                .newPasswordPlaceholder
                                        }
                                        required
                                    />
                                </div>


                                <div className="form-group">
                                    <label htmlFor="confirmNewPassword">
                                        {
                                            t.security
                                                .confirmPassword
                                        }
                                    </label>

                                    <input
                                        id="confirmNewPassword"
                                        name="confirmPassword"
                                        type="password"
                                        minLength={8}
                                        autoComplete="new-password"
                                        placeholder={
                                            t.security
                                                .confirmPasswordPlaceholder
                                        }
                                        required
                                    />
                                </div>
                            </div>


                            <div className="profile-form-actions">
                                <button
                                    type="submit"
                                    className="secondary-button"
                                >
                                    {
                                        t.security
                                            .changePassword
                                    }
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    );
}