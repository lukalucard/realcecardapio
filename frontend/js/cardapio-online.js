// ==========================================================================
// MOTOR DE INTEGRAÇÃO - LEITURA DA LOJA DINÂMICA
// ==========================================================================
let lojaAtiva = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosDaLojaUrl();
    aplicarIdentidadeVisual();
    // Aqui você mantém as suas outras funções, como carregarProdutos(), inicializarCarrinho(), etc.
});

function carregarDadosDaLojaUrl() {
    // 1. Pega o nome da loja que veio na URL (?loja=realce-pizza-burger)
    const params = new URLSearchParams(window.location.search);
    const lojaSlug = params.get('loja');

    // 2. Busca a lista completa de lojas do localStorage
    const listaLojas = JSON.parse(localStorage.getItem('realce_lista_lojas')) || [];

    if (!lojaSlug || listaLojas.length === 0) {
        alert('⚠️ Nenhuma loja encontrada ou link inválido!');
        return;
    }

    // 3. Encontra a loja correspondente gerando o mesmo slug para comparar
    lojaAtiva = listaLojas.find(loja => encodeCalmSlug(loja.nome) === lojaSlug);

    if (!lojaAtiva) {
        alert('⚠️ Loja não encontrada no sistema!');
        return;
    }

    // 4. INJETAR OS DADOS NO HTML (Substitua pelos IDs reais do seu cardapio-online)
    if (document.getElementById('nome-loja-header')) {
        document.getElementById('nome-loja-header').innerText = lojaAtiva.nome;
    }
    if (document.getElementById('slogan-loja')) {
        document.getElementById('slogan-loja').innerText = lojaAtiva.slogan || '';
    }
    if (document.getElementById('info-endereco')) {
        document.getElementById('info-endereco').innerText = lojaAtiva.endereco || '';
    }
    if (document.getElementById('info-horario')) {
        document.getElementById('info-horario').innerText = lojaAtiva.horario || '';
    }
    
    // Altera o título da aba do navegador dinamicamente
    document.title = `${lojaAtiva.nome} - Cardápio Online`;
}

// Função auxiliar para bater o mesmo slug do loja.js
function encodeCalmSlug(texto) {
    return texto.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

/* ==========================================================================
   APLICADOR DE IDENTIDADE VISUAL DINÂMICA
   ========================================================================== */
function aplicarIdentidadeVisual() {
    if (!lojaAtiva) return;

    // 1. Aplica as cores usando Variáveis CSS (Root) para mudar tudo de uma vez
    document.documentElement.style.setProperty('--cor-primaria', lojaAtiva.corPrimaria);
    document.documentElement.style.setProperty('--cor-secundaria', lojaAtiva.corSecundaria);
    document.documentElement.style.setProperty('--cor-fundo-geral', lojaAtiva.corFundo);

    // Também pode aplicar direto no body se preferir
    document.body.style.backgroundColor = lojaAtiva.corFundo;

    // 2. Aplica o Banner de Topo (Seja imagem em Base64 ou Cor Sólida)
    const bannerElement = document.getElementById('banner-topo-cliente');
    if (bannerElement) {
        if (lojaAtiva.bannerImg) {
            bannerElement.style.backgroundImage = `url(${lojaAtiva.bannerImg})`;
            bannerElement.style.backgroundSize = 'cover';
            bannerElement.style.backgroundPosition = 'center';
        } else {
            bannerElement.style.backgroundImage = 'none';
            bannerElement.style.backgroundColor = lojaAtiva.bannerCorSolida || '#6B3FA0';
        }
    }

    // 3. Aplica a Logomarca e a sua Posição
    const logoImgElement = document.getElementById('logo-cliente-img');
    const logoContainer = document.getElementById('container-logo-cliente'); // Div pai da logo

    if (logoImgElement && lojaAtiva.logoImg) {
        logoImgElement.src = lojaAtiva.logoImg;
        logoImgElement.style.display = 'block';
    }

    if (logoContainer) {
        // Alinha o container baseado na escolha do painel: left, center ou right
        if (lojaAtiva.logoPosicao === 'center') {
            logoContainer.style.margin = '0 auto';
            logoContainer.style.textAlign = 'center';
        } else if (lojaAtiva.logoPosicao === 'right') {
            logoContainer.style.marginLeft = 'auto';
            logoContainer.style.marginRight = '0';
        } else {
            logoContainer.style.marginLeft = '0';
            logoContainer.style.marginRight = 'auto';
        }
    }
}