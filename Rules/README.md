# Rules — índice e carregamento

| Documento | Carregamento | Uso |
| --- | --- | --- |
| [global.md](global.md) | Sempre, por instrução de AGENTS.md | Escopo, produto e fronteiras |
| [conventions.md](conventions.md) | Sempre | Padrões de código |
| [security.md](security.md) | Sempre | Tenant, RBAC e segredos |
| [documentation.md](documentation.md) | Sempre | Manutenção incremental |
| [validation.md](validation.md) | Ao implementar/verificar | Comandos e critérios |

“ sempre ” significa obrigação de leitura expressa no `AGENTS.md`, não um
mecanismo de importação universal do editor. Fora de ferramentas que reconhecem
`AGENTS.md`, indicar esse arquivo no contexto inicial. Arquivos em `Rules/`
não são carregados automaticamente apenas por existirem.

Instruções da plataforma e do usuário têm precedência. Instruções locais mais
específicas complementam as gerais sem enfraquecer invariantes de segurança.
Se código e documento divergirem, verificar o comportamento e corrigir a
referência; não inventar garantias para resolver a divergência.
