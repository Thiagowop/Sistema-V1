# Guia de Troubleshooting - DailyFlow

## Histórico de Problemas e Soluções

Este documento registra os principais problemas encontrados durante o desenvolvimento e manutenção do sistema, junto com suas soluções.

---

## 1. Problema: Aplicação não iniciava (Dependências não instaladas)

### Sintoma
- Erro ao executar `npm run dev`
- Pasta `node_modules` não existe

### Causa Raiz
- Dependências do projeto não foram instaladas após clone ou em nova máquina

### Solução
```bash
npm install
```

### Prevenção
- Sempre executar `npm install` após clonar o repositório
- Verificar existência de `node_modules` antes de rodar comandos npm

---

## 2. Problema: Logout automático ao recarregar página

### Sintoma
- Usuário fazia login mas ao recarregar a página era deslogado
- Perdia toda configuração e cache após F5

### Causa Raiz
- Estado de autenticação não estava sendo persistido no localStorage
- Código em `App.tsx` linha 39 tinha comentário: `// Login simples - sem persistência`

### Solução
Modificado em `App.tsx`:

**Antes:**
```typescript
const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

const handleLogin = () => {
  setIsAuthenticated(true);
};

const handleLogout = () => {
  setIsAuthenticated(false);
  setActiveView('import');
};
```

**Depois:**
```typescript
const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
  const saved = localStorage.getItem('dailyFlow_isAuthenticated');
  return saved === 'true';
});

const handleLogin = () => {
  setIsAuthenticated(true);
  localStorage.setItem('dailyFlow_isAuthenticated', 'true');
};

const handleLogout = () => {
  setIsAuthenticated(false);
  localStorage.removeItem('dailyFlow_isAuthenticated');
  setActiveView('import');
};
```

### Chave de localStorage
- `dailyFlow_isAuthenticated`: Armazena estado de login

---

## 3. Problema: Subtasks aparecendo soltas (fora da tarefa principal)

### Sintoma
- Subtasks eram exibidas como tasks independentes
- Tarefa principal desaparecia, deixando apenas subtasks soltas
- Quebrava a hierarquia visual esperada pelo ClickUp

### Causa Raiz 1 (Subtasks órfãs tratadas incorretamente)
No arquivo `services/clickup.ts`, linhas 752-764, havia código que transformava subtasks órfãas em tasks principais:

```typescript
} else {
  // Orphaned subtasks
  subtasks.forEach(t => { 
    t.isSubtask = false;  // <-- PROBLEMA: mudava tipo da task
    tasks.push(t);
  });
}
```

### Solução 1
Removido o código que transforma subtasks órfãs em tasks principais:

```typescript
} else {
  // Se o parent não existe, não mostrar subtasks órfãs soltas
  // Elas devem aparecer apenas quando o parent existe
}
```

### Causa Raiz 2 (Parent removido por filtros)
A função `applyClientSideFilters` removia a tarefa parent quando ela não passava nos filtros, mas mantinha as subtasks que passavam, criando órfãs.

**Exemplo:**
- Parent "Régua de cobrança completa" não tem tag "projeto"
- Subtasks têm tag "projeto"
- Filtro remove o parent mas mantém subtasks
- Resultado: subtasks ficam órfãs

### Solução 2
Modificado `applyClientSideFilters` em `services/clickup.ts` para usar **filtragem em duas passagens**:

1. **Primeira passagem**: Identifica tasks que passam filtros + marca IDs dos parents
2. **Segunda passagem**: Inclui tasks que passaram OU são parents de tasks que passaram

```typescript
export const applyClientSideFilters = (
  rawTasks: ClickUpApiTask[],
  filterConfig: FilterConfig
): ClickUpApiTask[] => {
  // Helper function para verificar se task passa nos filtros
  const taskPassesFilters = (task: ClickUpApiTask): boolean => {
    // ... lógica de filtros ...
  };

  // Build a map of parent IDs to keep
  const parentIdsToKeep = new Set<string>();
  const filteredTasks = new Set<string>();

  // Primeira passagem: identificar tasks que passam + seus parents
  rawTasks.forEach(task => {
    if (taskPassesFilters(task)) {
      filteredTasks.add(task.id);
      if (task.parent) {
        parentIdsToKeep.add(task.parent);
      }
    }
  });

  // Segunda passagem: incluir tasks ou parents necessários
  return rawTasks.filter(task => {
    if (filteredTasks.has(task.id)) return true;
    if (parentIdsToKeep.has(task.id)) return true;
    return false;
  });
};
```

### Benefício
- Hierarquia sempre preservada
- Parent automaticamente incluído quando subtask passa no filtro
- Comportamento consistente com interface do ClickUp

