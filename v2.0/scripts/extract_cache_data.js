// Script para extrair dados do cache do ClickUp
// Execute no console do navegador (F12) quando estiver na aplicação

console.log('='.repeat(80));
console.log('INICIANDO EXTRAÇÃO DE DADOS DO CLICKUP');
console.log('='.repeat(80));

// Chaves de cache
const PROCESSED_KEY = 'dailyFlow_processedCache_v2';
const METADATA_KEY = 'dailyFlow_metadataCache_v2';

// Função para extrair dados comprimidos
function extractCacheData() {
    try {
        // 1. Metadata
        const metaStr = localStorage.getItem(METADATA_KEY);
        if (metaStr) {
            console.log('\n📊 METADATA CACHE:');
            const meta = JSON.parse(metaStr);
            console.log('- Timestamp:', new Date(meta.timestamp).toLocaleString('pt-BR'));
            console.log('- Versão:', meta.version);
            console.log('- Task Count:', meta.taskCount);
            console.log('- Member Count:', meta.memberCount);
        }

        // 2. Processed Data (comprimido)
        const processedStr = localStorage.getItem(PROCESSED_KEY);
        if (!processedStr) {
            console.error('❌ Cache processado não encontrado!');
            return null;
        }

        const cacheInfo = JSON.parse(processedStr);
        console.log('\n📦 CACHE INFO:');
        console.log('- Timestamp:', new Date(cacheInfo.timestamp).toLocaleString('pt-BR'));
        console.log('- Compressed Size:', (cacheInfo.compressedSize / 1024).toFixed(2), 'KB');
        console.log('- Original Size:', (cacheInfo.originalSize / 1024).toFixed(2), 'KB');

        // 3. Descomprimir dados
        const compressedData = localStorage.getItem(PROCESSED_KEY + '_data');
        if (!compressedData) {
            console.error('❌ Dados comprimidos não encontrados!');
            return null;
        }

        // Usar LZString se disponível (está no projeto)
        if (typeof LZString !== 'undefined') {
            const decompressed = LZString.decompressFromUTF16(compressedData);
            const data = JSON.parse(decompressed);
            return data;
        } else {
            console.warn('⚠️ LZString não disponível, tentando parse direto...');
            const data = JSON.parse(compressedData);
            return data;
        }
    } catch (error) {
        console.error('❌ Erro ao extrair cache:', error);
        return null;
    }
}

// Executar extração
const data = extractCacheData();

if (data) {
    console.log('\n' + '='.repeat(80));
    console.log('✅ DADOS EXTRAÍDOS COM SUCESSO!');
    console.log('='.repeat(80));

    // Encontrar o usuário "Thiago"
    const thiagoData = data.find(member =>
        member.assignee && member.assignee.toLowerCase().includes('thiago')
    );

    if (thiagoData) {
        console.log('\n👤 DADOS DE THIAGO:');
        console.log('- Nome:', thiagoData.assignee);
        console.log('- Projetos:', thiagoData.projects.length);

        // Listar todos os projetos e tarefas
        thiagoData.projects.forEach((project, pIdx) => {
            console.log(`\n  📁 Projeto ${pIdx + 1}: ${project.name}`);
            console.log(`  - Tarefas: ${project.tasks.length}`);

            project.tasks.forEach((task, tIdx) => {
                console.log(`\n    📋 Tarefa ${tIdx + 1}: ${task.name}`);
                console.log(`    - ID: ${task.id}`);
                console.log(`    - Status: ${task.status || 'N/A'}`);
                console.log(`    - Start: ${task.startDate || 'N/A'}`);
                console.log(`    - Due: ${task.dueDate || 'N/A'}`);
                console.log(`    - Closed: ${task.dateClosed || 'N/A'}`);
                console.log(`    - Time Estimate: ${task.timeEstimate || 0}h`);
                console.log(`    - Time Logged: ${task.timeLogged || 0}h`);

                if (task.subtasks && task.subtasks.length > 0) {
                    console.log(`    - Subtarefas: ${task.subtasks.length}`);
                    task.subtasks.forEach((sub, sIdx) => {
                        console.log(`      🔹 Subtarefa ${sIdx + 1}: ${sub.name}`);
                        console.log(`      - Status: ${sub.status || 'N/A'}`);
                        console.log(`      - Start: ${sub.startDate || 'N/A'}`);
                        console.log(`      - Due: ${sub.dueDate || 'N/A'}`);
                        console.log(`      - Closed: ${sub.dateClosed || 'N/A'}`);
                        console.log(`      - Time: ${sub.timeEstimate || 0}h est, ${sub.timeLogged || 0}h log`);
                    });
                }
            });
        });

        // Salvar dados completos em arquivo
        console.log('\n' + '='.repeat(80));
        console.log('💾 Para salvar os dados completos:');
        console.log('1. Execute: copy(JSON.stringify(thiagoData, null, 2))');
        console.log('2. Cole em um arquivo .json');
        console.log('='.repeat(80));

        // Disponibilizar no window para análise
        window.THIAGO_DATA = thiagoData;
        window.ALL_DATA = data;

        console.log('\n✅ Dados disponíveis em:');
        console.log('- window.THIAGO_DATA (dados do Thiago)');
        console.log('- window.ALL_DATA (todos os membros)');
    } else {
        console.log('\n❌ Dados do Thiago não encontrados!');
        console.log('Membros disponíveis:');
        data.forEach((member, idx) => {
            console.log(`  ${idx + 1}. ${member.assignee}`);
        });
    }
} else {
    console.log('\n❌ Falha ao extrair dados do cache!');
}

console.log('\n' + '='.repeat(80));
console.log('EXTRAÇÃO CONCLUÍDA');
console.log('='.repeat(80));
