# 🏷️ MAPA DE IDS DE COMPONENTES - Daily Flow v2.0

**Documento de Referência Rápida**  
**Última Atualização:** 17 de Dezembro de 2025

---

## 📋 CONVENÇÃO DE NOMENCLATURA

```
Formato: [CATEGORIA]-[SUBCATEGORIA]-[NUMERO]

CATEGORIAS:
├── PAGE    → Páginas/Rotas principais
├── DASH    → Dashboards  
├── COMP    → Componentes reutilizáveis
├── SERV    → Serviços
├── CTX     → Contexts
├── HOOK    → Custom Hooks
├── UTIL    → Utilitários
├── PROTO   → Protótipos experimentais
├── LEGACY  → Código legado (para remoção)
└── FEAT    → Features/Módulos
```

---

## 📄 PAGES (Rotas)

| ID | Arquivo | Status | Descrição |
|----|---------|--------|-----------|
| `PAGE-MAIN-001` | `pages/App.tsx` | ✅ Ativo | Roteador principal + Sidebar |
| `PAGE-AUTH-001` | `pages/LoginScreen.tsx` | ✅ Ativo | Tela de autenticação |
| `PAGE-MGMT-001` | `pages/ManagementModule.tsx` | ⚠️ Revisar | Hub de gestão com abas |
| `PAGE-TEAM-001` | `pages/TeamWorkloadDashboard.tsx` | ⚠️ Revisar | Carga de trabalho da equipe |

---

## 📊 DASHBOARDS

| ID | Arquivo | Status | Mock/Real | Dependências |
|----|---------|--------|-----------|--------------|
| `DASH-DAILY-001` | `components/DailyAlignmentDashboard.tsx` | ⚠️ Mock | Mock | Precisa SERV-CLICK |
| `DASH-PROJ-001` | `components/ProjectsDashboard.tsx` | ⚠️ Mock | Mock | Precisa SERV-CLICK |
| `DASH-TEAM-001` | `components/GeneralTeamDashboard.tsx` | ⚠️ Mock | Mock | Precisa SERV-CLICK |
| `DASH-GOV-001` | `components/GovernanceDashboard.tsx` | ⚠️ Mock | Mock | Precisa SERV-CLICK |
| `DASH-ALLOC-001` | `components/AllocationDashboard.tsx` | ⚠️ Mock | Mock | Precisa SERV-CLICK |
| `DASH-QUAL-001` | `components/QualityDashboard.tsx` | ⚠️ Mock | Mock | Precisa SERV-CLICK |
| `DASH-MGMT-001` | `components/gestao/ManagementDashboard.tsx` | ⚠️ Mock | Mock | Precisa SERV-CLICK |
| `DASH-ADMIN-001` | `components/AdminDashboard.tsx` | ✅ Ativo | N/A | Config local |
| `DASH-SETT-001` | `components/SettingsDashboard.tsx` | ✅ Ativo | N/A | Config local |

---

## 🔌 SERVIÇOS

### Serviços da V1.0 (A COPIAR)

| ID | Arquivo Origem | Arquivo Destino | Linhas | Status |
|----|----------------|-----------------|--------|--------|
| `SERV-CLICK-001` | `services/clickup.ts` | `Referencia/services/clickup.ts` | 1146 | 📋 Pendente |
| `SERV-CACHE-001` | `services/advancedCacheService.ts` | `Referencia/services/advancedCacheService.ts` | ~400 | 📋 Pendente |
| `SERV-PROC-001` | `services/processor.ts` | `Referencia/services/processor.ts` | ~350 | 📋 Pendente |
| `SERV-FILT-001` | `services/filterService.ts` | `Referencia/services/filterService.ts` | ~200 | 📋 Pendente |

### Serviços Existentes na Referencia

| ID | Arquivo | Status | Descrição |
|----|---------|--------|-----------|
| `SERV-CLICK-REF` | `services/clickup.ts` | ⚠️ Básico | Versão simplificada |
| `SERV-GEM-001` | `services/geminiService.ts` | ✅ Ativo | Integração Gemini AI |

---

## 🧩 COMPONENTES REUTILIZÁVEIS

| ID | Arquivo | Status | Categoria |
|----|---------|--------|-----------|
| `COMP-CARD-001` | `components/MetricCard.tsx` | ✅ Ativo | Cards |
| `COMP-CARD-002` | `components/KPICard.tsx` | ✅ Ativo | Cards |
| `COMP-CHART-001` | `components/WorkloadCharts.tsx` | ✅ Ativo | Gráficos |
| `COMP-CHART-002` | `components/CapacityChart.tsx` | ✅ Ativo | Gráficos |
| `COMP-TABLE-001` | `components/TeamTable.tsx` | ✅ Ativo | Tabelas |
| `COMP-PROG-001` | `components/ProgressBar.tsx` | ✅ Ativo | UI |
| `COMP-FILT-001` | `components/FilterDashboard.tsx` | ⚠️ Mock | Filtros |
| `COMP-SYNC-001` | `components/ImportSyncView.tsx` | ❌ Refatorar | Sync (simulado) |
| `COMP-OP-001` | `components/OperationalHub.tsx` | ⚠️ Mock | Hub operacional |

---

## 🌐 CONTEXTS

