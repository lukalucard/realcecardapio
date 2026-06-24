/* ==========================================================================
   ESTADO GLOBAL DO CARDÁPIO ONLINE (CLIENTE)
   ========================================================================== */
let lojaAtiva = null;
let categoriasDaLoja = [];
let produtosDaLoja = [];

let sacolaItens = [];
let produtoSelecionadoModal = null;
let quantidadeModal = 1;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa a Integração Multilojas e Branding
    carregarDadosDaLojaUrl();
    aplicarIdentidadeVisual();
    
    // 2. Carrega o Banco de Dados Real da Loja e renderiza as vitrines
    carregarBancoDeDadosProdutos();

    // 3. Inicializa os motores de interface (Modais, cliques e formulários)
    inicializarEventosInterface();
});

/* ==========================================================================
   1. MOTOR DE INTEGRAÇÃO - LEITURA DA URL DINÂMICA
   ========================================================================== */
function carregarDadosDaLojaUrl() {
    const params = new URLSearchParams(window.location.search);
    const lojaSlug = params.get('loja');
    const listaLojas = JSON.parse(localStorage.getItem('realce_lista_lojas')) || [];

    if (!lojaSlug || listaLojas.length === 0) {
        alert('⚠️ Nenhuma loja encontrada ou link de vitrine inválido!');
        return;
    }

    lojaAtiva = listaLojas.find(loja => encodeCalmSlug(loja.nome) === lojaSlug);

    if (!lojaAtiva) {
        alert('⚠️ Esta loja não foi encontrada no sistema!');
        return;
    }

    document.getElementById('nome-loja-header').innerHTML = `${lojaAtiva.nome}`;
    document.getElementById('slogan-loja').innerText = lojaAtiva.slogan || 'O sabor que realça o seu dia';
    
    const taxaFormatada = parseFloat(lojaAtiva.taxa || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('delivery-info-badge').innerHTML = `
        <i class="fas fa-motorcycle"></i> ${lojaAtiva.tempo || '30-45'} min • ${taxaFormatada}
    `;

    const labelTaxaCheckout = document.getElementById('txt-label-taxa-checkout');
    if (labelTaxaCheckout) labelTaxaCheckout.innerText = `com entrega ${taxaFormatada}`;

    document.title = `${lojaAtiva.nome} - Cardápio Online`;
}

function encodeCalmSlug(texto) {
    return texto.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

/* ==========================================================================
   2. APLICADOR DE BRANDING E CORES DINÂMICAS
   ========================================================================== */
function aplicarIdentidadeVisual() {
    if (!lojaAtiva) return;

    document.documentElement.style.setProperty('--primary-color', lojaAtiva.corPrimaria || '#FF6B00');
    document.documentElement.style.setProperty('--secondary-color', lojaAtiva.corSecundaria || '#6B3FA0');
    document.documentElement.style.setProperty('--bg-light', lojaAtiva.corFundo || '#f8fafc');
    document.documentElement.style.setProperty('--primary-hover', (lojaAtiva.corPrimaria || '#FF6B00') + 'dd');

    const bannerElement = document.getElementById('banner-topo-cliente');
    if (bannerElement) {
        if (lojaAtiva.bannerImg) {
            bannerElement.style.backgroundImage = `url(${lojaAtiva.bannerImg})`;
        } else {
            bannerElement.style.backgroundImage = 'none';
            bannerElement.style.backgroundColor = lojaAtiva.bannerCorSolida || '#6B3FA0';
        }
    }

    const logoImg = document.getElementById('logo-cliente-img');
    const logoIcon = document.getElementById('logo-cliente-icon');
    const containerLogo = document.getElementById('container-logo-cliente');

    if (lojaAtiva.logoImg) {
        if (logoImg) {
            logoImg.src = lojaAtiva.logoImg;
            logoImg.classList.remove('hidden');
        }
        if (logoIcon) logoIcon.classList.add('hidden');
    }

    if (containerLogo) {
        if (lojaAtiva.logoPosicao === 'center') {
            containerLogo.style.left = '50%';
            containerLogo.style.transform = 'translateX(-50%)';
        } else if (lojaAtiva.logoPosicao === 'right') {
            containerLogo.style.left = 'auto';
            containerLogo.style.right = '20px';
            containerLogo.style.transform = 'none';
        } else {
            containerLogo.style.left = '20px';
            containerLogo.style.transform = 'none';
        }
    }
}

/* ==========================================================================
   3. CARREGADOR DE PRODUTOS E VITRINE
   ========================================================================== */
function carregarBancoDeDadosProdutos() {
    if (!lojaAtiva) return;

    categoriasDaLoja = JSON.parse(localStorage.getItem(`realce_categorias_${lojaAtiva.id}`)) || [];
    produtosDaLoja = JSON.parse(localStorage.getItem(`realce_produtos_${lojaAtiva.id}`)) || [];

    renderizarCarrosselCategoriasReais();
    renderizarVitrineProdutosReais('Todos');
}

function renderizarCarrosselCategoriasReais() {
    const carousel = document.getElementById('carousel-categorias');
    if (!carousel) return;

    carousel.innerHTML = "";

    if (categoriasDaLoja.length === 0) {
        carousel.innerHTML = `<span style="color:#64748b; font-size:0.85rem; padding:5px 20px;">Nenhuma categoria criada</span>`;
        return;
    }

    const btnTodos = document.createElement('button');
    btnTodos.className = 'category-btn active';
    btnTodos.textContent = 'Todos';
    btnTodos.addEventListener('click', () => filtrarVitrinePorCategoria('Todos', btnTodos));
    carousel.appendChild(btnTodos);

    categoriasDaLoja.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = cat;
        btn.addEventListener('click', () => filtrarVitrinePorCategoria(cat, btn));
        carousel.appendChild(btn);
    });
}

