/* ==========================================================================
   ESTADO GLOBAL DO SISTEMA (Carrega do cache local se existir)
   ========================================================================== */
let categoriasSalvas = JSON.parse(localStorage.getItem('realce_categorias')) || []; 
let produtosSalvos = JSON.parse(localStorage.getItem('realce_produtos')) || []; 
let categoriaEmEdicao = null; 

document.addEventListener('DOMContentLoaded', () => {
    inicializarAbasDoSistema();
    inicializarControleCategorias();
    inicializarGerenciadorIngredientes();
    inicializarConstrutorOpcionais();
    inicializarMotorFotosGaleria(); 
    inicializarEnvioFormulario();
    inicializarControleDesignCardapio();
    
    renderizarSelectCategorias();
});

document.addEventListener('DOMContentLoaded', () => {
    // Executa a trava preventiva logo que a página carrega
    travarFormularioCardapio();
});

function travarFormularioCardapio() {
    const isGuest = localStorage.getItem('guestMode') === 'true';
    if (!isGuest) return;

    const formulario = document.querySelector('.cardapio-form-grid');
    if (!formulario) return;

    // Captura qualquer tentativa de clique ou foco nos campos do formulário
    formulario.addEventListener('click', (e) => {
        // Impede qualquer ação nativa no formulário
        e.preventDefault();
        e.stopPropagation();
        
        // Desfoca qualquer campo que tenha pego foco indesejado
        if (document.activeElement) document.activeElement.blur();

        mostrarAlertaVisitante(
            '🔒 Cadastro Negado! Você está no Modo de Teste. Entre ou cadastre uma conta para montar o seu cardápio personalizado!', 
            'fas fa-utensils'
        );
    }, true); // O 'true' garante que o clique seja pego logo na descida do evento
}

function salvarEstadoNoCache() {
    localStorage.setItem('realce_categorias', JSON.stringify(categoriasSalvas));
    localStorage.setItem('realce_produtos', JSON.stringify(produtosSalvos));
}

/* ==========================================================================
   1. GERENCIADOR DE ABAS
   ========================================================================== */
function inicializarAbasDoSistema() {
    const btnMenu = document.getElementById('tab-menu');
    const btnPreview = document.getElementById('tab-preview');
    const btnDesign = document.getElementById('tab-design');
    
    const contentMenu = document.getElementById('content-menu');
    const contentPreview = document.getElementById('content-preview');
    const contentDesign = document.getElementById('content-design');

    if (!btnMenu || !btnPreview || !btnDesign) return;

    btnMenu.addEventListener('click', () => {
        alternarAbas(btnMenu, [btnPreview, btnDesign], contentMenu, [contentPreview, contentDesign]);
    });

    btnPreview.addEventListener('click', () => {
        alternarAbas(btnPreview, [btnMenu, btnDesign], contentPreview, [contentMenu, contentDesign]);
        renderizarPreviewCardapioReal();
    });

    btnDesign.addEventListener('click', () => {
        btnDesign.classList.add('active');
        [btnMenu, btnPreview].forEach(b => b.classList.remove('active'));
        contentDesign.classList.remove('hidden');
        contentMenu.classList.add('hidden');
        contentPreview.classList.add('hidden');
    });

    function alternarAbas(abaAtiva, abasInativas, conteudoAtivo, conteudosInativos) {
        abaAtiva.classList.add('active');
        abasInativas.forEach(b => b.classList.remove('active'));
        conteudoAtivo.classList.remove('hidden');
        conteudosInativos.forEach(c => c.classList.add('hidden'));
    }
}

/* ==========================================================================
   2. GERENCIADOR DE CATEGORIAS
   ========================================================================== */
