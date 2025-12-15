# 📋 Checklist Pré-Deploy - DailyFlow

**Data da Análise:** 10/12/2025  
**Versão:** 1.0.0  
**Status do Build:** ✅ Passou (439KB gzip)

---

## 🔴 CRÍTICO - Bloqueadores de Deploy

### 1. ⚠️ Segurança - Tokens Expostos
**Status:** ❌ URGENTE  
**Impacto:** Alto risco de segurança  

**Problema:**
```typescript
// App.tsx linha 50
localStorage.getItem('dailyPresenterConfig') // Token em plaintext
```

**Solução:**
- [ ] Criar `.env` e `.env.example`
- [ ] Mover token para variável de ambiente `VITE_CLICKUP_TOKEN`
- [ ] Implementar proxy backend no Vercel
- [ ] Remover storage de token no frontend

**Código de exemplo:**
```typescript
// .env
VITE_CLICKUP_API_URL=https://api.clickup.com/api/v2
CLICKUP_API_TOKEN=pk_xxxxx // Apenas no servidor
```

---

### 2. 🌐 CORS/Proxy em Produção
**Status:** ❌ BLOQUEADOR  
**Impacto:** API calls falharão completamente  

**Problema:**
```typescript
// vite.config.ts linha 11 - só funciona em DEV
proxy: {
  '/api-clickup': {
    target: 'https://api.clickup.com',
    // Não existe em produção!
  }
}
```

**Solução:**
- [ ] Configurar Vercel Serverless Function em `/api/proxy.js`
- [ ] Atualizar `clickup.ts` para detectar ambiente
- [ ] Adicionar fallback para proxy público
- [ ] Testar em produção

**Implementação:**
```typescript
// services/clickup.ts
const API_BASE = import.meta.env.PROD 
  ? '/api/clickup-proxy' // Vercel function
  : '/api-clickup'; // Vite proxy local
```

---

### 3. 📝 Variáveis de Ambiente
**Status:** ❌ FALTANDO  
**Impacto:** Deploy falhará  

**Arquivos necessários:**
```bash
# .env.example (template)
VITE_APP_NAME=DailyFlow
VITE_API_TIMEOUT=180000
VITE_CACHE_VERSION=3.0.0

# .env.production (Vercel)
CLICKUP_API_TOKEN=<secret>
VERCEL_URL=<auto>
```

**Ações:**
- [ ] Criar `.env.example`
- [ ] Adicionar `.env*` no `.gitignore`
- [ ] Configurar secrets no Vercel Dashboard
- [ ] Documentar no README

---

### 4. ❌ Error Handling Inadequado
**Status:** ⚠️ CRÍTICO  
**Impacto:** UX ruim + crashes  

**Problemas:**
```typescript
// App.tsx linha 170 - timeout fixo de 180s
setTimeout(() => {
  setLoading(false);
  alert('Sincronização demorou muito.'); // UI blocking
}, 180000);
```

**Melhorias:**
- [ ] Substituir `alert()` por toast notifications
- [ ] Implementar retry logic (3 tentativas)
- [ ] Adicionar Error Boundary
- [ ] Mostrar mensagens de erro específicas

**Código:**
```tsx
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
    // Enviar para Sentry
  }
}
```

---

### 5. 🚀 Build para Vercel
**Status:** ⚠️ PRECISA CONFIGURAÇÃO  
**Impacto:** Deploy pode falhar  

**Checklist:**
- [ ] Configurar `vercel.json` corretamente
- [ ] Testar build local: `npm run build`
- [ ] Verificar tamanho do bundle (<500KB)
- [ ] Configurar redirects e rewrites
- [ ] Adicionar headers de segurança

**vercel.json atualizado:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/clickup-proxy/:path*", "destination": "/api/proxy" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

---

## 🟠 ALTO - Impacto Significativo

### 6. 💾 Cache Excessivo
**Status:** ⚠️ IMPORTANTE  
**Impacto:** Performance degradada  

**Problema:**
- localStorage limitado a 5-10MB
- Compressão nem sempre suficiente
- Múltiplas camadas podem conflitar

**Solução:**
- [ ] Implementar LRU cache (limitar a 1000 tarefas)
- [ ] Migrar completamente para IndexedDB
- [ ] Adicionar cleanup automático de cache antigo
- [ ] Monitorar uso de storage

---

### 7. 🧠 Memory Leaks
**Status:** ⚠️ IMPORTANTE  
**Impacto:** App pode travar após uso prolongado  

**Problemas encontrados:**
```typescript
// Dashboard.tsx linha 239
const [fetchedTasks, setFetchedTasks] = useState<Map<...>>(new Map());
// Map cresce indefinidamente
```

**Soluções:**
- [ ] Implementar cleanup em useEffect
- [ ] Limitar tamanho do Map (max 100 entradas)
- [ ] Usar WeakMap quando possível
- [ ] Adicionar clear() ao desmontar

