---
name: courtly-pagination
description: Criar ou modificar listagens paginadas, buscas, filtros, ordenação, hidratação, contagens, receitas agregadas e KPIs no Courtly.
---

# Manter paginação server-side

1. Ler `src/shared/pagination/contracts.ts`, `actions.ts`,
   `use-server-pagination.ts`, `src/shared/ui/Pagination.tsx` e caller do módulo.
2. Ler a última migration de courtly_page_ids e contrato de filtros em
   `docs/ai/domain-contracts.md`; carregar skill database ao alterar SQL.
3. Manter page >=1 e pageSize 10/20/50/100, com normalização no servidor/banco.
4. Aplicar filtros e total sobre todo conjunto autorizado no banco, antes de
   limit/offset. Usar ordem estável com desempate por ID.
5. Manter módulo/ordenação em allowlist; validar datas, status, moedas e números
   para evitar casts SQL inválidos por input malformado.
6. Conferir autorização na action, RPC e RLS, incluindo escopo próprio.
7. Buscar somente IDs da página e hidratar associações desses IDs; restaurar
   a ordem retornada pelo banco. Evitar associação que multiplique total.
8. Preservar PaginatedResult e hidratação vazia; não executar in([]) desnecessário.
9. Calcular totais e KPIs com filtros globais, moeda e permissões corretos.
   Não somar apenas linhas visíveis nem combinar moedas sem conversão explícita.
10. Preservar debounce/deduplicação, cleanup, retry e proteção de resposta antiga.
11. Após mutation, usar revision/refresh; conferir page clamp no último item.
12. Definir comportamento de filtros e scope; o hook atual pode restaurar página
    guardada do scope. Não alegar reset universal sem implementar/testar.
13. Atualizar contratos/mapa/histórico e índice de módulos/permissões ao adicionar lista.

## Casos de verificação

- Zero linhas, uma linha, múltiplas páginas e totalPages mínimo de 1.
- Todos tamanhos, página inválida/muito alta, alteração de tamanho e filtros.
- Busca com acentos, exata e parcial; preservar prioridade atual de serviços/especialidades.
- Mudança rápida de busca, resposta fora de ordem, erro/retry e troca de profissional.
- Exclusão/inativação do último item da página e retorno a página válida.
- Contagem e totais idênticos em páginas distintas com mesmos filtros.
- Usuario de outro tenant, sem permissão e profissional com escopo próprio.
- Índices/plano de execução em volume representativo, se objetivo for desempenho.

Paginar oito listas não elimina consultas amplas de lookups/agenda: localizar
cada consulta real e não afirmar escalabilidade integral só pela UI paginada.