function inicializarControleCategorias() {
    const holderSugestoes = document.querySelector('.suggestions-holder');
    const inputCategoria = document.getElementById('input-nova-categoria');
    const btnConfirmar = document.getElementById('btn-add-categoria');
    const btnEditar = document.getElementById('btn-edit-categoria');
    const btnDeletar = document.getElementById('btn-delete-categoria');

    if (!holderSugestoes || !inputCategoria || !btnConfirmar) return;

    holderSugestoes.addEventListener('click', (e) => {
        const btnSugestao = e.target.closest('.badge-suggestion');
        if (btnSugestao) {
            e.preventDefault();
            inputCategoria.value = btnSugestao.textContent.trim();
            inputCategoria.focus();
        }
    });

    btnConfirmar.addEventListener('click', (e) => {
        e.preventDefault();
        const nomeCategoria = inputCategoria.value.trim();

        if (nomeCategoria === "") {
            alert("Por favor, informe um nome para a categoria antes de confirmar.");
            return;
        }

        if (categoriaEmEdicao !== null) {
            const index = categoriasSalvas.indexOf(categoriaEmEdicao);
            if (index !== -1) {
                categoriasSalvas[index] = nomeCategoria;
            }
            produtosSalvos.forEach(p => {
                if (p.categoria === categoriaEmEdicao) p.categoria = nomeCategoria;
            });
            categoriaEmEdicao = null;
            btnConfirmar.textContent = "Confirmar";
            document.getElementById('label-acao-categoria').textContent = "Criar categorias";
        } else {
            if (categoriasSalvas.includes(nomeCategoria)) {
                alert("Esta categoria já existe!");
                return;
            }
            categoriasSalvas.push(nomeCategoria);
        }

        inputCategoria.value = "";
        salvarEstadoNoCache();
        renderizarSelectCategorias();
    });

    if (btnEditar) {
        btnEditar.addEventListener('click', (e) => {
            e.preventDefault();
            const selectActive = document.querySelector('.category-lits-item select');
            if (!selectActive) return;
            const valorSelecionado = selectActive.value;

            if (!valorSelecionado || valorSelecionado === "") {
                alert("Selecione uma categoria válida no dropdown para configurar.");
                return;
            }

            inputCategoria.value = valorSelecionado;
            categoriaEmEdicao = valorSelecionado;
            btnConfirmar.textContent = "Salvar Alteração";
            document.getElementById('label-acao-categoria').textContent = "Editando categoria";
            inputCategoria.focus();
        });
    }

    if (btnDeletar) {
        btnDeletar.addEventListener('click', (e) => {
            e.preventDefault();
            const selectActive = document.querySelector('.category-lits-item select');
            if (!selectActive) return;
            const valorSelecionado = selectActive.value;

            if (!valorSelecionado || valorSelecionado === "") {
                alert("Selecione uma categoria válida para deletar.");
                return;
            }

            if (confirm(`Deseja realmente remover a categoria "${valorSelecionado}"?`)) {
                categoriasSalvas = categoriasSalvas.filter(cat => cat !== valorSelecionado);
                produtosSalvos = produtosSalvos.filter(p => p.categoria !== valorSelecionado);
                if (categoriaEmEdicao === valorSelecionado) {
                    categoriaEmEdicao = null;
                    btnConfirmar.textContent = "Confirmar";
                    document.getElementById('label-acao-categoria').textContent = "Criar categorias";
                    inputCategoria.value = "";
                }
                salvarEstadoNoCache();
                renderizarSelectCategorias();
            }
        });
    }
}

function renderizarSelectCategorias() {
    const selectGerencia = document.querySelector('.category-lits-item select');
    const selectFormulario = document.getElementById('prod-select-vinculo');
    const wrapperAtivas = document.getElementById('wrapper-categorias-ativas');
    
    if (!wrapperAtivas) return;

    if (categoriasSalvas.length === 0) {
        wrapperAtivas.classList.add('hidden');
        if (selectGerencia) selectGerencia.innerHTML = "";
        if (selectFormulario) selectFormulario.innerHTML = `<option value="">Crie uma categoria primeiro</option>`;
        return;
    }

    wrapperAtivas.classList.remove('hidden');

    if (selectGerencia) {
        selectGerencia.innerHTML = "";
        categoriasSalvas.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectGerencia.appendChild(option);
        });
    }

    if (selectFormulario) {
        selectFormulario.innerHTML = "";
        categoriasSalvas.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectFormulario.appendChild(option);
        });
    }
}

