# Arquitetura atual — baseline 2026-10-13

Fonte: archive courtlyWithoutNodeModules.zip. Este documento descreve arquivos
recebidos, sem afirmar o estado de um banco remoto ou deploy.

## Stack e execução

Next.js 16.3.4 App Router, React/React DOM 19.2.8, TypeScript strict,
Supabase SSR ^0.12.7 / JS ^2.116.0, Zod ^4.6.1, Tailwind/PostCSS 4,
ESLint 9 e Supabase CLI como devDependency. Dependências declaradas em
package.json; lockfile determina instalação. npm scripts: dev/build/start/lint.
Não há runner de testes configurado no pacote recebido.

## Fluxo

Server pages montam dados/contexto e renderizam componentes de módulo.
UI interativa chama Server Actions. Actions resolvem sessão, validam input,
checagem de acesso e chamam casos de uso/adaptadores ou RPC. PostgreSQL
concentra regras transacionais, constraints, triggers, RLS e alocação.
Após mutations, actions usam revalidatePath e UI pode renovar listagens.

## Camadas observadas

| Área | Estrutura e responsabilidade |
| --- | --- |
| activities | application/domain/infrastructure/ui; “serviços” na UI |
| customer-subscriptions | casos de uso, schema, contratos e adaptador de assinaturas |
| financial | schemas/actions/page-data; repositório; dashboard, relatórios e modais |
| professionals | contratos, actions, adaptador e UI; especialidades, acesso e exceções |
| resources | tipos, recursos e pools; parte da interface aparece em serviços |
| scheduling | agenda, regras, recursos, grupos e pagamentos; RPCs fazem operações críticas |
| attendance | actions/UI; presenças e reagendamento, sem quatro camadas completas |
| customers | actions/queries/types/validation/components/documents; estrutura legada |
| auth | actions/queries/components; Supabase Auth e perfil/avatar |
| organizations | actions/options/UI; onboarding e configuração internacional |
| shared | clientes Supabase, sessão/permissões, i18n, tema, layout e paginação |

Clean Architecture é direção obrigatória para novas fronteiras, não uma
alegação de conformidade integral do legado. Algumas actions consultam tabelas
diretamente; `shared/pagination/contracts.ts` depende de tipo da UI de presenças.
Corrigir fronteiras quando a tarefa exigir, sem reescrever tudo.

## Rotas

`src/app/(auth)` contém login, signup, onboarding, forgot-password,
reset-password e confirmação (`confirm/route.ts`). `src/app/(app)` contém
customers (new/edit), services, professionals, scheduling, attendance,
financial, organization, profile e dashboard. Grupos entre parênteses não
fazem parte da URL. O dashboard recebido é curto e não comprova dashboard
individual completo com notas/planejamento. Não reconstruir funcionalidades
somente a partir de pedidos anteriores.

## Infraestrutura transversal

- server.ts: cookies SSR e config pública Supabase; client.ts: navegador.
- admin.ts: service role no servidor para convites; módulo exige proteção de fronteira.
- permissions.ts: membership, get_my_permissions e can; OWNER é permitido em can.
- Contextos comercial/financeiro mantêm checks por papel, além de RBAC granular.
- Providers combina tema/idioma; dictionaries pt-BR/en-US e cookie de locale.
- globals.css é extenso; módulos de agenda/financeiro/profissionais usam CSS Modules.
- database.types.ts é gerado e pode divergir de migrations recentes; validar ao modificar.

## Escala e paginação

Oito listagens usam `courtly_page_ids` → hidratação por IDs → hook/client.
Agenda carrega compromissos entre aproximadamente -60/+180 dias, mas vários
lookups e associações ainda são carregados integralmente. Financeiro usa RPCs
para receitas agregadas/MRR; não implica paginação de todas as coleções.
Consultar [contratos](domain-contracts.md) e [pendências](review.md).

## Localização

Usar [mapa completo](repository-map.md) para arquivos, exports, tabelas e RPCs.
Usar [contratos SQL](database-contracts.md) antes de alterar banco. A sequência
de migrations, não apenas o primeiro arquivo de uma função, define o contrato.
