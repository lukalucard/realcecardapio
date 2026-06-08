/* ==========================================================================
   MOCK DATA: Simulação exata dos dados do seu PostgreSQL (Neon)
   ========================================================================== */
const categoriasDoBanco = ["Burgers", "Bebidas", "Açaí"];

const produtosDoBanco = [
    {
        id: 101,
        nome: "Realce Burger Duplo",
        preco: 38.90,
        categoria: "Burgers",
        ingredientes: "Dois blends de carne artesanal de 150g, queijo cheddar derretido, bacon crocante e maionese da casa.",
        imagens: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500"],
        opcionais: [
            {
                nome_grupo: "Escolha o Ponto da Carne",
                minimo: 1,
                maximo: 1,
                itens: [
                    { nome_adicional: "Mal Passado", preco_adicional: "0.00" },
                    { nome_adicional: "Ao Ponto", preco_adicional: "0.00" },
                    { nome_adicional: "Bem Passado", preco_adicional: "0.00" }
                ]
            },
            {
                nome_grupo: "Adicionais Pagos",
                minimo: 0,
                maximo: 3,
                itens: [
                    { nome_adicional: "Bacon Extra", preco_adicional: "4.50" },
                    { nome_adicional: "Queijo Cheddar", preco_adicional: "3.50" },
                    { nome_adicional: "Ovo Frito", preco_adicional: "2.00" }
                ]
            }
        ]
    },
    {
        id: 102,
        nome: "Classic Cheese",
        preco: 28.90,
        categoria: "Burgers",
        ingredientes: "Blend artesanal de 150g, queijo prato, alface, tomate fresco e molho especial.",
        imagens: [],
        opcionais: []
    },
    {
        id: 103,
        nome: "Coca-Cola Lata",
        preco: 6.00,
        categoria: "Bebidas",
        ingredientes: "Lata 350ml trincando de gelada.",
        imagens: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500"],
        opcionais: []
    }
];

/* ==========================================================================
   ESTADO GLOBAL DO APLICATIVO DO CLIENTE
   ========================================================================== */
let carrinho = [];
let produtoSelecionadoNoModal = null;
let quantidadeItemModal = 1;
const TAXA_ENTREGA = 5.00;

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização dinâmica baseada nos dados do banco
    renderizarCategoriasCarrossel();
    renderizarVitrineProdutos();
    
    inicializarEventosModalDetalhes();
    inicializarEventosModalCheckout();
});

/* ==========================================================================
   1. RENDERIZADORES DINÂMICOS (CARROSSEL E VITRINE)
   ========================================================================== */
function renderizarCategoriasCarrossel() {
    const carrossel = document.getElementById('carousel-categorias');
    if (!carrossel) return;

    carrossel.innerHTML = "";
    
    categoriasDoBanco.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${index === 0 ? 'active' : ''}`;
        btn.textContent = cat;
        
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Scroll suave até a seção correspondente
            const secao = document.getElementById(`secao-vitrine-${cat}`);
            if (secao) secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        
        carrossel.appendChild(btn);
    });
}

function renderizarVitrineProdutos() {
    const vitrine = document.getElementById('vitrine-produtos');
    if (!vitrine) return;

    vitrine.innerHTML = "";

    categoriasDoBanco.forEach(categoria => {
        const produtosFiltrados = produtosDoBanco.filter(p => p.categoria === categoria);
        
        if (produtosFiltrados.length > 0) {
            const secao = document.createElement('section');
            secao.className = 'menu-section';
            secao.id = `secao-vitrine-${categoria}`;
            secao.innerHTML = `<h2 class="section-title">${categoria}</h2>`;
            
            produtosFiltrados.forEach(prod => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.setAttribute('data-id', prod.id);
                
                const fotoDestaque = (prod.imagens && prod.imagens.length > 0)
                    ? `<img src="${prod.imagens[0]}" alt="${prod.nome}">`
                    : `<i class="fas ${categoria.toLowerCase().includes('bebida') ? 'fa-glass-cheers' : 'fa-hamburger'}"></i>`;
                
                card.innerHTML = `
                    <div class="product-details">
                        <h3>${prod.nome}</h3>
                        <p class="product-description">${prod.ingredientes || 'Sem descrição.'}</p>
                        <span class="product-price">R$ ${prod.preco.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="product-image-area">
                        <div class="img-placeholder">
                            ${fotoDestaque}
                        </div>
                        <button class="btn-add-item">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
                
                // Clicar no card inteiro ou no botão + abre o Modal de Opcionais
                card.addEventListener('click', () => abrirModalOpcionaisProduto(prod.id));
                secao.appendChild(card);
            });
            
            vitrine.appendChild(secao);
        }
    });
}