/* ==========================================================================
   3. NOVO MOTOR DE FOTOS DA GALERIA
   ========================================================================== */
function inicializarMotorFotosGaleria() {
    const container = document.getElementById('container-imagens-inputs');
    const btnAddSlot = document.getElementById('btn-add-foto-slot');

    if (!container || !btnAddSlot) return;

    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('input-prod-foto')) {
            const input = e.target;
            const boxPai = input.closest('.image-upload-box');
            const previewSlot = boxPai.querySelector('.preview-slot');

            if (input.files && input.files[0]) {
                const urlBlob = URL.createObjectURL(input.files[0]);
                previewSlot.innerHTML = `
                    <img src="${urlBlob}">
                    <button type="button" class="remove-photo-badge">&times;</button>
                `;
                previewSlot.classList.remove('hidden');
            }
        }
    });

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-photo-badge')) {
            e.preventDefault();
            const boxPai = e.target.closest('.image-upload-box');
            const input = boxPai.querySelector('input[type="file"]');
            const previewSlot = boxPai.querySelector('.preview-slot');

            input.value = ""; 
            previewSlot.innerHTML = "";
            previewSlot.classList.add('hidden');
        }
    });

    btnAddSlot.addEventListener('click', (e) => {
        e.preventDefault();
        const totalSlots = container.querySelectorAll('.image-upload-box').length;

        if (totalSlots >= 5) {
            alert("Limite máximo atingido! O sistema permite até 5 imagens por produto.");
            return;
        }

        const proximoIndex = totalSlots + 1;
        const novoSlot = document.createElement('div');
        novoSlot.className = 'image-upload-box';
        novoSlot.innerHTML = `
            <label for="prod-imagem-${proximoIndex}" class="custom-file-upload">
                <i class="fas fa-camera"></i>
                <span>Foto ${proximoIndex}</span>
            </label>
            <input type="file" id="prod-imagem-${proximoIndex}" class="input-prod-foto" accept="image/*">
            <div class="preview-slot hidden"></div>
        `;
        container.appendChild(novoSlot);
    });
}

/* ==========================================================================
   4. CHIPS DE INGREDIENTES
   ========================================================================== */
function inicializarGerenciadorIngredientes() {
    const input = document.getElementById('input-ingrediente');
    const btnAdd = document.getElementById('btn-add-ingrediente');
    const container = document.getElementById('container-ingredientes-chips');

    if (!input || !btnAdd || !container) return;

    function adicionarChip() {
        const texto = input.value.trim();
        if (texto === "") return;

        const chip = document.createElement('div');
        chip.className = 'ingredient-chip';
        chip.innerHTML = `${texto} <i class="fas fa-times-circle btn-remove-chip"></i>`;
        
        container.appendChild(chip);
        input.value = "";
        input.focus();
    }

    btnAdd.addEventListener('click', adicionarChip);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            adicionarChip();
        }
    });

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-chip')) {
            e.target.closest('.ingredient-chip').remove();
        }
    });
}

/* ==========================================================================
   5. CONSTRUTOR DE OPCIONAIS
   ========================================================================== */
function inicializarConstrutorOpcionais() {
    const builderContainer = document.querySelector('.product-optionals-builder');
    if (!builderContainer) return;

    builderContainer.addEventListener('click', (e) => {
        const btnAddItem = e.target.closest('.btn-secondary-sm');
        if (btnAddItem) {
            e.preventDefault();
            const tabelaItens = btnAddItem.closest('.optional-items-table');
            const novaLinha = document.createElement('div');
            novaLinha.className = 'opt-item-row';
            novaLinha.innerHTML = `
                <input type="text" placeholder="Ex: Queijo Extra">
                <input type="number" step="0.01" placeholder="0.00">
                <button type="button" class="btn-text-delete"><i class="fas fa-times"></i></button>
            `;
            tabelaItens.insertBefore(novaLinha, btnAddItem);
        }

        const btnDelete = e.target.closest('.btn-text-delete');
        if (btnDelete) {
            e.preventDefault();
            btnDelete.closest('.opt-item-row').remove();
        }

        const btnNewGroup = e.target.closest('.btn-secondary');
        if (btnNewGroup && !btnNewGroup.classList.contains('btn-secondary-sm')) {
            e.preventDefault();
            const novoGrupo = document.createElement('div');
            novoGrupo.className = 'optional-group-card';
            novoGrupo.innerHTML = `
                <div class="opt-group-header">
                    <input type="text" class="input-inline" placeholder="Nome do Grupo">
                    <div class="opt-rules"><label>Min:</label> <input type="number" value="0"><label>Max:</label> <input type="number" value="1"></div>
                </div>
                <div class="optional-items-table">
                    <div class="opt-item-row">
                        <input type="text" placeholder="Opção 1"><input type="number" step="0.01" placeholder="0.00"><button type="button" class="btn-text-delete"><i class="fas fa-times"></i></button>
                    </div>
                    <button type="button" class="btn-secondary-sm"><i class="fas fa-plus"></i> Adicionar Item Extra</button>
                </div>
            `;
            builderContainer.insertBefore(novoGrupo, btnNewGroup);
        }
    });
}

