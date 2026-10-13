# Regras globais

- Manter Courtly genérico para serviços de múltiplos nichos e organizações.
- Preservar jornadas existentes de login, onboarding, clientes, contratos,
  profissionais, serviços/recursos, agenda, presenças e financeiro.
- Uma organização é a fronteira de dados; permissões restringem operações dentro dela.
- Manter integridade entre TypeScript, tipos do banco, SQL e mensagens da UI.
- Respeitar o fluxo App Router e a sessão Supabase SSR existentes.
- Reutilizar `src/shared` para infraestrutura transversal e UI compartilhada.
- Evitar importar UI/Next/Supabase no domínio em novas implementações.
- Criar dependências somente com necessidade concreta; manter package-lock consistente.
- Não mudar versões da stack ou refatorar módulos inteiros para resolver tarefa pontual.
- Não alterar histórico de migrations já aplicado: adicionar migration corretiva.
- Não tratar protótipo, placeholder ou backlog como funcionalidade pronta.
- Preservar alterações preexistentes e não executar limpeza/reset destrutivo de Git.
- Não publicar, enviar convites reais ou aplicar SQL remoto fora da autorização da tarefa.
- Atualizar a documentação afetada antes de encerrar cada implementação.
