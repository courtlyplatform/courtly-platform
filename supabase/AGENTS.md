# Instruções para Supabase

Aplicar o AGENTS.md da raiz, Rules/security.md e a skill courtly-database.

- Ler migrations cronologicamente e localizar a última definição da assinatura modificada.
- Criar migration incremental `YYYYMMDDHHMMSS_descricao.sql`; preservar histórico aplicado.
- Tratar transação, tenant, permissões, grants, enums e concorrência como parte do contrato.
- Revisar triggers/callers e invalidar tipos TS após alteração de schema/RPC.
- Não tratar `snippets/` como migration de produção nem incluir `.temp/` em entregas.
- Não aplicar SQL remoto nem resetar dados sem autorização explícita adequada.
- Validar isolamento e privilégios por chamada direta de RPC com usuários de teste.
