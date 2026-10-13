# Perfis opcionais de subagentes

Este documento define responsabilidades; não inicia agentes nem instala plugins.
Usar somente quando a tarefa/ambiente permitir delegação. Uma pessoa/agente
integrador mantém responsabilidade pelo contrato final. Tarefas pequenas usam
um agente. Evitar edições simultâneas no mesmo arquivo.

| Perfil | Escopo | Leitura | Entrega esperada |
| --- | --- | --- | --- |
| Banco e segurança | migrations, RLS, RPC, tipos | Rules/security.md; skill database | Diff SQL/types, compatibilidade, cenários negativos |
| Agenda | recorrência, grupos, pools, presença | domain-contracts.md; skill scheduling | Fluxo final e casos de conflito/concorrência |
| UI e idiomas | componentes, CSS, dictionaries | conventions.md; skill UI | Estados, responsividade e traduções |
| Listagens | hook, actions, filtros e SQL de paginação | skill pagination | Contrato de paginação e totais consistentes |
| Revisão | ler diff integrado e documentação | AGENTS.md; review.md; validation.md | Achados com arquivo/evidência, checks executados e faltantes |

Briefing de delegação: objetivo, arquivos permitidos, contrato de entrada/saída,
regras aplicáveis, critérios de aceite e mudanças já existentes. Cada agente
atualiza somente documentação do seu escopo; o integrador consolida histórico,
mapa e validações. Nunca delegar acesso privilegiado sem a mesma autorização.

Para revisão independente, fornecer diff/artefatos e tarefa, sem sugerir a resposta.
Não declarar revisão independente se a mesma instância fez implementação e revisão.
