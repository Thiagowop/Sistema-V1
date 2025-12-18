// Cole este código no Console do navegador (F12 > Console)

const config = JSON.parse(localStorage.getItem('dailyPresenterConfig') || '{}');
const token = config.clickupApiToken || '';

console.log('=== DIAGNÓSTICO DO TOKEN ===');
console.log('Token completo:', token);
console.log('Primeiros 30 caracteres:', token.substring(0, 30));
console.log('Tamanho:', token.length);
console.log('Começa com "pk_"?', token.startsWith('pk_'));
console.log('Tem espaços?', token.includes(' '));
console.log('Tem "Bearer"?', token.includes('Bearer'));

// Testar autenticação
console.log('\n=== TESTE DE AUTENTICAÇÃO ===');

async function testarToken() {
    const testUrl = 'https://api.clickup.com/api/v2/user';
    
    console.log('🔍 Testando token direto (sem Bearer)...');
    try {
        const res1 = await fetch(testUrl, {
            headers: { 'Authorization': token }
        });
        console.log('Resultado sem Bearer:', res1.status, res1.statusText);
        if (res1.status === 200) {
            const data = await res1.json();
            console.log('✅ TOKEN VÁLIDO! Usuário:', data.user.username);
            return;
        }
    } catch (e) {
        console.log('❌ Erro sem Bearer:', e.message);
    }
    
    console.log('\n🔍 Testando com "Bearer" prefix...');
    try {
        const res2 = await fetch(testUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Resultado com Bearer:', res2.status, res2.statusText);
        if (res2.status === 200) {
            const data = await res2.json();
            console.log('⚠️ TOKEN precisa de "Bearer"! Usuário:', data.user.username);
            console.log('\n💡 SOLUÇÃO: O token precisa do prefixo "Bearer "');
            return;
        }
    } catch (e) {
        console.log('❌ Erro com Bearer:', e.message);
    }
    
    console.log('\n❌ TOKEN INVÁLIDO OU EXPIRADO');
    console.log('Ações:');
    console.log('1. Gere um novo token em: https://app.clickup.com/settings/apps');
    console.log('2. Cole aqui: localStorage.setItem("dailyPresenterConfig", JSON.stringify({...JSON.parse(localStorage.getItem("dailyPresenterConfig")), clickupApiToken: "SEU_NOVO_TOKEN"}))');
}

testarToken();
