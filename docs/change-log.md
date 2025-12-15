# Teste Dash – Histórico de Versões

Este documento versiona as principais intervenções realizadas durante a sessão de 04/12/2025 para facilitar auditoria futura.

## v0.9.0 – Layout Restaurado (04/12/2025 02:30)
- Copiado `layout 2.txt` sobre `components/TestDashboard.tsx` para reverter a tela em branco causada pelos cartões colapsáveis.
- Confirmado build via `npm run dev` (porta 3015) e retomada da view `management2`.
- Base estrutural mantida com abas: Visão Geral, Equipe, Projetos, Sprints, Prazos, Prioridades e Controle Tarefas.

## v0.9.1 – Documentação Inicial (04/12/2025 03:00)
- Criado `docs/session-notes.md` registrando contexto do projeto, comandos executados e próximos passos.
- Registradas métricas disponíveis no Teste Dash para handoff.

## v0.9.2 – Guia por Aba (04/12/2025 03:20)
- Adicionado `docs/testdashboard-tabs.md` detalhando fontes de dados, filtros e escopo de tarefas em cada aba.
- Explicado o comportamento da aba Prioridades e dos demais KPIs (inclui regras de status concluído/incompleto).

## v0.10.0 – Toggles de Prioridade (04/12/2025 04:00)
- Replicado o componente de toggle da Daily e inserido três controles na aba Prioridades: Tarefas, Subtarefas, Concluídas.
- Ajustado o cálculo de `priorityDistribution` para respeitar os toggles antes de somar horas e contagens.
- Atualizado `useMemo` principal para reagir aos filtros.

## v0.10.1 – Projetos com Indicadores de Tarefas (04/12/2025 04:30)
- Armazenado apenas tarefas “pai” por projeto e exibido, em cada cartão, uma tabela "Indicadores de tarefas" com responsável, status, horas e datas.
- Incluído botão de tooltip (ícone `Info`) mostrando a descrição da tarefa ao passar o mouse, seguindo o padrão da Daily.

## v0.10.2 – Layout de Colunas (04/12/2025 04:45)
- Reorganizada a tabela de indicadores para mostrar colunas Prioridade, Status, Início e Prazo separadamente.
- Utilizadas as mesmas cores/labels de prioridade e formatação de datas para garantir consistência.

## Arquivos Afetados
- `components/TestDashboard.tsx`
- `docs/session-notes.md`
- `docs/testdashboard-tabs.md`
- `docs/change-log.md` (este documento)

> Observação: as versões acima refletem incrementos lógicos dentro da sessão; use controle de versão real (git tags/commits) para persistir oficialmente.
