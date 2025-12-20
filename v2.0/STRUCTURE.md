# Daily Flow v2.0 - Estrutura do Projeto

## Estrutura de Pastas

```
v2.0/
├── types.ts                    # [TYPE-001] Tipos globais
├── constants.ts                # [CONST-001] Constantes (sem MOCK_DATA!)
├── App.tsx                     # [APP-001] Entry point
├── index.tsx                   # [INDEX-001] React root
│
├── types/
│   └── FilterConfig.ts         # [TYPE-FILT-001] Tipos de filtro
│
├── services/
│   ├── clickup.ts              # [SERV-CLICK-001] API ClickUp
│   ├── advancedCacheService.ts # [SERV-CACHE-001] Cache 3 camadas
│   ├── filterService.ts        # [SERV-FILT-001] Filtros salvos
│   └── processor.ts            # [SERV-PROC-001] Processamento
│
├── contexts/
│   ├── DataContext.tsx         # [CTX-DATA-001] Estado global de dados
│   └── AuthContext.tsx         # [CTX-AUTH-001] Autenticação
│
├── hooks/
│   ├── useClickupSync.ts       # [HOOK-SYNC-001] Sincronização
│   ├── useFilters.ts           # [HOOK-FILT-001] Filtros
│   ├── useTasks.ts             # [HOOK-TASK-001] Acesso a tasks
│   └── useCache.ts             # [HOOK-CACHE-001] Gerencia cache
│
├── components/
│   └── (componentes limpos, sem duplicados)
│
└── pages/
    └── (páginas organizadas por funcionalidade)
```

## Regras v2.0

1. **ZERO MOCK_DATA** - Tudo usa dados reais ou estado de loading
2. **IDs obrigatórios** - Todo arquivo tem ID único no header
3. **Sem duplicados** - Uma funcionalidade = um arquivo
4. **Contexts > Props drilling** - Dados globais via context
5. **Hooks > Lógica inline** - Lógica reutilizável em hooks

## Mapeamento de IDs

### Páginas (PAGE-XXX-001)
| ID | Nome | Descrição |
|----|------|-----------|
| PAGE-DASH-001 | Dashboard | Painel principal |
| PAGE-SYNC-001 | ImportSyncView | Sincronização |
| PAGE-ALIGN-001 | DailyAlignment | Alinhamento diário |
| PAGE-WORK-001 | Workload | Carga de trabalho |
| PAGE-SETT-001 | Settings | Configurações |

### Componentes (COMP-XXX-001)
| ID | Nome | Descrição |
|----|------|-----------|
| COMP-TASK-001 | TaskTable | Tabela de tarefas |
| COMP-FILT-001 | Filters | Barra de filtros |
| COMP-CARD-001 | KPICard | Card de métrica |
| COMP-CHART-001 | Charts | Gráficos |

## Changelog

### v2.0.0 (2025-12-17)
- Estrutura limpa criada
- Services migrados da v1.0
- Contexts implementados
