# Aplicação do pacote de documentação IA

Extrair o conteúdo deste ZIP diretamente na raiz do Courtly, ao lado de
package.json. Habilitar visualização de pastas ocultas para verificar `.agents`.
O pacote contém arquivos completos, prontos para versionamento.

## Arquivos substituídos

- `AGENTS.md`: amplia instruções e preserva o bloco gerado pelo Next.js.
- `CLAUDE.md`: mantém import de AGENTS.md e acrescenta orientação.

## Arquivos adicionados

- `Rules/`: regras globais, convenções, segurança, manutenção e validação.
- `src/AGENTS.md`, `supabase/AGENTS.md`: instruções específicas por diretório.
- `.agents/skills/`: cinco skills locais com SKILL.md e metadata.
- `SUB-AGENTS.md`: perfis opcionais, sem execução automática.
- `docs/ai/`: arquitetura, inventário completo, contratos, pendências e histórico.
- `scripts/validate-ai-docs.py`: valida estrutura/links/limite sem dependências.
- Este guia.

Não há mudanças de código de aplicação, dependências ou migrations, nem arquivo
a remover. Não é necessário aplicar SQL para instalar esta documentação.

## Uso a cada tarefa

Em ferramentas que reconhecem AGENTS.md, abrir a raiz correta do repositório.
Em outras ferramentas ou chats, fornecer os arquivos e instruir:

> Leia AGENTS.md, Rules obrigatórias e a skill aplicável antes de implementar.
> Após a mudança, atualize a documentação afetada e docs/ai/changes.md e valide.

O mecanismo é uma instrução versionada. Não garante que qualquer ferramenta
carregue todos arquivos automaticamente ou mantenha docs sem seguir o workflow.
Skills ficam no projeto; esta entrega não as instala como skills pessoais.

## Validar e versionar

```bash
python3 scripts/validate-ai-docs.py
```

No Windows, usar `py scripts/validate-ai-docs.py` se python3 não existir.
Revisar `git diff` e adicionar os arquivos explicitamente, evitando segredos:

```bash
git add AGENTS.md CLAUDE.md SUB-AGENTS.md LEIA-ME-IA.md Rules docs/ai .agents/skills src/AGENTS.md supabase/AGENTS.md scripts/validate-ai-docs.py
git commit -m "docs: add Courtly AI rules and workflows"
```

As versões e observações refletem o ZIP analisado em 2026-10-13. A revisão
estática não substitui build, testes, aplicação de migrations ou auditoria RLS.
