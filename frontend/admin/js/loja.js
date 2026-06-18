document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacaoAbas();
    inicializarPreviewVisualMotor();
});

document.addEventListener('DOMContentLoaded', () => {
    // Executa a trava preventiva na loja
    travarFormularioLoja();
});

function travarFormularioLoja() {
    const isGuest = localStorage.getItem('guestMode') === 'true';
    if (!isGuest) return;

    const principalContent = document.querySelector('.cardapio-main-content');
    if (!principalContent) return;

    principalContent.addEventListener('click', (e) => {
        // Ignora os cliques caso o usuário esteja apenas alternando entre as abas superiores
        if (e.target.classList.contains('tab-btn')) return;

        e.preventDefault();
        e.stopPropagation();
        if (document.activeElement) document.activeElement.blur();

        mostrarAlertaVisitante(
            '🎨 Branding Bloqueado! Para aplicar as cores e logomarca da sua açaiteria na vitrine real, entre ou cadastre uma conta gratuita para liberar.', 
            'fas fa-palette'
        );
    }, true);
}

/**
 * 1. GERENCIADOR DE SUBMENUS (Muda entre Cadastro e Personalização)
 */
function inicializarNavegacaoAbas() {
    const botoesTabs = document.querySelectorAll('.tab-btn');
    const paineisConteudo = document.querySelectorAll('.tab-pane');

    botoesTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const alvoID = btn.getAttribute('data-target');

            // Remove a classe ativa de todos os botões e painéis
            botoesTabs.forEach(b => b.classList.remove('active'));
            paineisConteudo.forEach(p => p.classList.remove('active'));

            // Aplica o estado ativo no submenu clicado
            btn.classList.add('active');
            document.getElementById(alvoID).classList.add('active');
        });
    });
}

/**
 * 2. MOTOR DE PREVIEW (Controla arquivos locais e mudanças de cores instantâneas)
 */
function inicializarPreviewVisualMotor() {
    const inputBanner = document.getElementById('input-banner');
    const areaBannerPreview = document.getElementById('preview-banner');
    const colorPickerBannerSólido = document.getElementById('banner-solid-color');
    const inputLogo = document.getElementById('input-logo');
    const areaLogoPreview = document.getElementById('preview-logo');
    const botoesPosicao = document.querySelectorAll('.pos-btn');

    // Escuta upload do arquivo de Banner do computador do gestor
    if (inputBanner) {
        inputBanner.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const linkBlob = URL.createObjectURL(e.target.files[0]);
                areaBannerPreview.style.backgroundImage = `url(${linkBlob})`;
                areaBannerPreview.style.backgroundSize = 'cover';
                areaBannerPreview.style.backgroundPosition = 'center';
                areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
            }
        });
    }

    // Altera o banner dinamicamente se o usuário escolher uma cor sólida
    if (colorPickerBannerSólido) {
        colorPickerBannerSólido.addEventListener('input', (e) => {
            areaBannerPreview.style.backgroundImage = 'none';
            areaBannerPreview.style.backgroundColor = e.target.value;
            areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
        });
    }

    // Escuta upload do logotipo
    if (inputLogo) {
        inputLogo.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const linkBlob = URL.createObjectURL(e.target.files[0]);
                areaLogoPreview.innerHTML = `<img src="${linkBlob}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        });
    }

    // Gerencia a seleção visual dos botões de posicionamento da logo
    botoesPosicao.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesPosicao.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}