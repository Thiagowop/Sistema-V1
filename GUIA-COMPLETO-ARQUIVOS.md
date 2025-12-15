# 📚 Guia Completo do Projeto - Daily Flow

## 📁 Estrutura de Arquivos e Funções

---

## 🎯 ARQUIVOS PRINCIPAIS (Raiz)

### **App.tsx** - 🏠 Aplicação Principal
**O que faz:**
- Ponto central da aplicação
- Gerencia navegação entre páginas/abas
- Controla autenticação
- Carrega dados do cache
- Distribui dados para os componentes

**Quando mexer aqui:**
- ✏️ Adicionar nova aba no menu
- ✏️ Mudar ordem dos itens do menu
- ✏️ Alterar lógica de carregamento inicial
- ✏️ Modificar sistema de autenticação

**Páginas/Abas que controla:**
```
├─ import (FileUpload.tsx)
├─ filters (Filters.tsx)
├─ projects (Dashboard.tsx - Alinhamento Diário)
├─ alignment (Dashboard.tsx - Alinhamento)
├─ archived (CompletedProjects.tsx)
├─ management2 (TestDashboard.tsx - Gestão)
└─ settings (Settings.tsx)
```

---

### **index.tsx** - 🚪 Ponto de Entrada
**O que faz:**
- Inicia a aplicação
- Renderiza App.tsx no DOM
- Configura React e Google OAuth

**Quando mexer aqui:**
- ✏️ Mudar configuração global do React
- ✏️ Adicionar providers globais
- ⚠️ **Raramente precisa mexer**

---

### **auth.config.ts** - 🔐 Autenticação
**O que faz:**
- Define usuários autorizados
- Valida login e senha
- Carrega credenciais do .env

**Quando mexer aqui:**
- ✏️ Adicionar/remover usuários
- ✏️ Mudar senhas
- ✏️ Modificar lógica de login

**Usuários atuais:**
- `thiago.vitorio@mcsarc.com.br` - Senha: `Mcsa@2025!`
- `admin@mcsarc.com.br` - Senha: `Mcsa@2025!`
- `user@mcsarc.com.br` - Senha: `usermcsa`

---

### **constants.ts** - ⚙️ Configurações Padrão
**O que faz:**
- Define valores padrão do sistema
- Nomes dos membros da equipe
- Mapeamento de nomes
- Ordem de prioridades
- Grupos customizados

**Quando mexer aqui:**
- ✏️ Adicionar/remover membro da equipe
- ✏️ Mudar apelidos/nomes exibidos
- ✏️ Alterar grupos de tags
- ✏️ Modificar ordem padrão

**Exemplo:**
```typescript
teamMembers: ['Brozinga', 'Soares', 'Thiago', ...]
nameMappings: { 'Rodrigo Brozinga': 'Brozinga' }
```

---

### **types.ts** - 📋 Definições de Tipos
**O que faz:**
- Define estrutura de dados TypeScript
- Interfaces e tipos usados em todo projeto
- Task, Project, GroupedData, AppConfig, etc.

**Quando mexer aqui:**
- ✏️ Adicionar novo campo em tarefa/projeto
- ✏️ Criar novo tipo de dado
- ⚠️ **Cuidado:** Mudanças afetam todo projeto

---

## 📦 COMPONENTES (pasta /components)

---

### **LoginScreen.tsx** - 🔑 Tela de Login
**Página:** Tela inicial (antes de logar)

**O que mostra:**
- Logo MCSA Tecnologia
- Campos de email e senha
- Botão de login
- Mensagens de erro

**Quando mexer aqui:**
- ✏️ Mudar visual da tela de login
- ✏️ Adicionar OAuth (Google, Microsoft)
- ✏️ Alterar mensagens de erro
- ✏️ Mudar logo/branding

---

### **FileUpload.tsx** - 📥 Importação/Sincronização
**Página:** Aba "Importar / Sync"

**O que mostra:**
- Card de sincronização via API
- Botão "Sincronizar Agora"
- Informações de última sincronização
- Tarefas em cache
- Alertas de configuração

**Quando mexer aqui:**
- ✏️ Alterar visual do card de sync
- ✏️ Adicionar novas opções de importação
- ✏️ Modificar mensagens de status
- ✏️ Adicionar indicadores de progresso

---

### **Filters.tsx** - 🔍 Filtros
**Página:** Aba "Filtros"

