# Courtly — instruções para agentes

## Leitura obrigatória em cada tarefa

1. Ler este arquivo e [Rules](Rules/README.md).
2. Ler as regras sempre carregadas: [globais](Rules/global.md), [convenções](Rules/conventions.md), [segurança](Rules/security.md) e [manutenção](Rules/documentation.md).
3. Ler [arquitetura](docs/ai/architecture.md) ao iniciar uma sessão ou quando a arquitetura mudar; localizar os arquivos pelo [mapa](docs/ai/repository-map.md).
4. Antes de editar, carregar a skill aplicável da tabela abaixo e qualquer `AGENTS.md` mais próximo dos arquivos envolvidos.
5. Conferir o código atual: os documentos são orientação, não substituem contratos ou migrations efetivas.

## Contexto e padrões obrigatórios

Courtly é um SaaS multi-tenant genérico de serviços, clientes, profissionais,
recursos, agenda, contratos e financeiro. Não especializar o núcleo para tênis
ou um nicho sem requisito explícito. A base recebida usa Next.js 16.3.4,
React 19.2.8, TypeScript strict, Supabase SSR/PostgreSQL, Zod e Tailwind 4.
Confirmar versões no `package.json` e lockfile antes de usar APIs.

- Components must be functional. Usar componentes React funcionais e hooks.
- Follow Clean Architecture nas novas fronteiras: domínio independente, casos de uso,
  adaptadores Supabase e UI. Respeitar módulos legados sem reescrita indiscriminada.
- Server Components por padrão; `"use client"` somente para interação necessária.
- Validar entradas e autorização no servidor; manter isolamento por organização também no banco.
- Reutilizar contratos existentes; evitar novos `any`, casts para esconder erros e duplicação de regras SQL.
- Traduzir textos novos em pt-BR e en-US; preservar temas claro/escuro e responsividade.
- Paginar listagens crescentes no banco; totais e KPIs abrangem o conjunto filtrado.
- Atualizar documentação afetada na mesma entrega e verificar o limite de 500 linhas por skill.

## Skills locais sob demanda

| Gatilho | Arquivo a carregar |
| --- | --- |
| Implementação, correção, refatoração ou entrega | [.agents/skills/courtly-change/SKILL.md](.agents/skills/courtly-change/SKILL.md) |
| SQL, RLS, RPC, auth, tenant, Storage, tipos do banco | [.agents/skills/courtly-database/SKILL.md](.agents/skills/courtly-database/SKILL.md) |
| Agenda, grupos, recorrências, disponibilidade, presenças, pagamento do compromisso | [.agents/skills/courtly-scheduling/SKILL.md](.agents/skills/courtly-scheduling/SKILL.md) |
| Listagens, busca, filtros, paginação, totais | [.agents/skills/courtly-pagination/SKILL.md](.agents/skills/courtly-pagination/SKILL.md) |
| Componentes, CSS, formulários, acessibilidade, idiomas | [.agents/skills/courtly-ui/SKILL.md](.agents/skills/courtly-ui/SKILL.md) |

Carregar múltiplas skills apenas quando os gatilhos coincidirem. Esses arquivos
podem ser lidos diretamente; descoberta automática depende da ferramenta utilizada.
Para outros agentes, usar este índice mesmo se não houver suporte nativo a skills.

## Como trabalhar

Inspecionar o estado Git e preservar alterações do usuário. Traçar o fluxo
página → UI/action → caso de uso/repositório → tabela/RPC/policy. Implementar
somente o escopo solicitado, incluindo contratos, traduções e documentação
necessários. Não criar rotas/API/dependências alternativas sem necessidade.

Usar [validação](Rules/validation.md) para os checks aplicáveis. Não declarar
build, testes, migrations ou segurança aprovados sem execução e evidência.
Na entrega, resumir comportamento, arquivos, aplicação das migrations,
validação realizada e limitações reais. Se solicitado ZIP, incluir arquivos
completos e instruções de remoção; excluir segredos e artefatos gerados.

Subagentes são opcionais. Trabalhar sozinho por padrão; só delegar quando
solicitado ou permitido pelo ambiente, usando [perfis](SUB-AGENTS.md).

## Evolução da documentação

Toda implementação deve avaliar atualização de regras, mapa, arquitetura,
contratos, skills e [histórico](docs/ai/changes.md). Atualizar só o conhecimento
que mudou; se nada estrutural mudou, registrar isso no histórico. Criar skill
nova apenas para procedimento recorrente distinto; aplicar o protocolo em
[Rules/documentation.md](Rules/documentation.md).

## Instruções geradas pelo Next.js

Preservar o bloco abaixo quando o Next.js o atualizar.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
