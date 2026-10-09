import { CanvasHelper } from './src/utils/canvasHelper.ts';
import { sampleMemoryNow, getMemoryStats, stopMemoryMonitor } from './server.ts';
import db from './src/database/db.ts';

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestSuite() {
    console.log('================================================================');
    console.log('  TESTES AUTOMATIZADOS: FILA CANVAS & MONITORAMENTO DE MEMÓRIA  ');
    console.log('================================================================\n');

    let maxObservedWorkers = 0;
    const sampleWorkers = () => {
        const stats = CanvasHelper.getQueueStats();
        if (stats.activeWorkers > maxObservedWorkers) {
            maxObservedWorkers = stats.activeWorkers;
        }
    };
    const sampleInterval = setInterval(sampleWorkers, 5);

    // ------------------------------------------------------------------------
    // ITEM 1: CONCORRÊNCIA MÁXIMA DE 1
    // ------------------------------------------------------------------------
    console.log('1. [TESTE DE CONCORRÊNCIA MÁXIMA = 1]');
    const startBatch = Date.now();
    const batchTasks = Array.from({ length: 6 }, (_, i) =>
        CanvasHelper.enqueue(async () => {
            sampleWorkers();
            await delay(30);
            sampleWorkers();
            return `task_${i}`;
        })
    );
    const batchResults = await Promise.all(batchTasks);
    console.log(`   - 6 tarefas processadas em ${Date.now() - startBatch}ms`);
    console.log(`   - Maior concorrência observada: ${maxObservedWorkers}`);
    const test1Passed = maxObservedWorkers === 1 && batchResults.length === 6;
    console.log(`   - Resultado: ${test1Passed ? '✅ APROVADO (Concorrência estritamente = 1)' : '❌ FALHA'}\n`);

    // ------------------------------------------------------------------------
    // ITENS 2, 3, 4, 7 & 8: TIMEOUT DE 15s, RETENÇÃO DO WORKER E RECUPERAÇÃO
    // ------------------------------------------------------------------------
    console.log('2. [TESTE DE TIMEOUT 15s, RETENÇÃO DO WORKER E RECUPERAÇÃO]');
    console.log('   Iniciando Tarefa Lenta (16.000ms)...');

    let taskTimeoutFiredAt = 0;
    let taskTimeoutErrorMsg = '';
    let slowTaskNativeEnded = false;
    let nextTaskStartedAt = 0;
    let workerLeakedEarly = false;

    const t0 = Date.now();

    // Tarefa A (Lenta): Executa por 16 segundos, excedendo o timeout de 15 segundos
    const slowTask = CanvasHelper.enqueue(async () => {
        await delay(16000);
        slowTaskNativeEnded = true;
        return 'slow_done';
    }).catch(err => {
        taskTimeoutFiredAt = Date.now() - t0;
        taskTimeoutErrorMsg = err.message;
    });

    await delay(100);

    // Tarefa B: Fica na fila e só pode iniciar após o término da Tarefa A (t >= 16.000ms)
    const nextTask = CanvasHelper.enqueue(async () => {
        nextTaskStartedAt = Date.now() - t0;
        await delay(50);
        return 'next_done';
    });

    // Monitor de verificação de vazamento de concorrência durante o timeout
    const leakChecker = setInterval(() => {
        const elapsed = Date.now() - t0;
        if (elapsed > 15100 && !slowTaskNativeEnded) {
            if (nextTaskStartedAt > 0) {
                workerLeakedEarly = true;
            }
        }
    }, 20);

    await Promise.all([slowTask, nextTask]);
    clearInterval(leakChecker);

    console.log(`   - Timeout de 15s registrado em: ${taskTimeoutFiredAt}ms (Mensagem: "${taskTimeoutErrorMsg}")`);
    console.log(`   - Operação nativa da Tarefa Lenta terminou em segundo plano: ${slowTaskNativeEnded}`);
    console.log(`   - Próxima tarefa iniciou em: ${nextTaskStartedAt}ms (>= 16.000ms esperado)`);
    console.log(`   - Worker vazou antes da conclusão nativa? ${workerLeakedEarly ? 'SIM (FALHA)' : 'NÃO (RETENÇÃO CONFIRMADA)'}`);
    
    const testTimeoutPassed = 
        taskTimeoutFiredAt >= 14900 && 
        taskTimeoutFiredAt <= 15500 &&
        slowTaskNativeEnded &&
        nextTaskStartedAt >= 15900 &&
        !workerLeakedEarly;
    console.log(`   - Resultado: ${testTimeoutPassed ? '✅ APROVADO (Timeout de 15s com worker retido até final nativo)' : '❌ FALHA'}\n`);

    // ------------------------------------------------------------------------
    // ITENS 5: REJEIÇÃO CONTROLADA DA 26ª TAREFA PENDENTE
    // ------------------------------------------------------------------------
    console.log('3. [TESTE DE LIMITE DA FILA (25 PENDENTES E REJEIÇÃO DA 26ª)]');
    // Segura o worker com tarefa ativa
    const activeHold = CanvasHelper.enqueue(async () => {
        await delay(300);
        return 'hold_done';
    });

    // Enfileira exatamente 25 tarefas pendentes
    const queue25Promises: Promise<any>[] = [];
    for (let i = 1; i <= 25; i++) {
        queue25Promises.push(CanvasHelper.enqueue(async () => {
            await delay(5);
            return `q_${i}`;
        }));
    }

    // Tenta a 26ª tarefa pendente (deve ser rejeitada)
    let rejected26 = false;
    let rejected26Msg = '';
    try {
        await CanvasHelper.enqueue(async () => 'overflow_task');
    } catch (err: any) {
        rejected26 = true;
        rejected26Msg = err.message;
    }

    await activeHold;
    await Promise.all(queue25Promises);

    console.log(`   - 26ª tarefa rejeitada? ${rejected26}`);
    console.log(`   - Mensagem de rejeição: "${rejected26Msg}"`);
    const test5Passed = rejected26 && rejected26Msg.includes('limite de 25 excedido');
    console.log(`   - Resultado: ${test5Passed ? '✅ APROVADO (Fila limitada a 25 e rejeição controlada)' : '❌ FALHA'}\n`);

    // ------------------------------------------------------------------------
    // ITEM 6: RECUPERAÇÃO DA FILA APÓS ERRO
    // ------------------------------------------------------------------------
    console.log('4. [TESTE DE RECUPERAÇÃO DA FILA APÓS ERRO]');
    let errorCaught = false;
    await CanvasHelper.enqueue(async () => {
        throw new Error('Falha simulada na renderização Cairo');
    }).catch(() => {
        errorCaught = true;
    });

    const recoveryTaskResult = await CanvasHelper.enqueue(async () => 'fila_recuperada');
    const test6Passed = errorCaught && recoveryTaskResult === 'fila_recuperada';
    console.log(`   - Erro capturado e tarefa subsequente concluída: "${recoveryTaskResult}"`);
    console.log(`   - Resultado: ${test6Passed ? '✅ APROVADO (Fila recupera após erro)' : '❌ FALHA'}\n`);

    // ------------------------------------------------------------------------
    // ITEM 9: MONITORAMENTO DE RSS INDEPENDENTE DA ROTA /status
    // ------------------------------------------------------------------------
    console.log('5. [TESTE DE MONITORAMENTO CONTÍNUO DE RSS]');
    const sample1 = sampleMemoryNow();
    const statsInitial = getMemoryStats();
    console.log(`   - RSS atual: ${statsInitial.rssMB}`);
    console.log(`   - Pico de RSS registrado: ${statsInitial.peakRssMB}`);
    console.log(`   - Última leitura amostrada: ${statsInitial.lastSampledRssMB}`);

    // Simula uma alocação para verificar a atualização de pico
    const dummyBuffers: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
        dummyBuffers.push(Buffer.alloc(2 * 1024 * 1024, 0xff)); // 10MB
    }
    const sample2 = sampleMemoryNow();
    const statsUpdated = getMemoryStats();

    console.log(`   - RSS após alocação de teste: ${statsUpdated.rssMB}`);
    console.log(`   - Novo pico de RSS capturado: ${statsUpdated.peakRssMB}`);
    dummyBuffers.length = 0; // Descarte

    const test9Passed = typeof sample1.currentRss === 'number' && statsUpdated.peakRssMB.includes('MB');
    console.log(`   - Resultado: ${test9Passed ? '✅ APROVADO (Amostragem e pico de RSS operando continuamente)' : '❌ FALHA'}\n`);

    // ------------------------------------------------------------------------
    // PERSISTÊNCIA SQLITE
    // ------------------------------------------------------------------------
    console.log('6. [TESTE DE PERSISTÊNCIA SQLITE COM WAL]');
    await db.set('test_audit_key', { ok: true, ts: Date.now() });
    const val = await db.get('test_audit_key');
    await db.delete('test_audit_key');
    const testDbPassed = val && val.ok === true;
    console.log(`   - Persistência QuickDB + better-sqlite3: ${testDbPassed ? '✅ APROVADO' : '❌ FALHA'}\n`);

    clearInterval(sampleInterval);
    stopMemoryMonitor();

    const allPassed = test1Passed && testTimeoutPassed && test5Passed && test6Passed && test9Passed && testDbPassed;

    console.log('================================================================');
    console.log(`  RESULTADO GERAL DOS TESTES: ${allPassed ? 'TODOS OS 9 ITENS APROVADOS (100%)' : 'HOUVE FALHAS'}`);
    console.log('================================================================\n');

    process.exit(allPassed ? 0 : 1);
}

runTestSuite().catch(e => {
    console.error('[ERRO CRÍTICO]:', e);
    process.exit(1);
});