---

### 8. 🔄 Paginação Perigosa
**Status:** ⚠️ IMPORTANTE  
**Impacto:** Loop infinito possível  

**Problema:**
```typescript
// clickup.ts linha 289
while (hasMore && page < MAX_PAGES) {
  // Se API retornar sempre hasMore=true?
}
```

**Melhorias:**
- [ ] Adicionar verificação de progresso
- [ ] Kill switch se 3 páginas sem novos dados
- [ ] Timeout por página (30s)
- [ ] Logging de paginação

---

### 9. 📝 TypeScript Errors
**Status:** ⚠️ MÉDIO  
**Impacto:** Type safety comprometida  

**Problemas:**
- `// @ts-ignore` em vite-env.d.ts
- `any` em 15+ lugares
- Tipagem fraca em filterService

**Ações:**
- [ ] Remover todos `@ts-ignore`
- [ ] Substituir `any` por tipos específicos
- [ ] Adicionar validação runtime com Zod
- [ ] Habilitar `strict: true` no tsconfig

---

### 10. 📊 Console Logs
**Status:** ⚠️ MÉDIO  
**Impacto:** Performance + segurança  

**Estatísticas:**
- 47 `console.log()` encontrados
- 12 `console.error()` sem tratamento
- Dados sensíveis podem vazar

**Solução:**
```typescript
// utils/logger.ts
const logger = {
  log: (...args) => {
    if (import.meta.env.DEV) console.log(...args);
  },
  error: (...args) => {
    console.error(...args);
    // Enviar para Sentry em produção
  }
};
```

---

## 🟡 MÉDIO - Melhorias Importantes

### 11-16. Lista Resumida
- **Validação de Dados:** Adicionar Zod schemas
- **Acessibilidade:** ARIA labels, keyboard nav
- **Responsividade:** Testar em tablets
- **Loading States:** Skeleton loaders
- **Duplicação:** Refatorar funções comuns
- **Ordenação:** Centralizar lógica de sort

---

## 🟢 BAIXO - Polimento

### 17-24. Lista Resumida
- Lazy loading de componentes
- Otimização de assets
- Testes unitários (Vitest)
- Documentação completa
- Error tracking (Sentry)
- SEO e meta tags
- PWA features
- Code splitting

---

## 🎯 PLANO DE AÇÃO

### **Sprint 1: Pré-Deploy (HOJE)**
**Tempo estimado: 2-3 horas**

```bash
✅ Fase 1.1 - Configuração (30min)
- [ ] Criar .env e .env.example
- [ ] Configurar vercel.json
- [ ] Atualizar .gitignore
- [ ] Documentar variáveis no README

✅ Fase 1.2 - Correções Críticas (60min)
- [ ] Implementar proxy para produção
- [ ] Substituir alerts por toast
- [ ] Adicionar Error Boundary
- [ ] Remover console.logs sensíveis

✅ Fase 1.3 - Validação (45min)
- [ ] Build de produção local
- [ ] Testar com mock data
- [ ] Verificar tamanho do bundle
- [ ] Teste de smoke em preview do Vercel
```

### **Sprint 2: Pós-Deploy (Semana 1)**
**Tempo estimado: 1 dia**

```bash
- [ ] Implementar retry logic
- [ ] Migrar cache para IndexedDB
- [ ] Adicionar Sentry
- [ ] Otimizar lazy loading
- [ ] Melhorar acessibilidade básica
```

### **Sprint 3: Iteração (Semana 2-3)**
**Tempo estimado: 3-5 dias**

```bash
- [ ] Adicionar testes (cobertura 60%+)
- [ ] Implementar PWA
- [ ] Melhorar responsividade
- [ ] Analytics e monitoramento
- [ ] Documentação completa
```

---

## 📈 Métricas de Sucesso

### Build
- ✅ Bundle size: 439KB (ok)
- ⚠️ Lighthouse Performance: ? (testar)
- ❌ Test coverage: 0% (adicionar)

### Runtime
- ✅ First load: <2s (com cache)
- ⚠️ API sync: 90-120s (pode melhorar)
- ✅ Incremental sync: 5-10s (ótimo)

### Qualidade
- ⚠️ TypeScript strict: Desabilitado
- ❌ Accessibility score: ? (testar)
- ⚠️ SEO score: Básico

---

## 🔧 Comandos Úteis

```bash
# Build de produção
npm run build

# Preview local do build
npm run preview

# Análise de bundle
npx vite-bundle-visualizer

# Deploy no Vercel
vercel --prod

# Checar tipos
npx tsc --noEmit

# Lint
npm run lint (se configurado)
```

---

## 📚 Recursos Adicionais

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Web.dev Performance](https://web.dev/performance/)

---

**Última atualização:** 10/12/2025  
**Responsável:** Dev Team  
**Status:** 🟡 Aguardando implementação Fase 1
