---
name: courtly-scheduling
description: Alterar agenda, grupos, participantes, recorrências, disponibilidade, pools, presenças, cancelamento, reagendamento e baixa de pagamento no Courtly.
---

# Evoluir agenda e presenças

1. Ler `docs/ai/domain-contracts.md`, `docs/ai/review.md` e skill database se SQL mudar.
2. Traçar scheduling-actions → scheduling repository → RPCs finais; incluir
   attendance-actions, profissionais, contratos e triggers dependentes.
3. Preservar compromisso legado/customer_id e associação appointment_participants.
   Não usar só o primeiro cliente para representar grupo quando o requisito for grupo.
4. Validar participantes únicos/ativos/do tenant, capacidade, modo individual,
   serviço, contrato, profissional e recursos; manter criação transacional.
5. Separar status do compromisso, presença e participant_status; definir
   explicitamente o efeito de cancelamento individual na capacidade.
6. Respeitar período do contrato, dias 0–6, regras semanais e pausas/reativações.
7. Validar horário futuro/intervalo válido tanto na action quanto na operação SQL.
8. Tratar timezone da organização e datas civis deliberadamente; não usar
   timezone da máquina como contrato implícito da agenda.
9. Preservar qualificação, disponibilidade semanal, PRESENCE/ABSENCE, pools,
   quantidade de recursos e constraints de conflitos existentes.
10. No reagendamento, usar preview autoritativo e validar novamente na gravação;
    não tomar preview como reserva. Preservar estado original em falha.
11. Na baixa de pagamento, verificar permissões, valor e idempotência. Não assumir
    que paid_status cria receita; revisar integração efetivamente existente.
12. Revalidar agenda/presenças/financeiro conforme dependências e renovar listagens.
13. Atualizar contratos, mapa, revisão se dívida mudou, e histórico.

## Cenários de aceite por impacto

- Criar individual e grupo; rejeitar repetido, inativo, outro tenant e excesso.
- Dois usuários disputando mesmo profissional/recurso/capacidade no mesmo horário.
- ABSENCE/PRESENCE com intervalos, extremos do dia e horário adjacente.
- Recorrência dentro/fora do contrato; pausa, reativação e geração repetida.
- Pools sem recurso disponível; rollback sem compromisso parcial.
- Cancelamento com janela configurada; não fixar 2h ignorando settings.
- Preview sem persistência e commit que falha por conflito posterior.
- Pagamento repetido e compromisso cancelado, sem contabilização duplicada.
- Listagem/calendário mostrando todos participantes quando exigido.

Selecionar cenários pertinentes e registrar executados versus pendentes.