/* ==========================================================================
   6. ENVIO E ARMAZENAMENTO DO FORMULÁRIO (CONVERSÃO BASE64 CONTROLADA)
   ========================================================================== */
function inicializarEnvioFormulario() {
    const formulario = document.querySelector('.cardapio-form-grid');
    if (!formulario) return;

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputNome = document.getElementById('prod-nome');
        const inputPreco = document.getElementById('prod-preco');
        const selectCategoria = document.getElementById('prod-select-vinculo');

        if (!inputNome || !inputPreco || !selectCategoria) return;

        const nome = inputNome.value.trim();
        const preco = parseFloat(inputPreco.value || 0).toFixed(2);
        const categoria = selectCategoria.value;

        if (!categoria || categoria === "") {
            alert("Por favor, crie e selecione uma categoria válida para o produto.");
            return;
        }

        const inputsFotos = formulario.querySelectorAll('.input-prod-foto');
        const listaImagensSalvas = [];

        // Converte as fotos para base64 para persistir no localstorage provisório
        for (let input of inputsFotos) {
            if (input.files && input.files[0]) {
                const base64 = await converterFileToBase64(input.files[0]);
                listaImagensSalvas.push(base64);
            }
        }

        const chips = document.querySelectorAll('.ingredient-chip');
        const listaIngredientes = [];
        chips.forEach(chip => {
            listaIngredientes.push(chip.textContent.replace('×', '').trim());
        });

        const gruposOpcionais = [];
        const cartoesGrupo = formulario.querySelectorAll('.optional-group-card');

        cartoesGrupo.forEach((cartao) => {
            const nomeGrupo = cartao.querySelector('.input-inline').value;
            const min = cartao.querySelectorAll('.opt-rules input')[0].value;
            const max = cartao.querySelectorAll('.opt-rules input')[1].value;

            const itensDoGrupo = [];
            const linhasItens = cartao.querySelectorAll('.opt-item-row');
            
            linhasItens.forEach((linha) => {
                const inputs = linha.querySelectorAll('input'); 
                if (inputs[0] && inputs[0].value) {
                    itensDoGrupo.push({
                        nome_adicional: inputs[0].value,
                        preco_adicional: parseFloat(inputs[1].value || 0).toFixed(2)
                    });
                }
            });

            if (nomeGrupo) {
                gruposOpcionais.push({
                    nome_grupo: nomeGrupo,
                    minimo: min,
                    maximo: max,
                    itens: itensDoGrupo
                });
            }
        });

        const novoProduto = {
            id: Date.now(),
            nome: nome,
            preco: preco,
            categoria: categoria,
            imagens: listaImagensSalvas, 
            ingredientes: listaIngredientes.join(', '),
            opcionais: gruposOpcionais
        };

        produtosSalvos.push(novoProduto); 
        salvarEstadoNoCache();
        alert(`Sucesso! "${nome}" adicionado com êxito ao seu cardápio.`);

        formulario.reset();
        document.getElementById('container-ingredientes-chips').innerHTML = "";
        
        const containerGaleria = document.getElementById('container-imagens-inputs');
        containerGaleria.innerHTML = `
            <div class="image-upload-box">
                <label for="prod-imagem-1" class="custom-file-upload">
                    <i class="fas fa-camera"></i>
                    <span>Foto 1</span>
                </label>
                <input type="file" id="prod-imagem-1" class="input-prod-foto" accept="image/*">
                <div class="preview-slot hidden"></div>
            </div>
        `;
    });
}

function converterFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

/* ==========================================================================
   7. RENDERIZAÇÃO DA VITRINE SIMULADA LIVE
   ========================================================================== */
function renderizarPreviewCardapioReal() {
    const containerVitrine = document.querySelector('.mock-client-menu-view');
    if (!containerVitrine) return;

    containerVitrine.innerHTML = "";

    if (produtosSalvos.length === 0) {
        containerVitrine.innerHTML = `<p style="text-align: center; color: #9ca3af; padding: 40px 20px; font-style: italic;">Nenhum produto cadastrado na sua conta. Monte itens para vê-los aqui!</p>`;
        return;
    }

    categoriasSalvas.forEach(categoria => {
        const produtosDaCategoria = produtosSalvos.filter(p => p.categoria === categoria);

        if (produtosDaCategoria.length > 0) {
            const blocoCategoria = document.createElement('div');
            blocoCategoria.className = 'mock-category-block';
            blocoCategoria.style.marginBottom = '24px';
            blocoCategoria.innerHTML = `<h4 class="mock-cat-title">${categoria}</h4>`;

            const listaCards = document.createElement('div');
            listaCards.className = 'mock-products-list';

            produtosDaCategoria.forEach(produto => {
                const card = document.createElement('div');
                card.className = 'mock-product-card';

                const containerImagem = (produto.imagens && produto.imagens.length > 0)
                    ? `<img src="${produto.imagens[0]}" alt="${produto.nome}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                    : `<i class="fas ${categoria.toLowerCase().includes('bebida') ? 'fa-glass-cheers' : 'fa-hamburger'}"></i>`;

                card.innerHTML = `
                    <div class="mock-card-details">
                        <h5>${produto.nome}</h5>
                        <p>${produto.ingredientes || 'Sem ingredientes base.'}</p>
                        <span class="mock-price">R$ ${produto.preco}</span>
                    </div>
                    <div class="mock-card-img">
                        ${containerImagem}
                    </div>
                `;
                listaCards.appendChild(card);
            });

            blocoCategoria.appendChild(listaCards);
            containerVitrine.appendChild(blocoCategoria);
        }
    });
}

/* ==========================================================================
   8. ABA DE DESIGN E LAYOUT DO CARDÁPIO EXTERNO
   ========================================================================== */
function inicializarControleDesignCardapio() {
    const secaoDesign = document.getElementById('content-design');
    if (!secaoDesign) return;

    const inputCorPrincipal = secaoDesign.querySelectorAll('input[type="color"]')[0];
    const inputCorFundo = secaoDesign.querySelectorAll('input[type="color"]')[1];
    const btnSalvarDesign = secaoDesign.querySelector('button[type="button"]');

    // Carrega layout anterior do design do cache
    if (localStorage.getItem('realce_design_principal')) inputCorPrincipal.value = localStorage.getItem('realce_design_principal');
    if (localStorage.getItem('realce_design_fundo')) inputCorFundo.value = localStorage.getItem('realce_design_fundo');
    
    const estiloSalvo = localStorage.getItem('realce_design_layout') || 'lista';
    const radios = secaoDesign.querySelectorAll('input[type="radio"]');
    if (estiloSalvo === 'grade' && radios[1]) radios[1].checked = true;

    if (btnSalvarDesign) {
        btnSalvarDesign.addEventListener('click', () => {
            const layoutSelecionado = radios[0].checked ? 'lista' : 'grade';
            localStorage.setItem('realce_design_principal', inputCorPrincipal.value);
            localStorage.setItem('realce_design_fundo', inputCorFundo.value);
            localStorage.setItem('realce_design_layout', layoutSelecionado);
            alert('🎨 Configurações de Design e Layout do cardápio salvas para o cliente!');
        });
    }
}