---

## 4. Problema: Credenciais de login não configuradas

### Sintoma
- Usuário não sabia qual senha usar para login
- Necessidade de diferentes usuários para teste

### Solução
Configurado no arquivo `auth.config.ts`:

```typescript
return [
  {
    email: 'thiago.vitorio@mcsarc.com.br',
    password: 'Mcsa@2025!',
    name: 'Thiago Vitório'
  },
  {
    email: 'admin@mcsarc.com.br',
    password: 'Mcsa@2025!',
    name: 'Administrador'
  },
  {
    email: 'user@mcsarc.com.br',
    password: 'usermcsa',
    name: 'User'
  }
];
```

### Usuários Disponíveis
- **thiago.vitorio@mcsarc.com.br** - Senha: `Mcsa@2025!`
- **admin@mcsarc.com.br** - Senha: `Mcsa@2025!`
- **user@mcsarc.com.br** - Senha: `usermcsa`

---

## Arquitetura de Persistência de Dados

### Sistema de Cache em 3 Camadas

#### Camada 1: Metadata (localStorage)
- **Chave**: `dailyFlow_metadata_v3`
- **Conteúdo**: Tags, status, assignees, projetos, prioridades
- **Propósito**: Popular filtros instantaneamente
- **Tamanho**: Pequeno (~KB)

#### Camada 2: Processed Data (localStorage + Compressão)
- **Chaves**: 
  - `dailyFlow_processed_v3` (metadata)
  - `dailyFlow_processed_v3_data` (dados comprimidos)
- **Conteúdo**: Dados agrupados do dashboard (comprimidos com LZ-String)
- **Propósito**: Mostrar dashboard rapidamente sem reprocessar
- **Tamanho**: Médio (~100-500KB comprimido)

#### Camada 3: Raw Data (IndexedDB)
- **Chave**: `dailyFlow_rawData_v3`
- **Conteúdo**: Dados brutos das tasks do ClickUp
- **Propósito**: Reprocessar filtros sem nova chamada à API
- **Tamanho**: Grande (~MB)
- **Biblioteca**: `idb-keyval`

#### Camada 4: Filter State (localStorage)
- **Chave**: `dailyFlow_filterState`
- **Conteúdo**: Estado atual dos filtros aplicados
- **Arquivo**: `services/filterService.ts`

### Versão do Cache
- Todas as camadas usam: `CACHE_VERSION = '3.0.0'`
- Cache é invalidado automaticamente se versão não bate

---

## Checklist de Manutenção

### Antes de Deploy
- [ ] Executar `npm install` para garantir dependências atualizadas
- [ ] Testar login e logout
- [ ] Verificar persistência após reload (F5)
- [ ] Testar hierarquia de tasks/subtasks com filtros ativos
- [ ] Validar cache em todas as 3 camadas
- [ ] Limpar cache antigo se mudou `CACHE_VERSION`

### Ao Adicionar Novos Filtros
- [ ] Atualizar `taskPassesFilters` em `applyClientSideFilters`
- [ ] Garantir que parent/child relationship é preservada
- [ ] Testar com tasks que têm e não têm subtasks

### Ao Modificar Autenticação
- [ ] Atualizar `auth.config.ts`
- [ ] Testar persistência com `dailyFlow_isAuthenticated`
- [ ] Verificar logout limpa localStorage corretamente

### Debugging Cache
```javascript
// Verificar cache no console do navegador
localStorage.getItem('dailyFlow_metadata_v3')
localStorage.getItem('dailyFlow_processed_v3')
localStorage.getItem('dailyFlow_isAuthenticated')

// Limpar cache manualmente
localStorage.clear()
indexedDB.deleteDatabase('keyval-store')
```

---

## Arquivos Críticos

| Arquivo | Responsabilidade | Atenção Especial |
|---------|-----------------|------------------|
| `App.tsx` | Autenticação, gerenciamento de estado | Login persistence |
| `auth.config.ts` | Credenciais de usuários | Senhas hardcoded |
| `services/clickup.ts` | Filtragem e processamento de tasks | Parent-child hierarchy |
| `services/advancedCacheService.ts` | Sistema de cache em 3 camadas | Versioning |
| `services/filterService.ts` | Persistência de filtros | localStorage sync |

---

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Iniciar servidor + proxy (se necessário)
npm run dev:all

# Build para produção
npm build

# Preview do build
npm run preview
```

---

## Contatos e Suporte

Para dúvidas sobre este documento ou problemas não listados aqui, contactar o time de desenvolvimento.

**Última atualização:** 11 de Dezembro de 2025
