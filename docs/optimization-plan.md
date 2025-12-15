# 🚀 Plano de Otimização - DailyFlow

## 📊 Problema Atual

### Sintomas:
- Sincronização demora muito (60s timeout)
- Cache não está salvando `rawData` (muito grande para localStorage)
- Sem carregamento instantâneo ao reabrir o app
- Filtros na API devem estar no Admin, mas precisam de lista completa de tags

### Causa Raiz:
1. **localStorage limitado a ~5-10MB** - `rawData` completo não cabe
2. **Sem compressão** - Dados JSON ocupam muito espaço
3. **Sem IndexedDB** - Melhor para dados grandes
4. **Sem estratégia incremental** - Baixa tudo sempre

---

## 🎯 Solução Proposta: Sistema de Cache em 3 Camadas

### **Camada 1: Metadata Cache (localStorage)**
```typescript
interface MetadataCache {
  version: string;
  lastSync: string;
  taskCount: number;
  tags: string[];           // ← Lista completa de tags
  statuses: string[];
  assignees: string[];
  projects: string[];
  priorities: string[];
}
```
- **Tamanho:** ~10-50KB
- **Velocidade:** Instantânea
- **Uso:** Carregar dropdowns de filtros imediatamente

### **Camada 2: Processed Data (localStorage comprimido)**
```typescript
interface ProcessedCache {
  data: GroupedData[];      // Dados já processados para dashboard
  compressed: boolean;
  timestamp: string;
}
```
- **Tamanho:** ~500KB-2MB (com compressão LZ)
- **Velocidade:** <500ms
- **Uso:** Mostrar dashboard instantaneamente

### **Camada 3: Raw Data (IndexedDB)**
```typescript
interface RawDataStore {
  tasks: ClickUpApiTask[];  // Dados brutos completos
  timestamp: string;
  version: string;
}
```
- **Tamanho:** Ilimitado (~50MB)
- **Velocidade:** ~1-2s
- **Uso:** Reprocessar filtros sem fazer nova API call

---

## 📝 Implementação por Etapas

### **FASE 1: Cache Inteligente com Compressão** ⭐ (Prioridade Alta)

#### 1.1. Criar `advancedCacheService.ts`
```typescript
import lz from 'lz-string';

interface CacheStrategy {
  metadata: MetadataCache;
  processedData: ProcessedCache;
  rawData?: RawDataStore; // Opcional (IndexedDB)
}

class AdvancedCacheService {
  // Salvar metadata (pequeno, rápido)
  saveMetadata(metadata: MetadataCache): void;
  
  // Salvar dados processados (comprimido)
  saveProcessedData(data: GroupedData[]): void;
  
  // Salvar rawData no IndexedDB
  async saveRawData(tasks: ClickUpApiTask[]): Promise<void>;
  
  // Carregar em camadas
  loadMetadata(): MetadataCache | null;
  loadProcessedData(): GroupedData[] | null;
  async loadRawData(): Promise<ClickUpApiTask[] | null>;
}
```

#### 1.2. Instalar compressão
```bash
npm install lz-string
```

#### 1.3. Modificar `handleApiSync` para usar cache em camadas
```typescript
const handleApiSync = async () => {
  // 1. Extrair metadata PRIMEIRO (antes de processar)
  const metadata = extractFilterMetadata(rawTasks);
  cacheService.saveMetadata(metadata);
  
  // 2. Processar dados
  const processed = processApiTasks(filtered, config);
  cacheService.saveProcessedData(processed);
  
  // 3. Salvar rawData no IndexedDB (assíncrono, não bloqueia)
  cacheService.saveRawData(rawTasks).catch(console.error);
};
```

---

### **FASE 2: Carregamento Instantâneo** ⭐ (Prioridade Alta)

#### 2.1. Modificar App.tsx - useEffect inicial
```typescript
useEffect(() => {
  // Carregar metadata instantaneamente
  const metadata = cacheService.loadMetadata();
  if (metadata) {
    setAvailableTags(metadata.tags);
    setAvailableStatuses(metadata.statuses);
    // ... outros metadados
  }
  
  // Carregar dados processados (rápido)
  const cachedData = cacheService.loadProcessedData();
  if (cachedData) {
    setData(cachedData);
    setActiveView('projects'); // Mostrar dashboard imediatamente
  }
  
  // Carregar rawData em background (lento)
  cacheService.loadRawData().then(raw => {
    if (raw) setRawData(raw);
  });
}, []);
```

#### 2.2. Resultado Esperado
- **0-100ms:** Filtros disponíveis (tags, status, etc.)
- **100-500ms:** Dashboard visível
- **500-2s:** RawData carregado (para reprocessar filtros)

---

### **FASE 3: Mover Filtro API para Admin** ⭐ (Prioridade Média)