**O que mostra:**
- Filtros por tags, status, responsável
- Seleção de datas
- Aplicar/Limpar filtros
- Preview de tarefas filtradas

**Quando mexer aqui:**
- ✏️ Adicionar novo tipo de filtro
- ✏️ Mudar layout dos filtros
- ✏️ Alterar lógica de filtragem
- ✏️ Adicionar filtros salvos/favoritos

---

### **Dashboard.tsx** - 📅 Alinhamento Diário/Semanal
**Páginas:** 
- Aba "Alinhamento Diário" (viewMode: projects)
- Aba "Alinhamento" (viewMode: alignment)

**O que mostra:**

**Modo "Alinhamento Diário":**
- Quadro estilo Daily Standup
- Por pessoa → projetos → tarefas
- Status visual (cores)
- Horas trabalhadas
- Agrupamento por tags

**Modo "Alinhamento":**
- Resumo por pessoa
- Tarefas da semana
- Standups/Updates
- Comentários e menções

**Quando mexer aqui:**
- ✏️ Mudar layout do daily standup
- ✏️ Adicionar novos campos nas tarefas
- ✏️ Alterar cores e estilos
- ✏️ Modificar agrupamentos
- ✏️ Adicionar exportação para PDF

---

### **TestDashboard.tsx** - 📊 Dashboard de Gestão (PRINCIPAL)
**Página:** Aba "Gestão"

**O que mostra:** Dashboard executivo com 9 abas:

#### **Tab 1: Overview (Visão Geral)**
- KPIs principais
- Taxa de conclusão
- Projetos ativos
- Horas registradas
- Tarefas atrasadas
- Gráficos de desempenho

#### **Tab 2: Team (Equipe)**
- Lista de membros
- Carga de trabalho por pessoa
- Horas planejadas vs registradas
- Taxa de utilização
- Tarefas por status

#### **Tab 3: Projects (Projetos)**
- Cards por membro da equipe
- Projetos agrupados
- Filtro por tag "projeto"
- Métricas de conclusão
- Horas estimadas/logadas

#### **Tab 4: Sprints**
- Visão semanal
- Velocidade da equipe
- Burndown charts
- Tarefas por sprint

#### **Tab 5: Deadlines (Prazos)**
- Tarefas vencidas (vermelho)
- Críticas - próximos 3 dias (amarelo)
- Próxima semana (azul)
- Ordenadas por data

#### **Tab 6: Priorities (Prioridades)**
- Distribuição por prioridade
- Horas por nível (Urgente, Alta, Normal, Baixa)
- Filtros: tarefas principais, subtarefas, completas
- Gráfico de barras horizontal

#### **Tab 7: TaskControl (Controle de Qualidade)**
- Tarefas sem responsável
- Sem prioridade
- Sem data inicial/vencimento
- Sem estimativa/descrição
- Score de qualidade dos dados

#### **Tab 8: Timesheet (Timesheet Simples)**
- Horas por dia da semana
- Horas planejadas vs logadas
- Por pessoa e projeto

#### **Tab 9: Timesheet2 (Timesheet Visual)**
- Hierarquia: Pessoa → Projeto → Tarefas
- Seleção de período (7/15/30 dias, meses)
- Filtro por pessoa e tags
- Exportação para Excel
- Visualização expandível/colapsável

**Quando mexer aqui:**
- ✏️ Adicionar nova aba
- ✏️ Modificar métricas exibidas
- ✏️ Alterar cálculos (horas, %)
- ✏️ Mudar cores e gráficos
- ✏️ Adicionar novos filtros
- ✏️ Modificar exportação Excel

**⚠️ Arquivo GRANDE (4000+ linhas):**
```
Linhas 1-250: Imports e definições
Linhas 250-700: Cálculos e agregações
Linhas 700-1500: Renderização de abas
Linhas 1500-2500: Componentes auxiliares
Linhas 2500-4000: TimesheetTab e outros
```

---

### **Settings.tsx** - ⚙️ Configurações
**Página:** Aba "Configurações"

**O que mostra:**
- Token da API ClickUp
- List IDs
- Team ID
- Standup View ID
- Ordem dos membros (drag-and-drop)
- Feriados
- Botão salvar

**Quando mexer aqui:**
- ✏️ Adicionar nova configuração
- ✏️ Modificar campos existentes
- ✏️ Alterar validações
- ✏️ Adicionar importação/exportação de configs

---

### **CompletedProjects.tsx** - ✅ Projetos Concluídos
**Página:** Aba "Arquivados"

