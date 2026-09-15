
export const ptBR = {
    common: {
        appName: "Courtly",
        appDescription: "Management Platform",

        owner: "Proprietário",
        admin: "Administrador",
        professional: "Profissional",
        customer: "Cliente",
        user: "Usuário",

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
        customers: "Clientes",
        services: "Serviços",
        scheduling: "Agenda",
        attendance: "Presenças",
        makeups: "Reposições",
        payments: "Pagamentos",
        financial: "Financeiro",
        professionals: "Profissionais",
        organization: "Organização",

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
        eyebrow:
            "Gestão",

        title:
            "Clientes",

        description:
            "Gerencie os clientes da sua organização.",

        newCustomer:
            "Novo cliente",

        customer:
            "Cliente",

        notProvided:
            "Não informado",

        table: {
            name:
                "Nome",

            documentType:
                "Tipo de documento",

            documentNumber:
                "Documento",

            email:
                "E-mail",

            phone:
                "Telefone",

            plans:
                "Planos / Serviços",

            status:
                "Status",

            actions:
                "Ações",
        },

        plans: {
            none:
                "Nenhum plano ativo",

            activeSingular:
                "{count} plano ativo",

            activePlural:
                "{count} planos ativos",

            view:
                "Ver planos",

            more:
                "+{count} mais",
        },

        filters: {
            name:
                "Nome",

            namePlaceholder:
                "Buscar por nome",

            documentType:
                "Tipo de documento",

            allDocumentTypes:
                "Todos",

            documentNumber:
                "Número do documento",

            documentNumberPlaceholder:
                "Buscar documento",

            status:
                "Status",

            allStatuses:
                "Todos",

            active:
                "Ativos",

            inactive:
                "Inativos",

            clear:
                "Limpar filtros",

            noResults:
                "Nenhum cliente encontrado com os filtros selecionados.",
        },

        status: {
            active:
                "Ativo",

            inactive:
                "Inativo",
        },

        actions: {
            edit:
                "Editar",

            deactivate:
                "Desativar",

            reactivate:
                "Reativar",
        },

        empty: {
            title:
                "Nenhum cliente cadastrado",

            description:
                "Cadastre seu primeiro cliente para começar a organizar suas atividades.",

            action:
                "Adicionar cliente",
        },

        confirmation: {
            deactivateTitle:
                "Desativar cliente?",

            deactivateDescription:
                'Deseja desativar o cliente "{name}"? Todos os planos e serviços ativos ou pausados serão encerrados. O cadastro e o histórico comercial serão preservados.',

            confirmDeactivate:
                "Desativar cliente",

            deactivating:
                "Desativando...",
        },

        feedback: {
            success: {
                customerCreated:
                    "Cliente cadastrado com sucesso.",

                customerUpdated:
                    "Cliente atualizado com sucesso.",

                customerDeactivated:
                    "Cliente desativado com sucesso. Contratos encerrados: {count}.",

                customerReactivated:
                    "Cliente reativado com sucesso. Os contratos anteriores permanecem encerrados.",
            },

            error: {
                nameRequired:
                    "O nome do cliente é obrigatório.",

                invalidDocumentType:
                    "Selecione um tipo de documento válido.",

                invalidDocument:
                    "Documento inválido. Verifique o CPF informado.",

                invalidData:
                    "Verifique os dados informados e tente novamente.",

                organizationNotFound:
                    "Não foi possível identificar sua organização.",

                createFailed:
                    "Não foi possível cadastrar o cliente. Tente novamente.",

                updateFailed:
                    "Não foi possível atualizar o cliente. Tente novamente.",

                forbidden:
                    "Você não possui permissão para alterar o status deste cliente.",

                statusUpdateFailed:
                    "Não foi possível alterar o status do cliente. Nenhuma alteração comercial foi concluída.",
            },
        },

        form: {
            createTitle:
                "Novo cliente",

            editTitle:
                "Editar cliente",

            name:
                "Nome",

            documentType:
                "Tipo de documento",

            documentNumber:
                "Número do documento",

            email:
                "E-mail",

            phone:
                "Telefone",

            birthDate:
                "Data de nascimento",

            notes:
                "Observações",

            create:
                "Cadastrar cliente",

            save:
                "Salvar alterações",

            back:
                "Voltar para clientes",
        },
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
            customer: "Cliente",
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


    scheduling: {
            mode: "Uso da agenda",
            modeHelp: "Define se este serviço utiliza agendamento.",
            professional: "Profissional",
            resource: "Recurso físico",
            resourceHelp: "Define se o serviço consome capacidade física. Configure abaixo os tipos e a quantidade por agendamento.",
            none: "Não necessário",
            optional: "Opcional",
            required: "Obrigatório",
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

    professionals: {
        eyebrow: "Equipe", title: "Profissionais", description: "Gerencie profissionais, especialidades, serviços habilitados e acessos ao COURTLY.", notProvided: "Não informado",
        tabs: { label: "Seções de profissionais", professionals: "Profissionais", specialties: "Especialidades" },
        actions: { new: "Novo profissional", edit: "Editar", access: "Acesso", disable: "Desabilitar", enable: "Habilitar", save: "Salvar", cancel: "Cancelar", addRegistration: "Adicionar registro" },
        status: { active: "Ativo", inactive: "Inativo" }, summary: { all: "Todos", active: "Ativos", inactive: "Inativos" },
        list: { professional: "Profissional", specialty: "Especialidade", document: "Documento", phone: "Telefone", privilege: "Privilégio", status: "Status", actions: "Ações" },
        filters: { search: "Buscar", searchPlaceholder: "Nome, registro ou documento", status: "Status", specialty: "Especialidade", registrationAuthority: "Entidade de registro", registrationNumber: "Número de registro", all: "Todos", clear: "Limpar filtros", noResults: "Nenhum profissional encontrado com os filtros selecionados." },
        fields: { firstName: "Nome", lastName: "Sobrenome", preferredName: "Nome preferido", jobTitle: "Cargo / profissão", email: "E-mail", phone: "Telefone", country: "País", birthDate: "Data de nascimento", age: "Idade", documentType: "Tipo de documento", documentNumber: "Número do documento", specialties: "Especialidades", services: "Serviços habilitados", registrations: "Registros profissionais", registrationAuthority: "Entidade (CRO, CRM, CREA, CREF...)", registrationNumber: "Número do registro", registrationRegion: "UF / Região", notes: "Observações internas", availability: "Disponibilidade semanal" },
        weekdays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], form: { newTitle: "Cadastrar profissional", editTitle: "Editar profissional" },
        avatar: { change: "Alterar foto", remove: "Remover foto", invalid: "Utilize uma imagem JPG, PNG ou WEBP." },
        access: { title: "Acesso ao COURTLY", description: "O acesso é opcional. Defina o nível e os privilégios somente quando este profissional precisar entrar no sistema.", level: "Nível de acesso", invite: "Enviar convite", noAccess: "SEM ACESSO" },
        availability: { help: "Um profissional pode ter mais de um intervalo no mesmo dia. Ex.: 08:00–10:00 e 14:00–18:00.", addInterval: "Adicionar intervalo", removeInterval: "Remover intervalo", available: "Disponível", unavailable: "Indisponível" },
        specialtyAreas: { HEALTHCARE: "Saúde", DENTISTRY: "Odontologia", FITNESS: "Fitness", SPORTS: "Esportes", THERAPY: "Terapias", BEAUTY: "Beleza", WELLNESS: "Bem-estar", EDUCATION: "Educação", OTHER: "Outros" },
        specialties: {
            eyebrow: "Catálogo profissional", title: "Especialidades", description: "Cadastre especialidades com área e cor. A cor poderá ser reutilizada na Agenda e em gráficos para identificar rapidamente cada especialidade.",
            actions: { new: "Nova especialidade" }, fields: { name: "Nome da especialidade", area: "Área da especialidade", color: "Cor", colorHelp: "Escolha uma cor de identificação para uso futuro na agenda e nos relatórios." },
            filters: { search: "Buscar", searchPlaceholder: "Buscar especialidade", noResults: "Nenhuma especialidade encontrada com os filtros selecionados." },
            list: { specialty: "Especialidade", area: "Área", color: "Cor", professionals: "Profissionais vinculados" }, form: { newTitle: "Cadastrar especialidade", editTitle: "Editar especialidade" },
            feedback: { saved: "Especialidade salva com sucesso.", saveFailed: "Não foi possível salvar a especialidade.", duplicate: "Já existe uma especialidade com este nome.", statusSaved: "Status da especialidade atualizado com sucesso.", statusFailed: "Não foi possível alterar o status da especialidade." }
        },
        deactivate: { title: "Desabilitar profissional", description: "{name} será marcado como inativo. Se houver compromissos futuros, você pode selecionar um profissional disponível para assumir os atendimentos compatíveis. O histórico será preservado.", replacement: "Profissional substituto", noReplacement: "Manter compromissos para tratamento posterior" },
        feedback: { saved: "Profissional salvo com sucesso.", saveFailed: "Não foi possível salvar o profissional.", invalidAvailability: "Revise os horários: os intervalos do mesmo dia não podem se sobrepor e o horário final deve ser posterior ao inicial.", disabled: "Profissional desabilitado com sucesso.", disabledWithAppointments: "Profissional desabilitado. Existem {count} compromissos futuros que precisam ser acompanhados.", statusFailed: "Não foi possível alterar o status do profissional.", reassignFailed: "Nem todos os compromissos puderam ser transferidos. Verifique disponibilidade e serviços habilitados.", invited: "Convite de acesso enviado com sucesso.", inviteFailed: "Não foi possível enviar o convite de acesso.", accessSaved: "Privilégios atualizados com sucesso.", accessFailed: "Não foi possível atualizar os privilégios." },
    },

    scheduling: {
        eyebrow: "Operação",
        title: "Agenda",
        description: "Gerencie compromissos, recorrências, profissionais, recursos e disponibilidade da organização.",
        tabs: { label: "Seções da agenda", calendar: "Calendário", recurrences: "Recorrências", resources: "Recursos", professionals: "Profissionais", settings: "Configurações" },
        views: { day: "Dia", week: "Semana", month: "Mês" },
        actions: {
            newAppointment: "Novo compromisso", newRecurrence: "Nova recorrência",
            createAppointment: "Criar compromisso", createRecurrence: "Criar recorrência",
            cancelAppointment: "Cancelar", save: "Salvar", saving: "Salvando...", cancel: "Voltar", close: "Fechar"
        },
        calendar: { previous: "Período anterior", next: "Próximo período", today: "Hoje", appointmentCount: "{count} compromisso(s)", free: "Sem compromissos", unknownCustomer: "Cliente", unknownService: "Serviço" },
        capacity: { available: "Disponível", busy: "Ocupado", unavailable: "Indisponível", ready: "Profissional e recursos selecionados estão livres neste horário.", resources: "Recursos", professionals: "Profissionais" },
        fields: { customer: "Cliente", service: "Serviço", date: "Data", startTime: "Início", endTime: "Fim", professional: "Profissional", resources: "Recursos", subscription: "Plano / serviço contratado", weekday: "Dia da semana", effectiveFrom: "Válido a partir de", effectiveUntil: "Válido até" },
        placeholders: { selectCustomer: "Selecione o cliente", selectService: "Selecione o serviço", noProfessional: "Sem profissional", selectSubscription: "Selecione um contrato ativo" },
        appointment: { title: "Novo compromisso", description: "Crie um atendimento avulso respeitando a disponibilidade operacional.", subscriptionTitle: "Vínculo comercial", withoutSubscription: "Sem vínculo com contrato", noSubscription: "Este cliente não possui um contrato ativo compatível. O compromisso pode ser criado sem vínculo comercial quando a operação permitir." },
        recurrence: { title: "Nova recorrência", description: "Crie uma regra semanal vinculada a um contrato ativo.", windowTitle: "Janela móvel", windowDescription: "Os próximos {days} dias são gerados imediatamente e o processo diário mantém essa janela sempre abastecida." },
        recurrences: { eyebrow: "Recorrência", title: "Regras recorrentes", description: "Gerencie horários semanais sem reescrever o histórico já gerado.", pause: "Pausar", resume: "Retomar", end: "Encerrar", empty: "Nenhuma recorrência cadastrada.", conflicts: "{count} ocorrência(s) não puderam ser geradas por conflito de capacidade." },
        ruleStatus: { active: "Ativa", paused: "Pausada", ended: "Encerrada" },
        resources: { eyebrow: "Capacidade", title: "Recursos", description: "Cadastre quadras, salas, consultórios e outros recursos físicos limitados.", new: "Novo recurso", newTitle: "Cadastrar recurso", newDescription: "Crie um recurso físico que poderá ser reservado pela Agenda.", type: "Tipo de recurso", typePlaceholder: "Ex.: Quadra de tênis", name: "Nome", namePlaceholder: "Ex.: Quadra 1", activate: "Ativar", deactivate: "Desativar", empty: "Nenhum recurso cadastrado.", requirementsTitle: "Requisitos por serviço", requirementsDescription: "Defina qual tipo e quantidade de recurso cada serviço exige.", selectType: "Selecione o tipo", requiredHelp: "Selecione todos os recursos obrigatórios para este serviço.", optionalHelp: "Você pode vincular recursos a este compromisso, mas eles não são obrigatórios." },
        professionals: { eyebrow: "Equipe", title: "Profissionais habilitados", description: "Defina quais profissionais podem executar cada serviço. A disponibilidade da agenda considera somente profissionais habilitados.", active: "Ativo", inactive: "Inativo", new: "Novo profissional", newTitle: "Cadastrar profissional", newDescription: "Cadastre um profissional da organização e depois habilite os serviços que ele pode executar.", name: "Nome", email: "E-mail", phone: "Telefone", create: "Cadastrar profissional" },
        settings: { eyebrow: "Políticas", title: "Configurações da agenda", description: "Parâmetros gerais da Agenda da organização.", windowTitle: "Janela de geração", windowHelp: "Quantidade de dias futuros mantidos automaticamente para regras recorrentes.", days: "dias" },
        status: { scheduled: "Agendado" },
        weekdays: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
        weekdaysShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
        feedback: {
            pastAppointment: "Não é permitido criar compromissos no passado.",
            invalidData: "Preencha os campos obrigatórios.", invalidInterval: "O horário final deve ser posterior ao horário inicial.", unavailable: "Não existe disponibilidade para esse atendimento no período selecionado.", professionalRequired: "Este serviço exige um profissional habilitado.", resourceRequired: "Este serviço exige os recursos configurados.", professionalUnavailable: "O profissional selecionado já está ocupado nesse horário.", resourceUnavailable: "Um dos recursos selecionados já está reservado nesse horário.", subscriptionInvalid: "O contrato selecionado não está ativo ou não é compatível com o serviço.", appointmentCreated: "Compromisso criado com sucesso.", recurrenceCreated: "Recorrência criada e janela futura gerada com sucesso.", appointmentCancelled: "Compromisso cancelado com sucesso.", cancelFailed: "Não foi possível cancelar o compromisso.", resourceUpdated: "Recurso atualizado com sucesso.", resourceFailed: "Não foi possível salvar o recurso.", requirementUpdated: "Requisito do serviço atualizado com sucesso.", requirementFailed: "Não foi possível atualizar o requisito do serviço.", qualificationUpdated: "Habilitação profissional atualizada com sucesso.", qualificationFailed: "Não foi possível atualizar a habilitação profissional.", settingsUpdated: "Configurações atualizadas e janela da agenda sincronizada.", settingsFailed: "Não foi possível atualizar as configurações.", professionalCreated: "Profissional cadastrado com sucesso.", professionalSaveFailed: "Não foi possível cadastrar o profissional.", ruleStatusUpdated: "Status da recorrência atualizado com sucesso.", ruleStatusFailed: "Não foi possível atualizar a recorrência."
        },
    },

    customerSubscriptions: {

        tabs: {
            personal:
                "Dados pessoais",

            services:
                "Planos / Serviços",
        },

        title:
            "Planos / Serviços",

        description:
            "Gerencie os serviços contratados por {name}.",

        service:
            "Serviço",

        unknownService:
            "Serviço indisponível",

        addService:
            "Adicionar serviço",

        selectService:
            "Selecione um serviço",

        amount:
            "Valor",

        currency:
            "Moeda",

        billingCycle:
            "Ciclo de cobrança",

        startsAt:
            "Início",

        endsAt:
            "Término",

        edit:
            "Editar",

        pause:
            "Pausar",

        resume:
            "Retomar",

        end:
            "Encerrar",

        add:
            "Adicionar",

        save:
            "Salvar alterações",

        saving:
            "Salvando...",

        cancel:
            "Cancelar",

        status: {
            active:
                "Ativo",

            paused:
                "Pausado",

            ended:
                "Encerrado",
        },

        reactivationNotice: {
            title:
                "Cliente inativo",

            description:
                "Ao adicionar um novo plano ou serviço, {name} será reativado automaticamente.",
        },

        cycles: {
            weekly:
                "Semanal",

            monthly:
                "Mensal",

            quarterly:
                "Trimestral",

            semiannual:
                "Semestral",

            annual:
                "Anual",

            oneTime:
                "Pagamento único",
        },

        modal: {
            eyebrow:
                "Contrato comercial",

            createTitle:
                "Adicionar serviço",

            editTitle:
                "Editar serviço do cliente",

            close:
                "Fechar",
        },

        empty: {
            title:
                "Nenhum serviço contratado",

            description:
                "Este cliente ainda não possui serviços vinculados.",

            action:
                "Adicionar serviço",
        },

        confirmation: {
            endTitle:
                "Encerrar serviço?",

            endDescription:
                "Deseja encerrar o serviço {service}? O histórico comercial será preservado.",

            confirmEnd:
                "Encerrar",

            ending:
                "Encerrando...",
        },

        feedback: {

            success: {
                created:
                    "Serviço vinculado ao cliente com sucesso.",

                updated:
                    "Serviço do cliente atualizado com sucesso.",

                paused:
                    "Serviço pausado com sucesso.",

                resumed:
                    "Serviço retomado com sucesso.",

                ended:
                    "Serviço encerrado com sucesso.",
                
                createdAndReactivated:
                    "Serviço vinculado com sucesso e cliente reativado automaticamente.",
            },

            error: {
                forbidden:
                    "Você não possui permissão para gerenciar os serviços deste cliente.",

                customerNotFound:
                    "Não foi possível localizar o cliente.",

                activityNotFound:
                    "Não foi possível localizar o serviço selecionado.",

                inactiveActivity:
                    "Não é possível contratar um serviço desativado.",

                duplicateOpenSubscription:
                    "Este cliente já possui este serviço ativo ou pausado.",

                endedImmutable:
                    "Um contrato encerrado não pode ser alterado. Crie um novo vínculo se o cliente retornar.",

                activityRequired:
                    "Selecione um serviço.",

                invalidAmount:
                    "Informe um valor válido.",

                startDateRequired:
                    "Informe a data de início.",

                invalidData:
                    "Verifique os dados informados.",

                saveFailed:
                    "Não foi possível vincular o serviço ao cliente.",

                statusUpdateFailed:
                    "Não foi possível alterar o status do serviço.",

                unexpected:
                    "Não foi possível concluir a operação. Tente novamente.",
            },
        },
    },


    financial: {
        eyebrow: "Gestão financeira",
        title: "Financeiro",
        description: "Acompanhe receitas, custos, lucro e a saúde financeira do seu negócio.",
        period: "Período",

        tabs: {
            overview: "Visão geral",
            revenues: "Receitas",
            expenses: "Custos",
            reports: "Relatórios",
        },

        cards: {
            mrr: "MRR",
            billedRevenue: "Faturamento",
            receivedRevenue: "Recebido",
            receivableRevenue: "A receber",
            expenses: "Custos pagos",
            netProfit: "Lucro líquido",
            margin: "Margem",
        },

        kpis: {
            activeCustomers: "Clientes com planos ativos",
            activeSubscriptions: "Assinaturas ativas",
            overdueRevenue: "Em atraso",
            totalExpenses: "Custos do período",
        },

        charts: {
            evolution: "Evolução financeira",
            categoryExpenses: "Custos por categoria",
            revenue: "Receitas",
            expenses: "Custos",
            profit: "Lucro",
            noData: "Ainda não há dados suficientes para este gráfico.",
        },

        revenues: {
            eyebrow: "Receita",
            title: "Receitas",
            description: "Cobranças geradas pelos planos dos clientes e receitas manuais.",
            newTitle: "Nova receita manual",
            editTitle: "Editar receita manual",
            newAction: "Nova receita",
            empty: "Nenhuma receita foi encontrada neste período.",
        },

        revenueFilters: {
            ariaLabel: "Filtros de receitas",
            customer: "Cliente",
            customerPlaceholder: "Buscar por nome ou documento",
            service: "Serviço",
            servicePlaceholder: "Buscar por serviço",
            documentType: "Tipo de documento",
            allDocumentTypes: "Todos",
            status: "Status",
            allStatuses: "Todos",
            dueDate: "Vencimento",
            sortBy: "Ordenar por",
            defaultSort: "Padrão",
            highestAmount: "Maior valor",
            newestReference: "Competência mais recente",
            oldestReference: "Competência mais antiga",
            statusSort: "Status",
            clear: "Limpar filtros",
            noResults: "Nenhuma receita encontrada com os filtros selecionados.",
        },

        expenses: {
            eyebrow: "Custo",
            title: "Custos",
            description: "Cadastre despesas avulsas ou recorrentes do negócio.",
            newTitle: "Novo custo",
            editTitle: "Editar custo",
            newAction: "Novo custo",
            recurring: "Este custo é recorrente",
            recurringBadge: "Recorrente",
            empty: "Nenhum custo foi encontrado neste período.",
        },

        reports: {
            title: "Relatórios",
            description: "Histórico consolidado dos últimos 12 meses na moeda padrão da organização.",
            period: "Período",
            hint: "Os relatórios históricos usam os lançamentos financeiros já materializados. Ao abrir um período, o Courtly sincroniza as cobranças e custos recorrentes daquele mês de forma idempotente.",
        },

        table: {
            description: "Descrição",
            customer: "Cliente",
            service: "Serviço",
            documentType: "Tipo de documento",
            documentNumber: "Número do documento",
            category: "Categoria",
            source: "Origem",
            referenceDate: "Competência",
            dueDate: "Vencimento",
            amount: "Valor",
            status: "Status",
            actions: "Ações",
        },

        fields: {
            description: "Descrição",
            category: "Categoria",
            amount: "Valor",
            currency: "Moeda",
            referenceDate: "Data de competência",
            dueDate: "Vencimento",
            recurrence: "Recorrência",
            notes: "Observações",
        },

        status: {
            pending: "Pendente",
            paid: "Pago",
            overdue: "Em atraso",
            cancelled: "Cancelado",
        },

        sources: {
            subscription: "Plano do cliente",
            manual: "Manual",
        },

        cycles: {
            weekly: "Semanal",
            monthly: "Mensal",
            quarterly: "Trimestral",
            semiannual: "Semestral",
            annual: "Anual",
        },

        actions: {
            save: "Salvar",
            saving: "Salvando...",
            cancel: "Cancelar",
            close: "Fechar",
            edit: "Editar",
            markPaid: "Marcar como pago",
            markPending: "Voltar para pendente",
            cancelEntry: "Cancelar lançamento",
            sync: "Sincronizar período",
            syncing: "Sincronizando...",
        },

        categoryNames: {
            RENT: "Aluguel",
            STAFF: "Funcionários",
            PROFESSIONALS: "Profissionais",
            ENERGY: "Energia",
            WATER: "Água",
            INTERNET: "Internet",
            MARKETING: "Marketing",
            SOFTWARE: "Software",
            EQUIPMENT: "Equipamentos",
            MAINTENANCE: "Manutenção",
            TAXES: "Impostos",
            ACCOUNTING: "Contabilidade",
            OTHER: "Outros",
        },

        feedback: {
            success: {
                synced: "Período financeiro sincronizado com sucesso.",
                statusUpdated: "Status financeiro atualizado com sucesso.",
            },
            error: {
                forbidden: "Apenas o proprietário da organização pode acessar e alterar dados financeiros.",
                invalidData: "Verifique os dados informados.",
                duplicateCategory: "Já existe uma categoria com este nome.",
                saveFailed: "Não foi possível salvar o lançamento financeiro.",
                statusUpdateFailed: "Não foi possível alterar o status do lançamento.",
                syncFailed: "Não foi possível sincronizar o período financeiro.",
            },
        },

        accessibility: {
            sections: "Seções do financeiro",
        },

        confirmation: {
            markPaidTitle: "Confirmar pagamento",
            markPaidDescription: "Deseja marcar como paga a receita de {customer}, documento {document}, referente ao serviço {service}, no valor de {amount}?",
            cancelTitle: "Cancelar lançamento",
            cancelDescription: "Deseja cancelar a receita de {customer}, documento {document}, referente ao serviço {service}, no valor de {amount}? Esta ação altera o status financeiro do lançamento.",
            confirmPaid: "Marcar como pago",
            confirmCancel: "Cancelar lançamento",
            goBack: "Voltar",
            unknownCustomer: "Cliente não identificado",
            documentNotProvided: "não informado",
            serviceNotProvided: "não informado",
        },
    },



    dashboard: {
        title: "Visão geral",
        description: "Acompanhe sua operação em um só lugar.",
        cards: {
            activeCustomers: "Clientes ativos",
            todayAppointments: "Aulas hoje",
            attendance: "Presenças",
            makeups: "Reposições",
        },
        upcomingTitle: "Próximas aulas",
        upcomingDescription: "Sua agenda aparecerá aqui.",
        summaryTitle: "Resumo",
        summaryDescription: "Os indicadores da operação aparecerão aqui.",
    },

    authLayout: {
        headline: "Gestão que acompanha o seu movimento.",
        description: "Organize clientes, profissionais, agenda, presença e pagamentos em um único lugar.",
    },

    auth: {
        fields: {
            fullName: "Seu nome",
            email: "E-mail",
            password: "Senha",
            confirmPassword: "Confirmar senha",
            newPassword: "Nova senha",
            confirmNewPassword: "Confirmar nova senha",
        },
        placeholders: {
            email: "voce@exemplo.com",
            password: "Sua senha",
        },
        login: {
            eyebrow: "BEM-VINDO",
            title: "Entrar no Courtly",
            description: "Acesse sua organização e continue de onde parou.",
            passwordUpdated: "Senha atualizada. Você já pode entrar novamente.",
            forgotPassword: "Esqueci minha senha",
            submit: "Entrar",
            newOrganization: "NOVA ORGANIZAÇÃO",
            createPrompt: "Quer administrar seu próprio espaço no Courtly?",
            createOrganization: "Criar organização",
            customerNote: "É cliente? Utilize o acesso fornecido pela sua organização.",
        },
        signup: {
            eyebrow: "PARA GESTORES",
            title: "Crie sua organização",
            description: "Sua conta será a responsável pela nova organização e terá o papel de proprietário.",
            ownerNoticeTitle: "Este cadastro não é destinado a clientes.",
            ownerNoticeDescription: "Profissionais e clientes serão vinculados posteriormente à organização por fluxos específicos.",
            submit: "Continuar",
            haveAccount: "Já possui uma conta?",
            signIn: "Entrar",
        },
        forgot: {
            eyebrow: "RECUPERAÇÃO",
            title: "Esqueceu sua senha?",
            description: "Informe seu e-mail. Enviaremos as instruções para definir uma nova senha.",
            success: "Se existir uma conta associada a esse e-mail, você receberá as instruções de recuperação.",
            backToLogin: "Voltar para o login",
            submit: "Enviar recuperação",
            back: "Voltar para entrar",
        },
        reset: {
            eyebrow: "SEGURANÇA",
            title: "Defina sua nova senha",
            description: "Utilize pelo menos 8 caracteres.",
            submit: "Atualizar senha",
        },
        errors: {
            requiredFields: "Preencha todos os campos obrigatórios.",
            passwordTooShort: "A senha deve possuir pelo menos 8 caracteres.",
            passwordsDoNotMatch: "As senhas não coincidem.",
            authUnavailable: "Não foi possível acessar o serviço de autenticação. Tente novamente em instantes.",
            signUpFailed: "Não foi possível criar sua conta.",
            invalidCredentials: "E-mail ou senha inválidos.",
            membershipFailed: "Não foi possível identificar sua organização.",
            emailRequired: "Informe seu e-mail.",
            passwordResetFailed: "Não foi possível enviar a recuperação de senha.",
            passwordUpdateFailed: "Não foi possível atualizar a senha.",
            sessionExpired: "Sua sessão expirou. Entre novamente.",
            invalidInvite: "O convite é inválido ou está incompleto.",
            expiredInvite: "O convite expirou ou já foi utilizado.",
            unexpected: "Não foi possível concluir a operação.",
        },
    },

    organizations: {
        onboarding: {
            brandTitle: "Seu negócio. Sua identidade. Uma plataforma.",
            brandDescription: "Configure seu tenant para operar com idioma, moeda, fuso horário e identidade próprios.",
            eyebrow: "CONFIGURAÇÃO INICIAL",
            title: "Configure sua organização",
            greeting: "Olá, {name}. Vamos preparar o Courtly para o seu negócio.",
            progressLabel: "Etapas da criação da organização",
            steps: ["Empresa", "Região", "Contato", "Identidade"],
        },
        settings: {
            eyebrow: "TENANT",
            title: "Organização",
            description: "Gerencie identidade, regionalização, contatos e preparação para recursos premium do seu tenant.",
        },
        sections: {
            identity: { title: "Identidade do negócio", description: "Dados que identificam sua organização dentro do Courtly." },
            regional: { title: "Regionalização", description: "País, fuso horário, idioma, moeda e registro fiscal sem regras específicas de um único país." },
            contact: { title: "Contato e endereço", description: "Informações usadas em comunicações e operações da organização." },
            branding: { title: "Identidade visual", description: "Defina as cores base do tenant mantendo a experiência Courtly." },
            enterprise: { title: "Domínios personalizados", description: "A estrutura já fica preparada para custom domain e custom email domain em planos futuros." },
        },
        fields: {
            displayName: "Nome do negócio",
            legalName: "Razão social / nome legal",
            businessType: "Tipo de negócio",
            slug: "Identificador do tenant (slug)",
            country: "País (ISO 2 letras)",
            timezone: "Fuso horário",
            defaultLocale: "Idioma padrão",
            currency: "Moeda (ISO 4217)",
            registrationType: "Tipo de registro fiscal",
            registrationNumber: "Número de registro",
            contactEmail: "E-mail de contato",
            replyToEmail: "E-mail para respostas",
            phoneCountryCode: "Código internacional",
            phone: "Telefone",
            website: "Website",
            addressLine1: "Endereço - linha 1",
            addressLine2: "Endereço - linha 2",
            city: "Cidade",
            region: "Estado / região",
            postalCode: "Código postal",
            primaryColor: "Cor principal",
            secondaryColor: "Cor secundária",
            customDomain: "Domínio personalizado",
            customEmailDomain: "Domínio de e-mail personalizado",
        },
        help: {
            slug: "Será usado futuramente em subdomínios como seu-negocio.courtly.com.",
            country: "Aceita qualquer código ISO 3166-1 alpha-2, por exemplo BR, US, PT ou GB.",
        },
        businessTypes: {
            ACADEMY: "Academia / escola",
            CLUB: "Clube / arena",
            STUDIO: "Estúdio",
            INDEPENDENT_PROFESSIONAL: "Profissional autônomo",
            CLINIC: "Clínica / consultório",
            OTHER: "Outro",
        },
        domainStatuses: {
            NOT_CONFIGURED: "Não configurado",
            PENDING: "Pendente",
            VERIFIED: "Verificado",
            FAILED: "Falhou",
        },
        future: {
            title: "Preparado para crescer",
            description: "Domínios customizados, domínio próprio de e-mail, white-label e infraestrutura dedicada ficam preparados no modelo, mas sem custo operacional agora.",
            items: "Custom domain • Custom email domain • Dedicated tenant",
            notConfigured: "Não configurado",
        },
        actions: { back: "Voltar", continue: "Continuar", create: "Criar organização", save: "Salvar organização" },
        feedback: { updated: "Organização atualizada com sucesso." },
        errors: {
            professionalNameRequired: "Informe o seu nome.",
            displayNameRequired: "Informe o nome do negócio.",
            businessTypeInvalid: "Selecione um tipo de negócio válido.",
            countryInvalid: "Informe um código de país válido com 2 letras.",
            timezoneInvalid: "Informe um fuso horário IANA válido.",
            localeInvalid: "Selecione um idioma suportado.",
            currencyInvalid: "Informe um código de moeda ISO válido com 3 letras.",
            slugInvalid: "Informe um identificador válido para o tenant.",
            slugAlreadyUsed: "Este identificador já está em uso. Escolha outro.",
            colorInvalid: "Informe cores válidas no formato hexadecimal.",
            createFailed: "Não foi possível criar sua organização.",
            updateFailed: "Não foi possível atualizar sua organização.",
            forbidden: "Apenas o proprietário pode alterar estas configurações.",
            invalidData: "Revise os dados informados e tente novamente.",
        },
    },

    accessibility: {
    mainNavigation: "Navegação principal",
    lightTheme: "Ativar tema claro",
    darkTheme: "Ativar tema escuro",
    changeLanguage: "Alterar idioma",
    closeMenu: "Fechar menu",
    openMenu: "Abrir menu",
    openUserMenu: "Abrir menu do usuário",
    close: "Fechar",
},
} as const;
