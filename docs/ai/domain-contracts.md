# Contratos de domínio e listagens

## Serviços e recursos

`activities` representa serviços. Modos de agendamento e exigência de
profissional/recurso: NONE/OPTIONAL/REQUIRED. Atendimento:
INDIVIDUAL/GROUP/FLEXIBLE. Campos incluem duração, preço, especialidade,
maxParticipants e sessionsPerWeek. Recursos possuem tipos; pools agrupam
recursos elegíveis; requisitos de atividade referenciam pools/quantidade.
Não substituir alocação autoritativa por escolha livre da UI.

## Profissionais e acesso

Profissionais têm especialidades, qualificações por atividade, registros,
vínculo de membership/acesso, disponibilidade semanal e exceções PRESENCE/ABSENCE.
Preservar status/inativação e regras para compromissos futuros/reassignment.
Papéis: OWNER, ADMIN, PROFESSIONAL, CUSTOMER. Permissions e overrides são
adicionais; conferir Rules/security.md e SQL. “Admin pode tudo” não é contrato.

## Agenda e grupos

Compromisso: SCHEDULED/CANCELLED/COMPLETED; origem:
RECURRENCE/MANUAL/MAKEUP/RESCHEDULE. `customer_id` permanece compatibilidade
legada; `appointment_participants` é a associação de grupo. Validar clientes
únicos, ativos, do tenant, capacidade e atendimento individual.
Presença individual permite PENDING/CONFIRMED/ABSENT/CANCELLED; não é igual
à presença legada do compromisso (PENDING/CONFIRMED/CANCELLED no tipo atual).
`participant_status` ACTIVE/CANCELLED é separado de attendance_status.
Mudança de presença não deve ser assumida como liberação automática da vaga.

Criar grupo delega `create_group_scheduling_appointment` ao RPC individual
existente; a migration corretiva faz cast para `public.appointment_source`.
Não reintroduzir incompatibilidade text/enum.

Disponibilidade deve considerar habilitação do serviço/agenda, duração,
qualificações, janela semanal, exceções, pools e conflitos. Preview de
reagendamento usa subtransação revertida; gravação final precisa validar outra
vez. Preview positivo não reserva vaga contra concorrência.

## Recorrência e contrato

Schedule rules: ACTIVE/PAUSED/ENDED, weekdays 0–6, período efetivo e contrato.
`create_weekly_scheduling_rules` cria regras para dias selecionados; o adaptador
atual retorna apenas o primeiro ID à action. Avaliar callers antes de mudar retorno.
Pausas/reativações/cancelamentos e geração de janela têm triggers/RPCs existentes.
Manter geração idempotente, vínculo do contrato e registro de conflitos.

## Financeiro e pagamento

Receitas, despesas, categorias, recorrências, períodos e contratos são distintos
dos campos payment_status/paid_at/paid_amount do compromisso. O RPC atual de
baixa atualiza o compromisso; não afirmar que lança receita no financeiro sem
confirmar integração. Status financeiros, moeda e competência precisam manter
semântica do schema. Totais e MRR devem respeitar moeda e filtros globais.

## Paginação server-side

| Módulo | Permissão de entrada | Filtros SQL atuais relevantes |
| --- | --- | --- |
| customers | CUSTOMERS_VIEW | name, documentType, documentNumber, status |
| services | SERVICES_VIEW | search, status, duration, minPrice, maxPrice |
| professionals | PROFESSIONALS_VIEW | search, status, docType/docNumber, specialty, regAuthority/regNumber |
| specialties | PROFESSIONALS_VIEW | search, status, area |
| exceptions | PROFESSIONALS_VIEW | professionalId |
| rules | SCHEDULING_VIEW_ALL ou SCHEDULING_VIEW_OWN | tenant; escopo próprio requer conferir RLS |
| attendance | ATTENDANCE_VIEW | search, status, start, end |
| revenues | FINANCIAL_VIEW | start/end, customer, service, documentType, status, dueDate, sort; currency nos totais |

`PaginationParams`: page a partir de 1; pageSize 10/20/50/100, fallback 10.
`PaginatedResult`: items,total,totalPages,page,pageSize,revenueTotals opcional.
Banco limita página ao total e retorna IDs ordenados com desempate por ID.
Action autentica, normaliza parâmetros, limita strings de filtros a 500 chars,
hidrata só os IDs da página e restaura sua ordem. Não criar caminho que
carregue todas as linhas para fazer slice no React.

Busca normaliza caixa/acentos via courtly_search_text. Serviços/especialidades
têm prioridade por correspondência exata, com diferenças atuais de escopo dos
filtros; revisar antes de generalizar. Totais de receitas usam conjunto filtrado
com moeda, e nunca apenas soma dos items visíveis.

Hook tem debounce de 250 ms, deduplicação de requisições em voo, proteção de
resposta obsoleta, retry e scope. Após mutation, preservar revisão/refresh e
página válida. Escopos guardam página/tamanho; mudança de filtro com scope pode
reutilizar página, não há reset universal garantido. Testar comportamento desejado.
