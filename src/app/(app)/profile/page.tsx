import {
    redirect,
} from "next/navigation";

import {
    changePassword,
    removeAvatar,
    updateProfile,
    uploadAvatar,
} from "@/modules/auth/actions";

import {
    getCurrentUserProfile,
} from "@/modules/auth/queries";


type ProfilePageProps = {
    searchParams: Promise<{
        error?: string;
        success?: string;
    }>;
};


function getRoleLabel(
    role: string | null
): string {
    switch (
        role?.toUpperCase()
    ) {
        case "OWNER":
            return "Proprietário";

        case "ADMIN":
            return "Administrador";

        case "PROFESSIONAL":
            return "Profissional";

        case "CUSTOMER":
            return "Aluno";

        default:
            return "Usuário";
    }
}


function getInitials(
    name: string
): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            (part) =>
                part[0]?.toUpperCase() ??
                ""
        )
        .join("");
}


export default async function ProfilePage({
    searchParams,
}: ProfilePageProps) {
    const profile =
        await getCurrentUserProfile();

    if (!profile) {
        redirect("/login");
    }

    const {
        error,
        success,
    } =
        await searchParams;

    return (
        <main className="profile-page">
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">
                        CONTA
                    </span>

                    <h1>
                        Meu perfil
                    </h1>

                    <p>
                        Gerencie suas informações,
                        foto e segurança da conta.
                    </p>
                </div>
            </div>

            {error && (
                <div className="profile-alert profile-alert--error">
                    {error}
                </div>
            )}

            {success && (
                <div className="profile-alert profile-alert--success">
                    Alterações salvas com sucesso.
                </div>
            )}

            <div className="profile-layout">
                <aside className="profile-avatar-card">
                    <div className="profile-avatar-large">
                        {profile.avatarUrl ? (
                            <img
                                src={
                                    profile.avatarUrl
                                }
                                alt={
                                    profile.fullName
                                }
                            />
                        ) : (
                            <span>
                                {
                                    getInitials(
                                        profile.fullName
                                    )
                                }
                            </span>
                        )}
                    </div>

                    <h2>
                        {profile.fullName}
                    </h2>

                    <p>
                        {
                            getRoleLabel(
                                profile.role
                            )
                        }
                    </p>

                    <form
                        action={uploadAvatar}
                        className="profile-avatar-form"
                    >
                        <label
                            htmlFor="avatar"
                            className="secondary-button"
                        >
                            Escolher foto
                        </label>

                        <input
                            id="avatar"
                            name="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                        />

                        <button
                            type="submit"
                            className="primary-button"
                        >
                            Enviar foto
                        </button>
                    </form>

                    {profile.avatarPath && (
                        <form
                            action={
                                removeAvatar
                            }
                        >
                            <button
                                type="submit"
                                className="profile-remove-avatar"
                            >
                                Remover foto
                            </button>
                        </form>
                    )}

                    <small>
                        JPG, PNG ou WEBP.
                        Máximo de 5 MB.
                    </small>
                </aside>

                <div className="profile-content">
                    <section className="profile-card">
                        <div className="profile-card-heading">
                            <h2>
                                Informações pessoais
                            </h2>

                            <p>
                                O e-mail utilizado
                                para login não pode
                                ser alterado aqui.
                            </p>
                        </div>

                        <form
                            action={
                                updateProfile
                            }
                            className="profile-form"
                        >
                            <div className="form-group">
                                <label htmlFor="fullName">
                                    Nome
                                </label>

                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    defaultValue={
                                        profile.fullName
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">
                                    Telefone
                                </label>

                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={15}
                                    defaultValue={
                                        profile.phone ??
                                        ""
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="profileEmail">
                                    E-mail / Login
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
                                    O login não pode
                                    ser alterado nesta tela.
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="profileRole">
                                    Função
                                </label>

                                <input
                                    id="profileRole"
                                    type="text"
                                    value={
                                        getRoleLabel(
                                            profile.role
                                        )
                                    }
                                    disabled
                                    readOnly
                                />
                            </div>

                            <div className="profile-form-actions">
                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    Salvar alterações
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="profile-card">
                        <div className="profile-card-heading">
                            <h2>
                                Segurança
                            </h2>

                            <p>
                                Defina uma nova senha
                                para sua conta.
                            </p>
                        </div>

                        <form
                            action={
                                changePassword
                            }
                            className="profile-form"
                        >
                            <div className="form-group">
                                <label htmlFor="newPassword">
                                    Nova senha
                                </label>

                                <input
                                    id="newPassword"
                                    name="password"
                                    type="password"
                                    minLength={8}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmNewPassword">
                                    Confirmar nova senha
                                </label>

                                <input
                                    id="confirmNewPassword"
                                    name="confirmPassword"
                                    type="password"
                                    minLength={8}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="profile-form-actions">
                                <button
                                    type="submit"
                                    className="secondary-button"
                                >
                                    Alterar senha
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    );
}