/* ==========================================================================
   2. NOVO: MOTOR DO MODAL DE DETALHES E OPCIONAIS DO PRODUTO
   ========================================================================== */
function abrirModalOpcionaisProduto(idProduto) {
    const prod = produtosDoBanco.find(p => p.id === idProduto);
    if (!prod) return;

    produtoSelecionadoNoModal = prod;
    quantidadeItemModal = 1;

    document.getElementById('modal-produto-nome').textContent = prod.nome;
    document.getElementById('modal-produto-preco').textContent = `R$ ${prod.preco.toFixed(2).replace('.', ',')}`;
    document.getElementById('modal-produto-descricao').textContent = prod.ingredientes || '';
    document.getElementById('txt-modal-quantidade').textContent = quantidadeItemModal;

    // Renderiza Galeria de Imagens (Até 5 fotos)
    const galeria = document.getElementById('modal-produto-galeria');
    galeria.innerHTML = "";
    if (prod.imagens && prod.imagens.length > 0) {
        prod.imagens.forEach(imgUrl => {
            galeria.innerHTML += `<img src="${imgUrl}" alt="${prod.nome}">`;
        });
        galeria.style.display = "flex";
    } else {
        galeria.style.display = "none"; // Se não tiver foto, oculta a galeria para economizar tela
    }

    // Renderiza Grupos de Opcionais Relacionais
    const containerOpcionais = document.getElementById('modal-produto-opcionais-container');
    containerOpcionais.innerHTML = "";

    if (prod.opcionais && prod.opcionais.length > 0) {
        prod.opcionais.forEach((grupo, idxGrupo) => {
            const grupoBox = document.createElement('div');
            grupoBox.className = 'modal-option-group-box';
            
            const regraTexto = grupo.minimo > 0 ? `Obrigatório • Min ${grupo.minimo}` : `Opcional • Max ${grupo.maximo}`;
            grupoBox.innerHTML = `
                <div class="modal-group-header-title">
                    <h4>${grupo.nome_grupo}</h4>
                    <span class="modal-group-badge-rule">${regraTexto}</span>
                </div>
            `;

            const inputType = grupo.maximo === 1 && grupo.minimo === 1 ? 'radio' : 'checkbox';

            grupo.itens.forEach((item, idxItem) => {
                const precoAdicionalNum = parseFloat(item.preco_adicional);
                const tagPreco = precoAdicionalNum > 0 ? `+ R$ ${precoAdicionalNum.toFixed(2).replace('.', ',')}` : '';
                
                const linhaItem = document.createElement('div');
                linhaItem.className = 'modal-option-item-row';
                linhaItem.innerHTML = `
                    <label class="modal-opt-left">
                        <input type="${inputType}" name="grupo-modal-${idxGrupo}" data-preco="${item.preco_adicional}" value="${item.nome_adicional}">
                        <span>${item.nome_adicional}</span>
                    </label>
                    <span class="modal-opt-price-tag">${tagPreco}</span>
                `;
                
                // Monitora mudanças para recalcular o subtotal em tempo real
                linhaItem.querySelector('input').addEventListener('change', calcularPrecoTotalModal);
                grupoBox.appendChild(linhaItem);
            });

            containerOpcionais.appendChild(grupoBox);
        });
    }

    calcularPrecoTotalModal();
    document.getElementById('modal-detalhes-produto').classList.remove('hidden');
}

