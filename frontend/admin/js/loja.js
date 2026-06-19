/* ==========================================================================
   ESTADO GLOBAL DA DASHBOARD MULTILOJAS
   ========================================================================== */
let lojasCadastradas = JSON.parse(localStorage.getItem('realce_lista_lojas')) || [];
let lojaEmEdicaoId = null; // Controla se estamos criando uma nova ou editando uma antiga

document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacaoAbas();
    inicializarPreviewVisualMotor();
    configurarFluxoFormularioLoja();
    renderizarMiniaturasDashboard();
});

/* ==========================================================================
   1. RENDERIZADOR DOS CARDS EM MINIATURA (DASHBOARD)
   ========================================================================== */
function renderizarMiniaturasDashboard() {
    const container = document.getElementById('container-miniaturas-lojas');
    if (!container) return;

    container.innerHTML = "";

    if (lojasCadastradas.length === 0) {
        container.innerHTML = `
            <div class="msg-lista-vazia">
                <i class="fas fa-store-slash" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                Você ainda não possui lojas cadastradas. Clique no botão abaixo para começar!
            </div>
        `;
        return;
    }

    lojasCadastradas.forEach(loja => {
        const card = document.createElement('div');
        card.className = 'loja-card-miniatura';
        
        // Se houver logo em Base64 salva, usa ela. Senão, mantém o ícone padrão.
        const logotipo = loja.logoImg 
            ? `<img src="${loja.logoImg}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
            : `<i class="fas fa-store"></i>`;

        // Transforma o nome da loja em parâmetro amigável para a URL
        const nomeSlug = encodeCalmSlug(loja.nome);

        card.innerHTML = `
            <div class="icon-box-card" style="background: ${loja.corPrimaria || '#6B3FA0'}">
                ${logotitulo = logotipo}
            </div>
            <h4>${loja.nome}</h4>
            <p>${loja.slogan || 'Sem slogan cadastrado'}</p>
            <a href="../cardapio-online.html?loja=${nomeSlug}" target="_blank" class="btn-abrir-vitrine-link">
                Ver Vitrine Online <i class="fas fa-external-link-alt" style="font-size:0.7rem;"></i>
            </a>
        `;

        // Se o gestor clicar no card (fora do link de ver vitrine), abre o modo de edição
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-abrir-vitrine-link') || e.target.closest('.btn-abrir-vitrine-link')) {
                return; // Deixa o link abrir em outra aba normalmente
            }
            carregarLojaParaEdicao(loja.id);
        });

        container.appendChild(card);
    });
}

function encodeCalmSlug(texto) {
    return texto.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')           // Substitui espaços por -
        .replace(/[^\w\-]+/g, '')       // Remove caracteres especiais
        .replace(/\-\-+/g, '-');        // Remove múltiplos -
}

/* ==========================================================================
   2. CONTROLE DO FLUXO DO FORMULÁRIO (AVANÇAR E SALVAR)
   ========================================================================== */
function configurarFluxoFormularioLoja() {
    const btnIniciarNova = document.getElementById('btn-iniciar-nova-loja');
    const btnAvancarVisual = document.getElementById('btn-avancar-visual');
    const btnFinalizarLoja = document.getElementById('btn-finalizar-loja');

    // Botão inferior da Dashboard: "+ Criar Minha Loja"
    if (btnIniciarNova) {
        btnIniciarNova.addEventListener('click', () => {
            lojaEmEdicaoId = null; // Modo Criação
            document.querySelector('.loja-form').reset();
            resetPreviewsBranding();
            
            // Força a exibição da aba de cadastro e joga o usuário lá
            mudarAbaAtiva('tab-cadastro', 'secao-cadastro');
        });
    }

    // Botão no fim da Etapa 1: "Avançar para Personalização"
    if (btnAvancarVisual) {
        btnAvancarVisual.addEventListener('click', () => {
            const nomeLoja = document.getElementById('loja-nome').value.trim();
            if (!nomeLoja) {
                alert('⚠️ Por favor, informe ao menos o Nome do Restaurante.');
                return;
            }
            mudarAbaAtiva('tab-visual', 'secao-visual');
        });
    }

    // Botão final na Etapa 2: "Finalizar e Criar Loja"
    if (btnFinalizarLoja) {
        btnFinalizarLoja.addEventListener('click', () => {
            const areaBannerPreview = document.getElementById('preview-banner');
            const areaLogoPreview = document.getElementById('preview-logo');
            const posBtnAtivo = document.querySelector('.pos-btn.active');

            // Captura imagens em Base64 se existirem nos previews
            let bannerImgBase64 = areaBannerPreview.style.backgroundImage ? areaBannerPreview.style.backgroundImage.slice(5, -2).replace(/"/g, "") : "";
            let logoImgBase64 = areaLogoPreview.querySelector('img') ? areaLogoPreview.querySelector('img').src : "";

            const dadosLoja = {
                id: lojaEmEdicaoId || 'loja_' + Date.now(),
                nome: document.getElementById('loja-nome').value,
                slogan: document.getElementById('loja-slogan').value,
                telefone: document.getElementById('loja-telefone').value,
                horario: document.getElementById('loja-horario').value,
                endereco: document.getElementById('loja-endereco').value,
                taxa: document.getElementById('loja-taxa').value,
                tempo: document.getElementById('loja-tempo').value,
                status: document.getElementById('loja-status').value,
                
                // Branding
                corPrimaria: document.getElementById('color-primary').value,
                corSecundaria: document.getElementById('color-secondary').value,
                corFundo: document.getElementById('color-bg').value,
                bannerImg: bannerImgBase64,
                bannerCorSolida: document.getElementById('banner-solid-color').value,
                logoImg: logoImgBase64,
                logoPosicao: posBtnAtivo ? posBtnAtivo.getAttribute('data-pos') : 'left'
            };

            if (lojaEmEdicaoId) {
                // Atualiza loja existente
                const index = lojasCadastradas.findIndex(l => l.id === lojaEmEdicaoId);
                if (index !== -1) lojasCadastradas[index] = dadosLoja;
            } else {
                // Adiciona nova loja na esteira
                lojasCadastradas.push(dadosLoja);
            }

            // Salva a lista completa atualizada no storage
            localStorage.setItem('realce_lista_lojas', JSON.stringify(lojasCadastradas));
            
            alert('🎉 Excelente! Unidade configurada com sucesso.');
            
            // Limpa o fluxo, reconstrói a tela e volta para as miniaturas
            lojaEmEdicaoId = null;
            renderizarMiniaturasDashboard();
            mudarAbaAtiva('tab-vitrine', 'secao-vitrine');
            
            // Oculta novamente as abas de formulário da navegação superior
            document.getElementById('tab-cadastro').style.display = 'none';
            document.getElementById('tab-visual').style.display = 'none';
        });
    }
}

function mudarAbaAtiva(tabBotaoId, secaoPaneId) {
    const btn = document.getElementById(tabBotaoId);
    if (btn) {
        btn.style.display = 'inline-block'; // Torna visível temporariamente
        btn.click(); // Dispara o evento nativo de navegação
    }
}

function resetPreviewsBranding() {
    const areaBannerPreview = document.getElementById('preview-banner');
    areaBannerPreview.style.backgroundImage = 'none';
    areaBannerPreview.style.backgroundColor = '#f1f5f9';
    areaBannerPreview.querySelector('.overlay-msg').style.display = 'block';

    const areaLogoPreview = document.getElementById('preview-logo');
    areaLogoPreview.innerHTML = `<i class="fas fa-camera"></i><input type="file" id="input-logo" accept="image/*">`;
    inicializarPreviewVisualMotor(); // Re-amarra o listener do novo input gerado
}

function carregarLojaParaEdicao(idLoja) {
    const loja = lojasCadastradas.find(l => l.id === idLoja);
    if (!loja) return;

    lojaEmEdicaoId = idLoja;

    // Preenche Etapa 1
    document.getElementById('loja-nome').value = loja.nome;
    document.getElementById('loja-slogan').value = loja.slogan;
    document.getElementById('loja-telefone').value = loja.telefone;
    document.getElementById('loja-horario').value = loja.horario;
    document.getElementById('loja-endereco').value = loja.endereco;
    document.getElementById('loja-taxa').value = loja.taxa;
    document.getElementById('loja-tempo').value = loja.tempo;
    document.getElementById('loja-status').value = loja.status;

    // Preenche Etapa 2
    document.getElementById('color-primary').value = loja.corPrimaria;
    document.getElementById('color-secondary').value = loja.corSecundaria;
    document.getElementById('color-bg').value = loja.corFundo;
    document.getElementById('banner-solid-color').value = loja.bannerCorSolida || '#6B3FA0';

    const areaBannerPreview = document.getElementById('preview-banner');
    if (loja.bannerImg) {
        areaBannerPreview.style.backgroundImage = `url(${loja.bannerImg})`;
        areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
    } else if (loja.bannerCorSolida) {
        areaBannerPreview.style.backgroundColor = loja.bannerCorSolida;
        areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
    }

    const areaLogoPreview = document.getElementById('preview-logo');
    if (loja.logoImg) {
        areaLogoPreview.innerHTML = `<img src="${loja.logoImg}" style="width: 100%; height: 100%; object-fit: cover;"><input type="file" id="input-logo" accept="image/*" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; z-index:2;">`;
    }

    const botoesPosicao = document.querySelectorAll('.pos-btn');
    botoesPosicao.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-pos') === loja.logoPosicao) b.classList.add('active');
    });

    // Abre na tela na etapa de cadastro
    mudarAbaAtiva('tab-cadastro', 'secao-cadastro');
    document.getElementById('tab-visual').style.display = 'inline-block';
}