**O que mostra:**
- Projetos 100% completos
- Agrupados por pessoa
- Estatísticas de conclusão
- Filtros e busca
- Timeline de conclusões

**Quando mexer aqui:**
- ✏️ Mudar critério de "concluído"
- ✏️ Adicionar estatísticas
- ✏️ Modificar visualização
- ✏️ Adicionar exportação

---

### **ChatInterface.tsx** - 💬 Chat/Comentários
**Usado em:** Dashboard (Alinhamento)

**O que mostra:**
- Interface de chat
- Comentários por tarefa/projeto
- Menções (@pessoa)
- Histórico de mensagens

**Quando mexer aqui:**
- ✏️ Estilizar mensagens
- ✏️ Adicionar emojis/reações
- ✏️ Modificar sistema de menções
- ✏️ Integrar com ClickUp comments

---

### **TaskTable.tsx** - 📋 Tabela de Tarefas
**Usado em:** Vários componentes

**O que mostra:**
- Tabela formatada de tarefas
- Colunas: Nome, Status, Responsável, Prazo
- Ordenação
- Filtros inline

**Quando mexer aqui:**
- ✏️ Adicionar/remover colunas
- ✏️ Mudar formatação
- ✏️ Adicionar ações (editar, deletar)
- ✏️ Modificar ordenação

---

### **Icon.tsx** - 🎨 Componente de Ícones
**Usado em:** Todos os componentes

**O que faz:**
- Renderiza ícones SVG
- Biblioteca: lucide-react
- Permite customização de cor/tamanho

**Quando mexer aqui:**
- ✏️ Adicionar novos ícones
- ✏️ Mudar biblioteca de ícones
- ⚠️ Raramente precisa mexer

---

### **Tooltip.tsx** - 💡 Tooltips
**Usado em:** Vários componentes

**O que faz:**
- Exibe dicas ao passar mouse
- Informações adicionais
- Atalhos de teclado

**Quando mexer aqui:**
- ✏️ Mudar estilo do tooltip
- ✏️ Adicionar animações
- ✏️ Modificar posicionamento

---

### **JsonEditor.tsx** - 📝 Editor JSON
**Usado em:** Settings (Admin)

**O que faz:**
- Editor de JSON formatado
- Validação de sintaxe
- Highlight de código

**Quando mexer aqui:**
- ✏️ Adicionar validações específicas
- ✏️ Mudar tema do editor
- ✏️ Adicionar autocomplete

---

## 🔧 SERVIÇOS (pasta /services)

---

### **clickup.ts** - 🔌 Integração ClickUp
**O que faz:**
- Faz requisições para API do ClickUp
- Busca tarefas, listas, times
- Processa dados da API
- Aplica filtros
- Busca standups/comentários

**Funções principais:**
```typescript
fetchClickUpData() // Busca todas as tarefas
fetchStandupSummaries() // Busca updates/standups
processApiTasks() // Processa tarefas da API
applyClientSideFilters() // Aplica filtros
```

**Quando mexer aqui:**
- ✏️ Adicionar novos endpoints do ClickUp
- ✏️ Modificar campos buscados
- ✏️ Alterar lógica de processamento
- ✏️ Adicionar tratamento de erros

---

### **processor.ts** - ⚙️ Processamento de Dados
**O que faz:**
- Processa CSV importados
- Transforma dados brutos em estrutura usável
- Agrupa por pessoa/projeto
- Calcula estatísticas

**Funções principais:**
```typescript
processCSV() // Processa arquivo CSV
groupDataByPerson() // Agrupa por responsável
calculateMetrics() // Calcula métricas
```

**Quando mexer aqui:**
- ✏️ Alterar formato de importação CSV
- ✏️ Modificar cálculos de horas/métricas
- ✏️ Adicionar novos agrupamentos
- ✏️ Tratar novos campos

---

### **filterService.ts** - 🔍 Gerenciamento de Filtros
**O que faz:**
- Salva/carrega estado dos filtros
- Aplica filtros aos dados
- Gerencia persistência no localStorage

**Funções principais:**
```typescript
FilterService.loadFilterState() // Carrega filtros salvos
FilterService.saveFilterState() // Salva filtros
FilterService.applyFilters() // Aplica filtros nos dados
```

**Quando mexer aqui:**
- ✏️ Adicionar novos tipos de filtros
- ✏️ Modificar lógica de filtragem
- ✏️ Adicionar filtros predefinidos
- ✏️ Alterar persistência

---

