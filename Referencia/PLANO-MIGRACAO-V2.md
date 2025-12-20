# 📋 PLANO COMPLETO DE MIGRAÇÃO - Daily Flow v2.0

**Documento Oficial de Planejamento**  
**Data de Criação:** 17 de Dezembro de 2025  
**Status:** 📋 Planejamento  
**Local de Implementação:** Pasta `/Referencia/` (v2.0)  
**⚠️ REGRA FUNDAMENTAL:** Não modificar NADA fora da pasta `/Referencia/`

---

## 📑 ÍNDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Diagnóstico do Projeto Atual](#2-diagnóstico-do-projeto-atual)
3. [Problemas Identificados](#3-problemas-identificados)
4. [Sistema de IDs para Componentes](#4-sistema-de-ids-para-componentes)
5. [Arquitetura Proposta v2.0](#5-arquitetura-proposta-v20)
6. [Mapa de Componentes com IDs](#6-mapa-de-componentes-com-ids)
7. [Plano de Migração Fase a Fase](#7-plano-de-migração-fase-a-fase)
8. [Serviços a Importar da v1.0](#8-serviços-a-importar-da-v10)
9. [Checklist de Validação](#9-checklist-de-validação)
10. [Rollback e Segurança](#10-rollback-e-segurança)
11. [Cronograma Estimado](#11-cronograma-estimado)

---

## 1. RESUMO EXECUTIVO

### 🎯 Objetivo
Transformar o projeto na pasta `/Referencia/` em uma versão 2.0 completa, implementando:
- ✅ Lógica real de backend (API ClickUp)
- ✅ Sistema de cache de 3 camadas da v1.0
- ✅ Sincronização real (não simulada)
- ✅ Tags e filtros funcionais com dados reais
- ✅ Organização modular com IDs únicos
- ✅ Separação clara entre componentes

### 🔒 Regras de Segurança
| Regra | Descrição |
|-------|-----------|
| **REGRA #1** | ❌ NUNCA modificar arquivos FORA da pasta `/Referencia/` |
| **REGRA #2** | ✅ COPIAR serviços da v1.0 para dentro de `/Referencia/` |
| **REGRA #3** | 🔄 Fazer backup antes de cada fase |
| **REGRA #4** | 📝 Documentar cada mudança com ID |

---

## 2. DIAGNÓSTICO DO PROJETO ATUAL

### 2.1 Versão 1.0 (Raiz do Projeto) - FUNCIONAL ✅

| Componente | Status | Linhas | Funcionalidade |
|------------|--------|--------|----------------|
| `App.tsx` | ✅ | ~800 | Dashboard principal com sync real |
| `services/clickup.ts` | ✅ | 1146 | API real com paginação e fallback |
| `services/advancedCacheService.ts` | ✅ | ~400 | Cache 3 camadas + compressão |
| `services/processor.ts` | ✅ | ~350 | Processamento de tarefas |
| `services/filterService.ts` | ✅ | ~200 | Sistema de filtros completo |
| `components/Dashboard.tsx` | ✅ | 1479 | Alinhamento diário REAL |
| `components/TestDashboard.tsx` | ✅ | 4017 | Dashboard de gestão REAL |

**O QUE FUNCIONA NA V1.0:**
- ✅ Cache de 3 camadas (IndexedDB, sessionStorage, localStorage)
- ✅ Sincronização incremental com ClickUp
- ✅ Filtros por tags, status, prioridade, assignee
- ✅ Cálculo de distribuição semanal
- ✅ Sistema de standup com comentários
- ✅ Compressão LZ-String
- ✅ Merge incremental de dados
- ✅ Detecção de mudanças

### 2.2 Versão Referencia (v2.0 em construção) - PROBLEMÁTICA ⚠️

| Arquivo | Status | Problema |
|---------|--------|----------|
| `Referencia/App.tsx` | ⚠️ | Usa MOCK_DATA, não é roteador |
| `Referencia/pages/App.tsx` | ⚠️ | É o roteador real mas confunde |
| `Referencia/constants.tsx` | ❌ | 100% dados mockados |
| `Referencia/components/ManagementDashboard.tsx` | ❌ | Placeholder VAZIO (37 linhas) |
| `Referencia/components/gestao/ManagementDashboard.tsx` | ⚠️ | Funcional mas usa mock |
| `Referencia/components/PrototypeDashboard.tsx` | ⚠️ | DUPLICADO |
| `Referencia/components/prototype/PrototypeDashboard.tsx` | ⚠️ | DUPLICADO |
| `Referencia/components/ImportSyncView.tsx` | ⚠️ | Simulação, não sync real |

---

## 3. PROBLEMAS IDENTIFICADOS

### 🔴 CRÍTICOS (Resolver primeiro)

| ID | Problema | Impacto | Solução |
|----|----------|---------|---------|
| **P-001** | TODOS os componentes usam `MOCK_DATA` | Nenhum dado real | Conectar com services reais |
| **P-002** | `ImportSyncView` é SIMULAÇÃO | Não sincroniza nada | Implementar sync real |
| **P-003** | Duplicação de componentes | Confusão, bugs | Unificar e deletar duplicados |
| **P-004** | Dois `App.tsx` com funções diferentes | Arquitetura confusa | Definir responsabilidades |
| **P-005** | Tags nunca são preenchidas | Filtros inúteis | Conectar com API real |

### 🟠 MÉDIOS (Resolver após críticos)

| ID | Problema | Impacto | Solução |
|----|----------|---------|---------|
| **P-006** | Pasta `gestao/` com 1 arquivo só | Estrutura incompleta | Reorganizar |
| **P-007** | Pasta `ruixen/` sem propósito claro | Código morto | Avaliar e remover |
| **P-008** | `Management2Dashboard` é só wrapper | Redundância | Simplificar |
| **P-009** | Múltiplos Timesheets redundantes | 4 versões | Unificar |
| **P-010** | LoginScreen duplicado | Manutenção dobrada | Unificar |

### 🟡 BAIXOS (Melhorias futuras)

| ID | Problema | Impacto | Solução |
|----|----------|---------|---------|
| **P-011** | 13 arquivos em `prototype/` misturados | Difícil manutenção | Categorizar |
| **P-012** | `DEV_NOTES.md` desatualizado | Documentação falha | Atualizar |
| **P-013** | AppContext muito simples | Falta estado global | Expandir |

---

## 4. SISTEMA DE IDS PARA COMPONENTES

### 4.1 Convenção de IDs

**Formato:** `[CATEGORIA]-[SUBCATEGORIA]-[NUMERO]`

```
CATEGORIAS:
├── PAGE    → Páginas/Rotas principais
├── DASH    → Dashboards
├── COMP    → Componentes reutilizáveis
├── SERV    → Serviços
├── CTX     → Contexts
├── HOOK    → Custom Hooks
├── UTIL    → Utilitários
├── PROTO   → Protótipos experimentais
└── LEGACY  → Código legado (para remoção futura)
```

### 4.2 Mapa Completo de IDs

#### 📄 PAGES (Rotas Principais)
| ID | Arquivo | Responsabilidade | Status |
|----|---------|------------------|--------|
| `PAGE-MAIN-001` | `pages/App.tsx` | Roteador + Sidebar | ✅ Manter |
| `PAGE-AUTH-001` | `pages/LoginScreen.tsx` | Autenticação | ✅ Manter |
| `PAGE-MGMT-001` | `pages/ManagementModule.tsx` | Hub de gestão | ⚠️ Revisar |
| `PAGE-TEAM-001` | `pages/TeamWorkloadDashboard.tsx` | Carga de equipe | ⚠️ Revisar |

#### 📊 DASHBOARDS
| ID | Arquivo | Responsabilidade | Status |
|----|---------|------------------|--------|
| `DASH-DAILY-001` | `components/DailyAlignmentDashboard.tsx` | Alinhamento diário | ⚠️ Conectar API |
| `DASH-PROJ-001` | `components/ProjectsDashboard.tsx` | Visão de projetos | ⚠️ Conectar API |
| `DASH-TEAM-001` | `components/GeneralTeamDashboard.tsx` | Equipe geral | ⚠️ Conectar API |
| `DASH-GOV-001` | `components/GovernanceDashboard.tsx` | Governança | ⚠️ Conectar API |
| `DASH-ALLOC-001` | `components/AllocationDashboard.tsx` | Alocação | ⚠️ Conectar API |
| `DASH-QUAL-001` | `components/QualityDashboard.tsx` | Qualidade | ⚠️ Conectar API |
| `DASH-MGMT-001` | `components/gestao/ManagementDashboard.tsx` | Gestão principal | ⚠️ Conectar API |
| `DASH-ADMIN-001` | `components/AdminDashboard.tsx` | Administração | ✅ Manter |
| `DASH-SETT-001` | `components/SettingsDashboard.tsx` | Configurações | ✅ Manter |

#### 🔌 SERVIÇOS (A IMPORTAR DA V1.0)
| ID | Arquivo Origem (v1.0) | Destino (v2.0) | Funcionalidade |
|----|----------------------|----------------|----------------|
| `SERV-CLICK-001` | `services/clickup.ts` | `Referencia/services/clickup.ts` | API ClickUp |
| `SERV-CACHE-001` | `services/advancedCacheService.ts` | `Referencia/services/advancedCacheService.ts` | Cache 3 camadas |
| `SERV-PROC-001` | `services/processor.ts` | `Referencia/services/processor.ts` | Processador |
| `SERV-FILT-001` | `services/filterService.ts` | `Referencia/services/filterService.ts` | Filtros |

#### 🧩 COMPONENTES REUTILIZÁVEIS
| ID | Arquivo | Responsabilidade | Status |
|----|---------|------------------|--------|
| `COMP-CARD-001` | `components/MetricCard.tsx` | Cards de métricas | ✅ Manter |
| `COMP-CARD-002` | `components/KPICard.tsx` | Cards KPI | ✅ Manter |
| `COMP-CHART-001` | `components/WorkloadCharts.tsx` | Gráficos | ✅ Manter |
| `COMP-CHART-002` | `components/CapacityChart.tsx` | Capacidade | ✅ Manter |
| `COMP-TABLE-001` | `components/TeamTable.tsx` | Tabela equipe | ✅ Manter |
| `COMP-PROG-001` | `components/ProgressBar.tsx` | Barra progresso | ✅ Manter |
| `COMP-FILT-001` | `components/FilterDashboard.tsx` | Filtros | ⚠️ Conectar |
| `COMP-SYNC-001` | `components/ImportSyncView.tsx` | Sincronização | ❌ Refatorar |

#### 🔬 PROTÓTIPOS (Pasta prototype/)
| ID | Arquivo | Decisão | Justificativa |
|----|---------|---------|---------------|
| `PROTO-HUB-001` | `prototype/PrototypeDashboard.tsx` | ✅ Manter | Hub de experimentos |
| `PROTO-TIME-001` | `prototype/WeeklyTimesheet.tsx` | ⚠️ Avaliar | Pode unificar |
| `PROTO-TIME-002` | `prototype/UnifiedTimesheet.tsx` | ⚠️ Avaliar | Pode unificar |
| `PROTO-TIME-003` | `prototype/MonthlyTimesheetGrid.tsx` | ⚠️ Avaliar | Pode unificar |
| `PROTO-BI-001` | `prototype/BI_Playground.tsx` | ✅ Manter | Experimentos BI |
| `PROTO-PRED-001` | `prototype/PredictiveDelaysView.tsx` | ✅ Manter | Predição |
| `PROTO-PRIO-001` | `prototype/PriorityDistributionProto.tsx` | ✅ Manter | Prioridades |
| `PROTO-ALLOC-001` | `prototype/ProjectAllocationDashboard.tsx` | ⚠️ Avaliar | Duplica DASH-ALLOC-001 |
| `PROTO-BACK-001` | `prototype/BackupVersions.tsx` | ✅ Manter | Útil |
| `PROTO-LEG-001` | `prototype/LegacyDashboard.tsx` | ❌ Remover | Código morto |
| `PROTO-QA-001` | `prototype/QualityAuditLegacy.tsx` | ❌ Remover | Código morto |
| `PROTO-STRAT-001` | `prototype/StrategicViewProto.tsx` | ⚠️ Avaliar | Experimental |
| `PROTO-ORB-001` | `prototype/OrbitViewProto.tsx` | ⚠️ Avaliar | Experimental |

#### ❌ CÓDIGO A REMOVER (Duplicados/Vazios)
| ID | Arquivo | Motivo |
|----|---------|--------|
| `LEGACY-DEL-001` | `components/ManagementDashboard.tsx` (raiz) | VAZIO - 37 linhas placeholder |
| `LEGACY-DEL-002` | `components/PrototypeDashboard.tsx` (raiz) | DUPLICADO do prototype/ |
| `LEGACY-DEL-003` | `components/Management2Dashboard.tsx` | Só wrapper |
| `LEGACY-DEL-004` | `components/LoginScreen.tsx` | DUPLICADO de pages/ |

---

## 5. ARQUITETURA PROPOSTA V2.0

### 5.1 Nova Estrutura de Pastas

```
Referencia/
├── 📁 core/                          # Arquivos fundamentais
│   ├── App.tsx                       # Entry point único
│   ├── types.ts                      # Tipagens TypeScript
│   ├── constants.ts                  # CONFIGURAÇÕES (não dados!)
│   └── theme.ts                      # Configurações visuais
│
├── 📁 pages/                         # Rotas principais (1 arquivo por rota)
│   ├── RootLayout.tsx                # Layout com Sidebar
│   ├── LoginPage.tsx                 # Autenticação
│   ├── SyncPage.tsx                  # Sincronização
│   ├── DailyPage.tsx                 # Alinhamento diário
│   ├── ProjectsPage.tsx              # Projetos
│   ├── ManagementPage.tsx            # Gestão unificada
│   ├── SettingsPage.tsx              # Configurações
│   ├── AdminPage.tsx                 # Administração
│   └── PrototypePage.tsx             # Laboratório de protótipos
│
├── 📁 features/                      # Módulos por funcionalidade
│   ├── 📁 daily/                     # [FEAT-DAILY]
│   │   ├── DailyAlignmentDashboard.tsx
│   │   ├── DailyFilters.tsx
│   │   └── hooks/useDailyData.ts
│   │
│   ├── 📁 management/                # [FEAT-MGMT]
│   │   ├── ManagementDashboard.tsx
│   │   ├── TeamWorkloadView.tsx
│   │   ├── AllocationView.tsx
│   │   └── hooks/useManagementData.ts
│   │
│   ├── 📁 projects/                  # [FEAT-PROJ]
│   │   ├── ProjectsDashboard.tsx
│   │   ├── ProjectCard.tsx
│   │   └── hooks/useProjectsData.ts
│   │
│   ├── 📁 quality/                   # [FEAT-QUAL]
│   │   ├── QualityDashboard.tsx
│   │   └── DataHealthMetrics.tsx
│   │
│   ├── 📁 timesheet/                 # [FEAT-TIME]
│   │   ├── TimesheetDashboard.tsx    # Unificado!
│   │   ├── WeeklyView.tsx
│   │   └── MonthlyView.tsx
│   │
│   └── 📁 governance/                # [FEAT-GOV]
│       └── GovernanceDashboard.tsx
│
├── 📁 components/                    # Componentes reutilizáveis APENAS
│   ├── 📁 cards/
│   │   ├── MetricCard.tsx
│   │   └── KPICard.tsx
│   ├── 📁 charts/
│   │   ├── WorkloadCharts.tsx
│   │   └── CapacityChart.tsx
│   ├── 📁 tables/
│   │   └── TeamTable.tsx
│   ├── 📁 layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── 📁 common/
│       ├── ProgressBar.tsx
│       ├── FilterBar.tsx
│       └── LoadingSpinner.tsx
│
├── 📁 services/                      # Lógica de negócio
│   ├── clickup.ts                    # API ClickUp (COPIAR DA V1.0)
│   ├── advancedCacheService.ts       # Cache 3 camadas (COPIAR DA V1.0)
│   ├── processor.ts                  # Processador (COPIAR DA V1.0)
│   ├── filterService.ts              # Filtros (COPIAR DA V1.0)
│   └── geminiService.ts              # IA (já existe)
│
├── 📁 contexts/                      # Estado global
│   ├── AppContext.tsx                # Context principal expandido
│   ├── AuthContext.tsx               # Autenticação
│   └── DataContext.tsx               # Dados do ClickUp
│
├── 📁 hooks/                         # Custom hooks globais
│   ├── useClickupSync.ts             # Hook de sincronização
│   ├── useCache.ts                   # Hook de cache
│   ├── useFilters.ts                 # Hook de filtros
│   └── useTasks.ts                   # Hook de tarefas
│
├── 📁 utils/                         # Funções utilitárias
│   ├── dateUtils.ts
│   ├── formatters.ts
│   └── validators.ts
│
├── 📁 prototype/                     # Experimentos isolados
│   ├── PrototypeHub.tsx              # Hub único de protótipos
│   ├── experiments/                  # Experimentos individuais
│   │   ├── PredictiveDelays.tsx
│   │   ├── BIPlayground.tsx
│   │   └── ...
│   └── README.md                     # Documentação de protótipos
│
├── 📁 archive/                       # Código legado para referência
│   └── _deprecated/
│
└── 📁 docs/                          # Documentação
    ├── PLANO-MIGRACAO-V2.md          # Este arquivo
    ├── COMPONENT-IDS.md              # Mapa de IDs
    └── CHANGELOG.md                  # Histórico de mudanças
```

### 5.2 Fluxo de Dados Proposto

```
┌─────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (v2.0)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │                    DataContext (Global)                   │     │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │     │
│   │  │   tasks     │  │   filters   │  │   metadata  │      │     │
│   │  │   (real)    │  │   (active)  │  │   (tags,etc)│      │     │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │     │
│   └─────────┼────────────────┼────────────────┼──────────────┘     │
│             │                │                │                     │
│   ┌─────────▼────────────────▼────────────────▼──────────────┐     │
│   │                     Custom Hooks                          │     │
│   │  useClickupSync()  useFilters()  useTasks()  useCache()  │     │
│   └─────────┬────────────────┬────────────────┬──────────────┘     │
│             │                │                │                     │
│   ┌─────────▼────────────────▼────────────────▼──────────────┐     │
│   │                    Features/Dashboards                    │     │
│   │  [DASH-DAILY-001]  [DASH-MGMT-001]  [DASH-PROJ-001]     │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               │ API Calls + Cache
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVICES                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │  clickup.ts    │  │advancedCache.ts  │  │  processor.ts     │   │
│  │  [SERV-CLICK]  │  │  [SERV-CACHE]    │  │  [SERV-PROC]      │   │
│  │                │  │                  │  │                   │   │
│  │ • fetchTasks() │  │ • Layer 1: meta  │  │ • processApiTasks │   │
│  │ • syncIncrem() │  │ • Layer 2: proc  │  │ • calcWeeklyDist  │   │
│  │ • getStandup() │  │ • Layer 3: raw   │  │ • groupByAssignee │   │
│  └───────┬────────┘  └────────┬─────────┘  └─────────┬─────────┘   │
│          │                    │                      │              │
│          └────────────────────┼──────────────────────┘              │
│                               │                                     │
└───────────────────────────────┼─────────────────────────────────────┘
                               │
                               ▼
                    ┌───────────────────┐
                    │   ClickUp API     │
                    │  (Fonte Verdade)  │
                    └───────────────────┘
```

---

## 6. MAPA DE COMPONENTES COM IDS

### 6.1 Tabela de Rastreamento Completa

| ID Único | Categoria | Arquivo Atual | Arquivo Novo | Status | Dependências |
|----------|-----------|---------------|--------------|--------|--------------|
| **PAGE-MAIN-001** | Page | `pages/App.tsx` | `pages/RootLayout.tsx` | 🔄 Renomear | Todos os DASH-* |
| **PAGE-AUTH-001** | Page | `pages/LoginScreen.tsx` | `pages/LoginPage.tsx` | 🔄 Renomear | AuthContext |
| **DASH-DAILY-001** | Dashboard | `components/DailyAlignmentDashboard.tsx` | `features/daily/DailyAlignmentDashboard.tsx` | 🔄 Mover + Conectar | SERV-CLICK, SERV-CACHE |
| **DASH-MGMT-001** | Dashboard | `components/gestao/ManagementDashboard.tsx` | `features/management/ManagementDashboard.tsx` | 🔄 Mover + Conectar | SERV-CLICK, SERV-CACHE |
| **DASH-PROJ-001** | Dashboard | `components/ProjectsDashboard.tsx` | `features/projects/ProjectsDashboard.tsx` | 🔄 Mover + Conectar | SERV-CLICK, SERV-CACHE |
| **COMP-SYNC-001** | Component | `components/ImportSyncView.tsx` | `features/sync/SyncDashboard.tsx` | ❌ Refatorar Total | SERV-CLICK, SERV-CACHE |
| **SERV-CLICK-001** | Service | `(v1.0) services/clickup.ts` | `services/clickup.ts` | 📋 Copiar | - |
| **SERV-CACHE-001** | Service | `(v1.0) services/advancedCacheService.ts` | `services/advancedCacheService.ts` | 📋 Copiar | lz-string |
| **SERV-PROC-001** | Service | `(v1.0) services/processor.ts` | `services/processor.ts` | 📋 Copiar | types |
| **SERV-FILT-001** | Service | `(v1.0) services/filterService.ts` | `services/filterService.ts` | 📋 Copiar | types |

### 6.2 Como Usar os IDs

**Para identificar um componente:**
```tsx
// No topo de cada arquivo, adicionar:
/**
 * @id DASH-DAILY-001
 * @name DailyAlignmentDashboard
 * @description Dashboard de alinhamento diário com dados reais do ClickUp
 * @dependencies SERV-CLICK-001, SERV-CACHE-001, CTX-DATA-001
 * @status active
 * @version 2.0.0
 */
```

**Para solicitar mudança:**
```
"Por favor, modifique o componente DASH-DAILY-001 para adicionar filtro por projeto"
```

---

## 7. PLANO DE MIGRAÇÃO FASE A FASE

### 📍 FASE 0: PREPARAÇÃO (Tempo: 30 min)
**Objetivo:** Preparar ambiente seguro

| # | Ação | Comando/Arquivo | Validação |
|---|------|-----------------|-----------|
| 0.1 | Backup completo da pasta Referencia | `xcopy Referencia Referencia_backup /E /I` | Pasta criada |
| 0.2 | Criar arquivo de IDs | `Referencia/docs/COMPONENT-IDS.md` | Arquivo existe |
| 0.3 | Criar CHANGELOG | `Referencia/docs/CHANGELOG.md` | Arquivo existe |

---

### 📍 FASE 1: COPIAR SERVIÇOS DA V1.0 (Tempo: 1-2 horas)
**Objetivo:** Trazer toda lógica de backend funcional

| # | Ação | Origem | Destino | Validação |
|---|------|--------|---------|-----------|
| 1.1 | Copiar clickup.ts | `services/clickup.ts` | `Referencia/services/clickup.ts` | Arquivo copiado |
| 1.2 | Copiar advancedCacheService.ts | `services/advancedCacheService.ts` | `Referencia/services/advancedCacheService.ts` | Arquivo copiado |
| 1.3 | Copiar processor.ts | `services/processor.ts` | `Referencia/services/processor.ts` | Arquivo copiado |
| 1.4 | Copiar filterService.ts | `services/filterService.ts` | `Referencia/services/filterService.ts` | Arquivo copiado |
| 1.5 | Copiar types relacionados | `types.ts` → extrair interfaces necessárias | `Referencia/types.ts` | Types atualizados |
| 1.6 | Ajustar imports | Atualizar caminhos em todos os serviços | - | Sem erros de import |

**⚠️ VALIDAÇÃO OBRIGATÓRIA:**
```bash
# Verificar se todos os arquivos existem
ls Referencia/services/
# Deve mostrar: clickup.ts, advancedCacheService.ts, processor.ts, filterService.ts, geminiService.ts
```

---

### 📍 FASE 2: CRIAR CONTEXTO DE DADOS (Tempo: 2-3 horas)
**Objetivo:** Centralizar estado global com dados reais

| # | Ação | Descrição |
|---|------|-----------|
| 2.1 | Expandir AppContext | Adicionar estado de tasks, metadata, syncStatus |
| 2.2 | Criar DataContext | Contexto separado para dados do ClickUp |
| 2.3 | Criar AuthContext | Contexto de autenticação real |
| 2.4 | Criar hook useClickupSync | Encapsular lógica de sincronização |
| 2.5 | Criar hook useFilters | Encapsular lógica de filtros |

**Estrutura do DataContext:**
```tsx
interface DataContextType {
  // Estado
  tasks: Task[];
  groupedData: GroupedData[];
  metadata: FilterMetadata;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSync: Date | null;
  
  // Ações
  syncData: (options: SyncOptions) => Promise<void>;
  applyFilters: (filters: FilterConfig) => Task[];
  clearCache: () => void;
  
  // Cache info
  cacheInfo: CacheMetadata;
}
```

---

### 📍 FASE 3: REFATORAR ImportSyncView → SyncDashboard (Tempo: 3-4 horas)
**Objetivo:** Substituir simulação por sync real

| # | Ação | Antes | Depois |
|---|------|-------|--------|
| 3.1 | Remover simulação | `setTimeout` simulando fetch | `fetchTasksFromApi()` real |
| 3.2 | Implementar logs reais | Texto estático | Logs de paginação, contagem |
| 3.3 | Mostrar progresso real | Barra falsa | Progresso de páginas carregadas |
| 3.4 | Exibir resultado real | Delta fictício | Tarefas adicionadas/modificadas |
| 3.5 | Integrar cache | Nenhum | 3 camadas de cache |

---

### 📍 FASE 4: CONECTAR DASHBOARDS (Tempo: 4-6 horas)
**Objetivo:** Trocar MOCK_DATA por dados reais em cada dashboard

| # | Dashboard | Arquivo | Mudanças Necessárias |
|---|-----------|---------|---------------------|
| 4.1 | DailyAlignment | `DASH-DAILY-001` | Trocar `MOCK_LEGACY_DATA` por `useDataContext().groupedData` |
| 4.2 | Management | `DASH-MGMT-001` | Trocar `MOCK_TEAM_DATA` por dados processados |
| 4.3 | Projects | `DASH-PROJ-001` | Trocar mock por dados reais |
| 4.4 | Team Workload | `PAGE-TEAM-001` | Trocar mock por dados reais |
| 4.5 | General Team | `DASH-TEAM-001` | Trocar mock por dados reais |

**Padrão de substituição:**
```tsx
// ANTES (mock)
import { MOCK_LEGACY_DATA, MOCK_TEAM_DATA } from '../constants';
const data = MOCK_LEGACY_DATA;

// DEPOIS (real)
import { useData } from '../contexts/DataContext';
const { groupedData, tasks, isLoading } = useData();
```

---

### 📍 FASE 5: LIMPAR DUPLICADOS (Tempo: 1-2 horas)
**Objetivo:** Remover código morto e duplicado

| # | Arquivo a Remover | ID | Justificativa |
|---|-------------------|-----|---------------|
| 5.1 | `components/ManagementDashboard.tsx` | `LEGACY-DEL-001` | Placeholder vazio |
| 5.2 | `components/PrototypeDashboard.tsx` | `LEGACY-DEL-002` | Duplicado |
| 5.3 | `components/Management2Dashboard.tsx` | `LEGACY-DEL-003` | Só wrapper |
| 5.4 | `components/LoginScreen.tsx` | `LEGACY-DEL-004` | Duplicado |

**⚠️ ANTES DE DELETAR:**
1. Verificar se não há imports ativos
2. Grep em todos os arquivos: `grep -r "ManagementDashboard" Referencia/`
3. Atualizar imports se necessário

---

### 📍 FASE 6: REORGANIZAR ESTRUTURA (Tempo: 2-3 horas)
**Objetivo:** Aplicar nova estrutura de pastas

| # | Ação | Origem | Destino |
|---|------|--------|---------|
| 6.1 | Criar pasta features/ | - | `Referencia/features/` |
| 6.2 | Mover DailyAlignment | `components/` | `features/daily/` |
| 6.3 | Mover Management | `components/gestao/` | `features/management/` |
| 6.4 | Mover Projects | `components/` | `features/projects/` |
| 6.5 | Criar pasta components/cards | - | Mover MetricCard, KPICard |
| 6.6 | Criar pasta components/charts | - | Mover WorkloadCharts |
| 6.7 | Atualizar TODOS os imports | - | `grep -r "from '../components"` |

---

### 📍 FASE 7: IMPLEMENTAR FILTROS REAIS (Tempo: 2-3 horas)
**Objetivo:** Tags e filtros funcionais

| # | Ação | Descrição |
|---|------|-----------|
| 7.1 | Extrair metadata na sync | Coletar tags únicas, statuses, assignees |
| 7.2 | Popular filtros automaticamente | Usar metadata para popular dropdowns |
| 7.3 | Aplicar filtros client-side | Usar filterService.ts |
| 7.4 | Persistir filtros | Salvar em localStorage |

---

### 📍 FASE 8: TESTES E VALIDAÇÃO (Tempo: 2-3 horas)
**Objetivo:** Garantir que tudo funciona

| # | Teste | Critério de Sucesso |
|---|-------|---------------------|
| 8.1 | Sync funciona | Tarefas carregam do ClickUp |
| 8.2 | Cache funciona | Segunda carga é instantânea |
| 8.3 | Filtros funcionam | Filtrar por tag mostra subset correto |
| 8.4 | Dashboards mostram dados | Todos os dashboards renderizam |
| 8.5 | Navegação funciona | Todas as rotas acessíveis |
| 8.6 | Sem erros no console | Zero erros TypeScript/Runtime |

---

## 8. SERVIÇOS A IMPORTAR DA V1.0

### 8.1 clickup.ts (CRÍTICO)

**Funções a importar:**
| Função | Linhas | Responsabilidade |
|--------|--------|------------------|
| `fetchTasksFromApi()` | ~200 | Fetch com paginação |
| `fetchTasksIncremental()` | ~100 | Sync incremental |
| `fetchAllTeamSpaceTasks()` | ~150 | Buscar por team |
| `fetchMultipleListTasks()` | ~100 | Buscar por lists |
| `fetchTaskById()` | ~50 | Buscar tarefa única |
| `fetchStandupComments()` | ~100 | Comentários de standup |
| `deduplicateTasks()` | ~30 | Remover duplicados |
| `getProxiedUrl()` | ~50 | CORS proxy fallback |

### 8.2 advancedCacheService.ts (CRÍTICO)

**Funções a importar:**
| Função | Responsabilidade |
|--------|------------------|
| `getMetadata()` / `saveMetadata()` | Layer 1 - localStorage |
| `getProcessedData()` / `saveProcessedData()` | Layer 2 - sessionStorage + LZ |
| `getRawData()` / `saveRawData()` | Layer 3 - IndexedDB |
| `mergeIncrementalData()` | Merge inteligente |
| `clearAllCache()` | Limpar cache |
| `getCacheInfo()` | Informações de cache |

### 8.3 processor.ts (IMPORTANTE)

**Funções a importar:**
| Função | Responsabilidade |
|--------|------------------|
| `processApiTasks()` | Normalizar tarefas da API |
| `groupTasksByAssignee()` | Agrupar por pessoa |
| `calculateWeeklyDistribution()` | Distribuir horas na semana |
| `calculateWorkingDays()` | Calcular dias úteis |
| `extractFilterMetadata()` | Extrair tags/status/etc |

### 8.4 filterService.ts (IMPORTANTE)

**Funções a importar:**
| Função | Responsabilidade |
|--------|------------------|
| `applyFilters()` | Aplicar todos os filtros |
| `filterByTags()` | Filtrar por tags |
| `filterByStatus()` | Filtrar por status |
| `filterByAssignee()` | Filtrar por pessoa |
| `filterByDateRange()` | Filtrar por período |
| `saveFilterGroup()` | Salvar grupo de filtros |
| `loadFilterGroups()` | Carregar grupos salvos |

---

## 9. CHECKLIST DE VALIDAÇÃO

### 9.1 Checklist por Fase

#### ✅ FASE 1 - Serviços Copiados
```
[ ] clickup.ts copiado e funcional
[ ] advancedCacheService.ts copiado e funcional
[ ] processor.ts copiado e funcional
[ ] filterService.ts copiado e funcional
[ ] Todos os imports corrigidos
[ ] Nenhum erro de TypeScript
```

#### ✅ FASE 2 - Contextos Criados
```
[ ] DataContext implementado
[ ] AuthContext implementado
[ ] useClickupSync hook funcionando
[ ] useFilters hook funcionando
[ ] Estado global acessível em todos os componentes
```

#### ✅ FASE 3 - Sync Funcional
```
[ ] ImportSyncView conectado à API real
[ ] Logs mostram progresso real
[ ] Cache é populado após sync
[ ] Contador de tarefas correto
```

#### ✅ FASE 4 - Dashboards Conectados
```
[ ] DailyAlignmentDashboard mostra dados reais
[ ] ManagementDashboard mostra dados reais
[ ] ProjectsDashboard mostra dados reais
[ ] Nenhum dashboard usa MOCK_DATA
```

#### ✅ FASE 5 - Duplicados Removidos
```
[ ] ManagementDashboard vazio deletado
[ ] PrototypeDashboard duplicado deletado
[ ] Management2Dashboard wrapper deletado
[ ] LoginScreen duplicado deletado
[ ] Nenhum import quebrado
```

#### ✅ FASE 6 - Estrutura Reorganizada
```
[ ] Pasta features/ criada
[ ] Componentes movidos corretamente
[ ] Imports atualizados
[ ] Aplicação compila sem erros
```

#### ✅ FASE 7 - Filtros Funcionais
```
[ ] Tags são extraídas automaticamente
[ ] Dropdown de filtros populado
[ ] Filtros aplicam corretamente
[ ] Filtros persistem após reload
```

---

## 10. ROLLBACK E SEGURANÇA

### 10.1 Estratégia de Backup

**Antes de cada fase:**
```powershell
# Criar backup numerado
$fase = "FASE1"
$data = Get-Date -Format "yyyy-MM-dd_HHmm"
$backup = "Referencia_backup_${fase}_${data}"
Copy-Item -Path "Referencia" -Destination $backup -Recurse
```

**Estrutura de backups:**
```
Daily - Copia/
├── Referencia/                    # Versão atual (em trabalho)
├── Referencia_backup_FASE0_2024-12-17_1430/
├── Referencia_backup_FASE1_2024-12-17_1600/
├── Referencia_backup_FASE2_2024-12-17_1800/
└── ...
```

### 10.2 Como Fazer Rollback

**Se algo der errado:**
```powershell
# 1. Verificar qual backup usar
Get-ChildItem -Directory | Where-Object {$_.Name -like "Referencia_backup*"}

# 2. Remover versão problemática
Remove-Item -Path "Referencia" -Recurse -Force

# 3. Restaurar backup
Copy-Item -Path "Referencia_backup_FASE1_2024-12-17_1600" -Destination "Referencia" -Recurse
```

### 10.3 Pontos de Não Retorno

| Fase | Risco | Mitigação |
|------|-------|-----------|
| FASE 1 | Baixo | Apenas cópia de arquivos |
| FASE 2 | Baixo | Novos arquivos apenas |
| FASE 3 | Médio | Backup obrigatório antes |
| FASE 4 | Médio | Testar cada dashboard individualmente |
| FASE 5 | **ALTO** | ⚠️ VERIFICAR IMPORTS ANTES DE DELETAR |
| FASE 6 | Médio | Backup obrigatório antes |

---

## 11. CRONOGRAMA ESTIMADO

### 11.1 Visão Geral

| Fase | Descrição | Tempo Estimado | Dependências |
|------|-----------|----------------|--------------|
| **FASE 0** | Preparação | 30 min | - |
| **FASE 1** | Copiar Serviços | 1-2 horas | FASE 0 |
| **FASE 2** | Criar Contextos | 2-3 horas | FASE 1 |
| **FASE 3** | Refatorar Sync | 3-4 horas | FASE 2 |
| **FASE 4** | Conectar Dashboards | 4-6 horas | FASE 3 |
| **FASE 5** | Limpar Duplicados | 1-2 horas | FASE 4 |
| **FASE 6** | Reorganizar | 2-3 horas | FASE 5 |
| **FASE 7** | Filtros Reais | 2-3 horas | FASE 6 |
| **FASE 8** | Testes | 2-3 horas | FASE 7 |
| **TOTAL** | - | **18-27 horas** | - |

### 11.2 Sugestão de Divisão por Dias

| Dia | Fases | Horas | Objetivo |
|-----|-------|-------|----------|
| **Dia 1** | FASE 0, 1, 2 | ~5h | Backend funcional |
| **Dia 2** | FASE 3, 4 (parcial) | ~5h | Sync e primeiros dashboards |
| **Dia 3** | FASE 4 (resto), 5 | ~5h | Todos dashboards + limpeza |
| **Dia 4** | FASE 6, 7 | ~5h | Estrutura + filtros |
| **Dia 5** | FASE 8 | ~3h | Testes e ajustes finais |

---

## 📝 NOTAS FINAIS

### Comandos Úteis

```powershell
# Verificar erros de TypeScript
cd Referencia
npx tsc --noEmit

# Buscar imports quebrados
Select-String -Path "Referencia/**/*.tsx" -Pattern "from '\.\./" | Select-Object -First 20

# Contar linhas por arquivo
Get-ChildItem -Recurse -Filter "*.tsx" | ForEach-Object { 
  $lines = (Get-Content $_.FullName).Count
  [PSCustomObject]@{File=$_.Name; Lines=$lines}
} | Sort-Object Lines -Descending
```

### Lembre-se:

1. **NUNCA** modificar arquivos fora de `/Referencia/`
2. **SEMPRE** fazer backup antes de cada fase
3. **TESTAR** incrementalmente, não tudo de uma vez
4. **DOCUMENTAR** cada mudança com o ID do componente
5. **VALIDAR** que a v1.0 continua funcionando após cada fase

---

**Documento criado para:** Migração Daily Flow v1.0 → v2.0  
**Última atualização:** 17 de Dezembro de 2025  
**Autor:** GitHub Copilot + Thiago  
**Status:** 📋 Aguardando execução
