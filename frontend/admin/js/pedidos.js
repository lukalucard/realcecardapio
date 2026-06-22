/* ==========================================================================
   ESTADO GLOBAL DO PAINEL DE PEDIDOS
   ========================================================================== */
let pedidosAtivosGlobais = [];
let quantidadeAnteriorDePedidos = 0; // Controla o aviso sonoro

document.addEventListener('DOMContentLoaded', () => {
    configurarSubmenuSuperior();
    
    // Busca os pedidos na hora que a página abre
    buscarPedidosDoServidor();

    // O RADAR: Fica buscando novos pedidos automaticamente a cada 10 segundos
    setInterval(buscarPedidosDoServidor, 10000); 
});

// Som de notificação para a cozinha
function tocarSomNovoPedido() {
    // Um beep simples e agradável
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.log("O navegador bloqueou o som automático. O gestor precisa clicar na tela antes."));
}

function configurarSubmenuSuperior() {
    const botoesMenu = document.querySelectorAll('.tab-link');
    const painelGeral = document.getElementById('painel-geral');
    const painelFlutuantes = document.getElementById('painel-flutuantes');
    const painelHistorico = document.getElementById('painel-historico');

    botoesMenu.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesMenu.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            const abaSelecionada = botao.getAttribute('data-aba');

            if (painelGeral) painelGeral.style.display = 'none';
            if (painelFlutuantes) painelFlutuantes.style.display = 'none';
            if (painelHistorico) painelHistorico.style.display = 'none';

            if (abaSelecionada === 'geral' && painelGeral) {
                painelGeral.style.display = 'block';
                renderizarModoGeralEsteira(pedidosAtivosGlobais);
            } else if (abaSelecionada === 'flutuantes' && painelFlutuantes) {
                painelFlutuantes.style.display = 'grid';
                renderizarModoPedidosFlutuantes(pedidosAtivosGlobais);
            } else if (abaSelecionada === 'historico' && painelHistorico) {
                painelHistorico.style.display = 'block';
            }
        });
    });
}

async function buscarPedidosDoServidor() {
    try {
        const resposta = await fetch('/api/pedidos/ativos');
        if (!resposta.ok) throw new Error("Erro na comunicação");
        
        pedidosAtivosGlobais = await resposta.json();

        // LÓGICA DO AVISO SONORO: Se o número de pedidos atuais for maior que o anterior, toca o som!
        const quantidadeAtual = pedidosAtivosGlobais.length;
        if (quantidadeAtual > quantidadeAnteriorDePedidos && quantidadeAnteriorDePedidos !== 0) {
            tocarSomNovoPedido();
        }
        quantidadeAnteriorDePedidos = quantidadeAtual;

        // Atualiza os contadores globais de ambas as abas antes de desenhar
        calcularEAtualizarContadores(pedidosAtivosGlobais);

        const abaAtiva = document.querySelector('.tab-link.active');
        const tipoAba = abaAtiva ? abaAtiva.getAttribute('data-aba') : 'geral';

        // Trata a renderização correta dependendo de qual aba o gestor está olhando
        if (tipoAba === 'geral') {
            renderizarModoGeralEsteira(pedidosAtivosGlobais);
        } else if (tipoAba === 'flutuantes') {
            renderizarModoPedidosFlutuantes(pedidosAtivosGlobais);
        } else if (tipoAba === 'historico') {
            buscarHistoricoDePedidos();
        }
    } catch (erro) {
        console.error("❌ Falha ao buscar pedidos ativos:", erro);
    }
}

function calcularEAtualizarContadores(pedidos) {
    const contadores = { pedidos: 0, pagamento: 0, preparo: 0, entrega: 0 };
    
    pedidos.forEach(pedido => {
        let statusNormalizado = pedido.status === 'novos' ? 'pedidos' : pedido.status;
        if (contadores.hasOwnProperty(statusNormalizado)) {
            contadores[statusNormalizado]++;
        }
    });

    // Atualiza os badges da aba Pedidos Flutuantes (Kanban)
    if(document.getElementById('badge-pedidos')) document.getElementById('badge-pedidos').innerText = contadores.pedidos;
    if(document.getElementById('badge-pagamento')) document.getElementById('badge-pagamento').innerText = contadores.pagamento;
    if(document.getElementById('badge-preparo')) document.getElementById('badge-preparo').innerText = contadores.preparo;
    if(document.getElementById('badge-entrega')) document.getElementById('badge-entrega').innerText = contadores.entrega;

    // Atualiza os badges novos da aba Pedidos Geral (Esteira Horizontal)
    if(document.getElementById('esteira-badge-pedidos')) document.getElementById('esteira-badge-pedidos').innerText = contadores.pedidos;
    if(document.getElementById('esteira-badge-pagamento')) document.getElementById('esteira-badge-pagamento').innerText = contadores.pagamento;
    if(document.getElementById('esteira-badge-preparo')) document.getElementById('esteira-badge-preparo').innerText = contadores.preparo;
    if(document.getElementById('esteira-badge-entrega')) document.getElementById('esteira-badge-entrega').innerText = contadores.entrega;
}

