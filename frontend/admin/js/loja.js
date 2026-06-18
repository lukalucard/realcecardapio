document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacaoAbas();
    inicializarPreviewVisualMotor();
    carregarDadosSalvosLoja();
    configurarPersistenciaLoja();
});

/**
 * 1. GERENCIADOR DE SUBMENUS (Muda entre Cadastro e Personalização)
 */
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

/**
 * 2. MOTOR DE PREVIEW (Controla arquivos locais e mudanças de cores instantâneas)
 */
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
                
                // Armazena temporariamente em Base64 para simular o banco
                const reader = new FileReader();
                reader.onload = function(event) {
                    localStorage.setItem('loja_banner_img', event.target.result);
                    localStorage.removeItem('loja_banner_tipo_cor');
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    if (colorPickerBannerSolido) {
        colorPickerBannerSolido.addEventListener('input', (e) => {
            areaBannerPreview.style.backgroundImage = 'none';
            areaBannerPreview.style.backgroundColor = e.target.value;
            areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
            localStorage.setItem('loja_banner_tipo_cor', e.target.value);
            localStorage.removeItem('loja_banner_img');
        });
    }

    if (inputLogo) {
        inputLogo.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const linkBlob = URL.createObjectURL(e.target.files[0]);
                areaLogoPreview.innerHTML = `<img src="${linkBlob}" style="width: 100%; height: 100%; object-fit: cover;">`;
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    localStorage.setItem('loja_logo_img', event.target.result);
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    botoesPosicao.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesPosicao.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            localStorage.setItem('loja_logo_posicao', btn.getAttribute('data-pos'));
        });
    });
}

/**
 * 3. CONFIGURAR PERSISTÊNCIA DOS BOTÕES DE SALVAR
 */
/**
 * 3. CONFIGURAR PERSISTÊNCIA DOS BOTÕES DE SALVAR (COM TRAVA DE SEGURANÇA)
 */
function configurarPersistenciaLoja() {
    const btnSalvarCadastro = document.querySelector('#secao-cadastro .btn-primary-lg');
    const btnSalvarVisual = document.querySelector('#secao-visual .btn-primary-lg');
    
    // Puxa o passaporte de visitante direto do armazenamento
    const isGuest = localStorage.getItem('guestMode') === 'true';

    if (btnSalvarCadastro) {
        btnSalvarCadastro.addEventListener('click', () => {
            // TRAVA ATIVA: Impede o visitante de salvar dados institucionais
            if (isGuest) {
                alert('🔒 Funcionalidade Bloqueada! Entre ou cadastre uma conta gratuita para liberar!');
                return;
            }

            localStorage.setItem('loja_nome', document.getElementById('loja-nome').value);
            localStorage.setItem('loja_slogan', document.getElementById('loja-slogan').value);
            localStorage.setItem('loja_taxa', document.getElementById('loja-taxa').value);
            localStorage.setItem('loja_tempo', document.getElementById('loja-tempo').value);
            localStorage.setItem('loja_status', document.getElementById('loja-status').value);
            alert('✅ Dados Institucionais salvos! Pronto para carregar na vitrine.');
        });
    }

    if (btnSalvarVisual) {
        btnSalvarVisual.addEventListener('click', () => {
            // TRAVA ATIVA: Impede o visitante de alterar o branding do site
            if (isGuest) {
                alert('🔒 Branding Bloqueado! Para aplicar as cores e logomarca da sua açaiteria na vitrine real, entre ou cadastre uma conta gratuita para liberar.');
                return;
            }

            localStorage.setItem('loja_cor_primaria', document.getElementById('color-primary').value);
            localStorage.setItem('loja_cor_secundaria', document.getElementById('color-secondary').value);
            localStorage.setItem('loja_cor_fundo', document.getElementById('color-bg').value);
            alert('🎨 Identidade Visual aplicada com sucesso!');
        });
    }
}

/**
 * 4. CARREGAR DADOS SALVOS DO CACHE (LÊ O ESTADO ANTERIOR)
 */
function carregarDadosSalvosLoja() {
    if (localStorage.getItem('loja_nome')) document.getElementById('loja-nome').value = localStorage.getItem('loja_nome');
    if (localStorage.getItem('loja_slogan')) document.getElementById('loja-slogan').value = localStorage.getItem('loja_slogan');
    if (localStorage.getItem('loja_taxa')) document.getElementById('loja-taxa').value = localStorage.getItem('loja_taxa');
    if (localStorage.getItem('loja_tempo')) document.getElementById('loja-tempo').value = localStorage.getItem('loja_tempo');
    if (localStorage.getItem('loja_status')) document.getElementById('loja-status').value = localStorage.getItem('loja_status');
    
    if (localStorage.getItem('loja_cor_primaria')) document.getElementById('color-primary').value = localStorage.getItem('loja_cor_primaria');
    if (localStorage.getItem('loja_cor_secundaria')) document.getElementById('color-secondary').value = localStorage.getItem('loja_cor_secundaria');
    if (localStorage.getItem('loja_cor_fundo')) document.getElementById('color-bg').value = localStorage.getItem('loja_cor_fundo');

    // Carregar previews guardados
    const areaBannerPreview = document.getElementById('preview-banner');
    if (localStorage.getItem('loja_banner_tipo_cor')) {
        areaBannerPreview.style.backgroundColor = localStorage.getItem('loja_banner_tipo_cor');
        areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
    } else if (localStorage.getItem('loja_banner_img')) {
        areaBannerPreview.style.backgroundImage = `url(${localStorage.getItem('loja_banner_img')})`;
        areaBannerPreview.style.backgroundSize = 'cover';
        areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
    }

    if (localStorage.getItem('loja_logo_img')) {
        document.getElementById('preview-logo').innerHTML = `<img src="${localStorage.getItem('loja_logo_img')}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    if (localStorage.getItem('loja_logo_posicao')) {
        const botoesPosicao = document.querySelectorAll('.pos-btn');
        botoesPosicao.forEach(b => {
            b.classList.remove('active');
            if (b.getAttribute('data-pos') === localStorage.getItem('loja_logo_posicao')) {
                b.classList.add('active');
            }
        });
    }
}