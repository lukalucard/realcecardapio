document.addEventListener('DOMContentLoaded', () => {
    inicializarSubmenu();
    carregarPedidosDoBanco();
});

function inicializarSubmenu() {
    const botoesMenu = document.querySelectorAll('.tab-link');
    const painelKanban = document.getElementById('painel-kanban');
    const painelHistorico = document.getElementById('painel-historico');

    botoesMenu.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesMenu.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            const origemSelecionada = botao.getAttribute('data-origem');

            if (origemSelecionada === 'historico') {
                painelKanban.style.display = 'none';
                painelHistorico.style.display = 'block';
            } else {
                painelKanban.style.display = 'grid';
                painelHistorico.style.display = 'none';
            }
        });
    });
}

async function carregarPedidosDoBanco() {
    try {
        const resposta = await fetch('/api/pedidos/ativos');
        if (!resposta.ok) throw new Error("Erro na requisição");
        const pedidos = await resposta.json();
        renderizarPedidosNoKanban(pedidos);
    } catch (erro) {
        console.error("❌ Falha ao carregar pedidos:", erro);
    }
}

function renderizarPedidosNoKanban(pedidos) {
    const colunas = {
        novos: document.getElementById('cards-novos'),
        pagamento: document.getElementById('cards-pagamento'),
        preparo: document.getElementById('cards-preparo'),
        entrega: document.getElementById('cards-entrega')
    };

    // Mantém os títulos das colunas organizados
    const tituloColunaNovos = document.querySelector('.col-novos .column-header h3');
    if (tituloColunaNovos) {
        tituloColunaNovos.innerHTML = `Pedidos <span class="badge" id="qtd-novos">0</span>`;
    }

    // Limpa os containers antes de renderizar
    Object.values(colunas).forEach(coluna => { if(coluna) coluna.innerHTML = ''; });
    const contadores = { novos: 0, pagamento: 0, preparo: 0, entrega: 0 };

    if (pedidos.length === 0) {
        Object.values(colunas).forEach(coluna => {
            if(coluna) coluna.innerHTML = '<div class="empty-column-message">Nenhum pedido ativo</div>';
        });
        atualizarBadgesDoTopo(contadores);
        return;
    }

    // Processa a esteira de cada pedido de forma independente
    pedidos.forEach(pedido => {
        const statusAtual = pedido.status;
        const subStatusAtual = pedido.sub_status || 'aguardando';
        
        if (colunas[statusAtual]) {
            contadores[statusAtual]++;
            
            let badgePagamentoHTML = '';
            let blocoFinanceiroHTML = ''; 
            let etiquetaSubstatusHTML = '';
            let textoBotao = 'Avançar';
            let acaoBotao = `avancarStatusPedido(${pedido.id}, '${statusAtual}', '${subStatusAtual}')`;

            // Tratamento e formatação de valores monetários padrão
            const valorTotalFormatado = parseFloat(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let trocoHTML = '';
            
            if (pedido.forma_pagamento === 'DINHEIRO') {
                const valorTroco = parseFloat(pedido.troco) || 0;
                const trocoFormatado = valorTroco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                trocoHTML = `<span class="troco-label font-atencao">Troco: <strong class="troco-destaque">${trocoFormatado}</strong></span>`;
            }

            // Definição das tags de pagamento baseadas em regras de cores
            if (pedido.forma_pagamento === 'PIX') {
                badgePagamentoHTML = `<span class="pago-badge status-verde"><i class="fas fa-check-circle"></i> PAGO: PIX</span>`;
            } else if (pedido.forma_pagamento === 'CARTAO_CREDITO') {
                badgePagamentoHTML = `<span class="pago-badge status-verde"><i class="fas fa-credit-card"></i> PAGO: CARTÃO CRÉDITO</span>`;
            } else if (pedido.forma_pagamento === 'CARTAO_DEBITO') {
                badgePagamentoHTML = `<span class="pago-badge status-verde"><i class="fas fa-credit-card"></i> PAGO: CARTÃO DÉBITO</span>`;
            } else if (pedido.forma_pagamento === 'DINHEIRO') {
                badgePagamentoHTML = `<span class="pago-badge status-amarelo"><i class="fas fa-money-bill-wave"></i> PAGO: DINHEIRO</span>`;
            }

            // ==========================================================================
            // LOGICA DA ESTEIRA DE STATUS POR CLIENTE
            // ==========================================================================
            
            if (statusAtual === 'novos') {
                // Primeira fase: Foco no cliente, itens e logística de entrega
                badgePagamentoHTML = ''; 
                blocoFinanceiroHTML = ''; 
                etiquetaSubstatusHTML = `<span class="badge-substatus sub-aguardando">Novo Pedido</span>`;
                textoBotao = '<i class="fas fa-check"></i> Aceitar Pedido';
            } 
            
            else {
                // Fases seguintes: Ativação dos blocos financeiros e troco programado
                blocoFinanceiroHTML = `
                    <div class="pedido-financeiro">
                        <span class="total-label">Total: <strong class="valor-dinheiro">${valorTotalFormatado}</strong></span>
                        ${trocoHTML}
                    </div>
                `;

                if (statusAtual === 'pagamento') {
                    if (pedido.forma_pagamento === 'DINHEIRO') {
                        etiquetaSubstatusHTML = `<span class="badge-substatus sub-amarelo">pagamento em dinheiro</span>`;
                    } else {
                        etiquetaSubstatusHTML = `<span class="badge-substatus sub-aguardando">aguardando pagamento</span>`;
                    }
                    textoBotao = '<i class="fas fa-fire"></i> Enviar p/ Cozinha';
                } 
                
                else if (statusAtual === 'preparo') {
                    if (subStatusAtual === 'aguardando') {
                        etiquetaSubstatusHTML = `<span class="badge-substatus sub-aguardando">Aguardando Cozinha</span>`;
                        textoBotao = '<i class="fas fa-play"></i> Iniciar Preparo';
                    } else if (subStatusAtual === 'preparando') {
                        etiquetaSubstatusHTML = `<span class="badge-substatus sub-preparando">Preparando...</span>`;
                        textoBotao = '<i class="fas fa-stopwatch"></i> Marcar como Pronto';
                    } else if (subStatusAtual === 'pronto') {
                        etiquetaSubstatusHTML = `<span class="badge-substatus sub-pronto">Pronto p/ Envio</span>`;
                        textoBotao = '<i class="fas fa-motorcycle"></i> Despachar Entrega';
                    }
                } 
                
                else if (statusAtual === 'entrega') {
                    if (subStatusAtual === 'aguardando') {
                        etiquetaSubstatusHTML = `<span class="badge-substatus sub-aguardando">Aguardando Motoboy</span>`;
                        textoBotao = '<i class="fas fa-shipping-fast"></i> Saiu para Entrega';
                    } else if (subStatusAtual === 'saiu_para_entrega') {
                        etiquetaSubstatusHTML = `<span class="badge-substatus sub-rota">Saiu para Entrega</span>`;
                        textoBotao = '<i class="fas fa-hand-holding-usd"></i> Pedido Entregue';
                    }
                }
            }

            // Injeção do endereço coletado previamente no fluxo
            let enderecoHTML = '';
            if (pedido.endereco_entrega) {
                enderecoHTML = `
                    <div class="card-endereco" style="margin-top: 8px; font-size: 0.8rem; color: #4b5563; border-top: 1px dashed #e5e7eb; padding-top: 6px;">
                        <i class="fas fa-map-marker-alt" style="color: #ef4444; margin-right: 4px;"></i> ${pedido.endereco_entrega}
                    </div>
                `;
            }

            // Estruturação final do Card dentro da coluna ativa do trilho
            const cardHTML = `
                <div class="pedido-card" id="pedido-${pedido.id}">
                    <div class="card-header">
                        <span class="pedido-id">#${pedido.id}</span>
                        ${badgePagamentoHTML}
                    </div>
                    <div class="card-body">
                        <h4>${pedido.cliente_nome}</h4>
                        <div class="substatus-container">${etiquetaSubstatusHTML}</div>
                        <p class="pedido-itens" style="margin-top: 8px; margin-bottom: 4px;">${pedido.itens}</p>
                        ${blocoFinanceiroHTML}
                        ${enderecoHTML}
                    </div>
                    <div class="card-footer">
                        <button class="btn-avancar" onclick="${acaoBotao}">${textoBotao}</button>
                    </div>
                </div>
            `;
            
            colunas[statusAtual].innerHTML += cardHTML;
        }
    });

    atualizarBadgesDoTopo(contadores);
}

function atualizarBadgesDoTopo(contadores) {
    if(document.getElementById('qtd-novos')) document.getElementById('qtd-novos').innerText = contadores.novos;
    if(document.getElementById('qtd-pagamento')) document.getElementById('qtd-pagamento').innerText = contadores.pagamento;
    if(document.getElementById('qtd-preparo')) document.getElementById('qtd-preparo').innerText = contadores.preparo;
    if(document.getElementById('qtd-entrega')) document.getElementById('qtd-entrega').innerText = contadores.entrega;
}