| ID | Arquivo | Status | Descrição |
|----|---------|--------|-----------|
| `CTX-APP-001` | `contexts/AppContext.tsx` | ⚠️ Básico | Filtros globais simples |
| `CTX-DATA-001` | `contexts/DataContext.tsx` | 📋 Criar | Estado de dados |
| `CTX-AUTH-001` | `contexts/AuthContext.tsx` | 📋 Criar | Autenticação |

---

## 🪝 HOOKS (A CRIAR)

| ID | Arquivo | Status | Descrição |
|----|---------|--------|-----------|
| `HOOK-SYNC-001` | `hooks/useClickupSync.ts` | 📋 Criar | Sincronização |
| `HOOK-CACHE-001` | `hooks/useCache.ts` | 📋 Criar | Gerenciar cache |
| `HOOK-FILT-001` | `hooks/useFilters.ts` | 📋 Criar | Aplicar filtros |
| `HOOK-TASK-001` | `hooks/useTasks.ts` | 📋 Criar | Manipular tarefas |

---

## 🔬 PROTÓTIPOS (prototype/)

| ID | Arquivo | Status | Decisão |
|----|---------|--------|---------|
| `PROTO-HUB-001` | `prototype/PrototypeDashboard.tsx` | ✅ Manter | Hub de experimentos |
| `PROTO-TIME-001` | `prototype/WeeklyTimesheet.tsx` | ⚠️ Avaliar | Timesheet semanal |
| `PROTO-TIME-002` | `prototype/UnifiedTimesheet.tsx` | ⚠️ Avaliar | Timesheet unificado |
| `PROTO-TIME-003` | `prototype/MonthlyTimesheetGrid.tsx` | ⚠️ Avaliar | Timesheet mensal |
| `PROTO-BI-001` | `prototype/BI_Playground.tsx` | ✅ Manter | Experimentos BI |
| `PROTO-PRED-001` | `prototype/PredictiveDelaysView.tsx` | ✅ Manter | Predição de atrasos |
| `PROTO-PRIO-001` | `prototype/PriorityDistributionProto.tsx` | ✅ Manter | Distribuição prioridades |
| `PROTO-ALLOC-001` | `prototype/ProjectAllocationDashboard.tsx` | ⚠️ Avaliar | Alocação de projetos |
| `PROTO-BACK-001` | `prototype/BackupVersions.tsx` | ✅ Manter | Backup de versões |
| `PROTO-LEG-001` | `prototype/LegacyDashboard.tsx` | ❌ Remover | Código morto |
| `PROTO-QA-001` | `prototype/QualityAuditLegacy.tsx` | ❌ Remover | Código morto |
| `PROTO-STRAT-001` | `prototype/StrategicViewProto.tsx` | ⚠️ Avaliar | Visão estratégica |
| `PROTO-ORB-001` | `prototype/OrbitViewProto.tsx` | ⚠️ Avaliar | Visão orbital |

---

## ❌ CÓDIGO A REMOVER

| ID | Arquivo | Motivo | Fase de Remoção |
|----|---------|--------|-----------------|
| `LEGACY-DEL-001` | `components/ManagementDashboard.tsx` | Placeholder vazio (37 linhas) | FASE 5 |
| `LEGACY-DEL-002` | `components/PrototypeDashboard.tsx` | Duplicado de prototype/ | FASE 5 |
| `LEGACY-DEL-003` | `components/Management2Dashboard.tsx` | Apenas wrapper | FASE 5 |
| `LEGACY-DEL-004` | `components/LoginScreen.tsx` | Duplicado de pages/ | FASE 5 |

---

## 📁 ARQUIVOS DE DADOS

| ID | Arquivo | Status | Descrição |
|----|---------|--------|-----------|
| `DATA-CONST-001` | `constants.tsx` | ❌ Problema | 100% mock data |
| `DATA-TYPES-001` | `types.ts` | ✅ Ativo | Definições TypeScript |

---

## 🔍 COMO USAR ESTE DOCUMENTO

### Para solicitar mudança em um componente:
```
"Modifique o componente DASH-DAILY-001 para usar dados reais"
```

### Para verificar status de um componente:
```
"Qual é o status atual do COMP-SYNC-001?"
```

### Para adicionar novo componente:
```
1. Escolher categoria apropriada (DASH, COMP, etc.)
2. Pegar próximo número disponível
3. Adicionar neste documento
4. Adicionar header no arquivo:

/**
 * @id NOVO-ID-001
 * @name NomeDoComponente
 * @description Descrição
 * @dependencies IDs das dependências
 * @status active|mock|deprecated
 */
```

---

## 📊 ESTATÍSTICAS

| Categoria | Total | Ativos | Mock | A Criar | A Remover |
|-----------|-------|--------|------|---------|-----------|
| Pages | 4 | 4 | 0 | 0 | 0 |
| Dashboards | 9 | 2 | 7 | 0 | 0 |
| Serviços (v1) | 4 | 0 | 0 | 4 | 0 |
| Componentes | 9 | 5 | 3 | 0 | 1 |
| Contexts | 3 | 1 | 0 | 2 | 0 |
| Hooks | 4 | 0 | 0 | 4 | 0 |
| Protótipos | 13 | 5 | 0 | 0 | 2 |
| **TOTAL** | **46** | **17** | **10** | **10** | **3** |

---

**Legenda de Status:**
- ✅ Ativo - Funcionando corretamente
- ⚠️ Mock - Usando dados simulados
- ⚠️ Revisar - Precisa análise
- 📋 Pendente/Criar - Ainda não existe
- ❌ Remover/Refatorar - Código problemático
