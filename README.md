# DailyFlow - Stand-up Automation

Projeto React + Vite para automação e visualização de Dailies, integrado com a API do ClickUp.

## 🚀 Funcionalidades

- **Visualização de Projetos**: Status, prazos, horas estimadas vs. gastas.
- **Alinhamento Semanal**: Resumo do que foi feito e o que está planejado.
- **Gestão Analítica**: Visão gerencial por colaborador.
- **Projetos Concluídos**: Histórico de entregas.
- **Filtros Avançados**: Por tag, status, responsável e prioridade.

## 🛠️ Tecnologias

- React 18 + TypeScript
- Vite
- Tailwind CSS
- ClickUp API (via Vercel Serverless Functions)

## 📦 Como Rodar Localmente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz com suas credenciais (veja `.env.example`):
   ```env
   VITE_CLICKUP_API_TOKEN=pk_...
   VITE_CLICKUP_LIST_IDS=...
   VITE_CLICKUP_TEAM_ID=...
   ```
4. Rode o projeto:
   ```bash
   npm run dev:all
   ```

## ☁️ Como Publicar na Vercel (Deploy)

Este projeto já está configurado para deploy automático na Vercel.

1. Crie um repositório no GitHub e suba este código.
2. Acesse [vercel.com](https://vercel.com) e importe o projeto do GitHub.
3. Na configuração do projeto na Vercel, adicione as **Environment Variables**:
   - `VITE_CLICKUP_API_TOKEN`: Seu token pessoal do ClickUp (pk_...).
   - `VITE_CLICKUP_LIST_IDS`: IDs das listas separados por vírgula.
   - `VITE_CLICKUP_TEAM_ID`: ID do time/espaço.
4. Clique em **Deploy**.

A Vercel cuidará automaticamente do Frontend e do Proxy da API (`api/proxy.js`).
