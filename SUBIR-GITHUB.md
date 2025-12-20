# 🚀 Como Subir o Repositório para GitHub

## ✅ Git Local Criado
- Repositório inicializado
- Commit inicial feito (50 arquivos)
- Branch: master

## 📤 Próximos Passos

### 1️⃣ Criar Repositório no GitHub

**Acesse:** https://github.com/new

**Configurações:**
- Repository name: `sistema`
- Description: `Sistema Daily - Dashboard ClickUp`
- Visibility: **Private** (recomendado para código interno)
- ❌ **NÃO marque** "Add a README file"
- ❌ **NÃO marque** ".gitignore"
- ❌ **NÃO marque** "Choose a license"

**Clique em:** "Create repository"

### 2️⃣ Conectar e Enviar

Copie e execute no terminal:

```bash
# Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/sistema.git

# Renomear branch para main
git branch -M main

# Enviar código
git push -u origin main
```

**Substitua `SEU_USUARIO` pelo seu username do GitHub!**

### 3️⃣ Autenticação

Se pedir senha, você tem 2 opções:

**Opção A: Personal Access Token (Recomendado)**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Marque: `repo` (Full control of private repositories)
4. Copie o token
5. Use como senha no git push

**Opção B: GitHub Desktop**
1. Baixe: https://desktop.github.com/
2. File → Add Local Repository → Escolha `C:\Users\Thiago\Desktop\Daily`
3. Publish repository

## 🔒 Arquivos Protegidos (.gitignore)

O `.gitignore` já está configurado para NÃO subir:
- ✅ `node_modules/` (dependências)
- ✅ `.env` (credenciais secretas)
- ✅ `dist/` (build)
- ✅ Arquivos de cache

## ✅ O Que Foi Enviado

- 50 arquivos
- Todo código fonte
- Documentação
- Configurações

## 🚨 IMPORTANTE

**Antes de fazer push, verifique se `.env` NÃO está commitado:**

```bash
git ls-files | grep .env
```

Se aparecer `.env`, remova:
```bash
git rm --cached .env
git commit -m "Remove .env do repositório"
```

## 📝 Comandos Git Úteis

```bash
# Ver status
git status

# Ver histórico
git log --oneline

# Ver remote
git remote -v

# Criar nova branch
git checkout -b nova-feature

# Fazer commit
git add .
git commit -m "Descrição da mudança"

# Enviar mudanças
git push
```

## 🌿 Workflow Recomendado

```bash
# 1. Criar branch para feature
git checkout -b feature/novo-dashboard

# 2. Fazer mudanças e testar
# ...

# 3. Commit
git add .
git commit -m "Add novo dashboard com dados mockados"

# 4. Push da branch
git push -u origin feature/novo-dashboard

# 5. No GitHub, criar Pull Request
# 6. Revisar e fazer merge para main
```

## 🔗 Links Úteis

- **Criar repositório:** https://github.com/new
- **Seus repositórios:** https://github.com/SEU_USUARIO?tab=repositories
- **Configurar token:** https://github.com/settings/tokens
- **GitHub Desktop:** https://desktop.github.com/
