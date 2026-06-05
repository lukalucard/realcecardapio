// Estado global do carrinho de compras (salvo na memória do navegador por enquanto)
let carrinho = [];

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventosCardapio();
});

/**
 * Vincula os cliques dos botões da tela às funções do sistema
 */
function inicializarEventosCardapio() {
    // Captura todos os botões "+" de adicionar item
    const botoesAdicionar = document.querySelectorAll('.btn-add-item');
    
    botoesAdicionar.forEach(botao => {
        botao.addEventListener('click', (evento) => {
            // Descobre qual card de produto foi clicado subindo a árvore do HTML
            const cardProduto = evento.target.closest('.product-card');
            
            if (!cardProduto) return;

            // Extrai os dados reais que estão renderizados na tela
            const nome = cardProduto.querySelector('.product-details h3').textContent;
            const precoTexto = cardProduto.querySelector('.product-price').textContent;
            
            // Limpa a string do preço ("R$ 38,90" -> 38.90) para conseguir fazer cálculos matemáticos
            const preco = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim());

            adicionarAoCarrinho(nome, preco);
        });
    });

    // Configura o clique no botão de "Ver Sacola" da barra flutuante
    const btnVerSacola = document.querySelector('.btn-view-cart');
    if (btnVerSacola) {
        btnVerSacola.addEventListener('click', () => {
            alert("Sacola aberta! O próximo passo será criar a modal que mostra o resumo do pedido e pede o endereço.");
        });
    }
}

/**
 * Insere o produto no array do carrinho ou aumenta a quantidade se ele já existir
 */
function adicionarAoCarrinho(nome, preco) {
    // Procura se o produto já foi adicionado antes
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        // Se for a primeira vez do item, adiciona o objeto completo
        carrinho.push({
            nome: nome,
            preco: preco,
            quantidade: 1
        });
    }

    atualizarBarraFlutuante();
}

/**
 * Calcula os totais e gerencia a animação de subida/descida da barra do carrinho
 */
function atualizarBarraFlutuante() {
    const barraCarrinho = document.getElementById('floating-cart');
    const elementoQtd = document.querySelector('.cart-qty');
    const elementoTotal = document.querySelector('.cart-total');

    if (!barraCarrinho) return;

    // Se o carrinho esvaziar por algum motivo, esconde a barra imediatamente
    if (carrinho.length === 0) {
        barraCarrinho.classList.add('hidden');
        return;
    }

    let totalItens = 0;
    let valorFinanceiroTotal = 0;

    // Percorre o carrinho somando as quantidades e multiplicando os valores
    carrinho.forEach(item => {
        totalItens += item.quantidade;
        valorFinanceiroTotal += (item.preco * item.quantidade);
    });

    // Atualiza as mensagens de texto da barra usando a formatação de moeda brasileira
    elementoQtd.textContent = `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;
    elementoTotal.textContent = `Sacola • R$ ${valorFinanceiroTotal.toFixed(2).replace('.', ',')}`;

    // Remove a classe "hidden", fazendo o CSS disparar a transição que sobe a barra na tela
    barraCarrinho.classList.remove('hidden');
}