#### 3.1. Criar componente TagSelector no Admin
```tsx
// Em Settings.tsx (admin view)
<div className="bg-white p-6 rounded-2xl">
  <h3>Filtro de Tags (API)</h3>
  <p className="text-xs text-amber-500">
    ⚠️ Estas tags são aplicadas NA API. Reduz volume de dados.
  </p>
  
  {/* Mostrar todas as tags disponíveis */}
  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
    {availableTags.map(tag => (
      <label key={tag} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={localConfig.apiTagFilters?.includes(tag)}
          onChange={(e) => handleApiTagToggle(tag, e.target.checked)}
        />
        <span>{tag}</span>
      </label>
    ))}
  </div>
  
  <p className="text-xs text-slate-400 mt-2">
    💡 Tags selecionadas: {localConfig.apiTagFilters?.length || 0}
  </p>
</div>
```

#### 3.2. Carregar tags do metadata cache
```typescript
const [availableTags, setAvailableTags] = useState<string[]>([]);

useEffect(() => {
  const metadata = cacheService.loadMetadata();
  if (metadata?.tags) {
    setAvailableTags(metadata.tags);
  }
}, []);
```

---

### **FASE 4: Sincronização Incremental** (Prioridade Baixa)

#### 4.1. Sync apenas tarefas modificadas
```typescript
// ClickUp API suporta filter por updated_date
const lastSync = cacheService.getLastSyncTime();
const deltaUrl = `${baseUrl}&date_updated_gt=${lastSync}`;

// Merge com cache local
const cachedTasks = await cacheService.loadRawData();
const updatedTasks = mergeTaskUpdates(cachedTasks, deltaTasks);
```

---

## 📈 Resultados Esperados

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Tempo inicial** | 0s (vazio) | 100-500ms | ⚡ Instantâneo |
| **Cache size** | ❌ Overflow | ✅ 2-5MB | 🎯 Otimizado |
| **Sync completo** | 30-60s | 10-20s | 🚀 50% mais rápido |
| **Disponibilidade offline** | ❌ Nenhuma | ✅ Total | 💪 100% |
| **Admin: Lista de tags** | ❌ Nenhuma | ✅ Todas | ✨ Completo |

---

## 🔧 Implementação Técnica

### Stack Recomendado:
1. **lz-string** - Compressão texto (70-90% redução)
2. **IndexedDB** - Storage grande (50MB+)
3. **idb-keyval** - Wrapper simples para IndexedDB

### Estrutura de Arquivos:
```
/app/services/
  ├── cacheService.ts          # Cache avançado (novo)
  ├── metadataCache.ts         # Camada 1
  ├── processedCache.ts        # Camada 2
  └── indexedDBCache.ts        # Camada 3
```

---

## ⏱️ Timeline Estimado

| Fase | Tarefa | Tempo | Status |
|------|--------|-------|--------|
| 1 | Criar advancedCacheService.ts | 2h | ⏳ |
| 1 | Implementar compressão LZ | 1h | ⏳ |
| 1 | Integrar no handleApiSync | 1h | ⏳ |
| 2 | Carregamento em camadas | 2h | ⏳ |
| 2 | Teste de performance | 1h | ⏳ |
| 3 | Mover filtro API para Admin | 2h | ⏳ |
| 3 | UI TagSelector | 1h | ⏳ |
| 4 | Sync incremental (opcional) | 4h | 📅 |

**Total FASE 1-3:** ~10 horas
**Total com FASE 4:** ~14 horas

---

## 🎯 Próximos Passos Imediatos

1. ✅ **Aprovar plano** - Review e ajustes
2. 🔧 **Instalar dependências** - `npm install lz-string idb-keyval`
3. 🚀 **Implementar FASE 1** - Cache com compressão
4. 🧪 **Testar com dados reais** - Validar performance
5. 📊 **Medir resultados** - Comparar antes/depois

---

## 💡 Benefícios Adicionais

- ✅ **Experiência offline** - Dashboard funciona sem internet
- ✅ **Reduz carga na API** - Menos requests ao ClickUp
- ✅ **Filtros mais rápidos** - Não precisa refazer API call
- ✅ **Admin melhorado** - Lista completa de tags disponíveis
- ✅ **Escalável** - Suporta 1000+ tarefas

---

## 🐛 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| IndexedDB não suportado | Baixa | Médio | Fallback para localStorage |
| Cache corrompido | Média | Alto | Versionamento + validação |
| Compressão lenta | Baixa | Baixo | Web Worker (assíncrono) |
| Dados desatualizados | Média | Médio | TTL + botão "Forçar Sync" |

---

## 📚 Referências Técnicas

- [LZ-String Compression](https://github.com/pieroxy/lz-string)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [idb-keyval Wrapper](https://github.com/jakearchibald/idb-keyval)
- [LocalStorage Limits](https://stackoverflow.com/questions/2989284/what-is-the-max-size-of-localstorage-values)

