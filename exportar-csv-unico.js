// SCRIPT DE EXPORTAÇÃO ÚNICA - Execute no Console do Navegador (F12 > Console)
// Gera CSV com todos os dados sincronizados do ClickUp

(async function exportarParaCSV() {
    console.log('📊 Iniciando exportação para CSV...');
    
    // Tentar pegar dados do cache
    let dados = null;
    
    // Tentar IndexedDB primeiro
    try {
        const dbRequest = indexedDB.open('dailyFlowCache', 3);
        
        await new Promise((resolve, reject) => {
            dbRequest.onsuccess = () => {
                const db = dbRequest.result;
                const transaction = db.transaction(['rawData'], 'readonly');
                const store = transaction.objectStore('rawData');
                const getRequest = store.get('clickup_raw_tasks');
                
                getRequest.onsuccess = () => {
                    if (getRequest.result) {
                        dados = getRequest.result.data;
                        console.log('✅ Dados encontrados no IndexedDB:', dados.length, 'tarefas');
                    }
                    resolve();
                };
                getRequest.onerror = reject;
            };
            dbRequest.onerror = reject;
        });
    } catch (e) {
        console.log('⚠️ IndexedDB não disponível:', e.message);
    }
    
    // Se não achou no IndexedDB, tentar localStorage
    if (!dados) {
        const keys = ['dailyFlow_processed_v3', 'dailyFlowCachedData', 'clickup_cache_data'];
        for (const key of keys) {
            const cached = localStorage.getItem(key);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed)) {
                        dados = parsed;
                    } else if (parsed.data && Array.isArray(parsed.data)) {
                        dados = parsed.data;
                    }
                    if (dados) {
                        console.log(`✅ Dados encontrados em ${key}`);
                        break;
                    }
                } catch (e) {}
            }
        }
    }
    
    if (!dados || dados.length === 0) {
        console.error('❌ Nenhum dado encontrado no cache!');
        alert('❌ Nenhum dado encontrado. Execute uma sincronização primeiro.');
        return;
    }
    
    // Extrair todas as tarefas dos grupos
    const todasTarefas = [];
    dados.forEach(grupo => {
        if (grupo.tasks && Array.isArray(grupo.tasks)) {
            grupo.tasks.forEach(task => {
                todasTarefas.push({
                    ...task,
                    projeto: grupo.name || grupo.projectName || 'Sem Projeto'
                });
            });
        }
    });
    
    console.log(`📋 Total de tarefas encontradas: ${todasTarefas.length}`);
    
    // Criar CSV
    const headers = [
        'ID',
        'Nome',
        'Projeto',
        'Status',
        'Prioridade',
        'Responsável',
        'Tags',
        'Data Início',
        'Data Entrega',
        'Data Fechamento',
        'Horas Estimadas',
        'Horas Gastas',
        'Descrição',
        'Lista',
        'Parent ID',
        'URL'
    ];
    
    let csv = headers.join(',') + '\n';
    
    todasTarefas.forEach(task => {
        const row = [
            task.id || '',
            `"${(task.name || '').replace(/"/g, '""')}"`,
            `"${(task.projeto || '').replace(/"/g, '""')}"`,
            `"${(task.status || '').replace(/"/g, '""')}"`,
            `"${(task.priority || '').replace(/"/g, '""')}"`,
            `"${(task.assignee || '').replace(/"/g, '""')}"`,
            `"${(task.tags || []).join('; ').replace(/"/g, '""')}"`,
            task.startDate || '',
            task.dueDate || '',
            task.dateCompleted || '',
            task.estimatedHours || 0,
            task.actualHours || 0,
            `"${(task.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            `"${(task.listName || '').replace(/"/g, '""')}"`,
            task.parentId || '',
            `https://app.clickup.com/t/${task.id || ''}`
        ];
        
        csv += row.join(',') + '\n';
    });
    
    // Criar e baixar arquivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `clickup-export-${timestamp}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ CSV gerado com sucesso: ${filename}`);
    console.log(`📊 Total de ${todasTarefas.length} tarefas exportadas`);
    alert(`✅ CSV gerado com sucesso!\n\n${todasTarefas.length} tarefas exportadas\nArquivo: ${filename}`);
})();
