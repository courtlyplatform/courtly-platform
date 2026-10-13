---
name: courtly-ui
description: Criar ou alterar interfaces React do Courtly, formulários, modais, CSS, responsividade, acessibilidade, temas e traduções pt-BR/en-US.
---

# Evoluir UI bilíngue

1. Ler `Rules/conventions.md`, página/caller e componente atual antes de editar.
2. Usar componentes funcionais. Manter Server Components para composição/dados
   e colocar interação na menor fronteira client necessária.
3. Reutilizar componentes de `src/shared/ui` existentes; EmptyState está vazio
   na baseline e não deve ser importado presumindo implementação.
4. Reutilizar CSS Modules/tokens; conferir globals.css para regra global que
   sobrescreva largura, cores ou estados. Evitar nova biblioteca de design.
5. Respeitar padrão local dos botões e PageHeader, sem largura full-screen
   involuntária em ações pequenas. Verificar mobile sem overflow horizontal.
6. Traduzir mensagens, labels, placeholders, validação e erros nos arquivos
   `src/shared/i18n/dictionaries/pt-BR.ts` e `en-US.ts`.
7. Separar idioma, moeda e timezone; formatar com configuração apropriada.
8. Definir loading, vazio, falha/retry, sucesso, disabled e pending de mutation.
9. Preservar labels, foco, navegação por teclado, contraste e aria relevante.
   Modais devem permitir fechar/restaurar foco sem perder alteração silenciosamente.
10. Usar CourtlyAlert/ConfirmDialog em fluxos que já seguem esse padrão;
    não criar alert nativo para desviar de tratamento de erro existente.
11. Não usar visibilidade de botão como autorização. Action/RPC deve validar.
12. Se a UI listar coleção crescente, carregar skill pagination.
13. Verificar tema claro/escuro, pt-BR/en-US, mobile/desktop e estados assíncronos.
14. Atualizar documentação/histórico; atualizar esta skill só com regra reutilizável nova.

## Limites

Não refatorar componentes grandes inteiros para mudança visual pontual. Extrair
unidade de responsabilidade quando escopo justificar, preservando props e estado.
Não dizer que inspeção visual foi feita quando só houve leitura de CSS/TSX.