/* ==========================================================================
   3. SISTEMA REUTILIZÁVEL DE NAVEGAÇÃO DE ABAS (TABS)
   ========================================================================== */
function inicializarNavegacaoAbas() {
    const botoesTabs = document.querySelectorAll('.tab-btn');
    const paineisConteudo = document.querySelectorAll('.tab-pane');

    botoesTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const alvoID = btn.getAttribute('data-target');

            botoesTabs.forEach(b => b.classList.remove('active'));
            paineisConteudo.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const alvoElement = document.getElementById(alvoID);
            if (alvoElement) alvoElement.classList.add('active');
        });
    });
}

/* ==========================================================================
   4. MOTOR DE PREVIEWS DE ARQUIVOS LOCAIS
   ========================================================================== */
function inicializarPreviewVisualMotor() {
    const containerVisual = document.getElementById('secao-visual');
    if (!containerVisual) return;

    containerVisual.addEventListener('change', (e) => {
        // Monitora upload do Banner
        if (e.target.id === 'input-banner' && e.target.files && e.target.files[0]) {
            const areaBannerPreview = document.getElementById('preview-banner');
            const reader = new FileReader();
            reader.onload = function(event) {
                areaBannerPreview.style.backgroundImage = `url(${event.target.result})`;
                areaBannerPreview.style.backgroundSize = 'cover';
                areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
            };
            reader.readAsDataURL(e.target.files[0]);
        }

        // Monitora upload do Logotipo
        if (e.target.id === 'input-logo' && e.target.files && e.target.files[0]) {
            const areaLogoPreview = document.getElementById('preview-logo');
            const reader = new FileReader();
            reader.onload = function(event) {
                areaLogoPreview.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;"><input type="file" id="input-logo" accept="image/*" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; z-index:2;">`;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Monitora o seletor de cor sólida do banner
    const colorPickerBannerSolido = document.getElementById('banner-solid-color');
    if (colorPickerBannerSolido) {
        colorPickerBannerSolido.addEventListener('input', (e) => {
            const areaBannerPreview = document.getElementById('preview-banner');
            areaBannerPreview.style.backgroundImage = 'none';
            areaBannerPreview.style.backgroundColor = e.target.value;
            areaBannerPreview.querySelector('.overlay-msg').style.display = 'none';
        });
    }

    // Monitora a escolha de posições do logotipo
    const botoesPosicao = document.querySelectorAll('.pos-btn');
    botoesPosicao.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesPosicao.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}