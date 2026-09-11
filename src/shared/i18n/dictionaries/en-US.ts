import type {
    ptBR,
} from "./pt-BR";

type Dictionary = {
    [K in keyof typeof ptBR]:
        typeof ptBR[K] extends string
            ? string
            : {
                [P in keyof typeof ptBR[K]]:
                    typeof ptBR[K][P] extends string
                        ? string
                        : typeof ptBR[K][P] extends object
                            ? {
                                [Q in keyof typeof ptBR[K][P]]:
                                    string;
                            }
                            : never;
            };
};

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
            email: "Email",
            phone: "Phone",
            status: "Status",
            actions: "Actions",
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

    accessibility: {
    mainNavigation: "Main navigation",
    lightTheme: "Enable light theme",
    darkTheme: "Enable dark theme",
    changeLanguage: "Change language",
},
} satisfies Dictionary;