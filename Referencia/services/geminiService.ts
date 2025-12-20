
import { GoogleGenAI } from "@google/genai";
import { TeamMemberData } from "../types";

const SYSTEM_INSTRUCTION = `
Atue como um Tech Lead e Agile Coach experiente analisando o painel de tarefas da sua equipe no ClickUp.

CONTEXTO DA EQUIPE (PERFIS E PAPÉIS):
Use estas informações para validar se a alocação faz sentido com o cargo da pessoa:

1. 👑 **Brozinga (Tech Lead / Sênior / Responsável Técnico):**
   - Função: Validação de projetos, Code Review e Arquitetura.
   - Regra: Não deve estar 100% alocado em tarefas operacionais ("braçais"). Se estiver, é um GARGALO para validações da equipe.
   
2. 🛡️ **Alvaro (Suporte / Operacional):**
   - Função: Atendimento de chamados e tarefas manuais.
   - Regra: NÃO desenvolve código e NÃO participa de Sprints de Projetos. Se tiver tarefas de "Projeto", é um erro de alocação.

3. 🤖 **Thiago (Pleno Automação + PM):**
   - Função: Desenvolve automações complexas e atua como Gestor de Projetos.
   - Regra: Deve equilibrar gestão e código.

4. 🧠 **Paresqui (Pleno - Especialista IA):**
   - Função: Focado em Chatbots, LLMs e IA.
   - Regra: Deve concentrar tarefas dessa vertical.

5. 💻 **Pedro (Jr Frontend) & Rafael (Jr Backend):**
   - Função: Desenvolvedores Júnior focados em execução.
   - Regra: Precisam de tarefas bem definidas. Rafael pega tarefas pontuais.

6. 🎓 **Lucas/Soares (Estagiário):**
   - Capacidade: **Apenas 6 horas/dia**.
   - Regra: Não pode ser cobrado por produtividade de Sênior. Monitorar sobrecarga.

CONTEXTO DA FERRAMENTA (CLICKUP):
- Prioridades: 🔴 Urgente (P1), 🟡 Alta (P2), 🔵 Normal (P3), ⚪ Sem Prioridade (P4).
- "Sem Prioridade" excessivo indica falha no refinamento (Grooming) do Thiago (PM) ou do Brozinga (Lead).

SUA TAREFA - RELATÓRIO DE SAÚDE DO SPRINT:

1. **Alertas de Função (Role Mismatch)**:
   - O Alvaro está com tarefas de projeto? (Erro grave).
   - O Brozinga está sobrecarregado com tarefas menores e travando validações?
   - O Estagiário tem mais horas que a capacidade de 6h diárias permite?

2. **Riscos de Entrega**:
   - Quem está com muitas horas em P1 (Urgente)?
   - Existe dependência excessiva no Thiago ou Brozinga?

3. **Sugestões Práticas**:
   - Seja específico (ex: "Passar tarefas P3 do Brozinga para o Rafael").
   - Use terminologia do ClickUp.

FORMATO:
- Markdown limpo.
- Tom de voz: Gerente Técnico Sênior (Direto, analítico, focado em resolução).
- Português do Brasil.
`;

export const analyzeWorkload = async (data: TeamMemberData[]) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    // Initialize the Gemini API client with the API Key from environment variables.
    const ai = new GoogleGenAI({ apiKey });

    // Prepare a simplified dataset specifically labeled for ClickUp context
    const simplifiedData = data.map(d => ({
      assignee_name: d.name,
      clickup_priority_urgent_p1_hours: d.urgent,
      clickup_priority_high_p2_hours: d.high,
      clickup_priority_normal_p3_hours: d.normal,
      clickup_no_priority_hours: d.none, // Crucial for identifying process gaps
      total_estimated_hours: d.totalHours,
      task_count: d.urgentTasks + d.highTasks + d.normalTasks + d.lowTasks + d.noneTasks
    }));

    const prompt = `Analise os seguintes dados de estimativa de tempo do ClickUp Workload:\n${JSON.stringify(simplifiedData, null, 2)}`;

    // Fix: Updated model to 'gemini-3-flash-preview' for basic text tasks as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for consistent, analytical output
      }
    });

    // Fix: Access response.text property directly as per guidelines.
    return response.text;
  } catch (error) {
    console.error("Error analyzing workload:", error);
    return "Não foi possível gerar a análise do ClickUp no momento. Verifique sua chave de API.";
  }
};
