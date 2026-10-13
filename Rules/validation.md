# Validação por impacto

Executar comandos na raiz do projeto, após conferir scripts e ambiente.

| Impacto | Verificação |
| --- | --- |
| Documentação/skills | `python3 scripts/validate-ai-docs.py` |
| TS/React | `npm run lint`, `npx tsc --noEmit`, `npm run build` |
| SQL/types | Aplicar cadeia em Supabase local de teste e gerar tipos; verificar diff |
| RLS/RBAC/RPC | Dois tenants, papéis distintos, chamada direta e IDs de outro tenant |
| Agenda | Conflitos, concorrência, grupos, recorrências, pools e reagendamento |
| Paginação | Todos filtros, tamanhos, página fora do limite, exclusão da última linha, totais globais |
| UI | Mobile/desktop, claro/escuro, pt-BR/en-US, teclado e estados assíncronos |

`package.json` recebido não contém script `test` nem suíte automatizada. Não
executar `npm test` presumindo configuração. Introduzir testes focados quando
necessários para regra crítica; registrar roteiro manual se não houver runner.

Usar `npm ci` quando dependências estiverem disponíveis. Se Next exigir geração
de tipos de rotas antes de tsc, usar comando compatível com a versão instalada.
O build pode depender de rede para fontes e variáveis; separar falha de ambiente
versus erro de implementação. Não afirmar sucesso quando um comando não rodou.

Migrations: confirmar CLI instalada e `supabase status`; usar reset somente em
banco local descartável, pois apaga dados. Nunca reset remoto. Validar tanto
upgrade da base anterior quanto instalação limpa quando SQL mudar.

Tipos: em ambiente local adequado, `npx supabase gen types typescript --local`
para arquivo temporário; conferir resultado e depois substituir
`src/types/database.types.ts`. Não truncar o arquivo por redirecionar comando que falhou.

Lint/tsc podem apresentar dívida preexistente. Registrar baseline e erros
introduzidos separadamente; não desabilitar regras para obter check verde.
