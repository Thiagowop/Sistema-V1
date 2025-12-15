# 📋 Proposta: Agrupamento Inteligente de Tarefas

## 🎯 Objetivo
Separar tarefas em categorias lógicas além dos projetos tradicionais:
- **Projetos** (mantém como está)
- **Rotina/Recorrente** (reuniões, relatórios)
- **Operacional** (suporte, manutenção, sem projeto)

---

## 💡 Solução Proposta

### Opção 1: **Usar Tags do ClickUp** (Recomendado)
✅ Simples de implementar  
✅ Flexível e visual no ClickUp  
✅ Fácil de categorizar tarefas

**Como funciona:**
1. Criar tags no ClickUp:
   - `rotina` - para tarefas recorrentes
   - `operacional` - para tarefas de suporte/manutenção
   - (projetos não precisam de tag especial, já usam o campo List/Projeto)

2. Sistema detecta automaticamente:
   ```
   SE tarefa tem tag "rotina" → Grupo ROTINA
   SE tarefa tem tag "operacional" → Grupo OPERACIONAL  
   SENÃO → Grupo por PROJETO (atual)
   ```

**Visualização no Dashboard:**
```
┌─────────────────────────────────────┐
│ 👤 João Silva                       │
├─────────────────────────────────────┤
│                                     │
│ 🎯 PROJETOS                         │
│   📁 Projeto Alpha (3 tarefas)      │
│   📁 Projeto Beta (2 tarefas)       │
│                                     │
│ 🔄 ROTINA                           │
│   ✓ Daily stand-up                  │
│   ✓ Relatório semanal               │
│                                     │
│ 📦 OPERACIONAL                      │
│   ⚙️ Suporte cliente X              │
│   🔧 Manutenção servidor            │
└─────────────────────────────────────┘
```

---

### Opção 2: **Usar Status específico**
Menos flexível, mas funciona se você não quiser criar tags.

**Como funciona:**
- Status "ROTINA" → Grupo ROTINA
- Status "OPERACIONAL" → Grupo OPERACIONAL
- Outros status → Grupo por PROJETO

---

### Opção 3: **Usar List/Pasta especial no ClickUp**
Criar Lists específicas:
- List "Rotina e Recorrentes"
- List "Operacional"
- Demais lists = projetos

---

## 🚀 Implementação (Opção 1 - Tags)

### Passo 1: Adicionar campo `category` nas tarefas
```typescript
export interface Task {
  // ... campos existentes
  category: 'projeto' | 'rotina' | 'operacional';
}
```

### Passo 2: Detectar categoria automaticamente
```typescript
function detectTaskCategory(task: ClickUpApiTask): string {
  const tags = task.tags.map(t => t.name.toLowerCase());
  
  if (tags.includes('rotina') || tags.includes('recorrente')) {
    return 'rotina';
  }
  
  if (tags.includes('operacional') || tags.includes('suporte')) {
    return 'operacional';
  }
  
  return 'projeto'; // default
}
```

### Passo 3: Agrupar no Dashboard
```typescript
// Agrupar por categoria primeiro, depois por projeto
const groupedByCategory = {
  projetos: [...],
  rotina: [...],
  operacional: [...]
};
```

### Passo 4: UI com seções colapsáveis
```tsx
<Accordion>
  <AccordionItem title="🎯 PROJETOS (5)">
    {/* Projetos atuais */}
  </AccordionItem>
  
  <AccordionItem title="🔄 ROTINA (3)">
    {/* Tarefas de rotina */}
  </AccordionItem>
  
  <AccordionItem title="📦 OPERACIONAL (2)">
    {/* Tarefas operacionais */}
  </AccordionItem>
</Accordion>
```

---

## ⚙️ Configuração no Admin

Adicionar seção em **Admin > Configurações**:

```
┌─────────────────────────────────────┐
│ 🏷️ Agrupamento de Tarefas          │
├─────────────────────────────────────┤
│                                     │
│ Tags para ROTINA:                   │
│ [rotina, recorrente, daily]         │
│                                     │
│ Tags para OPERACIONAL:              │
│ [operacional, suporte, manutencao]  │
│                                     │
│ ☑️ Mostrar categoria ROTINA         │
│ ☑️ Mostrar categoria OPERACIONAL    │
│ ☑️ Agrupar projetos como antes      │
└─────────────────────────────────────┘
```

---

## ❓ Perguntas para Decidir

1. **Qual opção você prefere?**
   - [ ] Opção 1: Tags (recomendado)
   - [ ] Opção 2: Status
   - [ ] Opção 3: Lists

2. **Quais categorias quer usar?**
   - [ ] Rotina
   - [ ] Operacional
   - [ ] Backlog
   - [ ] Sprint/Ativo
   - [ ] Outra: __________

3. **Como prefere visualizar?**
   - [ ] Seções separadas (acordeão)
   - [ ] Abas (tabs)
   - [ ] Tudo junto com badges coloridos

4. **Quer configurar as tags no Admin ou deixar fixo no código?**
   - [ ] Configurável (mais flexível)
   - [ ] Fixo no código (mais simples)

---

## 📝 Próximos Passos

Após decidir, implemento:
1. ✅ Detecção automática de categoria
2. ✅ Agrupamento visual no Dashboard
3. ✅ Configuração no Admin (se quiser)
4. ✅ Testes e ajustes

---

**Tempo estimado:** 30-45 minutos  
**Complexidade:** Média  
**Impacto:** Alto (organização muito melhor)
