---
name: courtly-change
description: Implementar mudanças no Courtly e manter conhecimento do projeto atualizado. Usar em novas funcionalidades, correções, refatorações e preparação de entregas.
---

# Implementar mudanças no Courtly

1. Ler `AGENTS.md`, as quatro Rules obrigatórias e instruções locais do escopo.
2. Identificar no `docs/ai/repository-map.md` página, UI, action, contrato,
   adaptador, tabela/RPC e policy envolvidos. Ler os arquivos atuais.
3. Consultar `docs/ai/review.md` para restrições existentes no fluxo afetado.
4. Identificar gatilhos de banco, agenda, paginação ou UI e carregar as skills
   correspondentes; não carregar todas por rotina.
5. Definir comportamento final e critérios de aceite com a informação disponível.
   Resolver escolhas reversíveis; pedir contexto apenas para requisito bloqueante.
6. Implementar do contrato para as fronteiras, mantendo compatibilidade dos callers.
7. Validar input/autorização no servidor e invariantes concorrentes no banco.
8. Atualizar mensagens pt-BR/en-US e estados loading/empty/error/success.
9. Executar checks aplicáveis em `Rules/validation.md`; separar baseline legado
   de regressões introduzidas. Não inventar testes/resultado.
10. Aplicar `Rules/documentation.md`: atualizar somente conhecimento afetado,
    histórico e roteamento de skills quando necessário.
11. Executar `python3 scripts/validate-ai-docs.py`.
12. Entregar arquivos completos, comportamento, validação e limitações.

## Alterações sensíveis

Tratar auth, RBAC, tenant, pagamentos, recorrências e conflitos como contratos
que exigem cenários negativos. Não usar service role para contornar autorização.
Não remover salvaguardas para resolver erro de schema ou tipos.

## ZIP solicitado

Preservar caminhos da raiz; incluir todos arquivos novos/modificados completos,
migrations novas e documentação correspondente. Registrar arquivos removidos
em instruções; ausência no ZIP não remove arquivo do destinatário. Excluir
node_modules, .next, build output, .env com valores, .temp, credenciais e dados
pessoais. Validar conteúdo do arquivo antes de entregar.

## Evoluir conhecimento

Criar skill nova apenas quando houver workflow distinto e recorrente. Atualizar
skill existente para ajuste de contrato. Manter YAML name/description e <=500
linhas. Não transformar cada feature em skill nem duplicar Rules em cada skill.
