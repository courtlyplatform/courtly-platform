# Revisão estática e pendências conhecidas

Baseline: 2026-10-13, archive recebido. Todo texto de código, migrations,
configuração e documentação foi percorrido para inventário; fluxos críticos
foram inspecionados. Assets binários apenas inventariados. Arquivos de secrets
não foram lidos/reproduzidos. Não foi feita auditoria dinâmica nem execução
contra banco; nenhuma pendência abaixo foi corrigida por esta entrega documental.

| Observação | Evidência | Tratamento em futuras mudanças |
| --- | --- | --- |
| Estrutura heterogênea | customers/auth/organizations versus módulos com quatro camadas | Evolução incremental, sem declarar arquitetura pura |
| Casts `any` e tipos gerados | actions/adaptadores; database.types.ts | Conferir schema real, gerar tipos e reduzir casts na área |
| Arquivos UI/CSS extensos | ProfessionalsClient, FinancialClient, services-client, globals.css | Extrair responsabilidades quando escopo justificar |
| Consultas amplas | scheduling repository: lookups, appointment_resources e participants por tenant | Recortar associações aos compromissos da janela e buscar opções sob demanda |
| Escolha de membership | shared/auth: limit(1), sem ordenação/tenant ativo | Não garantir multi-membership determinístico |
| RBAC nas RPCs de grupos/presença/pagamento | migrations de grupo verificam membership; actions possuem checks mais granulares | Revisar chamada direta, grants e autorização granular em nova migration |
| Scope próprio em rules | courtly_page_ids aceita VIEW_OWN sem filtro profissional explícito no branch rules | Conferir RLS efetiva e vínculo; acrescentar defesa se necessário |
| Service role | admin.ts sem import de server-only | Restringir fronteira servidor e verificar auth nos callers |
| Dependência shared→UI | pagination/contracts importa AttendanceAppointment da UI | Mover DTO para contrato compartilhado/domínio quando tocar |
| Grupo versus customer legado | attendance pagina appointments com customers via customer_id | Conferir apresentação/busca dos demais participantes se evoluir presenças |
| Pagamento do compromisso | settle_appointment_payment altera appointments | Validar integração contábil antes de afirmar geração de receita |
| Cobertura de testes ausente | package.json não declara test | Adicionar testes focados em regra crítica; relatar roteiro manual |
| Placeholder compartilhado | shared/ui/EmptyState.tsx vazio | Não importar como componente pronto |
| Dashboard individual planejado | dashboard/page.tsx não evidencia fluxo completo de notas/planejamento | Tratar como requisito futuro, não funcionalidade comprovada |

As observações são riscos/restrições localizados, não afirmações de exploração
confirmada. Quando resolver, registrar migration/diff e cenário que comprovou
correção; manter histórico resumido em changes.md.
