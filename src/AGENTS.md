# Instruções para src

Aplicar o AGENTS.md da raiz e Rules. Antes de editar, seguir as fronteiras do
módulo e carregar as skills roteadas na raiz.

- Domínio novo não importa Next, React, Supabase ou UI.
- UI nova usa componentes funcionais e não contém autorização final.
- Actions validam input e sessão; adaptadores validam o resultado da persistência.
- Preservar DTOs e códigos de erro consumidos pelos clientes.
- Atualizar ambas as dictionaries ao criar texto ou erro público.
- Não voltar a carregar coleções completas para alimentar listagens paginadas.
- `database.types.ts` é gerado; conferir migrations e gerar novamente quando schema mudar.
- Tipos compartilhados novos não devem depender de componentes UI; evitar replicar
  a dependência legada de paginação em `AttendanceClient`.