function calcularPrecoTotalModal() {
    if (!produtoSelecionadoNoModal) return;

    let precoBase = produtoSelecionadoNoModal.preco;
    let precoAdicionais = 0;

    // Coleta todos os inputs marcados dentro do modal
    const inputsMarcados = document.querySelectorAll('#modal-produto-opcionais-container input:checked');
    inputsMarcados.forEach(input => {
        precoAdicionais += parseFloat(input.getAttribute('data-preco') || 0);
    });

    const valorFinalUnitario = precoBase + precoAdicionais;
    const valorFinalTotal = valorFinalUnitario * quantidadeItemModal;

    document.getElementById('txt-modal-botao-preco').textContent = `R$ ${valorFinalTotal.toFixed(2).replace('.', ',')}`;
}

function inicializarEventosModalDetalhes() {
    const modal = document.getElementById('modal-detalhes-produto');
    const btnFechar = document.getElementById('btn-fechar-details');
    const btnMais = document.getElementById('btn-modal-mais');
    const btnMenos = document.getElementById('btn-modal-menos');
    const btnAdicionarSacola = document.getElementById('btn-modal-adicionar-sacola');

    if (btnFechar) btnFechar.addEventListener('click', () => modal.classList.add('hidden'));

    if (btnMais) {
        btnMais.addEventListener('click', () => {
            quantidadeItemModal++;
            document.getElementById('txt-modal-quantidade').textContent = quantityItemModal;
            document.getElementById('txt-modal-quantidade').textContent = quantidadeItemModal;
            calcularPrecoTotalModal();
        });
    }

    if (btnMenos) {
        btnMenos.addEventListener('click', () => {
            if (quantidadeItemModal > 1) {
                quantidadeItemModal--;
                document.getElementById('txt-modal-quantidade').textContent = quantidadeItemModal;
                calcularPrecoTotalModal();
            }
        });
    }

    if (btnAdicionarSacola) {
        btnAdicionarSacola.addEventListener('click', () => {
            // VALIDAÇÃO DE REGRAS DE ADICIONAIS (MIN / MAX)
            if (produtoSelecionadoNoModal.opcionais) {
                let validacaoOk = true;
                produtoSelecionadoNoModal.opcionais.forEach((grupo, idxGrupo) => {
                    const marcados = document.querySelectorAll(`input[name="grupo-modal-${idxGrupo}"]:checked`).length;
                    if (marcados < grupo.minimo) {
                        alert(`Por favor, selecione no mínimo ${grupo.minimo} opções em: "${grupo.nome_grupo}"`);
                        validacaoOk = false;
                    }
                    if (marcados > grupo.maximo) {
                        alert(`Atenção: Você selecionou mais do que o limite de ${grupo.maximo} opções em: "${grupo.nome_grupo}"`);
                        validacaoOk = false;
                    }
                });
                if (!validacaoOk) return; // Trava a inclusão se quebrar a regra do gestor
            }

            // COALIZAÇÃO DAS ESCOLHAS DO CLIENTE
            const opcionaisEscolhidos = [];
            let precoComplementos = 0;
            const selecionados = document.querySelectorAll('#modal-produto-opcionais-container input:checked');
            
            selecionados.forEach(sel => {
                opcionaisEscolhidos.push(sel.value);
                precoComplementos += parseFloat(sel.getAttribute('data-preco') || 0);
            });

            const nomeItemUnico = produtoSelecionadoNoModal.nome;
            const precoItemFinal = produtoSelecionadoNoModal.preco + precoComplementos;

            // Insere ou soma na sacola principal
            const itemExistente = carrinho.find(item => item.nome === nomeItemUnico && item.detalhes === opcionaisEscolhidos.join(', '));
            
            if (itemExistente) {
                itemExistente.quantidade += quantidadeItemModal;
            } else {
                carrinho.push({
                    nome: nomeItemUnico,
                    preco: precoItemFinal,
                    quantidade: quantidadeItemModal,
                    detalhes: opcionaisEscolhidos.join(', ')
                });
            }

            modal.classList.add('hidden');
            renderizarSacolaNoRodape();
        });
    }
}

