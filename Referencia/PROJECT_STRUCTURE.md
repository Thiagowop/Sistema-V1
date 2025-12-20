
# 🗺️ Estrutura do Projeto & Guia de Desenvolvimento

Este documento serve como um mapa para entender onde cada funcionalidade do sistema reside. Use este guia para saber qual arquivo editar ao implementar novas features.

---

## 1. O "Cérebro" e Navegação Principal
O arquivo principal que estrutura o layout (Sidebar lateral + Área de conteúdo) é:

*   **`pages/App.tsx`**: Este é o **Roteador Principal**.
    *   Ele contém a Sidebar (`<aside>`) e o estado `currentView`.
    *   Se você quer adicionar um novo item no menu lateral, edite este arquivo.
    *   Ele decide qual "Dashboard" renderizar com base no menu clicado.

---

## 2. Mapeamento de Funcionalidades (Onde editar o quê?)

Se você precisa trabalhar em uma área específica, vá direto para estes arquivos:

| Funcionalidade (Menu) | Arquivo Principal (Container) | Descrição |
| :--- | :--- | :--- |
| **🔒 Admin** | `components/AdminDashboard.tsx` | Configurações de API Key, Mapeamento de Nomes, Criação de Grupos/Tags e Logs de Sync. |
| **⚙️ Configurações** | `components/SettingsDashboard.tsx` | Temas (Dark/Light), Filtros Globais (`FilterDashboard`) e Configuração de Relatórios de E-mail. |
| **📊 Gestão** | `components/gestao/ManagementDashboard.tsx` | O painel principal de BI. Contém abas internas (Visão Geral, Saúde, Operacional). |
| **📅 Alinhamento Diário** | `components/DailyAlignmentDashboard.tsx` | A lista de tarefas diárias estilo "Daily", com drag & drop. |
| **🚀 Projetos** | `components/ProjectsDashboard.tsx` | Visão focada em entregas por projeto e status. |
| **📥 Importar / Sync** | `components/ImportSyncView.tsx` | Tela de simulação de conexão com ClickUp e logs de terminal. |
| **💡 Sugestões** | `components/SuggestionsDashboard.tsx` | Formulário e lista para feedback dos usuários. |

---

## 3. Detalhando o Módulo "Gestão" (`ManagementDashboard.tsx`)

Você perguntou se as abas estão dentro de Gestão. **Sim**.
O arquivo `components/gestao/ManagementDashboard.tsx` possui seu próprio sistema de abas internas.

Se você quer alterar algo dentro da aba **"Gestão"**, verifique qual sub-aba você quer mexer:

1.  **Aba "Visão Geral":** Renderiza o componente `GeneralTeamDashboard` (em `components/GeneralTeamDashboard.tsx`).
2.  **Aba "Equipe & Saúde":** Lógica interna do `ManagementDashboard.tsx` (Cards de Burnout, Drill Down Modal).
3.  **Aba "Operacional":** Renderiza o `OperationalHub` (em `components/OperationalHub.tsx`).
4.  **Aba "IA Analyst":** Lógica interna que chama o `geminiService`.

---

## 4. Dados e Tipos (Backend Mockado)

*   **`constants.tsx`**: Aqui vivem os dados falsos (`MOCK_TEAM_DATA`, `MOCK_LEGACY_DATA`). Se quiser mudar os dados de teste, edite aqui.
*   **`types.ts`**: Definições de TypeScript. Se criar uma nova propriedade para uma tarefa ou usuário, adicione aqui primeiro.
*   **`services/clickup.ts`**: Lógica para buscar dados reais (se configurado no Admin).

---

## 5. O que NÃO mexer (Protótipos)

A pasta `components/prototype/` e o arquivo `components/PrototypeDashboard.tsx` contêm versões antigas, testes de layout e componentes legados.
*   Evite editar arquivos aqui a menos que esteja resgatando um código antigo.
*   O menu "Protótipo & Labs" no sistema aponta para cá.

---

## Resumo para sua implementação:

*   Vai mexer no **Admin** (API, Grupos)? -> **`components/AdminDashboard.tsx`**
*   Vai mexer nas **Configurações** (Relatórios, Tema)? -> **`components/SettingsDashboard.tsx`**
*   Vai mexer nos **Gráficos de Gestão/BI**? -> **`components/gestao/ManagementDashboard.tsx`**
