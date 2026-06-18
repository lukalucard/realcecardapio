document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacaoAbas();
    inicializarPreviewVisualMotor();
    carregarDadosSalvosLoja();
    configurarPersistenciaLoja();
    travarFormularioLoja(); // Só vai agir se for Guest!
});

function travarFormularioLoja() {
    let isGuest = false;
    try {
        isGuest = localStorage.getItem('guestMode') === 'true';
    } catch (e) {
        isGuest = false; // Se o navegador bloquear, não trava o desenvolvedor
    }

    if (!isGuest) {
        // Garante que se NÃO for guest, as travas fiquem escondidas de verdade
        const aviso = document.getElementById('aviso-loja-guest');
        const pelicula = document.getElementById('pelicula-loja');
        if (aviso) aviso.classList.add('hidden');
        if (pelicula) pelicula.classList.add('hidden');
        document.querySelector('.wrapper-conteudo-travado').style.opacity = '1';
        return;
    }

    document.getElementById('aviso-loja-guest').classList.remove('hidden');
    document.getElementById('pelicula-loja').classList.remove('hidden');
    document.querySelector('.wrapper-conteudo-travado').style.opacity = '0.6';
}

function configurarPersistenciaLoja() {
    const btnCriarLoja = document.getElementById('btn-criar-loja');
    const btnSalvarVisual = document.getElementById('btn-salvar-visual');

    if (btnCriarLoja) {
        btnCriarLoja.addEventListener('click', () => {
            localStorage.setItem('loja_nome', document.getElementById('loja-nome').value);
            localStorage.setItem('loja_slogan', document.getElementById('loja-slogan').value);
            localStorage.setItem('loja_telefone', document.getElementById('loja-telefone').value);
            localStorage.setItem('loja_horario', document.getElementById('loja-horario').value);
            localStorage.setItem('loja_endereco', document.getElementById('loja-endereco').value);
            localStorage.setItem('loja_taxa', document.getElementById('loja-taxa').value);
            localStorage.setItem('loja_tempo', document.getElementById('loja-tempo').value);
            localStorage.setItem('loja_status', document.getElementById('loja-status').value);
            
            alert('🏪 Loja Criada com Sucesso! Seu Cardápio agora está liberado para cadastro.');
        });
    }

    if (btnSalvarVisual) {
        btnSalvarVisual.addEventListener('click', () => {
            localStorage.setItem('loja_cor_primaria', document.getElementById('color-primary').value);
            localStorage.setItem('loja_cor_secundaria', document.getElementById('color-secondary').value);
            localStorage.setItem('loja_cor_fundo', document.getElementById('color-bg').value);
            alert('🎨 Identidade Visual aplicada com sucesso!');
        });
    }
}

function carregarDadosSalvosLoja() {
    if (localStorage.getItem('loja_nome')) document.getElementById('loja-nome').value = localStorage.getItem('loja_nome');
    if (localStorage.getItem('loja_slogan')) document.getElementById('loja-slogan').value = localStorage.getItem('loja_slogan');
    if (localStorage.getItem('loja_telefone')) document.getElementById('loja-telefone').value = localStorage.getItem('loja_telefone');
    if (localStorage.getItem('loja_horario')) document.getElementById('loja-horario').value = localStorage.getItem('loja_horario');
    if (localStorage.getItem('loja_endereco')) document.getElementById('loja-endereco').value = localStorage.getItem('loja_endereco');
    if (localStorage.getItem('loja_taxa')) document.getElementById('loja-taxa').value = localStorage.getItem('loja_taxa');
    if (localStorage.getItem('loja_tempo')) document.getElementById('loja-tempo').value = localStorage.getItem('loja_tempo');
    if (localStorage.getItem('loja_status')) document.getElementById('loja-status').value = localStorage.getItem('loja_status');
    
    if (localStorage.getItem('loja_cor_primaria')) document.getElementById('color-primary').value = localStorage.getItem('loja_cor_primaria');
    if (localStorage.getItem('loja_cor_secundaria')) document.getElementById('color-secondary').value = localStorage.getItem('loja_cor_secundaria');
    if (localStorage.getItem('loja_cor_fundo')) document.getElementById('color-bg').value = localStorage.getItem('loja_cor_fundo');
}

function inicializarNavegacaoAbas() {
    const botoesTabs = document.querySelectorAll('.tab-btn');
    const paineisConteudo = document.querySelectorAll('.tab-pane');

    botoesTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const alvoID = btn.getAttribute('data-target');
            botoesTabs.forEach(b => b.classList.remove('active'));
            paineisConteudo.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(alvoID).classList.add('active');
        });
    });
}

function inicializarPreviewVisualMotor() {
    const inputBanner = document.getElementById('input-banner');
    const areaBannerPreview = document.getElementById('preview-banner');
    const colorPickerBannerSolido = document.getElementById('banner-solid-color');
    const inputLogo = document.getElementById('input-logo');
    const areaLogoPreview = document.getElementById('preview-logo');
    const botoesPosicao = document.querySelectorAll('.pos-btn');

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

    if (colorPickerBannerSolido) {
        colorPickerBannerSolido.addEventListener('input', (e) => {
            areaBannerPreview.style.backgroundImage = 'none';
            areaBannerPreview.style.backgroundColor = e.target.value;
            areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
        });
    }

    if (inputLogo) {
        inputLogo.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const linkBlob = URL.createObjectURL(e.target.files[0]);
                areaLogoPreview.innerHTML = `<img src="${linkBlob}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        });
    }

    botoesPosicao.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesPosicao.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}