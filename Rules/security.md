# Restrições de segurança

## Tenant e autorização

- Derivar usuário e organização da sessão/membership no servidor. Não aceitar
  organizationId, role ou permission enviado pelo navegador como autoridade.
- Confirmar que IDs de clientes, serviços, profissionais, recursos e contratos
  pertencem ao mesmo tenant da operação, inclusive em joins e tabelas associativas.
- Usar `getCurrentAccessContext`/`can` e contextos comerciais/financeiros conforme
  a fronteira; revisar policy/RPC correspondente, não só botão ou action.
- RLS deve estar habilitada em novas tabelas tenant; definir `USING` e `WITH CHECK`
  e permissões mínimas por operação. Filtrar tenant explicitamente em consultas.
- Escopo “próprio profissional” exige vínculo servidor/banco com usuário atual;
  ocultar linhas na UI não protege os dados.
- O legado usa `.limit(1)` em memberships. Não alegar seleção multi-organização
  determinística; mudança nesse fluxo exige definição explícita de tenant ativo.
- Testar acesso negado entre tenants e por papel usando JWT real de teste, sem
  service role que anule RLS.

## RPCs e privilégios

- Preferir `SECURITY INVOKER`. Para `SECURITY DEFINER`, restringir `search_path`,
  autenticar, checar membership e permissão granular e validar IDs internamente.
- Rever overloads e grants; revogar execução de PUBLIC/anon em RPC privilegiada,
  concedendo apenas papéis necessários. Uma action restrita não protege RPC pública.
- SQL dinâmico deve usar parâmetros para valores e allowlist para módulos/ordenação.
- Garantias de conflito, capacidade e financeiro devem sobreviver a chamadas concorrentes.
- Não usar `createAdminClient` para consultas usuais. Service role só no servidor,
  em fluxo privilegiado previamente autorizado e com verificação de acesso.
- Usar `server-only` ao reforçar módulos privilegiados se compatível com dependências.

## Dados sensíveis e sessão

- Não copiar `.env.local`, `.env*` com valores, `supabase/.temp`, tokens, senhas,
  cookies, chaves privadas ou dados pessoais reais para docs, logs, ZIP ou commit.
- `.env.example` só pode conter placeholders verificados, nunca valores reais.
- `NEXT_PUBLIC_*` é visível ao navegador; jamais colocar service role nesse prefixo.
- Validar destino de redirect de auth para impedir redirecionamento externo arbitrário.
- Uploads de avatar devem validar tamanho, tipo, ownership e policy de Storage.
- Logs devem minimizar dados pessoais; retornar mensagens públicas controladas,
  sem detalhes internos do banco ou credenciais.
- Não reduzir RLS/validação para fazer uma mutation funcionar.

Há pendências identificadas em [review.md](../docs/ai/review.md); estas regras
são obrigações para mudanças, não certificação de que o legado já as cumpre.
