/* ==========================================================================
   ESTADO GLOBAL DO CARDÁPIO ONLINE (CLIENTE)
   ========================================================================== */
let lojaAtiva = null;
let categoriasDaLoja = [];
let produtosDaLoja = [];
let sacolaItens = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa a Integração Multilojas e Branding
    carregarDadosDaLojaUrl();
    aplicarIdentidadeVisual();
    
    // 2. Carrega o Banco de Dados Real da Loja
    carregarBancoDeDadosProdutos();

    // 3. Inicializa os motores de interface
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

    // Busca o registro correspondente gerando o mesmo padrão de slug
    lojaAtiva = listaLojas.find(loja => encodeCalmSlug(loja.nome) === lojaSlug);

    if (!lojaAtiva) {
        alert('⚠️ Esta loja não foi encontrada no sistema!');
        return;
    }

    // Injeta os dados nos IDs novos mapeados no cardapio-online.html
    document.getElementById('nome-loja-header').innerHTML = `${lojaAtiva.nome}`;
    document.getElementById('slogan-loja').innerText = lojaAtiva.slogan || 'O sabor que realça o seu dia';
    
    // Injeta tempo e taxa no badge correspondente
    const taxaFormatada = parseFloat(lojaAtiva.taxa || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('delivery-info-badge').innerHTML = `
        <i class="fas fa-motorcycle"></i> ${lojaAtiva.tempo || '30-45'} min • ${taxaFormatada}
    `;

    // Atualiza a frase da taxa na tela do checkout final
    const labelTaxaCheckout = document.getElementById('txt-label-taxa-checkout');
    if (labelTaxaCheckout) labelTaxaCheckout.innerText = `com entrega ${taxaFormatada}`;

    // Altera o título da aba do navegador
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

    // Injeta as cores configuradas pelo lojista direto nas variáveis de CSS Root
    document.documentElement.style.setProperty('--primary-color', lojaAtiva.corPrimaria || '#FF6B00');
    document.documentElement.style.setProperty('--secondary-color', lojaAtiva.corSecundaria || '#6B3FA0');
    document.documentElement.style.setProperty('--bg-light', lojaAtiva.corFundo || '#f8fafc');
    document.documentElement.style.setProperty('--primary-hover', (lojaAtiva.corPrimaria || '#FF6B00') + 'dd');

    // Aplica o Banner (Seja imagem Base64 ou Cor Sólida)
    const bannerElement = document.getElementById('banner-topo-cliente');
    if (bannerElement) {
        if (lojaAtiva.bannerImg) {
            bannerElement.style.backgroundImage = `url(${lojaAtiva.bannerImg})`;
        } else {
            bannerElement.style.backgroundImage = 'none';
            bannerElement.style.backgroundColor = lojaAtiva.bannerCorSolida || '#6B3FA0';
        }
    }

    // Aplica a Logomarca e respeita o Alinhamento (Esquerda, Centro, Direita)
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
   3. CARREGADOR DE PRODUTOS E CATEGORIAS REAIS DO LOCALSTORAGE
   ========================================================================== */
function carregarBancoDeDadosProdutos() {
    if (!lojaAtiva) return;

    // Busca os produtos e categorias salvos sob a chave única desta loja ativa
    categoriasDaLoja = JSON.parse(localStorage.getItem(`realce_categorias_${lojaAtiva.id}`)) || [];
    produtosDaLoja = JSON.parse(localStorage.getItem(`realce_produtos_${lojaAtiva.id}`)) || [];

    renderizarCarrosselCategoriasReais();
    renderizarVitrineProdutosReais('Todos'); // Por padrão, exibe todos ao carregar
}

function renderizarCarrosselCategoriasReais() {
    const carousel = document.getElementById('carousel-categorias');
    if (!carousel) return;

    carousel.innerHTML = "";

    if (categoriasDaLoja.length === 0) {
        carousel.innerHTML = `<span style="color:#64748b; font-size:0.85rem; padding:5px 20px;">Nenhuma categoria criada</span>`;
        return;
    }

    // Cria o botão global "Todos"
    const btnTodos = document.createElement('button');
    btnTodos.className = 'category-btn active';
    btnTodos.textContent = 'Todos';
    btnTodos.addEventListener('click', () => filtrarVitrinePorCategoria('Todos', btnTodos));
    carousel.appendChild(btnTodos);

    // Cria os botões das categorias cadastradas pelo lojista
    categoriasDaLoja.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = cat;
        btn.addEventListener('click', () => filtrarVitrinePorCategoria(cat, btn));
        carousel.appendChild(btn);
    });
}

function filtrarVitrinePorCategoria(categoriaNome, botaoClicado) {
    // Atualiza estados dos botões ativos do carrossel
    const botoes = document.querySelectorAll('.category-btn');
    botoes.forEach(b => b.classList.remove('active'));
    botaoClicado.classList.add('active');

    // Refaz a filtragem na tela
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

    // Define quais categorias exibir com base no filtro selecionado
    const categoriasParaRenderizar = (categoriaFiltro === 'Todos') ? categoriasDaLoja : [categoriaFiltro];

    categoriasParaRenderizar.forEach(cat => {
        const produtosFiltrados = produtosDaLoja.filter(p => p.categoria === cat);

        // Se houver produtos nessa categoria, constrói a seção na tela
        if (produtosFiltrados.length > 0) {
            const secao = document.createElement('section');
            secao.className = 'menu-section';
            secao.innerHTML = `<h2 class="section-title">${cat}</h2>`;

            const listaCards = document.createElement('div');

            produtosFiltrados.forEach(prod => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                // Trata a foto do produto (se houver Base64 usa, senão coloca ícone neutro)
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

                // Listener para abrir o modal do produto ao clicar no card
                card.addEventListener('click', () => {
                    alert(`Aqui abrirá o modal de opcionais para o item: ${prod.nome}`);
                });

                listaCards.appendChild(card);
            });

            secao.appendChild(listaCards);
            vitrine.appendChild(secao);
        }
    });
}

/* ==========================================================================
   4. CONTROLADOR DOS MODAIS E EVENTOS DE INTERFACE
   ========================================================================== */
function inicializarEventosInterface() {
    const btnAbrirCheckout = document.getElementById('btn-abrir-checkout');
    const btnFecharModalDados = document.getElementById('btn-fechar-modal-dados');
    const modalDadosEntrega = document.getElementById('modal-dados-entrega');

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