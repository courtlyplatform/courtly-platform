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
        services: "Services",
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
        eyebrow:
            "Management",

        title:
            "Students",

        description:
            "Manage your organization's students.",

        newCustomer:
            "New student",

        customer:
            "Student",

        notProvided:
            "Not provided",

        table: {
            name:
                "Name",

            documentType:
                "Document type",

            documentNumber:
                "Document",

            email:
                "Email",

            phone:
                "Phone",

            plans:
                "Plans / Services",

            status:
                "Status",

            actions:
                "Actions",
        },

        plans: {
            none:
                "No active plans",

            activeSingular:
                "{count} active plan",

            activePlural:
                "{count} active plans",

            view:
                "View plans",

            more:
                "+{count} more",
        },

        filters: {
            name:
                "Name",

            namePlaceholder:
                "Search by name",

            documentType:
                "Document type",

            allDocumentTypes:
                "All",

            documentNumber:
                "Document number",

            documentNumberPlaceholder:
                "Search document",

            status:
                "Status",

            allStatuses:
                "All",

            active:
                "Active",

            inactive:
                "Inactive",

            clear:
                "Clear filters",

            noResults:
                "No students found with the selected filters.",
        },

        status: {
            active:
                "Active",

            inactive:
                "Inactive",
        },

        actions: {
            edit:
                "Edit",

            deactivate:
                "Deactivate",

            reactivate:
                "Reactivate",
        },

        empty: {
            title:
                "No students yet",

            description:
                "Add your first student to start organizing your activities.",

            action:
                "Add student",
        },

        confirmation: {
            deactivateTitle:
                "Deactivate student?",

            deactivateDescription:
                'Do you want to deactivate "{name}"? All active or paused plans and services will be ended. The student record and commercial history will be preserved.',

            confirmDeactivate:
                "Deactivate student",

            deactivating:
                "Deactivating...",
        },

        feedback: {
            success: {
                customerCreated:
                    "Student created successfully.",

                customerUpdated:
                    "Student updated successfully.",

                customerDeactivated:
                    "Student deactivated successfully. Agreements ended: {count}.",

                customerReactivated:
                    "Student reactivated successfully. Previous agreements remain ended.",
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

                forbidden:
                    "You don't have permission to change this student's status.",

                statusUpdateFailed:
                    "We could not change the student's status. No commercial changes were completed.",
            },
        },

        form: {
            createTitle:
                "New student",

            editTitle:
                "Edit student",

            name:
                "Name",

            documentType:
                "Document type",

            documentNumber:
                "Document number",

            email:
                "Email",

            phone:
                "Phone",

            birthDate:
                "Birth date",

            notes:
                "Notes",

            create:
                "Add student",

            save:
                "Save changes",

            back:
                "Back to students",
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

    services: {
        eyebrow: "Management",

        title: "Services",

        description:
            "Manage the activities and services offered by your organization.",

        service: "Service",

        new: "New service",
        edit: "Edit service",

        name: "Name",
        serviceDescription: "Description",

        namePlaceholder:
            "E.g. Tennis",

        descriptionPlaceholder:
            "E.g. Individual and group lessons",

        duration: "Default duration",

        durationHelp:
            "Used as the suggested duration when creating an appointment.",

        price: "Default price",

        priceHelp:
            "Commercial reference only. It does not depend on duration.",

        minutes: "min",

        active: "Active",
        inactive: "Inactive",

        activate: "Reactivate",
        deactivate: "Deactivate",

        editAction: "Edit",

        save: "Save changes",
        create: "Create service",
        cancel: "Cancel",
        saving: "Saving...",

        noPrice: "Not defined",

        modalDescription:
            "Duration and price are independent and can be customized later.",

        close: "Close",

        filters: {
            name: "Service",

            namePlaceholder:
                "Search by name or description",

            duration: "Duration",
            allDurations: "All",

            minPrice: "Minimum price",
            maxPrice: "Maximum price",

            minPricePlaceholder: "0.00",
            maxPricePlaceholder: "0.00",

            status: "Status",

            allStatuses: "All",
            active: "Active",
            inactive: "Inactive",

            clear: "Clear filters",

            noResults:
                "No services found with the selected filters.",
        },

        table: {
            name: "Service",
            description: "Description",
            duration: "Duration",
            price: "Default price",
            status: "Status",
            actions: "Actions",
        },

        empty: {
            title: "No services yet",

            description:
                "Add your first service to start organizing your appointments.",

            action: "Add service",
        },

        confirmation: {
            deactivateTitle:
                "Deactivate service?",

            deactivateDescription:
                'Are you sure you want to deactivate "{name}"? The service will be kept and can be reactivated later.',

            confirmDeactivate:
                "Deactivate service",

            deactivating:
                "Deactivating...",
        },

        validation: {
            nameRequired:
                "Enter the service name.",

            invalidDuration:
                "Enter a valid duration.",

            invalidPrice:
                "Enter a valid price.",
        },

        feedback: {
            success: {
                serviceCreated:
                    "Service created successfully.",

                serviceUpdated:
                    "Service updated successfully.",

                serviceDeactivated:
                    "Service deactivated successfully.",

                serviceReactivated:
                    "Service reactivated successfully.",
            },

            error: {
                saveFailed:
                    "We couldn't save the service.",

                statusUpdateFailed:
                    "We couldn't change the service status.",

                duplicateName:
                    "A service with this name already exists.",

                unexpected:
                    "We couldn't complete the operation.",
            },
        },
    },

    customerSubscriptions: {

        tabs: {
            personal:
                "Personal information",

            services:
                "Plans / Services",
        },

        title:
            "Plans / Services",

        description:
            "Manage the services contracted by {name}.",

        service:
            "Service",

        unknownService:
            "Unavailable service",

        addService:
            "Add service",

        selectService:
            "Select a service",

        amount:
            "Amount",

        currency:
            "Currency",

        billingCycle:
            "Billing cycle",

        startsAt:
            "Start date",

        endsAt:
            "End date",

        edit:
            "Edit",

        pause:
            "Pause",

        resume:
            "Resume",

        end:
            "End",

        add:
            "Add",

        save:
            "Save changes",

        saving:
            "Saving...",

        cancel:
            "Cancel",

        status: {
            active:
                "Active",

            paused:
                "Paused",

            ended:
                "Ended",
        },

        reactivationNotice: {
            title:
                "Inactive student",

            description:
                "Adding a new plan or service will automatically reactivate {name}.",
        },

        cycles: {
            weekly:
                "Weekly",

            monthly:
                "Monthly",

            quarterly:
                "Quarterly",

            semiannual:
                "Semiannual",

            annual:
                "Annual",

            oneTime:
                "One-time",
        },

        modal: {
            eyebrow:
                "Commercial agreement",

            createTitle:
                "Add service",

            editTitle:
                "Edit student service",

            close:
                "Close",
        },

        empty: {
            title:
                "No contracted services",

            description:
                "This student does not have any services yet.",

            action:
                "Add service",
        },

        confirmation: {
            endTitle:
                "End service?",

            endDescription:
                "Do you want to end {service}? The commercial history will be preserved.",

            confirmEnd:
                "End service",

            ending:
                "Ending...",
        },

        feedback: {

            success: {
                created:
                    "Service successfully assigned to the student.",

                updated:
                    "Student service successfully updated.",

                paused:
                    "Service successfully paused.",

                resumed:
                    "Service successfully resumed.",

                ended:
                    "Service successfully ended.",

                createdAndReactivated:
                    "Service successfully assigned and student automatically reactivated.",
            },

            error: {
                forbidden:
                    "You don't have permission to manage this student's services.",

                customerNotFound:
                    "We couldn't find the student.",

                activityNotFound:
                    "We couldn't find the selected service.",

                inactiveActivity:
                    "An inactive service cannot be contracted.",

                duplicateOpenSubscription:
                    "This student already has this service active or paused.",

                endedImmutable:
                    "An ended agreement cannot be changed. Create a new subscription if the student returns.",

                activityRequired:
                    "Select a service.",

                invalidAmount:
                    "Enter a valid amount.",

                startDateRequired:
                    "Enter the start date.",

                invalidData:
                    "Check the information provided.",

                saveFailed:
                    "We couldn't assign the service to the student.",

                statusUpdateFailed:
                    "We couldn't change the service status.",

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