function filtrarVitrinePorCategoria(categoriaNome, botaoClicado) {
    const botoes = document.querySelectorAll('.category-btn');
    botoes.forEach(b => b.classList.remove('active'));
    botaoClicado.classList.add('active');
    renderizarVitrineProdutosReais(categoriaNome);
}

function renderizarVitrineProdutosReais(categoriaFiltro) {
    const vitrine = document.getElementById('vitrine-produtos');
    if (!vitrine) return;

    vitrine.innerHTML = "";

    if (produtosDaLoja.length === 0) {
        vitrine.innerHTML = `
            <div class="menu-section" style="text-align:center; padding:40px 20px;">
                <i class="fas fa-utensils" style="font-size:2rem; color:#cbd5e1; margin-bottom:10px; display:block;"></i>
                <p style="color:#64748b; font-size:0.95rem;">Nenhum produto cadastrado nesta loja ainda.</p>
            </div>
        `;
        return;
    }

    const categoriesParaRenderizar = (categoriaFiltro === 'Todos') ? categoriasDaLoja : [categoriaFiltro];

    categoriesParaRenderizar.forEach(cat => {
        const produtosFiltrados = produtosDaLoja.filter(p => p.categoria === cat);

        if (produtosFiltrados.length > 0) {
            const secao = document.createElement('section');
            secao.className = 'menu-section';
            secao.innerHTML = `<h2 class="section-title">${cat}</h2>`;

            const listaCards = document.createElement('div');

            produtosFiltrados.forEach(prod => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                const containerImagem = (prod.imagens && prod.imagens.length > 0)
                    ? `<img src="${prod.imagens[0]}" alt="${prod.nome}">`
                    : `<i class="fas fa-hamburger" style="color:#94a3b8;"></i>`;

                const precoFormatado = parseFloat(prod.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                card.innerHTML = `
                    <div class="product-details">
                        <h3>${prod.nome}</h3>
                        <p class="product-description">${prod.ingredientes || 'Sem ingredientes descritos.'}</p>
                        <span class="product-price">${precoFormatado}</span>
                    </div>
                    <div class="product-image-area">
                        <div class="img-placeholder">
                            ${containerImagem}
                        </div>
                        <button type="button" class="btn-add-item"><i class="fas fa-plus"></i></button>
                    </div>
                `;

                card.addEventListener('click', () => abrirModalDetalhesProduto(prod));
                listaCards.appendChild(card);
            });

            secao.appendChild(listaCards);
            vitrine.appendChild(secao);
        }
    });
}

