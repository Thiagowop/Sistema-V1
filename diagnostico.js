// Diagnóstico do localStorage - Cole no Console do Navegador (F12)

console.log("=== DIAGNÓSTICO DO DAILY FLOW ===\n");

// 1. Verificar configurações
const config = localStorage.getItem('dailyPresenterConfig');
if (config) {
  const parsed = JSON.parse(config);
  console.log("✅ Configurações encontradas:");
  console.log("Token:", parsed.clickupApiToken ? "✅ Configurado (***)" : "❌ Não configurado");
  console.log("List IDs:", parsed.clickupListIds ? `✅ ${parsed.clickupListIds}` : "❌ Não configurado");
  console.log("Team ID:", parsed.clickupTeamId || "Não configurado");
  console.log("\n");
} else {
  console.log("❌ Nenhuma configuração encontrada!\n");
}

// 2. Verificar cache de dados
const cachedData = localStorage.getItem('dailyFlowCachedData');
if (cachedData) {
  const parsed = JSON.parse(cachedData);
  console.log("✅ Cache encontrado:");
  console.log("Data:", new Date(parsed.timestamp).toLocaleString('pt-BR'));
  console.log("Tarefas:", parsed.taskCount || 0);
  console.log("\n");
} else {
  console.log("❌ Nenhum cache encontrado!\n");
}

// 3. Verificar autenticação
const auth = localStorage.getItem('dailyFlow_isAuthenticated');
console.log("Autenticado:", auth === 'true' ? "✅ Sim" : "❌ Não");
console.log("\n");

// 4. Listar todas as chaves do localStorage
console.log("📋 Todas as chaves no localStorage:");
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.includes('daily') || key?.includes('Daily')) {
    console.log(`  - ${key}`);
  }
}

console.log("\n=== FIM DO DIAGNÓSTICO ===");
