# Teste Dash – Planejamento Estratégico

Data: 2025-12-04  
Preparado por: GitHub Copilot (GPT-5.1-Codex Preview)

---

## 1. Estado Atual
- **Front-end**: React + Vite + TypeScript, componente principal `components/TestDashboard.tsx` consumindo `GroupedData` e `AppConfig`.
- **Funcionalidades já entregues**:
  - Abas Visão Geral, Equipe, Projetos, Sprints, Prazos, Prioridades e Controle Tarefas com métricas executivas.
  - Distribuição de prioridades com filtros (Tarefas, Subtarefas, Concluídas) e painel de qualidade de dados.
  - Indicadores por projeto exibindo tarefas principais, horas planejadas/logadas, prazos e descrições via tooltip.
  - Documentação de métricas (`docs/testdashboard-tabs.md`) e registro histórico (`docs/change-log.md`).
- **Riscos / Pendências**:
  - Dependência de `GroupedData` externo (ClickUp) sem camada de cache ou fallback robusto.
  - Ausência de testes automatizados para cálculos complexos (e.g., score de qualidade, distribuição por prioridade).
  - Falta de controles finos de filtro (por squad, sprint, portfolio) e de exportações integradas.

---

## 2. Roadmap "Do Zero"
| Fase | Objetivo | Entregas Técnicas | Estimativa |
| --- | --- | --- | --- |
| **F1 – Conexão ClickUp & Descoberta** | Mapear espaços/listas/colunas necessárias, validar credenciais e limites da API | - Documentar todas as listas a sincronizar (Daily, Projetos, Demandas executivas) <br> - Inventariar campos obrigatórios, custom fields e prioridade <br> - Configurar proxy (`api/proxy.js`) e variáveis secretas <br> - Gerar coleções de testes (Insomnia/Postman) | 1 semana |
| **F2 – Ingestão & Normalização** | Criar pipeline resiliente para tarefas/subtarefas | - Funções de paginação e retry para ClickUp <br> - Mapping para `Task`, `Project`, `Person` com validação de tipos <br> - Scripts para importação CSV fallback <br> - Testes unitários para parser/normalizer | 1.5 semana |
| **F3 – Serviços & Sincronização** | Construir camada de serviços e jobs | - Serviço de sincronização incremental (webhook + cron) <br> - Cache local/IndexedDB + fallback offline <br> - Hooks puros para status, horas, prioridades, deadlines <br> - Alerta visual para subtarefas com inconsistência (badge + toast) | 1.5 semana |
| **F4 – Experiência Executiva** | Desenvolver UI modular com abas e Daily | - Layout responsivo + estados de carregamento/erro <br> - Componentes compartilhados (MetricCard, ProgressBar, Toggles, Alertas) <br> - Controles de filtro (tarefas/subtarefas, concluídas, squads) <br> - Accessible focus/atalhos para executivos | 2.5 semanas |
| **F5 – Governança & Qualidade** | Painéis de auditoria e exportações | - Painel de dados faltantes (responsável, estimativa, datas, descrição) <br> - Histórico de versões e changelog automático <br> - Exportação CSV/PNG/PDF com branding <br> - Alertas configuráveis (e-mail/Slack) para prazos críticos | 1.5 semana |
| **F6 – Observabilidade & QA** | Garantir estabilidade pós-release | - Telemetria (page views, tempos de cálculo) <br> - Testes E2E (Cypress/Playwright) cobrindo abas críticas <br> - Monitoração da sincronização e alarmes de falha <br> - Plano de rollout + checklist de validação | 1 semana |

> **Sequenciamento**: Fases F1→F2 são pré-requisito para UI. F3 pode rodar em paralelo às últimas tarefas de F2. F4/F5 dependem da estabilização funcional.

---

## 3. Controle ClickUp (padrão Daily)
Tabela no formato utilizado na Daily: `Tarefa | Responsável | Status | Horas | Início | Prazo | Observações`.

| Tarefa | Responsável | Status | Horas (plan) | Início | Prazo | Observações |
| --- | --- | --- | --- | --- | --- | --- |
| **[Epic] Teste Dash v1.0** | Thiago | Em andamento | 96h | 04/12 | 20/12 | Entrega macro que consolida ingestão, UI executiva e governança. |
| ↳ Sub: Conectar API ClickUp (tokens, proxy, collections) | Thiago | Em andamento | 12h | 04/12 | 06/12 | Configurar `api/proxy.js`, validar requests e limites. |
| ↳ Sub: Mapear listas/campos necessários | Copilot Assist | Concluída | 8h | 04/12 | 05/12 | Inventário de espaços, listas, custom fields e prioridades. |
| ↳ Sub: Desenvolver sincronização + cache incremental | Thiago | Pendente | 16h | 06/12 | 10/12 | Jobs agendados, persistência em cache e alerta de falha. |
| ↳ Sub: Construir abas (Visão Geral, Equipe, Projetos, Sprints, Prazos) | Copilot Assist | Em andamento | 24h | 05/12 | 12/12 | Layout responsivo, métricas e interações. |
| ↳ Sub: Implementar aba Prioridades com toggles | Copilot Assist | Concluída | 10h | 05/12 | 07/12 | Controle de Tarefas/Subtarefas/Concluídas + distribuição visual. |
| ↳ Sub: Implementar aba Controle Tarefas + alertas subtarefa | Thiago | Em andamento | 12h | 06/12 | 11/12 | Score de qualidade, badges e alerta visual para subtarefas inconsistentes. |
| ↳ Sub: Testar (unitário + manual cross-browser) | Squad QA | Pendente | 8h | 11/12 | 13/12 | Scripts para agregadores e validação manual nas principais abas. |
| ↳ Sub: Exportações e documentos executivos | Thiago | Pendente | 6h | 13/12 | 15/12 | CSV/PDF e relatórios para rituais. |
| ↳ Sub: Governança/documentação (session-notes, change-log, roadmap) | Copilot Assist | Concluída | 10h | 04/12 | 06/12 | Pacote de documentação criado nesta sessão. |

> **Estimativas**: horas consideram esforço concentrado por responsável; ajuste conforme disponibilidade real do time.

---

## 4. Próximos Passos Recomendados
1. **Formalizar tarefas no ClickUp** usando a tabela acima e vincular aos squads afetados.
2. **Implementar F1-F2** do roadmap para reduzir risco de dados inconsistentes.
3. **Adicionar testes unitários** para agregadores críticos (`priorityDistribution`, `taskControl`).
4. **Planejar exportações** (CSV/PDF) e integração com o fluxo executivo (apresentações semanais).

Com este planejamento, retomamos o controle histórico e estabelecemos base clara para evoluções futuras.
