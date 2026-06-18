/* ==========================================================================
   CONEXÃO COM O ECOSSISTEMA: LEITURA EM TEMPO REAL DAS CONFIGURAÇÕES DO PAINEL
   ========================================================================== */
const categoriasDoBanco = JSON.parse(localStorage.getItem('realce_categorias')) || [];
const produtosDoBanco = JSON.parse(localStorage.getItem('realce_produtos')) || [];

// Dados Institucionais e Visuais vindos da página Loja
const configLoja = {
    nome: localStorage.getItem('loja_nome') || 'Realce Cardápio',
    slogan: localStorage.getItem('loja_slogan') || 'O sabor que realça o seu dia',
    taxaEntrega: parseFloat(localStorage.getItem('loja_taxa') || 5.00),
    tempoEntrega: localStorage.getItem('loja_tempo') || '30-45',
    statusAberto: localStorage.getItem('loja_status') !== 'false', // Padrão true
    
    // Identidade Visual
    corPrimaria: localStorage.getItem('loja_cor_primaria') || '#FF6B00',
    corSecundaria: localStorage.getItem('loja_cor_secundaria') || '#6B3FA0',
    corFundo: localStorage.getItem('loja_cor_fundo') || '#f8fafc',
    bannerImg: localStorage.getItem('loja_banner_img') || '',
    bannerCorSolida: localStorage.getItem('loja_banner_tipo_cor') || '',
    logoImg: localStorage.getItem('loja_logo_img') || '',
    logoPosicao: localStorage.getItem('loja_logo_posicao') || 'center'
};

/* ==========================================================================
   ESTADO GLOBAL DO APLICATIVO DO CLIENTE
   ========================================================================== */
let carrinho = [];
let produtoSelecionadoNoModal = null;
let quantidadeItemModal = 1;

document.addEventListener('DOMContentLoaded', () => {
    aplicarBrandingCustomizado();
    renderizarDadosDoEstabelecimento();
    renderizarCategoriasCarrossel();
    renderizarVitrineProdutos();
    
    inicializarEventosModalDetalhes();
    inicializarEventosModalCheckout();
});

/* ==========================================================================
   1. INJETOR DE BRANDING E APARÊNCIA DINÂMICA
   ========================================================================== */
function aplicarBrandingCustomizado() {
    // Sobrescreve as variáveis do CSS em tempo real conforme a escolha do lojista
    document.documentElement.style.setProperty('--primary-color', configLoja.corPrimaria);
    document.documentElement.style.setProperty('--secondary-color', configLoja.corSecundaria);
    document.documentElement.style.setProperty('--bg-light', configLoja.corFundo);
    
    // Calcula um tom de hover ligeiramente mais escuro para o botão principal
    document.documentElement.style.setProperty('--primary-hover', configLoja.corPrimaria + 'dd');

    // Injeta Banner de Topo (Seja imagem Base64 ou cor sólida)
    const headerBanner = document.querySelector('.restaurant-header');
    if (headerBanner) {
        if (configLoja.bannerImg) {
            headerBanner.style.backgroundImage = `url(${configLoja.bannerImg})`;
        } else if (configLoja.bannerCorSolida) {
            headerBanner.style.backgroundImage = 'none';
            headerBanner.style.backgroundColor = configLoja.bannerCorSolida;
        }
    }

    // Alinha a logo conforme o seletor de posição
    const logoBox = document.querySelector('.restaurant-profile-img');
    if (logoBox) {
        if (configLoja.logoImg) {
            logoBox.innerHTML = `<img src="${configLoja.logoImg}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }
        
        if (configLoja.logoPosicao === 'left') {
            logoBox.style.left = '65px';
            logoBox.style.transform = 'none';
        } else if (configLoja.logoPosicao === 'right') {
            logoBox.style.left = 'auto';
            logoBox.style.right = '20px';
            logoBox.style.transform = 'none';
        }
    }
}

function renderizarDadosDoEstabelecimento() {
    const nomeTxt = document.querySelector('.restaurant-name');
    const sloganTxt = document.querySelector('.restaurant-subtitle');
    const badgeStatus = document.querySelector('.badge-status');
    const badgeDelivery = document.querySelector('.badge-delivery');

    if (nomeTxt) nomeTxt.innerHTML = `${configLoja.nome}`;
    if (sloganTxt) sloganTxt.textContent = configLoja.slogan;
    
    if (badgeStatus) {
        if (configLoja.statusAberto) {
            badgeStatus.className = 'badge-status open';
            badgeStatus.innerHTML = `<i class="fas fa-circle"></i> Aberto`;
        } else {
            badgeStatus.className = 'badge-status closed';
            badgeStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            badgeStatus.style.color = '#ef4444';
            badgeStatus.innerHTML = `<i class="fas fa-circle"></i> Fechado`;
        }
    }

    if (badgeDelivery) {
        badgeDelivery.innerHTML = `<i class="fas fa-motorcycle"></i> ${configLoja.tempoEntrega} min • R$ ${configLoja.taxaEntrega.toFixed(2).replace('.', ',')}`;
    }
}

/* ==========================================================================
   2. RENDERIZADORES DA VITRINE E CARROSSEL
   ========================================================================== */
function renderizarCategoriasCarrossel() {
    const carrossel = document.getElementById('carousel-categorias');
    if (!carrossel) return;

    carrossel.innerHTML = "";
    
    if (categoriasDoBanco.length === 0) {
        carrossel.innerHTML = `<span style="color:var(--text-muted); font-size:0.85rem; padding:5px 10px;">Nenhuma categoria ativa</span>`;
        return;
    }
    
    categoriasDoBanco.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${index === 0 ? 'active' : ''}`;
        btn.textContent = cat;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const secao = document.getElementById(`secao-vitrine-${cat.replace(/\s+/g, '-')}`);
            if (secao) secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        
        carrossel.appendChild(btn);
    });
}

