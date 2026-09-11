export const ptBR = {
    common: {
        appName: "Courtly",
        appDescription: "Management Platform",

        owner: "Proprietário",

        notProvided: "Não informado",

        actions: {
            save: "Salvar",
            cancel: "Cancelar",
            edit: "Editar",
            delete: "Excluir",
            deactivate: "Desativar",
            reactivate: "Reativar",
            back: "Voltar",
            continue: "Continuar",
        },
    },

    navigation: {
        overview: "Visão geral",
        customers: "Alunos",
        scheduling: "Agenda",
        attendance: "Presenças",
        makeups: "Reposições",
        payments: "Financeiro",

        collapseMenu: "Recolher menu",
        expandMenu: "Expandir menu",
    },

    header: {
        language: "Idioma",
        portuguese: "Português",
        english: "Inglês",
    },

    theme: {
        title: "Aparência",
        light: "Claro",
        dark: "Escuro",
        system: "Sistema",
    },

    customers: {
        eyebrow: "Gestão",

        title: "Alunos",

        description:
            "Gerencie os alunos da sua organização.",

        newCustomer: "Novo aluno",

        customer: "Aluno",

        notProvided: "Não informado",

        table: {
            name: "Nome",
            email: "E-mail",
            phone: "Telefone",
            status: "Status",
            actions: "Ações",
        },

        status: {
            active: "Ativo",
            inactive: "Inativo",
        },

        actions: {
            edit: "Editar",
            deactivate: "Desativar",
            reactivate: "Reativar",
        },

        empty: {
            title: "Nenhum aluno cadastrado",

            description:
                "Cadastre seu primeiro aluno para começar a organizar suas atividades.",

            action: "Adicionar aluno",
        },

        form: {
            createTitle: "Novo aluno",
            editTitle: "Editar aluno",

            name: "Nome",
            documentType: "Tipo de documento",
            documentNumber:"Número do documento",
            email: "E-mail",
            phone: "Telefone",
            birthDate: "Data de nascimento",
            notes: "Observações",

            create: "Cadastrar aluno",
            save: "Salvar alterações",

            back: "Voltar para alunos",
        }
    },

    accessibility: {
    mainNavigation: "Navegação principal",
    lightTheme: "Ativar tema claro",
    darkTheme: "Ativar tema escuro",
    changeLanguage: "Alterar idioma",
},
} as const;