### **geminiService.ts** - 🤖 Integração IA (Gemini)
**O que faz:**
- Integração com Google Gemini AI
- Análise automática de dados
- Sugestões inteligentes
- Geração de insights

**Quando mexer aqui:**
- ✏️ Adicionar novos prompts
- ✏️ Modificar análises de IA
- ✏️ Integrar outros modelos (GPT, Claude)
- ⚠️ **Funcionalidade experimental**

---

### **advancedCacheService.ts** - 💾 Sistema de Cache
**O que faz:**
- Gerencia cache em 3 camadas
- Salva/carrega dados do IndexedDB
- Comprime dados grandes
- Recuperação de emergência

**Camadas de cache:**
1. **Metadata** (localStorage) - Instantâneo
2. **Processed Data** (localStorage comprimido) - Rápido
3. **Raw Data** (IndexedDB) - Completo

**Funções principais:**
```typescript
advancedCache.saveMetadata() // Salva metadados
advancedCache.loadProcessedData() // Carrega dados processados
advancedCache.saveRawData() // Salva dados brutos
advancedCache.tryRecoverFromOldCache() // Recuperação
```

**Quando mexer aqui:**
- ✏️ Modificar estratégia de cache
- ✏️ Adicionar compressão adicional
- ✏️ Alterar tempo de expiração
- ✏️ Adicionar sincronização em background

---

### **mockData.ts** - 🎭 Dados de Teste
**O que faz:**
- Fornece dados fictícios para desenvolvimento
- Permite testar sem API real
- Simula estrutura do ClickUp

**Quando mexer aqui:**
- ✏️ Adicionar mais dados de teste
- ✏️ Criar cenários específicos
- ✏️ Testar edge cases
- ⚠️ Não usar em produção

---

## 🎨 ESTILOS

### **index.css** - 🖌️ Estilos Globais
**O que faz:**
- Estilos base da aplicação
- Configuração do Tailwind CSS
- Animações globais
- Reset CSS

**Quando mexer aqui:**
- ✏️ Adicionar animações globais
- ✏️ Modificar cores do tema
- ✏️ Adicionar fontes customizadas
- ✏️ Ajustar scrollbars

---

## 📝 TIPOS (pasta /types)

### **FilterConfig.ts** - 🔍 Tipos de Filtros
**O que faz:**
- Define tipos para filtros
- Interfaces de configuração
- Estados de filtro

**Quando mexer aqui:**
- ✏️ Adicionar novo tipo de filtro
- ✏️ Modificar estrutura de filtros

---

## ⚙️ CONFIGURAÇÃO

### **vite.config.ts** - ⚡ Configuração Vite
**O que faz:**
- Configura build e dev server
- Define portas
- Configura plugins
- Otimizações de build

**Quando mexer aqui:**
- ✏️ Mudar porta do servidor (padrão: 3015)
- ✏️ Adicionar plugins
- ✏️ Modificar otimizações
- ⚠️ **Cuidado:** Pode quebrar build

---

### **tsconfig.json** - 📘 Configuração TypeScript
**O que faz:**
- Configura compilador TypeScript
- Define regras de tipagem
- Paths e imports

**Quando mexer aqui:**
- ✏️ Adicionar paths customizados
- ✏️ Modificar strict mode
- ⚠️ **Raramente precisa mexer**

---

### **package.json** - 📦 Dependências
**O que faz:**
- Lista todas as bibliotecas usadas
- Scripts de build/dev
- Metadados do projeto

**Bibliotecas principais:**
- `react` - Interface
- `vite` - Build tool
- `lucide-react` - Ícones
- `lz-string` - Compressão
- `idb-keyval` - IndexedDB

**Scripts:**
```bash
npm run dev    # Inicia servidor desenvolvimento
npm run build  # Build para produção
npm run preview # Preview do build
```

---

## 🗺️ GUIA RÁPIDO: "ONDE MEXER PARA..."

### 📝 Adicionar novo campo em uma tarefa
1. **types.ts** - Adicionar na interface `Task`
2. **clickup.ts** - Buscar campo da API
3. **TestDashboard.tsx** - Exibir na interface

### 🎨 Mudar cores/tema visual
1. **index.css** - Cores globais e tema
2. **Componente específico** - Classes Tailwind inline

### 👤 Adicionar novo membro da equipe
1. **constants.ts** - Adicionar em `teamMembers` e `teamMemberOrder`
2. **Settings.tsx** - Já atualiza automaticamente