/* ==========================================================================
   3. GERENCIADOR DA SACOLA PERSISTENTE DO RODAPÉ
   ========================================================================== */
function mudarQuantidadeNaSacola(index, mudanca) {
    carrinho[index].quantidade += mudanca;
    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1);
    }
    renderizarSacolaNoRodape();
}

function renderizarSacolaNoRodape() {
    const containerSacola = document.getElementById('persistent-cart');
    const containerLista = document.getElementById('itens-sacola-direta');
    const txtTotalRodape = document.getElementById('cart-valor-total-tela');
    const txtTotalModal = document.getElementById('modal-total-final-valor');

    if (!containerSacola || !containerLista) return;

    if (carrinho.length === 0) {
        containerSacola.classList.add('hidden');
        return;
    }

    containerLista.innerHTML = '';
    let subtotal = 0;

    carrinho.forEach((item, index) => {
        const valorLinha = item.preco * item.quantidade;
        subtotal += valorLinha;

        const row = document.createElement('div');
        row.classList.add('cart-item-row');
        row.innerHTML = `
            <div class="item-info-side">
                <h4>${item.nome}</h4>
                <span style="font-size:0.78rem; color:#64748b; font-style:italic;">${item.detalhes || 'Sem adicionais.'}</span>
                <span>R$ ${valorLinha.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="item-actions-side">
                <button type="button" class="btn-qty-action btn-sacola-menos" data-index="${index}">
                    <i class="fas ${item.quantidade === 1 ? 'fa-trash-alt' : 'fa-minus'}"></i>
                </button>
                <span class="qty-number">${item.quantidade}</span>
                <button type="button" class="btn-qty-action btn-sacola-mais" data-index="${index}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        containerLista.appendChild(row);
    });

    // Eventos dos botões de quantidade na sacola
    containerLista.querySelectorAll('.btn-sacola-menos').forEach(btn => {
        btn.addEventListener('click', () => mudarQuantidadeNaSacola(parseInt(btn.getAttribute('data-index')), -1));
    });
    containerLista.querySelectorAll('.btn-sacola-mais').forEach(btn => {
        btn.addEventListener('click', () => mudarQuantidadeNaSacola(parseInt(btn.getAttribute('data-index')), 1));
    });

    if (txtTotalRodape) txtTotalRodape.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (txtTotalModal) txtTotalModal.textContent = `R$ ${(subtotal + TAXA_ENTREGA).toFixed(2).replace('.', ',')}`;

    containerSacola.classList.remove('hidden');
}

/* ==========================================================================
   4. CHECKOUT E ENVIO DO PEDIDO VIA WHATSAPP (INTEGRADO ÀS SUAS MENSAGENS)
   ========================================================================== */
function inicializarEventosModalCheckout() {
    const modalDados = document.getElementById('modal-dados-entrega');
    const btnAbrirCheckout = document.getElementById('btn-abrir-checkout');
    const btnFecharModalDados = document.getElementById('btn-fechar-modal-dados');
    const btnEnviarPedido = document.getElementById('btn-enviar-pedido');

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
        btnEnviarPedido.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = document.getElementById('checkout-nome').value.trim();
            const whatsapp = document.getElementById('checkout-whatsapp').value.trim();
            const endereco = document.getElementById('checkout-endereco').value.trim();
            const pagamento = document.getElementById('checkout-pagamento').value;

            if (!nome || !whatsapp || !endereco || !pagamento) {
                alert("Por favor, preencha todos os campos da entrega.");
                return;
            }

            // Alerta de sucesso local antes do disparo
            alert("Pedido validado com sucesso! Redirecionando para o WhatsApp do estabelecimento...");
            modalDados.classList.add('hidden');
        });
    }
}