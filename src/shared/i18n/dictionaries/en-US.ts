import type {
    ptBR,
} from "./pt-BR";


type DeepStringify<T> =
    T extends string
        ? string
        : T extends object
            ? {
                [K in keyof T]:
                    DeepStringify<T[K]>;
            }
            : never;


type Dictionary =
    DeepStringify<
        typeof ptBR
    >;

export const enUS = {
    common: {
        appName: "Courtly",
        appDescription: "Management Platform",

        owner: "Owner",

        notProvided: "Not provided",

        actions: {
            save: "Save",
            cancel: "Cancel",
            edit: "Edit",
            delete: "Delete",
            deactivate: "Deactivate",
            reactivate: "Reactivate",
            back: "Back",
            continue: "Continue",
        },
    },

    navigation: {
        overview: "Overview",
        customers: "Students",
        scheduling: "Schedule",
        attendance: "Attendance",
        makeups: "Makeups",
        payments: "Finance",

        collapseMenu: "Collapse menu",
        expandMenu: "Expand menu",
    },

    header: {
        language: "Language",
        portuguese: "Portuguese",
        english: "English",
    },

    theme: {
        title: "Appearance",
        light: "Light",
        dark: "Dark",
        system: "System",
    },

    customers: {
        eyebrow: "Management",

        title: "Students",

        description:
            "Manage your organization's students.",

        newCustomer: "New student",

        customer: "Student",

        notProvided: "Not provided",

        table: {
            name: "Name",
            documentType: "Document type",
            documentNumber: "Document",
            email: "Email",
            phone: "Phone",
            status: "Status",
            actions: "Actions",
        },

        filters: {
            name: "Name",
            namePlaceholder: "Search by name",

            documentType: "Document type",
            allDocumentTypes: "All",

            documentNumber: "Document number",
            documentNumberPlaceholder: "Search document",

            status: "Status",
            allStatuses: "All",
            active: "Active",
            inactive: "Inactive",

            clear: "Clear filters",

            noResults: "No students found with the selected filters.",
        },

        status: {
            active: "Active",
            inactive: "Inactive",
        },

        actions: {
            edit: "Edit",
            deactivate: "Deactivate",
            reactivate: "Reactivate",
        },

        empty: {
            title: "No students yet",

            description:
                "Add your first student to start organizing your activities.",

            action: "Add student",
        },

        confirmation: {
            deactivateTitle:
                "Deactivate student?",

            deactivateDescription:
                'Are you sure you want to deactivate "{name}"? The student record will be kept and can be reactivated later.',

            confirmDeactivate:
                "Deactivate student",
            
            deactivating: "Deactivating...",
        },

        feedback: {
            success: {
                customerCreated:
                    "Student created successfully.",

                customerUpdated:
                    "Student updated successfully.",

                customerDeactivated:
                    "Student deactivated successfully.",

                customerReactivated:
                    "Student reactivated successfully.",
            },

            error: {
                nameRequired:
                    "Student name is required.",

                invalidDocumentType:
                    "Select a valid document type.",

                invalidDocument:
                    "Invalid document. Please check the provided CPF.",

                invalidData:
                    "Check the provided information and try again.",

                organizationNotFound:
                    "We could not identify your organization.",

                createFailed:
                    "We could not create the student. Please try again.",

                updateFailed:
                    "We could not update the student. Please try again.",

                statusUpdateFailed:
                    "We could not change the student's status. Please try again.",
            },
        },

        form: {
            createTitle: "New student",
            editTitle: "Edit student",

            name: "Name",
            documentType: "Document type",
            documentNumber: "Document number",
            email: "Email",
            phone: "Phone",
            birthDate: "Birth date",
            notes: "Notes",

            create: "Add student",
            save: "Save changes",

            back: "Back to students",
        },
    },

    profile: {
        eyebrow: "Account",
        title: "My profile",

        description:
            "Manage your information, profile photo, and account security.",

        roles: {
            owner: "Owner",
            admin: "Administrator",
            professional: "Professional",
            customer: "Student",
            user: "User",
        },

        avatar: {
            addPhoto: "Add photo",
            changePhoto: "Change photo",
            removePhoto: "Remove photo",

            selectPhoto:
                "Select profile photo",

            photoAlt:
                "Photo of {name}",

            help:
                "JPG, PNG, or WEBP. The photo will be adjusted before upload.",

            editor: {
                eyebrow:
                    "Profile photo",

                title:
                    "Adjust photo",

                description:
                    "Position the image inside the circle.",

                previewAlt:
                    "Profile photo preview",

                instruction:
                    "Drag the image to reposition your face.",

                zoom:
                    "Zoom",

                cancel:
                    "Cancel",

                save:
                    "Save photo",

                saving:
                    "Saving...",

                close:
                    "Close",
            },

            errors: {
                invalidType:
                    "Use a JPG, PNG, or WEBP image.",

                originalTooLarge:
                    "The original image must be no larger than 10 MB.",

                processingFailed:
                    "We couldn't process the image.",

                preparingFailed:
                    "We couldn't prepare the image.",

                generationFailed:
                    "We couldn't generate the image.",

                saveFailed:
                    "We couldn't save the photo.",
            },
        },

        personalInformation: {
            title:
                "Personal information",

            description:
                "Update the information used to identify your account.",

            name:
                "Name",

            phone:
                "Phone",

            phonePlaceholder:
                "Contact phone",

            email:
                "Email / Login",

            emailHelp:
                "Your login cannot be changed on this page.",

            role:
                "Role",

            roleHelp:
                "Your role is defined by the organization.",

            save:
                "Save changes",
        },

        security: {
            title:
                "Security",

            description:
                "Set a new password to protect your account.",

            newPassword:
                "New password",

            newPasswordPlaceholder:
                "Minimum of 8 characters",

            confirmPassword:
                "Confirm new password",

            confirmPasswordPlaceholder:
                "Enter the new password again",

            changePassword:
                "Change password",
        },

        feedback: {
            success: {
                profileUpdated:
                    "Personal information updated successfully.",

                passwordUpdated:
                    "Password changed successfully.",

                avatarUpdated:
                    "Profile photo updated successfully.",

                avatarRemoved:
                    "Profile photo removed successfully.",

                changesSaved:
                    "Changes saved successfully.",
            },

            error: {
                nameRequired:
                    "Enter your name.",

                passwordTooShort:
                    "Your new password must be at least 8 characters long.",

                passwordsDoNotMatch:
                    "Passwords do not match.",

                avatarRequired:
                    "Select an image.",

                avatarTooLarge:
                    "The image must be no larger than 5 MB.",

                invalidAvatarType:
                    "Use a JPG, PNG, or WEBP image.",

                profileUpdateFailed:
                    "We couldn't update your information. Please try again.",

                passwordUpdateFailed:
                    "We couldn't change your password. Please try again.",

                avatarUploadFailed:
                    "We couldn't update your profile photo. Please try again.",

                avatarRemoveFailed:
                    "We couldn't remove your profile photo. Please try again.",

                unexpected:
                    "We couldn't complete the operation. Please try again.",
            },
        },
    },

    accessibility: {
    mainNavigation: "Main navigation",
    lightTheme: "Enable light theme",
    darkTheme: "Enable dark theme",
    changeLanguage: "Change language",
},
} satisfies Dictionary;