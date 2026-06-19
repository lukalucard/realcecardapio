/* ==========================================================================
   ESTADO GLOBAL DO CARDÁPIO ONLINE
   ========================================================================== */
let lojaAtiva = null;
let produtosDaLoja = []; // Receberá os produtos cadastrados no painel
let sacolaItens = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa a Integração Multilojas e Branding
    carregarDadosDaLojaUrl();
    aplicarIdentidadeVisual();
    
    // 2. Inicializa os motores nativos do cardápio
    carregarCategoriasEDinamismo();
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
   3. CARREGADOR DE PRODUTOS E FILTROS DE CATEGORIAS
   ========================================================================== */
function carregarCategoriasEDinamismo() {
    // Aqui no futuro vamos puxar a lista de produtos salvos vinculados a esta loja
    // Por enquanto, renderiza uma estrutura de teste limpa na vitrine
    const vitrine = document.getElementById('vitrine-produtos');
    const carousel = document.getElementById('carousel-categorias');
    
    if (carousel) {
        carousel.innerHTML = `
            <button class="category-btn active">Todos</button>
            <button class="category-btn">🍕 Pizzas</button>
            <button class="category-btn">🍔 Hambúrgueres</button>
            <button class="category-btn">🥤 Bebidas</button>
        `;
    }

    if (vitrine) {
        vitrine.innerHTML = `
            <div class="menu-section">
                <h2 class="section-title">Bem-vindo à nossa vitrine!</h2>
                <p style="color: #64748b; font-size:0.9rem; padding: 10px 0;">
                    Adicione seus produtos no menu administrativo para vê-los brilhar aqui com o seu novo visual personalizado.
                </p>
            </div>
        `;
    }
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