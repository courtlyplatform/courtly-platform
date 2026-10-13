# Convenções de código

## TypeScript e arquitetura

- Usar strict e alias `@/*` para `src/*`; seguir estilo do arquivo ao editar.
- Novos componentes devem ser funcionais; classes são aceitáveis para repositórios.
- Definir contratos de domínio e interfaces de repositório nas áreas em camadas.
- Colocar regras de caso de uso em `application`; persistência em `infrastructure`.
- Actions são fronteiras: validar input, autenticar, autorizar, chamar operação,
  tratar erros esperados e invalidar páginas afetadas.
- Preferir Zod nos módulos que já usam schemas; preservar validadores legados.
- Não confiar no tipo TypeScript para validar dados recebidos pela rede/FormData.
- Usar tipos `Database`, `Tables`, DTOs e `unknown` com narrowing em novos adaptadores.
- Não acrescentar `any` nem `@ts-ignore` para esconder contrato divergente.
- Há `any` legado: corrigir na área tocada quando viável, sem migração transversal forçada.
- Nomes de domínio/DTO em inglês, propriedades camelCase; banco em snake_case.
- UI tende a PascalCase; arquivos de actions/repositórios tendem a kebab-case.
  Preservar exceções existentes como `services-client.tsx` e `CustomersView.tsx`.
- Evitar barrel exports, abstrações e camadas sem benefício de reutilização real.

## React, UI e dados

- Minimizar fronteiras client; não importar adaptadores privilegiados em componentes client.
- Manter hooks estáveis, efeitos com cleanup e respostas antigas sem sobrescrever estado atual.
- Não mutar props/estado; derivar valores quando não exigirem persistência própria.
- Usar `Button`, `PageHeader`, `CourtlyAlert`, `ConfirmDialog`, `Pagination` quando aplicáveis.
- Usar CSS Modules existentes e tokens de `globals.css`; evitar outra biblioteca visual.
- Traduzir todas as novas mensagens e estados nas duas dictionaries.
- Respeitar organização: locale, moeda e timezone são conceitos independentes.
- Não converter data civil para UTC indiscriminadamente; definir limites de intervalo.
- Formatar números com moeda/locale corretos, sem somar moedas diferentes.
- Usar códigos de erro estáveis; mapear erros conhecidos para mensagens traduzidas.
- Manter snake_case→camelCase no adaptador; não espalhar formato do banco pela UI.
- Invalidar rotas dependentes e atualizar paginação após mutation; não deixar dados antigos.
