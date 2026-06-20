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

    const categoriasParaRenderizar = (categoriaFiltro === 'Todos') ? categoriasDaLoja : [categoriaFiltro];

    categoriasParaRenderizar.forEach(cat => {
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

                // Evento corrigido: Clique no card abre o modal dinâmico de opcionais
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

    // Limpa o campo de observações sempre que abrir um novo produto
    const campoObs = document.getElementById('modal-produto-observacao');
    if(campoObs) campoObs.value = "";

    document.getElementById('modal-produto-nome').innerText = produto.nome;
    document.getElementById('modal-produto-descricao').innerText = produto.ingredientes || 'Sem ingredientes descritos.';
    document.getElementById('modal-produto-preco').innerText = parseFloat(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('txt-modal-quantidade').innerText = quantidadeModal;

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
        inputAlterado.checked = false; // Barra o clique se estourar o limite máximo do grupo
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

    // FORMATO A: O tamanho selecionado vira o novo preço unitário do item
    let valorUnitarioItem = temTamanhoSelecionado ? precoTamanhoSelecionado : precoBase;
    
    // MUDANÇA AQUI: Atualiza o preço do TOPO do modal com o valor do tamanho selecionado (preço unitário)
    document.getElementById('modal-produto-preco').innerText = valorUnitarioItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Calcula o total final multiplicando pela quantidade de itens selecionada
    let totalFinalModal = (valorUnitarioItem + adicionaisExtras) * quantidadeModal;

    // Atualiza o preço do BOTÃO de adicionar lá embaixo
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
        const nomeGrupo = grupo.getAttribute('data-nome-grupo');
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

    // CAPTURA A OBSERVAÇÃO DO CLIENTE
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
        observacao: txtObservacao // SALVA A OBSERVAÇÃO AQUI
    };

    sacolaItens.push(itemSacola);
    atualizarRenderSacolaEFooter();

    document.getElementById('modal-detalhes-produto').classList.add('hidden');
    produtoSelecionadoModal = null;
}

function atualizarRenderSacolaEFooter() {
    const containerLista = document.getElementById('itens-sacola-direta');
    const persistentCart = document.getElementById('persistent-cart');
    
    if (!containerLista || !persistentCart) return;

    containerLista.innerHTML = "";

    if (sacolaItens.length === 0) {
        persistentCart.classList.add('hidden');
        return;
    }

    let valorTotalSacolaItens = 0;

    sacolaItens.forEach(item => {
        let precoUnitarioTotal = item.precoBase;
        item.opcionais.forEach(o => precoUnitarioTotal += o.preco);

        const subtotalItem = precoUnitarioTotal * item.quantidade;
        valorTotalSacolaItens += subtotalItem;

        const stringOpcionais = item.opcionais.length > 0 ? item.opcionais.map(o => o.nome).join(', ') : '';
        // Mostra a observação em itálico na sacola se ela existir
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
                <button type="button" class="btn-qty-action remove-icon" onclick="alterarQuantidadeItemSacola('${item.idUnico}', -1)"><i class="fas fa-minus"></i></button>
                <span class="qty-number">${item.quantidade}</span>
                <button type="button" class="btn-qty-action" onclick="alterarQuantidadeItemSacola('${item.idUnico}', 1)"><i class="fas fa-plus"></i></button>
            </div>
        `;
        containerLista.appendChild(linha);
    });

    document.getElementById('cart-valor-total-tela').innerText = valorTotalSacolaItens.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const taxaEntrega = parseFloat(lojaAtiva ? lojaAtiva.taxa : 0);
    document.getElementById('modal-total-final-valor').innerText = (valorTotalSacolaItens + taxaEntrega).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    persistentCart.classList.remove('hidden');
}

/* ==========================================================================
   6. CONTROLADOR DOS MODAIS E EVENTOS DE INTERFACE
   ========================================================================== */
function inicializarEventosInterface() {
    const btnFecharDetalhes = document.getElementById('btn-fechar-details') || document.getElementById('btn-fechar-detalhes');
    const btnAbrirCheckout = document.getElementById('btn-abrir-checkout');
    const btnFecharModalDados = document.getElementById('btn-fechar-modal-dados');
    const modalDadosEntrega = document.getElementById('modal-dados-entrega');

    // Controle de quantidade INTERNA do modal de opcionais
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

    // Botão Adicionar a Sacola no Modal
    document.getElementById('btn-modal-adicionar-sacola').addEventListener('click', adicionarProdutoSelecionadoASacola);

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
}