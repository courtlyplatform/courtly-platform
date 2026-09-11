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
        services: "Serviços",
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
            documentType: "Tipo de documento",
            documentNumber: "Documento",
            email: "E-mail",
            phone: "Telefone",
            status: "Status",
            actions: "Ações",
        },

        filters: {
            name: "Nome",
            namePlaceholder: "Buscar por nome",

            documentType: "Tipo de documento",
            allDocumentTypes: "Todos",

            documentNumber: "Número do documento",
            documentNumberPlaceholder: "Buscar documento",

            status: "Status",
            allStatuses: "Todos",
            active: "Ativos",
            inactive: "Inativos",

            clear: "Limpar filtros",

            noResults: "Nenhum aluno encontrado com os filtros selecionados.",
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

        confirmation: {
            deactivateTitle: "Desativar aluno?",
            deactivateDescription:
                'Tem certeza de que deseja desativar o aluno "{name}"? O cadastro será mantido e poderá ser reativado posteriormente.',
            confirmDeactivate: "Desativar aluno",
            deactivating: "Desativando...",
        },

        feedback: {
            success: {
                customerCreated:
                    "Aluno cadastrado com sucesso.",

                customerUpdated:
                    "Aluno atualizado com sucesso.",

                customerDeactivated:
                    "Aluno desativado com sucesso.",

                customerReactivated:
                    "Aluno reativado com sucesso.",
            },

            error: {
                nameRequired:
                    "O nome do aluno é obrigatório.",

                invalidDocumentType:
                    "Selecione um tipo de documento válido.",

                invalidDocument:
                    "Documento inválido. Verifique o CPF informado.",

                invalidData:
                    "Verifique os dados informados e tente novamente.",

                organizationNotFound:
                    "Não foi possível identificar sua organização.",

                createFailed:
                    "Não foi possível cadastrar o aluno. Tente novamente.",

                updateFailed:
                    "Não foi possível atualizar o aluno. Tente novamente.",

                statusUpdateFailed:
                    "Não foi possível alterar o status do aluno. Tente novamente.",
            },
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

    profile: {
        eyebrow: "Conta",
        title: "Meu perfil",

        description:
            "Gerencie suas informações, foto e segurança da conta.",

        roles: {
            owner: "Proprietário",
            admin: "Administrador",
            professional: "Profissional",
            customer: "Aluno",
            user: "Usuário",
        },

        avatar: {
            addPhoto: "Adicionar foto",
            changePhoto: "Alterar foto",
            removePhoto: "Remover foto",

            selectPhoto:
                "Selecionar foto de perfil",

            photoAlt:
                "Foto de {name}",

            help:
                "JPG, PNG ou WEBP. A foto será ajustada antes do envio.",

            editor: {
                eyebrow:
                    "Foto de perfil",

                title:
                    "Ajustar foto",

                description:
                    "Posicione a imagem dentro do círculo.",

                previewAlt:
                    "Pré-visualização da foto",

                instruction:
                    "Arraste a imagem para reposicionar seu rosto.",

                zoom:
                    "Zoom",

                cancel:
                    "Cancelar",

                save:
                    "Salvar foto",

                saving:
                    "Salvando...",

                close:
                    "Fechar",
            },

            errors: {
                invalidType:
                    "Utilize uma imagem JPG, PNG ou WEBP.",

                originalTooLarge:
                    "A imagem original deve possuir no máximo 10 MB.",

                processingFailed:
                    "Não foi possível processar a imagem.",

                preparingFailed:
                    "Não foi possível preparar a imagem.",

                generationFailed:
                    "Não foi possível gerar a imagem.",

                saveFailed:
                    "Não foi possível salvar a foto.",
            },
        },

        personalInformation: {
            title:
                "Informações pessoais",

            description:
                "Atualize os dados utilizados para identificação da sua conta.",

            name:
                "Nome",

            phone:
                "Telefone",

            phonePlaceholder:
                "Telefone de contato",

            email:
                "E-mail / Login",

            emailHelp:
                "O login não pode ser alterado nesta tela.",

            role:
                "Função",

            roleHelp:
                "A função é definida pela organização.",

            save:
                "Salvar alterações",
        },

        security: {
            title:
                "Segurança",

            description:
                "Defina uma nova senha para proteger sua conta.",

            newPassword:
                "Nova senha",

            newPasswordPlaceholder:
                "Mínimo de 8 caracteres",

            confirmPassword:
                "Confirmar nova senha",

            confirmPasswordPlaceholder:
                "Repita a nova senha",

            changePassword:
                "Alterar senha",
        },

        feedback: {
            success: {
                profileUpdated:
                    "Informações pessoais atualizadas com sucesso.",

                passwordUpdated:
                    "Senha alterada com sucesso.",

                avatarUpdated:
                    "Foto de perfil atualizada com sucesso.",

                avatarRemoved:
                    "Foto de perfil removida com sucesso.",

                changesSaved:
                    "Alterações salvas com sucesso.",
            },

            error: {
                nameRequired:
                    "Informe seu nome.",

                passwordTooShort:
                    "A nova senha deve possuir pelo menos 8 caracteres.",

                passwordsDoNotMatch:
                    "As senhas não coincidem.",

                avatarRequired:
                    "Selecione uma imagem.",

                avatarTooLarge:
                    "A imagem deve possuir no máximo 5 MB.",

                invalidAvatarType:
                    "Utilize uma imagem JPG, PNG ou WEBP.",

                profileUpdateFailed:
                    "Não foi possível atualizar suas informações. Tente novamente.",

                passwordUpdateFailed:
                    "Não foi possível alterar sua senha. Tente novamente.",

                avatarUploadFailed:
                    "Não foi possível atualizar sua foto de perfil. Tente novamente.",

                avatarRemoveFailed:
                    "Não foi possível remover sua foto de perfil. Tente novamente.",

                unexpected:
                    "Não foi possível concluir a operação. Tente novamente.",
            },
        },
    },

    services: {
        eyebrow: "Gestão",

        title: "Serviços",

        description:
            "Gerencie as atividades e serviços oferecidos pela sua organização.",

        service: "Serviço",

        new: "Novo serviço",
        edit: "Editar serviço",

        name: "Nome",
        serviceDescription: "Descrição",

        namePlaceholder:
            "Ex.: Tênis",

        descriptionPlaceholder:
            "Ex.: Aulas individuais e em grupo",

        duration: "Duração padrão",

        durationHelp:
            "Usada como sugestão ao criar um compromisso.",

        price: "Preço padrão",

        priceHelp:
            "Referência comercial. Não depende da duração.",

        minutes: "min",

        active: "Ativo",
        inactive: "Inativo",

        activate: "Reativar",
        deactivate: "Desativar",

        editAction: "Editar",

        save: "Salvar alterações",
        create: "Criar serviço",
        cancel: "Cancelar",
        saving: "Salvando...",

        noPrice: "Não definido",

        modalDescription:
            "Duração e preço são independentes e poderão ser personalizados posteriormente.",

        close: "Fechar",

        filters: {
            name: "Serviço",

            namePlaceholder:
                "Buscar por nome ou descrição",

            duration: "Duração",
            allDurations: "Todas",

            minPrice: "Preço mínimo",
            maxPrice: "Preço máximo",

            minPricePlaceholder: "0,00",
            maxPricePlaceholder: "0,00",

            status: "Status",

            allStatuses: "Todos",
            active: "Ativos",
            inactive: "Inativos",

            clear: "Limpar filtros",

            noResults:
                "Nenhum serviço encontrado com os filtros selecionados.",
        },

        table: {
            name: "Serviço",
            description: "Descrição",
            duration: "Duração",
            price: "Preço padrão",
            status: "Status",
            actions: "Ações",
        },

        empty: {
            title: "Nenhum serviço cadastrado",

            description:
                "Cadastre seu primeiro serviço para começar a organizar seus atendimentos.",

            action: "Adicionar serviço",
        },

        confirmation: {
            deactivateTitle:
                "Desativar serviço?",

            deactivateDescription:
                'Tem certeza de que deseja desativar o serviço "{name}"? O cadastro será mantido e poderá ser reativado posteriormente.',

            confirmDeactivate:
                "Desativar serviço",

            deactivating:
                "Desativando...",
        },

        validation: {
            nameRequired:
                "Informe o nome do serviço.",

            invalidDuration:
                "Informe uma duração válida.",

            invalidPrice:
                "Informe um preço válido.",
        },

        feedback: {
            success: {
                serviceCreated:
                    "Serviço cadastrado com sucesso.",

                serviceUpdated:
                    "Serviço atualizado com sucesso.",

                serviceDeactivated:
                    "Serviço desativado com sucesso.",

                serviceReactivated:
                    "Serviço reativado com sucesso.",
            },

            error: {
                saveFailed:
                    "Não foi possível salvar o serviço.",

                statusUpdateFailed:
                    "Não foi possível alterar o status do serviço.",

                duplicateName:
                    "Já existe um serviço com este nome.",

                unexpected:
                    "Não foi possível concluir a operação.",
            },
        },
    },


    accessibility: {
    mainNavigation: "Navegação principal",
    lightTheme: "Ativar tema claro",
    darkTheme: "Ativar tema escuro",
    changeLanguage: "Alterar idioma",
},
} as const;