function renderizarVitrineProdutos() {
    const vitrine = document.getElementById('vitrine-produtos');
    if (!vitrine) return;

    vitrine.innerHTML = "";

    if (produtosDoBanco.length === 0) {
        vitrine.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:60px 20px; font-style:italic;">Cardápio em manutenção. Volte mais tarde!</p>`;
        return;
    }

    const layoutEstilo = localStorage.getItem('realce_design_layout') || 'lista';
    if (layoutEstilo === 'grade') {
        vitrine.style.display = 'grid';
        vitrine.style.gridTemplateColumns = '1fr 1fr';
        vitrine.style.gap = '12px';
    } else {
        vitrine.style.display = 'block';
    }

    categoriasDoBanco.forEach(categoria => {
        const produtosFiltrados = produtosDoBanco.filter(p => p.categoria === categoria);
        
        if (produtosFiltrados.length > 0) {
            const secao = document.createElement('section');
            secao.className = 'menu-section';
            secao.id = `secao-vitrine-${categoria.replace(/\s+/g, '-')}`;
            secao.innerHTML = `<h2 class="section-title" style="grid-column: span 2;">${categoria}</h2>`;
            
            produtosFiltrados.forEach(prod => {
                const card = document.createElement('div');
                card.className = 'product-card';
                if (layoutEstilo === 'grade') {
                    card.style.flexDirection = 'column';
                    card.style.height = '100%';
                }
                card.setAttribute('data-id', prod.id);
                
                const fotoDestaque = (prod.imagens && prod.imagens.length > 0)
                    ? `<img src="${prod.imagens[0]}" alt="${prod.nome}">`
                    : `<i class="fas ${categoria.toLowerCase().includes('bebida') ? 'fa-glass-cheers' : 'fa-hamburger'}"></i>`;
                
                card.innerHTML = `
                    <div class="product-details">
                        <h3>${prod.nome}</h3>
                        <p class="product-description">${prod.ingredientes || 'Sem descrição.'}</p>
                        <span class="product-price">R$ ${parseFloat(prod.preco).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="product-image-area" style="${layoutEstilo === 'grade' ? 'width:100%; height:130px; margin-top:10px;' : ''}">
                        <div class="img-placeholder">
                            ${fotoDestaque}
                        </div>
                        <button class="btn-add-item">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
                
                card.addEventListener('click', () => abrirModalOpcionaisProduto(prod.id));
                secao.appendChild(card);
            });
            
            vitrine.appendChild(secao);
        }
    });
}

/* ==========================================================================
   3. MOTOR DO MODAL DE DETALHES E COMPLEMENTOS
   ========================================================================== */
function abrirModalOpcionaisProduto(idProduto) {
    const prod = produtosDoBanco.find(p => p.id === idProduto);
    if (!prod) return;

    produtoSelecionadoNoModal = prod;
    quantidadeItemModal = 1;

    document.getElementById('modal-produto-nome').textContent = prod.nome;
    document.getElementById('modal-produto-preco').textContent = `R$ ${parseFloat(prod.preco).toFixed(2).replace('.', ',')}`;
    document.getElementById('modal-produto-descricao').textContent = prod.ingredientes || '';
    document.getElementById('txt-modal-quantidade').textContent = quantidadeItemModal;

    const galeria = document.getElementById('modal-produto-galeria');
    galeria.innerHTML = "";
    if (prod.imagens && prod.imagens.length > 0) {
        prod.imagens.forEach(imgUrl => {
            galeria.innerHTML += `<img src="${imgUrl}" alt="${prod.nome}">`;
        });
        galeria.style.display = "flex";
    } else {
        galeria.style.display = "none";
    }

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

            const inputType = parseInt(grupo.maximo) === 1 && parseInt(grupo.minimo) === 1 ? 'radio' : 'checkbox';

            grupo.itens.forEach((item) => {
                const precoAdicionalNum = parseFloat(item.preco_adicional);
                const tagPreco = precoAdicionalNum > 0 ? `+ R$ ${precoAdicionalNum.toFixed(2).replace('.', ',')}` : '';
                
                const sampleRow = document.createElement('div');
                sampleRow.className = 'modal-option-item-row';
                sampleRow.innerHTML = `
                    <label class="modal-opt-left">
                        <input type="${inputType}" name="grupo-modal-${idxGrupo}" data-preco="${item.preco_adicional}" value="${item.nome_adicional}">
                        <span>${item.nome_adicional}</span>
                    </label>
                    <span class="modal-opt-price-tag">${tagPreco}</span>
                `;
                
                sampleRow.querySelector('input').addEventListener('change', calcularPrecoTotalModal);
                grupoBox.appendChild(sampleRow);
            });

            containerOpcionais.appendChild(grupoBox);
        });
    }

    calcularPrecoTotalModal();
    document.getElementById('modal-detalhes-produto').classList.remove('hidden');
}

function calcularPrecoTotalModal() {
    if (!produtoSelecionadoNoModal) return;

    let precoBase = parseFloat(produtoSelecionadoNoModal.preco);
    let precoAdicionais = 0;

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
    const btnFechar = document.getElementById('btn-fechar-detalhes');
    const btnMais = document.getElementById('btn-modal-mais');
    const btnMenos = document.getElementById('btn-modal-menos');
    const btnAdicionarSacola = document.getElementById('btn-modal-adicionar-sacola');

    if (btnFechar) btnFechar.addEventListener('click', () => modal.classList.add('hidden'));

    if (btnMais) {
        btnMais.addEventListener('click', () => {
            quantidadeItemModal++;
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
            if (produtoSelecionadoNoModal.opcionais) {
                let validacaoOk = true;
                produtoSelecionadoNoModal.opcionais.forEach((grupo, idxGrupo) => {
                    const marcados = document.querySelectorAll(`input[name="grupo-modal-${idxGrupo}"]:checked`).length;
                    if (marcados < parseInt(grupo.minimo)) {
                        alert(`Por favor, selecione no mínimo ${grupo.minimo} opções em: "${grupo.nome_grupo}"`);
                        validacaoOk = false;
                    }
                    if (marcados > parseInt(grupo.maximo)) {
                        alert(`Atenção: Você ultrapassou o limite de ${grupo.maximo} opções em: "${grupo.nome_grupo}"`);
                        validacaoOk = false;
                    }
                });
                if (!validacaoOk) return;
            }

            const opcionaisEscolhidos = [];
            let precoComplementos = 0;
            const selecionados = document.querySelectorAll('#modal-produto-opcionais-container input:checked');
            
            selecionados.forEach(sel => {
                opcionaisEscolhidos.push(sel.value);
                precoComplementos += parseFloat(sel.getAttribute('data-preco') || 0);
            });

            const nomeItemUnico = produtoSelecionadoNoModal.nome;
            const precoItemFinal = parseFloat(produtoSelecionadoNoModal.preco) + precoComplementos;

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
   4. GERENCIADOR DA SACOLA DO RODAPÉ
   ========================================================================== */
function mudarQuantidadeNaSacola(index, mudanca) {
    carrinho[index].quantidade += mudanca;
    if (carrinho[index].whitespace || carrinho[index].quantidade <= 0) {
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
                <span style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">${item.detalhes || 'Sem adicionais.'}</span>
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

    containerLista.querySelectorAll('.btn-sacola-menos').forEach(btn => {
        btn.addEventListener('click', () => mudarQuantidadeNaSacola(parseInt(btn.getAttribute('data-index')), -1));
    });
    containerLista.querySelectorAll('.btn-sacola-mais').forEach(btn => {
        btn.addEventListener('click', () => mudarQuantidadeNaSacola(parseInt(btn.getAttribute('data-index')), 1));
    });

    if (txtTotalRodape) txtTotalRodape.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (txtTotalModal) txtTotalModal.textContent = `R$ ${(subtotal + configLoja.taxaEntrega).toFixed(2).replace('.', ',')}`;

    containerSacola.classList.remove('hidden');
}

/* ==========================================================================
   5. CHECKOUT E INTEGRAÇÃO DO WHATSAPP
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

            alert("Pedido validado com sucesso! Redirecionando para o WhatsApp do estabelecimento...");
            modalDados.classList.add('hidden');
        });
    }
}