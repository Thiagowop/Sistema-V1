# Como Configurar Google Login

## 📋 Passo a Passo

### 1. Criar Projeto no Google Cloud Console
1. Acesse: https://console.cloud.google.com/
2. Clique em "Select a project" > "New Project"
3. Nome: "DailyFlow MCSA" (ou outro nome)
4. Clique em "Create"

### 2. Ativar Google Identity API
1. No menu lateral: APIs & Services > Library
2. Busque: "Google Identity Services"
3. Clique em "Enable"

### 3. Criar Credenciais OAuth
1. APIs & Services > Credentials
2. Clique em "+ CREATE CREDENTIALS"
3. Selecione "OAuth client ID"
4. Application type: "Web application"
5. Name: "DailyFlow Web"

### 4. Configurar Origens Autorizadas
**Authorized JavaScript origins:**
```
http://localhost:3019
http://localhost:5173
https://seu-dominio-vercel.vercel.app
```

**Authorized redirect URIs:**
```
http://localhost:3019
https://seu-dominio-vercel.vercel.app
```

### 5. Copiar Client ID
Após criar, você verá:
```
Client ID: 123456789-abcdefghijk.apps.googleusercontent.com
```

### 6. Configurar no Projeto

**Desenvolvimento (Local):**
Crie arquivo `/app/.env`:
```env
VITE_GOOGLE_CLIENT_ID=cole-seu-client-id-aqui.apps.googleusercontent.com
```

**Produção (Vercel):**
1. Vercel Dashboard > Settings > Environment Variables
2. Adicione: `VITE_GOOGLE_CLIENT_ID`
3. Value: seu Client ID
4. Environments: Production, Preview, Development

### 7. Testar
```bash
npm run dev
```

Acesse http://localhost:3019 e verá o botão "Continue with Google"

## 🔒 Segurança

### Restrições Recomendadas (Google Console)
1. Domain verification: Adicione apenas domínios MCSA
2. Authorized domains: 
   - `mcsarc.com.br`
   - `localhost` (apenas dev)
3. User type: Internal (apenas usuários da organização)

### Validação no Código
O sistema já valida que apenas emails `@mcsarc.com.br` podem fazer login.

## 🎯 Status Atual

**SEM configuração (atual):**
- ✅ Login com email/senha funciona
- ❌ Botão Google NÃO aparece

**COM configuração:**
- ✅ Login com email/senha funciona
- ✅ Botão Google aparece
- ✅ Login com conta Google @mcsarc.com.br

## 📝 Notas

- O Google Login é OPCIONAL
- Sistema funciona 100% sem ele
- Adiciona conveniência: um clique, sem senha
- Mais seguro: autenticação delegada ao Google
