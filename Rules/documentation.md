# Manutenção incremental obrigatória

## Ao iniciar

Ler o conhecimento aplicável e verificar os arquivos atuais. Documentação deve
explicar o contrato observado, distinguindo comportamento existente, padrão
obrigatório para código novo e pendência conhecida.

## Ao finalizar cada implementação

1. Revisar o diff e classificar impactos pela tabela abaixo.
2. Atualizar documentos existentes na mesma entrega, removendo instruções obsoletas.
3. Registrar em `docs/ai/changes.md`: data, problema, comportamento final,
   contratos/documentos alterados, validação executada e limitações.
4. Se nenhum conhecimento estrutural mudou, registrar “documentação estrutural
   revisada; sem mudança necessária” no histórico; não inventar regras novas.
5. Executar `python3 scripts/validate-ai-docs.py` (Windows: `py scripts/validate-ai-docs.py`).
6. Incluir a documentação na entrega/commit junto com a implementação.

| Mudança | Atualização necessária |
| --- | --- |
| Novo módulo, rota ou responsabilidade | architecture.md, repository-map.md e roteamento em AGENTS.md quando necessário |
| Tabela, enum, policy, assinatura de RPC | database-contracts.md, tipos e skill de banco se o procedimento mudou |
| Agenda, recorrência, presenças, pools | domain-contracts.md e skill scheduling |
| Paginação, filtros ou totais | domain-contracts.md e skill pagination |
| UI, idioma, tema ou componente compartilhado | convenções e skill UI quando houver regra reutilizável nova |
| Nova regra transversal | Rules existente; AGENTS.md apenas se precisar carregar conteúdo novo |
| Pendência resolvida/introduzida | review.md com evidência e status |
| Correção sem mudança de arquitetura | changes.md com comportamento e validação |

## Criar ou evoluir skills

Preferir atualizar uma skill existente. Criar nova somente para um procedimento
recorrente, distinto e com gatilho identificável. Exemplo: futura integração
externa complexa; uma alteração de botão não justifica skill.

Usar `.agents/skills/<nome-kebab-case>/SKILL.md`, frontmatter YAML `name` e
`description` com gatilhos, instruções imperativas e caminhos reais.
Manter cada SKILL.md em no máximo 500 linhas; objetivo 40–150. Separar referências
longas em documentos sob demanda e ligar diretamente à skill. Nunca mascarar
excesso repartindo procedimento em fragmentos que sempre precisam ser carregados.
Atualizar o índice de AGENTS.md e `agents/openai.yaml` quando houver mudança de
nome/gatilho. Validar links, exemplos e workflows antes de afirmar que funciona.

## Fonte da verdade

SQL efetivo = sequência completa de migrations, usando a última definição por
assinatura. Contratos atuais = código e schema realmente instalado; confirmar
schema local sem assumir que migration do arquivo já foi aplicada no ambiente.
Não copiar dumps completos nem logs para AGENTS.md. Registrar decisões duráveis
com motivo e consequências. Histórico é cumulativo; manter resumo atual curto.

Essas instruções dependem de o agente as seguir. O validador verifica estrutura,
links e limites; não atualiza docs sozinho nem prova coerência semântica com código.