function renderizarModoGeralEsteira(pedidos) {
    const container = document.getElementById('lista-pedidos-linhas');
    if (!container) return;
    container.innerHTML = '';

    if (!pedidos || pedidos.length === 0) {
        container.innerHTML = '<div class="empty-message">Nenhum pedido ativo na esteira.</div>';
        return;
    }

    pedidos.forEach(pedido => {
        let statusReal = pedido.status === 'novos' ? 'pedidos' : pedido.status;
        const subStatus = pedido.sub_status || 'aguardando';
        const valorFormatado = parseFloat(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        let trocoHTML = '';
        if (pedido.forma_pagamento === 'DINHEIRO' && parseFloat(pedido.troco) > 0) {
            const trocoFormatado = parseFloat(pedido.troco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            trocoHTML = `<span class="troco-destaque" style="display:block;margin-top:2px;">Troco: ${trocoFormatado}</span>`;
        }

        // --- CÉLULA 1: PEDIDOS ---
        let htmlCel1 = '';
        if (statusReal === 'pedidos') {
            htmlCel1 = `
                <div class="celula-esteira etapa-iluminada">
                    <div>
                        <span class="pedido-id">#${pedido.id}</span>
                        <h4>${pedido.cliente_nome}</h4>
                        <p style="font-size:0.82rem; margin-bottom:4px;"><strong>Itens:</strong> ${pedido.itens}</p>
                        <small style="color:#ef4444;"><i class="fas fa-map-marker-alt"></i> ${pedido.endereco_entrega || 'Balcão'}</small>
                    </div>
                    <button class="btn-avancar" onclick="executarAvancoDeEtapa(${pedido.id}, '${statusReal}', '${subStatus}')"><i class="fas fa-check"></i> Aceitar Pedido</button>
                </div>`;
        } else {
            htmlCel1 = `
                <div class="celula-esteira etapa-concluida">
                    <div>
                        <span class="pedido-id">#${pedido.id}</span>
                        <h4>${pedido.cliente_nome}</h4>
                        <p style="font-size:0.82rem; margin-bottom:4px;"><strong>Itens:</strong> ${pedido.itens}</p>
                        <small style="color:#6b7280;"><i class="fas fa-map-marker-alt"></i> ${pedido.endereco_entrega || 'Balcão'}</small>
                    </div>
                    <span class="txt-concluido-check"><i class="fas fa-check-circle"></i> Pedido Aceito</span>
                </div>`;
        }

        // --- CÉLULA 2: PAGAMENTO ---
        let htmlCel2 = '';
        if (statusReal === 'pedidos') {
            htmlCel2 = `<div class="celula-esteira etapa-apagada"><h4>Aguardando</h4><p>Etapa financeira bloqueada.</p></div>`;
        } else if (statusReal === 'pagamento') {
            htmlCel2 = `
                <div class="celula-esteira etapa-iluminada">
                    <div>
                        <h4>Pagamento</h4>
                        <span class="pago-badge status-verde" style="display:inline-block;margin-bottom:6px;">${pedido.forma_pagamento}</span>
                        <p style="font-weight:700; font-size:1rem; margin:0;">Total: ${valorFormatado}${trocoHTML}</p>
                    </div>
                    <button class="btn-avancar" onclick="executarAvancoDeEtapa(${pedido.id}, '${statusReal}', '${subStatus}')"><i class="fas fa-fire"></i> Enviar p/ Cozinha</button>
                </div>`;
        } else {
            htmlCel2 = `
                <div class="celula-esteira etapa-concluida">
                    <div>
                        <h4>Pagamento</h4>
                        <span class="pago-badge status-verde" style="display:inline-block;margin-bottom:6px;">${pedido.forma_pagamento}</span>
                        <p style="font-size:0.9rem; margin:0;">Total Pago: ${valorFormatado}</p>
                    </div>
                    <span class="txt-concluido-check"><i class="fas fa-check-circle"></i> Financeiro Pago</span>
                </div>`;
        }

        // --- CÉLULA 3: EM PREPARO ---
        let htmlCel3 = '';
        if (statusReal === 'pedidos' || statusReal === 'pagamento') {
            htmlCel3 = `<div class="celula-esteira etapa-apagada"><h4>Cozinha</h4><p>Aguardando liberação.</p></div>`;
        } else if (statusReal === 'preparo') {
            let textoBotao = '';
            let labelStatus = '';
            
            if (subStatus === 'aguardando') {
                labelStatus = '<span class="badge-substatus sub-aguardando">Aguardando Cozinha</span>';
                textoBotao = '<i class="fas fa-play"></i> Iniciar Preparo';
            } else if (subStatus === 'preparando') {
                labelStatus = '<span class="badge-substatus sub-preparando">Preparando...</span>';
                textoBotao = '<i class="fas fa-stopwatch"></i> Marcar como Pronto';
            } else if (subStatus === 'pronto') {
                labelStatus = '<span class="badge-substatus sub-pronto">Pronto p/ Envio</span>';
                textoBotao = '<i class="fas fa-motorcycle"></i> Despachar Entrega';
            }

            htmlCel3 = `
                <div class="celula-esteira etapa-iluminada">
                    <div>
                        <h4>Produção</h4>
                        <p style="margin-bottom:6px;">${labelStatus}</p>
                    </div>
                    <button class="btn-avancar" onclick="executarAvancoDeEtapa(${pedido.id}, '${statusReal}', '${subStatus}')">${textoBotao}</button>
                </div>`;
        } else {
            htmlCel3 = `
                <div class="celula-esteira item-concluido etapa-concluida">
                    <div>
                        <h4>Produção</h4>
                        <p><span class="badge-substatus sub-pronto">Finalizado</span></p>
                    </div>
                    <span class="txt-concluido-check"><i class="fas fa-check-circle"></i> Pronto e Despachado</span>
                </div>`;
        }

        // --- CÉLULA 4: SAIU PARA ENTREGA ---
        let htmlCel4 = '';
        if (statusReal !== 'entrega') {
            htmlCel4 = `<div class="celula-esteira etapa-apagada"><h4>Logística</h4><p>Aguardando produção.</p></div>`;
        } else {
            let labelEntrega = subStatus === 'aguardando' ? 'Aguardando Motoboy' : 'Saiu para Entrega';
            let txtBtn = subStatus === 'aguardando' ? '<i class="fas fa-shipping-fast"></i> Despachar Rota' : '<i class="fas fa-hand-holding-usd"></i> Finalizar Pedido';
            
            htmlCel4 = `
                <div class="celula-esteira etapa-iluminada">
                    <div>
                        <h4>Logística</h4>
                        <p><span class="badge-substatus sub-rota">${labelEntrega}</span></p>
                    </div>
                    <button class="btn-avancar" onclick="executarAvancoDeEtapa(${pedido.id}, '${statusReal}', '${subStatus}')">${txtBtn}</button>
                </div>`;
        }

        const linhaCompletaHTML = `
            <div class="linha-esteira-pedido" id="trilho-pedido-${pedido.id}">
                ${htmlCel1}
                ${htmlCel2}
                ${htmlCel3}
                ${htmlCel4}
            </div>
        `;
        container.innerHTML += linhaCompletaHTML;
    });
}

function renderizarModoPedidosFlutuantes(pedidos) {
    const colunas = {
        pedidos: document.getElementById('cards-pedidos'),
        pagamento: document.getElementById('cards-pagamento'),
        preparo: document.getElementById('cards-preparo'),
        entrega: document.getElementById('cards-entrega')
    };

    Object.values(colunas).forEach(col => { if(col) col.innerHTML = ''; });

    if (!pedidos || pedidos.length === 0) {
        Object.values(colunas).forEach(col => { if(col) col.innerHTML = '<div class="empty-message">Vazio</div>'; });
        return;
    }

    pedidos.forEach(pedido => {
        let statusNormalizado = pedido.status === 'novos' ? 'pedidos' : pedido.status;
        const subStatus = pedido.sub_status || 'aguardando';

        if (colunas[statusNormalizado]) {
            const valorFormatado = parseFloat(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            let btnTexto = 'Avançar';
            if (statusNormalizado === 'pedidos') btnTexto = '<i class="fas fa-check"></i> Aceitar Pedido';
            else if (statusNormalizado === 'pagamento') btnTexto = '<i class="fas fa-fire"></i> Ir p/ Cozinha';
            else if (statusNormalizado === 'preparo') {
                btnTexto = subStatus === 'aguardando' ? '<i class="fas fa-play"></i> Iniciar' : '<i class="fas fa-stopwatch"></i> Pronto';
            } else if (statusNormalizado === 'entrega') {
                btnTexto = subStatus === 'aguardando' ? '<i class="fas fa-motorcycle"></i> Despachar' : '<i class="fas fa-hand-holding-usd"></i> Finalizar';
            }

            const cardHTML = `
                <div class="pedido-card">
                    <div class="card-header">
                        <span class="pedido-id">#${pedido.id}</span>
                        <span class="pago-badge status-verde">${pedido.forma_pagamento}</span>
                    </div>
                    <div class="card-body">
                        <h4 style="margin: 4px 0;">${pedido.cliente_nome}</h4>
                        <p style="font-size: 0.85rem; color: #4b5563; margin: 6px 0;">${pedido.itens}</p>
                        <p style="margin: 4px 0; font-size: 0.9rem; font-weight: bold;">Total: ${valorFormatado}</p>
                    </div>
                    <button class="btn-avancar" onclick="executarAvancoDeEtapa(${pedido.id}, '${statusNormalizado}', '${subStatus}')">${btnTexto}</button>
                </div>`;
            colunas[statusNormalizado].innerHTML += cardHTML;
        }
    });
}

async function executarAvancoDeEtapa(id, statusAtual, subStatusAtual) {
    try {
        const resposta = await fetch(`/api/pedidos/${id}/avancar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_atual: statusAtual, sub_status_atual: subStatusAtual })
        });
        if (!resposta.ok) throw new Error("Erro ao atualizar no servidor");
        buscarPedidosDoServidor();
    } catch (erro) {
        console.error("❌ Erro ao avançar o pedido:", erro);
    }
}

/* ==========================================================================
   LÓGICA DA ABA DE HISTÓRICO
   ========================================================================== */
async function buscarHistoricoDePedidos() {
    try {
        const resposta = await fetch('/api/pedidos/historico');
        if (!resposta.ok) throw new Error("Erro na comunicação com o histórico");
        
        const historico = await resposta.json();
        renderizarHistorico(historico);
    } catch (erro) {
        console.error("❌ Falha ao buscar histórico:", erro);
    }
}

function renderizarHistorico(pedidos) {
    const tbody = document.getElementById('lista-historico-hoje');
    if (!tbody) return;

    tbody.innerHTML = ''; // Limpa a tabela antes de preencher

    // Se não houver pedidos finalizados
    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Nenhum pedido finalizado ainda.</td></tr>';
        return;
    }

    // Desenha cada linha da tabela dinamicamente
    pedidos.forEach(pedido => {
        const tr = document.createElement('tr');
        
        // Pega a hora do pedido
        const horaPedido = new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Define a cor da etiqueta (verde para sucesso, vermelho para cancelado)
        let corBadge = pedido.status === 'cancelado' ? 'background-color: #dc3545;' : 'background-color: #28a745;';

        tr.innerHTML = `
            <td>#${pedido.id}</td>
            <td>Hoje, ${horaPedido}</td>
            <td><strong>${pedido.cliente_nome}</strong></td>
            <td><small>${pedido.itens}</small></td>
            <td>R$ ${parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</td>
            <td>${pedido.forma_pagamento}</td>
            <td><span style="padding: 5px 10px; border-radius: 5px; color: white; font-size: 0.85em; ${corBadge}">${pedido.status.toUpperCase()}</span></td>
            <td style="text-align: center;">
                <button class="btn btn-sm" style="border: 1px solid #ccc; background: transparent; cursor: pointer;" onclick="alert('Detalhes do pedido #${pedido.id} em breve!')">Ver</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}