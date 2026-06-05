let carrinho = [];
const TAXA_ENTREGA = 5.00;

document.addEventListener('DOMContentLoaded', () => {
    inicializarCliquesCardapio();
    inicializarEventosModal();
});

/**
 * 1. Escuta o clique de adicionar item na lista do cardápio
 */
function inicializarCliquesCardapio() {
    const botoesAdicionar = document.querySelectorAll('.btn-add-item');

    botoesAdicionar.forEach(botao => {
        botao.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;

            const nome = card.querySelector('.product-details h3').textContent;
            const precoTexto = card.querySelector('.product-price').textContent;
            const preco = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim());

            adicionarAoCarrinho(nome, preco);
        });
    });
}

function adicionarAoCarrinho(nome, preco) {
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ nome, preco, quantity: 1, quantidade: 1 });
    }

    renderizarSacolaNoRodape();
}

/**
 * 2. Atualiza as quantidades direto na lista da sacola do rodapé
 */
function mudarQuantidadeNaSacola(nome, mudanca) {
    const item = carrinho.find(item => item.nome === nome);
    if (!item) return;

    item.quantidade += mudanca;

    if (item.quantidade <= 0) {
        carrinho = carrinho.filter(item => item.nome !== nome);
    }

    renderizarSacolaNoRodape();
}

/**
 * 3. GERA OS ITENS SEPARADOS COM BOTÕES DE MAIS E MENOS DIRETO NO RODAPÉ
 */
function renderizarSacolaNoRodape() {
    const containerContainer = document.getElementById('persistent-cart');
    const containerLista = document.getElementById('itens-sacola-direta');
    const txtTotalRodape = document.getElementById('cart-valor-total-tela');
    const txtTotalModal = document.getElementById('modal-total-final-valor');

    // Se o carrinho estiver vazio, some com a sacola do rodapé
    if (carrinho.length === 0) {
        containerContainer.classList.add('hidden');
        return;
    }

    containerLista.innerHTML = ''; // Limpa antes de reconstruir
    let subtotal = 0;

    // Constrói linha por linha de item selecionado
    carrinho.forEach(item => {
        const valorTotalDoItem = item.preco * item.quantidade;
        subtotal += valorTotalDoItem;

        const row = document.createElement('div');
        row.classList.add('cart-item-row');
        row.innerHTML = `
            <div class="item-info-side">
                <h4>${item.nome}</h4>
                <span>R$ ${valorTotalDoItem.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="item-actions-side">
                <button type="button" class="btn-qty-action ${item.quantidade === 1 ? 'remove-icon' : ''}" data-name="${item.nome}" data-action="minus">
                    <i class="fas ${item.quantidade === 1 ? 'fa-trash-alt' : 'fa-minus'}"></i>
                </button>
                <span class="qty-number">${item.quantidade}</span>
                <button type="button" class="btn-qty-action" data-name="${item.nome}" data-action="plus">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        containerLista.appendChild(row);
    });

    // Escuta os cliques dos botões de + e - gerados dentro da sacola do rodapé
    const botoesAcao = containerLista.querySelectorAll('.btn-qty-action');
    botoesAcao.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const botao = e.target.closest('.btn-qty-action');
            const nomeProd = botao.getAttribute('data-name');
            const acao = botao.getAttribute('data-action');

            if (acao === 'plus') {
                mudarQuantidadeNaSacola(nomeProd, 1);
            } else {
                mudarQuantidadeNaSacola(nomeProd, -1);
            }
        });
    });

    // Atualiza os valores na tela
    if (txtTotalRodape) txtTotalRodape.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (txtTotalModal) txtTotalModal.textContent = `R$ ${(subtotal + TAXA_ENTREGA).toFixed(2).replace('.', ',')}`;

    // Mostra a estrutura da sacola
    containerContainer.classList.remove('hidden');
}

/**
 * 4. Controla a abertura da janela de entrega
 */
function inicializarEventosModal() {
    const modalDados = document.getElementById('modal-dados-entrega');
    const btnAbrirCheckout = document.getElementById('btn-abrir-checkout');
    const btnFecharModalDados = document.getElementById('btn-fechar-modal-dados');
    const btnEnviarPedido = document.getElementById('btn-enviar-pedido');

    // Clicou em Confirmar na sacola fixa -> Abre o formulário de entrega
    if (btnAbrirCheckout) {
        btnAbrirCheckout.addEventListener('click', () => {
            if (carrinho.length === 0) return;
            modalDados.classList.remove('hidden');
        });
    }

    if (btnFecharModalDados) {
        btnFecharModalDados.addEventListener('click', () => {
            modalDados.classList.add('hidden');
        });
    }

    if (btnEnviarPedido) {
        btnEnviarPedido.addEventListener('click', () => {
            const nome = document.getElementById('checkout-nome').value;
            const whatsapp = document.getElementById('checkout-whatsapp').value;
            const endereco = document.getElementById('checkout-endereco').value;
            const pagamento = document.getElementById('checkout-pagamento').value;

            if (!nome || !whatsapp || !endereco || !pagamento) {
                alert("Por favor, preencha todos os campos da entrega.");
                return;
            }
            alert("Pedido validado com sucesso! Pronto para salvar no backend.");
        });
    }
}