/* ==========================================================================
   4. MOTOR DO MODAL DE DETALHES E OPCIONAIS (TAMANHOS)
   ========================================================================== */
function abrirModalDetalhesProduto(produto) {
    produtoSelecionadoModal = produto;
    quantidadeModal = 1;

    const campoObs = document.getElementById('modal-produto-observacao');
    if(campoObs) campoObs.value = "";

    document.getElementById('modal-produto-nome').innerText = produto.nome;
    document.getElementById('modal-produto-descricao').innerText = produto.ingredientes || 'Sem ingredientes descritos.';
    document.getElementById('modal-produto-preco').innerText = parseFloat(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('txt-modal-quantidade').innerText = quantityModal = quantidadeModal;

    const galeria = document.getElementById('modal-produto-galeria');
    if (produto.imagens && produto.imagens.length > 0) {
        galeria.innerHTML = produto.imagens.map(img => `<img src="${img}">`).join('');
    } else {
        galeria.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:#94a3b8; font-size:3rem; background:#f1f5f9;"><i class="fas fa-hamburger"></i></div>`;
    }

    const containerOpcionais = document.getElementById('modal-produto-opcionais-container');
    containerOpcionais.innerHTML = "";

    if (produto.opcionais && produto.opcionais.length > 0) {
        produto.opcionais.forEach((grupo, grupoIdx) => {
            const grupoBox = document.createElement('div');
            grupoBox.className = 'modal-option-group-box';

            const nomeGrupoLower = grupo.nome_grupo.toLowerCase();
            const ehGrupoTamanho = nomeGrupoLower.includes('tamanho') || nomeGrupoLower.includes('tamanhos') || nomeGrupoLower.includes('escolha o tamanho');
            const tipoInput = parseInt(grupo.maximo) === 1 ? 'radio' : 'checkbox';
            const regraTexto = parseInt(grupo.minimo) > 0 ? `Obrigatório • Escolha ${grupo.maximo}` : `Opcional • Máx ${grupo.maximo}`;

            let temGrande = grupo.itens.some(item => item.nome_adicional.toLowerCase().includes('grande'));

            grupoBox.innerHTML = `
                <div class="modal-group-header-title">
                    <h4>${grupo.nome_grupo}</h4>
                    <span class="modal-group-badge-rule">${regraTexto}</span>
                </div>
                <div class="modal-options-list-rows" data-min="${grupo.minimo}" data-max="${grupo.maximo}" data-nome-grupo="${grupo.nome_grupo}" data-tipo-grupo="${ehGrupoTamanho ? 'tamanho' : 'adicional'}">
                    ${grupo.itens.map((item, itemIdx) => {
                        const nomeItemLower = item.nome_adicional.toLowerCase();
                        
                        let deveMarcar = false;
                        if (ehGrupoTamanho) {
                            if (temGrande && nomeItemLower.includes('grande')) {
                                deveMarcar = true;
                            } else if (!temGrande && itemIdx === 0 && parseInt(grupo.minimo) > 0) {
                                deveMarcar = true;
                            }
                        } else if (tipoInput === 'radio' && itemIdx === 0 && parseInt(grupo.minimo) > 0) {
                            deveMarcar = true;
                        }

                        const precoExibicao = ehGrupoTamanho 
                            ? parseFloat(item.preco_adicional).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : `+ ${parseFloat(item.preco_adicional).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                        
                        return `
                            <label class="modal-option-item-row">
                                <div class="modal-opt-left">
                                    <input type="${tipoInput}" name="grupo_opt_${grupoIdx}" data-nome="${item.nome_adicional}" data-preco="${item.preco_adicional}" ${deveMarcar ? 'checked' : ''}>
                                    <span>${item.nome_adicional}</span>
                                </div>
                                <span class="modal-opt-price-tag" style="${ehGrupoTamanho ? 'color: var(--text-main); font-weight:700;' : ''}">${parseFloat(item.preco_adicional) > 0 ? precoExibicao : 'Grátis'}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            `;

            grupoBox.querySelectorAll('input').forEach(input => {
                input.addEventListener('change', () => validarRegrasELimitesSelecao(grupoBox, input, tipoInput));
            });

            containerOpcionais.appendChild(grupoBox);
        });
    }

    recalcularSubtotalModal();
    document.getElementById('modal-detalhes-produto').classList.remove('hidden');
}

function validarRegrasELimitesSelecao(grupoBox, inputAlterado, tipoInput) {
    const containerLista = grupoBox.querySelector('.modal-options-list-rows');
    const maximo = parseInt(containerLista.getAttribute('data-max'));
    const selecionados = containerLista.querySelectorAll('input:checked');

    if (tipoInput === 'checkbox' && selecionados.length > maximo) {
        inputAlterado.checked = false;
        alert(`⚠️ Você pode escolher no máximo ${maximo} opções para este grupo.`);
    }
    recalcularSubtotalModal();
}

function recalcularSubtotalModal() {
    if (!produtoSelecionadoModal) return;

    let precoBase = parseFloat(produtoSelecionadoModal.preco);
    let adicionaisExtras = 0;
    let temTamanhoSelecionado = false;
    let precoTamanhoSelecionado = 0;

    const opcionaisMarcados = document.querySelectorAll('#modal-produto-opcionais-container input:checked');
    
    opcionaisMarcados.forEach(opt => {
        const containerGrupo = opt.closest('.modal-options-list-rows');
        const tipoGrupo = containerGrupo.getAttribute('data-tipo-grupo');

        if (tipoGrupo === 'tamanho') {
            temTamanhoSelecionado = true;
            precoTamanhoSelecionado = parseFloat(opt.getAttribute('data-preco') || 0);
        } else {
            adicionaisExtras += parseFloat(opt.getAttribute('data-preco') || 0);
        }
    });

    let valorUnitarioItem = temTamanhoSelecionado ? precoTamanhoSelecionado : precoBase;
    document.getElementById('modal-produto-preco').innerText = valorUnitarioItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let totalFinalModal = (valorUnitarioItem + adicionaisExtras) * quantidadeModal;
    document.getElementById('txt-modal-botao-preco').innerText = totalFinalModal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ==========================================================================
   5. GERENCIADOR DA SACOLA (CARRINHO DINÂMICO)
   ========================================================================== */
function adicionarProdutoSelecionadoASacola() {
    if (!produtoSelecionadoModal) return;

    const gruposOpcionais = document.querySelectorAll('#modal-produto-opcionais-container .modal-options-list-rows');
    let opcionaisEscolhidos = [];
    let erroValidacao = false;
    
    let temTamanhoSelecionado = false;
    let precoTamanhoSelecionado = 0;

    gruposOpcionais.forEach(grupo => {
        const minimo = parseInt(grupo.getAttribute('data-min'));
        const nomeGrupo = group = grupo.getAttribute('data-nome-grupo');
        const tipoGrupo = grupo.getAttribute('data-tipo-grupo');
        const marcados = grupo.querySelectorAll('input:checked');

        if (marcados.length < minimo) {
            alert(`⚠️ O grupo "${nomeGrupo}" é obrigatório. Escolha pelo menos uma opção.`);
            erroValidacao = true;
            return;
        }

        marcados.forEach(m => {
            const precoOpcao = parseFloat(m.getAttribute('data-preco') || 0);
            
            if (tipoGrupo === 'tamanho') {
                temTamanhoSelecionado = true;
                precoTamanhoSelecionado = precoOpcao;
            }

            opcionaisEscolhidos.push({
                nome: m.getAttribute('data-nome'),
                preco: precoOpcao,
                tipo: tipoGrupo
            });
        });
    });

    if (erroValidacao) return;

    const campoObs = document.getElementById('modal-produto-observacao');
    const txtObservacao = campoObs ? campoObs.value.trim() : "";

    let precoBaseCalculado = temTamanhoSelecionado ? precoTamanhoSelecionado : parseFloat(produtoSelecionadoModal.preco);

    let apenasAdicionaisExtras = opcionaisEscolhidos.filter(o => o.tipo !== 'tamanho');
    let stringTamanhoLabel = opcionaisEscolhidos.find(o => o.tipo === 'tamanho');

    const itemSacola = {
        idUnico: Date.now() + Math.random().toString(36).substr(2, 5),
        idProduto: produtoSelecionadoModal.id,
        nome: produtoSelecionadoModal.nome + (stringTamanhoLabel ? ` (${stringTamanhoLabel.nome})` : ''),
        precoBase: precoBaseCalculado,
        quantidade: quantidadeModal,
        opcionais: apenasAdicionaisExtras,
        observacao: txtObservacao
    };

    sacolaItens.push(itemSacola);
    atualizarRenderSacolaEFooter();

    document.getElementById('modal-detalhes-produto').classList.add('hidden');
    produtoSelecionadoModal = null;
}

/* ==========================================================================
   FUNÇÕES DE RENDERIZAÇÃO E CÁLCULO DA SACOLA
   ========================================================================== */
function atualizarRenderSacolaEFooter() {
    const containerLista = document.getElementById('itens-sacola-direta');
    const persistentCart = document.getElementById('persistent-cart');
    const btnFlutuante = document.getElementById('btn-sacola-flutuante');
    
    if (!containerLista || !persistentCart) return;

    containerLista.innerHTML = "";

    if (sacolaItens.length === 0) {
        persistentCart.classList.add('hidden');
        if (btnFlutuante) btnFlutuante.classList.add('hidden');
        return;
    }

    let valorTotalSacolaItens = 0;
    let quantidadeTotalItens = 0;

    sacolaItens.forEach(item => {
        quantidadeTotalItens += item.quantidade;
        let precoUnitarioTotal = item.precoBase;
        item.opcionais.forEach(o => precoUnitarioTotal += o.preco);

        const subtotalItem = precoUnitarioTotal * item.quantidade;
        valorTotalSacolaItens += subtotalItem;

        const stringOpcionais = item.opcionais.length > 0 ? item.opcionais.map(o => o.nome).join(', ') : '';
        const stringObs = item.observacao ? `<span style="color:#ef4444; font-style:italic; font-size: 0.8rem;">Obs: ${item.observacao}</span>` : '';

        const linha = document.createElement('div');
        linha.className = 'cart-item-row';
        linha.innerHTML = `
            <div class="item-info-side">
                <h4>${item.nome}</h4>
                ${stringOpcionais ? `<span>${stringOpcionais}</span>` : ''}
                ${stringObs}
                <span style="font-weight:700; color:var(--text-main); margin-top:4px;">${subtotalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div class="item-actions-side">
                <button type="button" class="btn-qty-action remove-icon btn-cart-minus" data-id="${item.idUnico}"><i class="fas fa-minus"></i></button>
                <span class="qty-number">${item.quantidade}</span>
                <button type="button" class="btn-qty-action btn-cart-plus" data-id="${item.idUnico}"><i class="fas fa-plus"></i></button>
            </div>
        `;
        containerLista.appendChild(linha);
    });

    document.getElementById('cart-valor-total-tela').innerText = valorTotalSacolaItens.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const taxaEntrega = parseFloat(lojaAtiva ? lojaAtiva.taxa : 0);
    document.getElementById('modal-total-final-valor').innerText = (valorTotalSacolaItens + taxaEntrega).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (btnFlutuante) {
        document.getElementById('txt-sacola-flutuante-qtd').innerText = quantidadeTotalItens;
        document.getElementById('txt-sacola-flutuante-valor').innerText = valorTotalSacolaItens.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (!btnFlutuante || btnFlutuante.classList.contains('hidden')) {
        persistentCart.classList.remove('hidden');
    }
}

function alterarQuantidadeItemSacolaSeguro(idUnico, modificador) {
    const item = sacolaItens.find(i => i.idUnico === idUnico);
    if (!item) return;

    item.quantidade += modificador;

    if (item.quantidade <= 0) {
        sacolaItens = sacolaItens.filter(i => i.idUnico !== idUnico);
    }

    atualizarRenderSacolaEFooter();
}

/* ==========================================================================
   6. INTERFACES, MÁSCARAS E EVENTOS DE FORMULÁRIO (NOME, WHATSAPP, CEP)
   ========================================================================== */
function inicializarEventosInterface() {
    const btnFecharDetalhes = document.getElementById('btn-fechar-details') || document.getElementById('btn-fechar-detalhes');
    const btnAbrirCheckout = document.getElementById('btn-abrir-checkout');
    const btnFecharModalDados = document.getElementById('btn-fechar-modal-dados');
    const modalDadosEntrega = document.getElementById('modal-dados-entrega');

    const cartList = document.getElementById('itens-sacola-direta');
    if (cartList) {
        cartList.addEventListener('click', (e) => {
            const btnMinus = e.target.closest('.btn-cart-minus');
            const btnPlus = e.target.closest('.btn-cart-plus');

            if (btnMinus) alterarQuantidadeItemSacolaSeguro(btnMinus.getAttribute('data-id'), -1);
            if (btnPlus) alterarQuantidadeItemSacolaSeguro(btnPlus.getAttribute('data-id'), 1);
        });
    }

    const btnMinimizar = document.getElementById('btn-minimizar-sacola');
    const btnFlutuante = document.getElementById('btn-sacola-flutuante');
    const cartContainer = document.getElementById('persistent-cart');

    if (btnMinimizar && btnFlutuante && cartContainer) {
        btnMinimizar.addEventListener('click', () => {
            cartContainer.classList.add('hidden');
            if (sacolaItens.length > 0) {
                btnFlutuante.classList.remove('hidden');
            }
        });

        btnFlutuante.addEventListener('click', () => {
            btnFlutuante.classList.add('hidden');
            cartContainer.classList.remove('hidden');
        });
    }

    document.getElementById('btn-modal-mais').addEventListener('click', () => {
        quantidadeModal++;
        document.getElementById('txt-modal-quantidade').innerText = quantidadeModal;
        recalcularSubtotalModal();
    });

    document.getElementById('btn-modal-menos').addEventListener('click', () => {
        if (quantidadeModal > 1) {
            quantidadeModal--;
            document.getElementById('txt-modal-quantidade').innerText = quantidadeModal;
            recalcularSubtotalModal();
        }
    });

    document.getElementById('btn-modal-adicionar-sacola').addEventListener('click', () => {
        const btnFlutuante = document.getElementById('btn-sacola-flutuante');
        if(btnFlutuante) btnFlutuante.classList.add('hidden');
        adicionarProdutoSelecionadoASacola();
    });

    if (btnFecharDetalhes) {
        btnFecharDetalhes.addEventListener('click', () => {
            document.getElementById('modal-detalhes-produto').classList.add('hidden');
        });
    }

    if (btnAbrirCheckout && modalDadosEntrega) {
        btnAbrirCheckout.addEventListener('click', () => {
            modalDadosEntrega.classList.remove('hidden');
        });
    }

    if (btnFecharModalDados && modalDadosEntrega) {
        btnFecharModalDados.addEventListener('click', () => {
            modalDadosEntrega.classList.add('hidden');
        });
    }

    const btnEnviarPedido = document.getElementById('btn-enviar-pedido');
    if (btnEnviarPedido) {
        btnEnviarPedido.addEventListener('click', enviarPedidoParaServidor);
    }

    /* ==========================================================================
       7. INTEGRAÇÃO COMPLETA DAS MÁSCARAS E VALIDAÇÕES DO CHECKOUT
       ========================================================================== */
    const checkoutNome = document.getElementById('checkout-nome');
    if (checkoutNome) {
        checkoutNome.addEventListener('input', function() {
            let valor = this.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
            valor = valor.split(' ').map(palavra => {
                if (palavra.length > 0) return palavra[0].toUpperCase() + palavra.slice(1).toLowerCase();
                return '';
            }).join(' ');
            this.value = valor;
        });
    }

    const checkoutWhatsapp = document.getElementById('checkout-whatsapp');
    if (checkoutWhatsapp) {
        checkoutWhatsapp.addEventListener('input', function() {
            let numero = this.value.replace(/\D/g, '').substring(0, 11);
            if (numero.length > 2 && numero[2] !== '9') {
                numero = numero.substring(0, 2) + '9' + numero.substring(2);
            }
            let formatado = numero;
            if (numero.length > 2) {
                formatado = `(${numero.substring(0, 2)}) `;
                if (numero.length > 7) formatado += `${numero.substring(2, 7)}-${numero.substring(7)}`;
                else formatado += numero.substring(2);
            }
            this.value = formatado;
        });
    }

    const checkoutCep = document.getElementById('checkout-cep');
    if (checkoutCep) {
        checkoutCep.addEventListener('input', function() {
            let cep = this.value.replace(/\D/g, '').substring(0, 8);
            if (cep.length > 5) cep = cep.replace(/^(\d{5})(\d)/, '$1-$2');
            this.value = cep;
        });

        checkoutCep.addEventListener('blur', async function() {
            const cepLimpo = this.value.replace(/\D/g, '');
            const statusLabel = document.getElementById('cep-status');
            if (cepLimpo.length === 8) {
                if (statusLabel) {
                    statusLabel.textContent = "🔍 Buscando endereço...";
                    statusLabel.style.color = "#3b82f6";
                }
                try {
                    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                    const dados = await resposta.json();
                    if (!dados.erro) {
                        if(document.getElementById('checkout-rua')) document.getElementById('checkout-rua').value = dados.logradouro || '';
                        if(document.getElementById('checkout-bairro')) document.getElementById('checkout-bairro').value = dados.bairro || '';
                        if(document.getElementById('checkout-cidade')) document.getElementById('checkout-cidade').value = `${dados.localidade} - ${dados.uf}`;
                        if (statusLabel) {
                            statusLabel.textContent = "✅ Endereço preenchido!";
                            statusLabel.style.color = "#10b981";
                        }
                        const numField = document.getElementById('checkout-numero');
                        if (numField) numField.focus();
                    } else {
                        if (statusLabel) {
                            statusLabel.textContent = "❌ CEP não encontrado. Digite o endereço.";
                            statusLabel.style.color = "#ef4444";
                        }
                    }
                } catch (erro) {
                    if (statusLabel) statusLabel.textContent = "⚠️ Erro ao buscar. Digite manualmente.";
                }
            }
        });
    }

    const checkSemNumero = document.getElementById('checkout-sem-numero');
    const inputNumero = document.getElementById('checkout-numero');
    const inputQuadra = document.getElementById('checkout-quadra');
    if (checkSemNumero && inputNumero) {
        checkSemNumero.addEventListener('change', function() {
            if (this.checked) {
                inputNumero.value = '';
                inputNumero.disabled = true;
                inputNumero.style.backgroundColor = '#f3f4f6';
                if(inputQuadra) inputQuadra.focus();
            } else {
                inputNumero.disabled = false;
                inputNumero.style.backgroundColor = '#fff';
                inputNumero.focus();
            }
        });
    }
}

/* ==========================================================================
   INTEGRAÇÃO COM A API DO SERVIDOR (ENVIAR PEDIDO REFORMATADO)
   ========================================================================== */
async function enviarPedidoParaServidor() {
    // 1. Puxa os dados cadastrais
    const nome = document.getElementById('checkout-nome').value.trim();
    const whatsapp = document.getElementById('checkout-whatsapp').value.trim();
    const pagamento = document.getElementById('checkout-pagamento').value;

    // Puxa as caixas desmembradas do endereço estruturado
    const cep = document.getElementById('checkout-cep').value.trim();
    const rua = document.getElementById('checkout-rua').value.trim();
    const numero = document.getElementById('checkout-numero').value.trim();
    const quadra = document.getElementById('checkout-quadra').value.trim();
    const lote = document.getElementById('checkout-lote').value.trim();
    const bairro = document.getElementById('checkout-bairro').value.trim();
    const cidade = document.getElementById('checkout-cidade').value.trim();
    const semNumero = document.getElementById('checkout-sem-numero').checked;

    // 2. Validação geral de segurança dos obrigatórios
    if (!nome || !whatsapp || !cep || !rua || !bairro || !cidade || !pagamento) {
        alert("⚠️ Por favor, preencha todos os campos obrigatórios de entrega e pagamento.");
        return;
    }

    // A regra inteligente que você criou: se não tem número real, precisa de Quadra ou Lote
    const temNumeroGarantido = numero !== '' || semNumero;
    const temQuadraOuLote = quadra !== '' || lote !== '';

    if (!temNumeroGarantido && !temQuadraOuLote) {
        alert("⚠️ Por favor, informe o Número da residência ou preencha a Quadra/Lote (ou marque a opção 'Sem Número').");
        return;
    }

    if (sacolaItens.length === 0) {
        alert("⚠️ Sua sacola está vazia!");
        return;
    }

    // MONTAGEM MÁGICA: Consolida todos os campos em um único texto estruturado para o backend
    let enderecoConsolidado = `Rua: ${rua}`;
    if (semNumero) {
        enderecoConsolidado += `, S/N`;
    } else if (numero) {
        enderecoConsolidado += `, Nº ${numero}`;
    }
    if (quadra) enderecoConsolidado += `, Qd: ${quadra}`;
    if (lote) enderecoConsolidado += `, Lt: ${lote}`;
    enderecoConsolidado += `, Bairro: ${bairro}, ${cidade} - CEP: ${cep}`;

    // 3. Formata os itens para a esteira/Kanban do gestor
    const stringItensFormatada = sacolaItens.map(item => {
        let descricao = `${item.quantidade}x ${item.nome}`;
        if (item.opcionais && item.opcionais.length > 0) {
            descricao += ` [${item.opcionais.map(o => o.nome).join(', ')}]`;
        }
        if (item.observacao) {
            descricao += ` (Obs: ${item.observacao})`;
        }
        return descricao;
    }).join(' | ');

    // 4. Calcula os totais financeiros
    let subtotal = 0;
    sacolaItens.forEach(item => {
        let precoUnitarioTotal = item.precoBase;
        item.opcionais.forEach(o => precoUnitarioTotal += o.preco);
        subtotal += precoUnitarioTotal * item.quantidade;
    });

    const taxaEntrega = parseFloat(lojaAtiva && lojaAtiva.taxa ? lojaAtiva.taxa : 0);
    const totalFinal = subtotal + taxaEntrega;

    // 5. Envia o payload idêntico ao que o banco Neon espera
    const payloadPedido = {
        cliente_nome: nome,
        cliente_telefone: whatsapp,
        cliente_endereco: enderecoConsolidated = enderecoConsolidado, // Passa a string única compilada!
        itens: stringItensFormatada, 
        subtotal: subtotal,
        taxa_entrega: taxaEntrega,
        total: totalFinal,
        forma_pagamento: pagamento
    };

    // 6. Efeito visual de carregamento
    const btnEnviar = document.getElementById('btn-enviar-pedido');
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btnEnviar.disabled = true;

    try {
        // 7. Envia para o servidor Render
        const resposta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadPedido)
        });

        if (!resposta.ok) {
            throw new Error("Falha de comunicação com o servidor.");
        }

        const dadosRetorno = await resposta.json();

        // 8. Sucesso! Limpa o carrinho e reseta os campos
        alert(`✅ Sucesso! Seu pedido #${dadosRetorno.id} foi enviado para a cozinha!`);
        
        sacolaItens = [];
        atualizarRenderSacolaEFooter();
        document.getElementById('form-checkout').reset();
        
        // Destrava o campo número caso estivesse desativado pelo checkbox
        const inputNum = document.getElementById('checkout-numero');
        if (inputNum) {
            inputNum.disabled = false;
            inputNum.style.backgroundColor = '#fff';
        }

        document.getElementById('modal-dados-entrega').classList.add('hidden');

    } catch (erro) {
        console.error("Erro ao enviar pedido:", erro);
        alert("❌ Ocorreu um erro ao enviar seu pedido. Verifique sua conexão e tente novamente.");
    } finally {
        btnEnviar.innerHTML = textoOriginal;
        btnEnviar.disabled = false;
    }
}