### 📊 Adicionar nova aba no Dashboard de Gestão
1. **TestDashboard.tsx** (linha ~650)
   - Adicionar em `tabs` array
   - Criar renderização condicional
   - Implementar componente da aba

### 🔍 Modificar filtros disponíveis
1. **types/FilterConfig.ts** - Adicionar tipo
2. **filterService.ts** - Implementar lógica
3. **Filters.tsx** - Adicionar UI

### 📥 Mudar formato de importação
1. **processor.ts** - Modificar `processCSV()`
2. **FileUpload.tsx** - Atualizar UI se necessário

### 🔐 Adicionar novo usuário
1. **auth.config.ts** - Adicionar no array de usuários
2. OU **.env** - Adicionar em `VITE_AUTHORIZED_USERS`

### 📈 Adicionar nova métrica/KPI
1. **TestDashboard.tsx** - Calcular na seção de `aggregates`
2. **Overview tab** - Exibir com `MetricCard`

### 🎯 Modificar agrupamento de projetos
1. **Dashboard.tsx** - Modificar lógica de agrupamento
2. **TestDashboard.tsx** (Projects tab) - Ajustar renderização

### 💾 Mudar estratégia de cache
1. **advancedCacheService.ts** - Modificar camadas
2. **App.tsx** - Ajustar carregamento inicial

---

## 📊 FLUXO DE DADOS

```
1. IMPORTAÇÃO
   ┌──────────────┐
   │ ClickUp API  │
   └──────┬───────┘
          ↓
   ┌──────────────────┐
   │ clickup.ts       │ ← Busca e processa
   │ (fetchClickUpData)│
   └──────┬───────────┘
          ↓
   ┌──────────────────────┐
   │ advancedCacheService │ ← Salva em cache
   │ (3 camadas)          │
   └──────┬───────────────┘
          ↓
   ┌──────────────┐
   │ App.tsx      │ ← Armazena em state
   └──────┬───────┘

2. FILTRAGEM
   ┌──────────────┐
   │ App.tsx      │ ← Dados brutos
   └──────┬───────┘
          ↓
   ┌──────────────────┐
   │ filterService.ts │ ← Aplica filtros
   └──────┬───────────┘
          ↓
   ┌──────────────┐
   │ Components   │ ← Recebe dados filtrados
   └──────────────┘

3. VISUALIZAÇÃO
   ┌──────────────┐
   │ App.tsx      │ ← Distribui dados
   └──────┬───────┘
          ├─→ Dashboard.tsx (Alinhamento)
          ├─→ TestDashboard.tsx (Gestão)
          ├─→ CompletedProjects.tsx (Arquivados)
          └─→ Outros componentes...
```

---

## 🎓 CONVENÇÕES DO PROJETO

### Nomenclatura
- **Componentes:** PascalCase (`Dashboard.tsx`)
- **Serviços:** camelCase (`clickup.ts`)
- **Tipos:** PascalCase (`Task`, `Project`)
- **Funções:** camelCase (`fetchData()`)
- **Constantes:** UPPER_SNAKE_CASE (`DEFAULT_CONFIG`)

### Organização
- **1 componente = 1 arquivo**
- **Componentes auxiliares** ficam no mesmo arquivo (ex: `MetricCard` em `TestDashboard.tsx`)
- **Tipos** vão em `types.ts` ou pasta `/types`
- **Lógica de negócio** vai em `/services`

### Estilos
- **Tailwind CSS** para estilização
- Classes inline nos componentes
- Cores principais: indigo, slate, sky, emerald
- Responsivo: mobile-first

---

## 📚 ARQUIVOS DE DOCUMENTAÇÃO

- **README.md** - Introdução e setup
- **SEGURANCA-BACKUP.md** - Guia de segurança e backups
- **ARQUITETURA-LONGO-PRAZO.md** - Planejamento futuro
- **diagnostico.js** - Script de diagnóstico
- **backup-config.js** - Script de backup manual

---

## 🚀 INÍCIO RÁPIDO

### Para desenvolver
```bash
npm run dev
# ou
./iniciar.bat
```

### Para fazer mudanças

1. **Mudança visual?** → Componente específico
2. **Nova funcionalidade?** → TestDashboard.tsx ou novo componente
3. **Lógica de dados?** → /services
4. **Tipos/estrutura?** → types.ts
5. **Configuração?** → constants.ts ou Settings.tsx

---

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}
**Versão do projeto:** 3.0.0
