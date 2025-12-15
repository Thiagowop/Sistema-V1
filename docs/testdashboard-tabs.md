# Teste Dash – Guia de Métricas por Aba

Data: 2025-12-04  
Responsável: GitHub Copilot (GPT-5.1-Codex Preview)

## Base de Dados
- **Fonte**: estruturas `GroupedData` recebidas via props (`data` + `config`). Cada grupo contém pessoa→projetos→tarefas.
- **Flatten**: todas as tarefas e subtarefas são linearizadas por `flattenTaskWithSubtasks`, garantindo que subtarefas apareçam em todas as métricas.
- **Status**: texto livre normalizado em quatro buckets (`completed`, `inProgress`, `pending`, `blocked`).
- **Horas**: utiliza `timeEstimate` (planejado), `timeLogged`, `additionalTime`, `remaining` quando presentes.
- **Filtros globais**:
  - Tarefas concluídas ainda contam nos blocos Visão Geral/Equipe/Projetos/Prioridades/Sprints.
  - Deadlines e Controle Tarefas ignoram status `completed`.
  - Métricas só consideram tarefas com dados disponíveis (ex.: deadlines exigem `dueDate`).

## Visão Geral
- **Taxa de Conclusão** = `completedTasks / totalTasks` (%). Inclui todas as tarefas/subtarefas.
- **Projetos Ativos** = quantidade de nomes de projeto únicos.
- **Horas Registradas** = soma global de `timeLogged`; horas planejadas = soma de `timeEstimate`.
- **Tarefas Atrasadas** = tamanho de `deadlineWatchlist.overdue` (apenas tarefas não concluídas com `dueDate < hoje`).
- **Distribuição de Status** = contadores de `statusTotals` (completed/inProgress/pending/blocked) para todas as tarefas.
- **Focos** = três maiores buckets com percentual relativo ao total (inclui tarefas concluídas para referencial). Nenhum filtro adicional além do status.

## Equipe
- **Dataset**: todas as tarefas (inclusive concluídas) agrupadas por `assignee` ("Sem responsável" filtrado da UI).
- **Indicadores**:
  - `total`, `completed`, `inProgress`, `blocked`, `overdue` (quantas tarefas do responsável com prazo vencido e status não concluído).
  - Horas planejadas (`timeEstimate`) x logadas (`timeLogged`).
  - `completionRate = completed / total`.
  - `utilization = logged / planned`.
- **Filtros**: só exclui registros com nome vazio/"Sem responsável" para a listagem; usa ordenação opcional via `config.teamMemberOrder`.

## Projetos
- **Dataset**: todas as tarefas agrupadas por `project.name`.
- **Métricas**: total/concluídas/em andamento/bloqueadas/pendentes, horas planejadas, logadas, adicionais, restantes, `completionRate`, `burn` (logged/planned) e lista de responsáveis envolvidos.
- **Filtros**: nenhum recorte de status; inclui tarefas concluídas e ativas.

## Sprints (Velocidade Semanal)
- **Agrupamento**: semana da `dueDate` (início do domingo). Tarefas sem prazo não entram.
- **Métricas**: `completed`, `inProgress`, `hours` (soma `timeLogged`). Taxa exibida = `completed/(completed+inProgress)`; `pending`/`blocked` não aparecem aqui.
- **Escopo**: inclui tarefas concluídas ou em progresso, desde que tenham `dueDate` e alguma hora registrada; tarefas pendentes/bloqueadas sem horas entram com `hours = 0` mas contam na taxa se mapeadas.

## Prazos
- **Watchlist** só considera tarefas com `dueDate` e **status diferente de completed**.
  - `critical`: prazo em até 3 dias (>= hoje e <= hoje+3).
  - `upcoming`: 4 a 7 dias.
  - `overdue`: prazo anterior a hoje.
- **Saída**: cartões separados com contagens e tabelas usando `renderDeadlineItem`.

## Prioridades
- **Agrupamento**: por `assignee` (inclui "Sem responsável" porém a UI filtra). Cada responsável possui buckets `urgente`, `alta`, `normal`, `baixa`, `sem_prioridade`.
- **Dados usados**:
  - `count`: número de tarefas/subtarefas por bucket.
  - `hours`: soma de `timeEstimate` de cada bucket.
- **Escopo**: inclui tarefas concluídas e ativas; não filtra por status. Usa `timeEstimate` mesmo se `timeLogged` for zero.
- **Saídas**: cartões-resumo por prioridade, tabela por pessoa com horas/contagem, barras percentuais empilhadas.

## Controle Tarefas
- **Escopo**: apenas tarefas com status diferente de `completed`.
- **Checks**:
  - Sem responsável, prioridade, data inicial, data final, estimativa, descrição.
  - Cada lista alimenta cartões colapsáveis com tabela de tarefas impactadas.
- **Score de Qualidade**: `((totalPending - totalIncomplete)/totalPending) * 100`, onde `totalPending` = tarefas não concluídas; `totalIncomplete` = tarefas que falham em pelo menos um requisito.

## Status & Conclusões
- Tarefas concluídas aparecem em todas as métricas exceto Deadlines e Controle Tarefas.
- Tarefas inativas (sem responsável/projeto) ainda entram nos totais mas podem ser ocultadas visualmente (ex.: equipe).
- Subtarefas são tratadas como tarefas independentes para todas as estatísticas.

## Uso do Documento
- Utilize este guia ao validar se uma aba reúne apenas itens ativos, atrasados ou concluídos.
- Caso precise limitar métricas a tarefas ativas, ajuste os filtros no `useMemo` correspondente antes do cálculo dos agregados.
