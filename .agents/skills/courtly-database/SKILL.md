---
name: courtly-database
description: Evoluir Supabase PostgreSQL, migrations, RPCs, RLS, RBAC, autenticação, Storage e tipos do Courtly. Usar quando mudar persistência, segurança ou contratos do banco.
---

# Evoluir banco e segurança

1. Ler `supabase/AGENTS.md`, `Rules/security.md` e `docs/ai/database-contracts.md`.
2. Buscar tabela/função/policy em toda a cadeia de migrations. Identificar a
   última definição de cada assinatura, overloads, triggers, grants e callers TS.
3. Conferir o schema local instalado; não presumir que arquivo implica deployment.
4. Criar migration incremental com timestamp único; não editar migration aplicada.
5. Definir defaults/backfill/constraints para dados legados e novas escritas.
6. Habilitar RLS em novas tabelas tenant; validar USING/WITH CHECK e relações
   entre entidades da mesma organização, incluindo tabelas associativas.
7. Preferir SECURITY INVOKER; justificar DEFINER e validar auth.uid, membership,
   permissão específica, IDs, search_path e privilégios de execução internos.
8. Parametrizar SQL dinâmico e permitir só fontes/ordens em allowlist.
9. Preservar transação/idempotência; usar mecanismo de banco adequado para
   invariantes sob concorrência, não só checagem SELECT na aplicação.
10. Validar upgrade e instalação limpa em banco local descartável autorizado.
11. Testar chamada direta com usuário sem permissão, outro tenant, IDs mistos,
    anon e profissional limitado ao próprio escopo, conforme o contrato.
12. Gerar tipos com CLI local para arquivo temporário; substituir somente após
    comando bem-sucedido e revisão do diff. Ajustar DTOs/repositórios/actions.
13. Atualizar `docs/ai/database-contracts.md`, mapa/histórico e contrato de domínio.

## Armadilhas do Courtly

- A criação de grupo recebe source text e delega com cast appointment_source.
- Algumas RPCs antigas verificam membership sem permissão granular; não copiar
  isso como padrão e não confiar apenas na action para impedir chamada direta.
- Financeiro tem helpers de papel e RBAC granular; revisar policy efetiva.
- Banco e `database.types.ts` podem divergir; casts any não resolvem contrato.
- Membership limit(1) não define tenant ativo multi-organização.
- `supabase/snippets` não é migration; `.temp` contém estado/secrets locais.
- Service role ignora RLS; limitar a fluxo servidor autorizado, como convite.

## Evidência de saída

Informar nome/ordem da migration, compatibilidade, tipos alterados, cenários
executados e limitações do ambiente. Não aplicar SQL remoto automaticamente.
