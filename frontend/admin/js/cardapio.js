/* ==========================================================================
   ESTADO GLOBAL DO SISTEMA (Isolado por ID da loja gerenciada)
   ========================================================================== */
let lojasDisponiveis = JSON.parse(localStorage.getItem('realce_lista_lojas')) || [];
let lojaSelecionadaId = null;

let categoriasSalvas = []; 
let produtosSalvos = []; 
let categoriaEmEdicao = null;
let produtoEmEdicaoId = null; // Controla se o formulário está criando ou editando um produto 

document.addEventListener('DOMContentLoaded', () => {
    inicializarSeletorLojasSaaS();
    inicializarAbasDoSistema();
    inicializarControleCategorias();
    inicializarGerenciadorIngredientes();
    inicializarConstrutorOpcionais();
    inicializarMotorFotosGaleria(); 
    inicializarEnvioFormulario();
    inicializarControleDesignCardapio();
});

/* ==========================================================================
   MOTOR MULTILOJAS - TROCA DINÂMICA DE BANCO DE DADOS
   ========================================================================== */
function inicializarSeletorLojasSaaS() {
    const selectLojas = document.getElementById('prod-loja-vinculo');
    if (!selectLojas) return;

    if (lojasDisponiveis.length === 0) {
        selectLojas.innerHTML = `<option value="">Crie uma loja primeiro no painel Gestão de Loja</option>`;
        return;
    }

    selectLojas.innerHTML = "";
    lojasDisponiveis.forEach(loja => {
        const option = document.createElement('option');
        option.value = loja.id;
        option.textContent = loja.nome;
        selectLojas.appendChild(option);
    });

    // Pega por padrão a primeira loja da lista
    lojaSelecionadaId = selectLojas.value;
    carregarDadosDaLojaEspecifica();

    // Listener para carregar produtos e categorias da outra loja imediatamente ao trocar
    selectLojas.addEventListener('change', (e) => {
        lojaSelecionadaId = e.target.value;
        carregarDadosDaLojaEspecifica();
    });
}

function carregarDadosDaLojaEspecifica() {
    if (!lojaSelecionadaId) return;
    
    // Carrega dados isolados daquela loja do storage
    categoriasSalvas = JSON.parse(localStorage.getItem(`realce_categorias_${lojaSelecionadaId}`)) || [];
    produtosSalvos = JSON.parse(localStorage.getItem(`realce_produtos_${lojaSelecionadaId}`)) || [];
    
    renderizarSelectCategorias();
}

function salvarEstadoNoCache() {
    if (!lojaSelecionadaId) return;
    localStorage.setItem(`realce_categorias_${lojaSelecionadaId}`, JSON.stringify(categoriasSalvas));
    localStorage.setItem(`realce_produtos_${lojaSelecionadaId}`, JSON.stringify(produtosSalvos));
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
   2. GERENCIADOR DE CATEGORIAS + MÓDULO AUTO-TAMANHOS PIZZA
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
            const valorSugestao = btnSugestao.textContent.trim();
            inputCategoria.value = valorSugestao;
            inputCategoria.focus();

            // MÓDULO INTELIGENTE: Se escolheu pizzas, monta automaticamente os tamanhos
            if (valorSugestao.toLowerCase() === 'pizzas' || valorSugestao.toLowerCase() === 'pizza') {
                autoInjetarTamanhosPizzaFormulario();
            }
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

function autoInjetarTamanhosPizzaFormulario() {
    const builderContainer = document.querySelector('.product-optionals-builder');
    if (!builderContainer) return;

    const gruposAntigos = builderContainer.querySelectorAll('.optional-group-card');
    gruposAntigos.forEach(g => g.remove());

    const novoGrupo = document.createElement('div');
    novoGrupo.className = 'optional-group-card';
    novoGrupo.innerHTML = `
        <div class="opt-group-header">
            <input type="text" class="input-inline" value="Escolha o Tamanho">
            <div class="opt-rules"><label>Min:</label> <input type="number" value="1"><label>Max:</label> <input type="number" value="1"></div>
        </div>
        <div class="optional-items-table">
            <div class="opt-item-row">
                <input type="text" value="Pequena (4 fatias)"><input type="number" step="0.01" value="0.00">
                <label class="radio-destaque-label" title="Destaque na Vitrine"><input type="radio" name="destaque_produto" class="radio-destaque"><i class="fas fa-star"></i></label>
                <button type="button" class="btn-text-delete"><i class="fas fa-times"></i></button>
            </div>
            <div class="opt-item-row">
                <input type="text" value="Média (6 fatias)"><input type="number" step="0.01" value="10.00">
                <label class="radio-destaque-label" title="Destaque na Vitrine"><input type="radio" name="destaque_produto" class="radio-destaque"><i class="fas fa-star"></i></label>
                <button type="button" class="btn-text-delete"><i class="fas fa-times"></i></button>
            </div>
            <div class="opt-item-row">
                <input type="text" value="Grande (8 fatias)"><input type="number" step="0.01" value="20.00">
                <label class="radio-destaque-label" title="Destaque na Vitrine"><input type="radio" name="destaque_produto" class="radio-destaque" checked><i class="fas fa-star"></i></label>
                <button type="button" class="btn-text-delete"><i class="fas fa-times"></i></button>
            </div>
            <button type="button" class="btn-secondary-sm"><i class="fas fa-plus"></i> Adicionar Item Extra</button>
        </div>
    `;
    const btnNewGroup = builderContainer.querySelector('.btn-secondary');
    builderContainer.insertBefore(novoGrupo, btnNewGroup);
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
   3. MOTOR DE FOTOS DA GALERIA
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
                <label class="radio-destaque-label" title="Destaque na Vitrine"><input type="radio" name="destaque_produto" class="radio-destaque"><i class="fas fa-star"></i></label>
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
                        <input type="text" placeholder="Opção 1"><input type="number" step="0.01" placeholder="0.00">
                        <label class="radio-destaque-label" title="Destaque na Vitrine"><input type="radio" name="destaque_produto" class="radio-destaque"><i class="fas fa-star"></i></label>
                        <button type="button" class="btn-text-delete"><i class="fas fa-times"></i></button>
                    </div>
                    <button type="button" class="btn-secondary-sm"><i class="fas fa-plus"></i> Adicionar Item Extra</button>
                </div>
            `;
            builderContainer.insertBefore(novoGrupo, btnNewGroup);
        }
    });
}

/* ==========================================================================
   6. ENVIO E ARMAZENAMENTO DO FORMULÁRIO (ISOLADO MULTILOJA)
   ========================================================================== */
function inicializarEnvioFormulario() {
    const formulario = document.querySelector('.cardapio-form-grid');
    if (!formulario) return;

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!lojaSelecionadaId) {
            alert("⚠️ Selecione uma loja no topo antes de cadastrar o produto.");
            return;
        }

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

        cartoesGrupo.forEach((cartao, gIdx) => {
            const nomeGrupo = cartao.querySelector('.input-inline').value;
            const min = cartao.querySelectorAll('.opt-rules input')[0].value;
            const max = cartao.querySelectorAll('.opt-rules input')[1].value;

            const itensDoGrupo = [];
            const linesItens = cartao.querySelectorAll('.opt-item-row');
            
            linesItens.forEach((linha) => {
                const inputNomeAdicional = linha.querySelector('input[type="text"]');
                const inputPrecoAdicional = linha.querySelector('input[type="number"]');
                const radioDestaque = linha.querySelector('.radio-destaque'); 
                
                if (inputNomeAdicional && inputNomeAdicional.value) {
                    itensDoGrupo.push({
                        nome_adicional: inputNomeAdicional.value,
                        preco_adicional: parseFloat(inputPrecoAdicional.value || 0).toFixed(2),
                        destaque: radioDestaque ? radioDestaque.checked : false
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

        // INTELIGÊNCIA DE EDIÇÃO VS CADASTRO NOVO
        if (produtoEmEdicaoId !== null) {
            // Modo Edição: Localiza o produto antigo no array e atualiza os dados dele
            const index = produtosSalvos.findIndex(p => p.id === produtoEmEdicaoId);
            if (index !== -1) {
                // Se o gestor não enviou fotos novas na edição, mantém as fotos antigas que já estavam salvas
                const fotosFinais = listaImagensSalvas.length > 0 ? listaImagensSalvas : produtosSalvos[index].imagens;

                produtosSalvos[index] = {
                    id: produtoEmEdicaoId,
                    nome: nome,
                    preco: preco,
                    categoria: categoria,
                    imagens: fotosFinais, 
                    ingredientes: listaIngredientes.join(', '),
                    opcionais: gruposOpcionais
                };
                alert(`Sucesso! "${nome}" atualizado com êxito.`);
            }
            // Reseta o estado global de edição de volta para o padrão
            produtoEmEdicaoId = null;
            document.querySelector('.cardapio-card-box h3').innerHTML = `<i class="fas fa-hamburger"></i> Cadastro de Produto`;
            document.querySelector('.btn-save-product').textContent = "Salvar Produto no Cardápio";
        } else {
            // Modo Cadastro Novo: Cria um novo objeto com id baseado no timestamp
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
            alert(`Sucesso! "${nome}" adicionado com êxito.`);
        }

        // Limpa o formulário e os componentes periféricos
        salvarEstadoNoCache();
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
        containerVitrine.innerHTML = `<p style="text-align: center; color: #9ca3af; padding: 40px 20px; font-style: italic;">Nenhum produto cadastrado nesta loja. Monte itens para vê-los aqui!</p>`;
        return;
    }

    categoriasSalvas.forEach(categoria => {
        const produtosDaCategoria = produtosSalvos.filter(p => p.categoria === categoria);

        if (produtosDaCategoria.length > 0) {
            const blocoCategoria = document.createElement('div');
            blocoCategoria.className = 'mock-category-block';
            blocoCategoria.style.transform = 'none';
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
                    <div class="mock-card-actions">
                        <button type="button" class="btn-action-preview edit btn-editar-prod-click" data-id="${produto.id}" title="Editar Produto"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn-action-preview delete btn-deletar-prod-click" data-id="${produto.id}" title="Excluir Produto"><i class="fas fa-trash-alt"></i></button>
                    </div>

                    <div class="mock-card-details">
                        <h5>${produto.nome}</h5>
                        <p>${produto.ingredientes || 'Sem ingredientes base.'}</p>
                        <span class="mock-price">R$ ${produto.preco}</span>
                    </div>
                    <div class="mock-card-img">
                        ${containerImagem}
                    </div>
                `;

                // Escutadores de eventos para os botões de ação do card
                card.querySelector('.btn-editar-prod-click').addEventListener('click', (e) => {
                    e.stopPropagation();
                    carregarProdutoParaEdicao(produto.id);
                });

                card.querySelector('.btn-deletar-prod-click').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deletarProdutoReal(produto.id);
                });

                listaCards.appendChild(card);
            });

            blocoCategoria.appendChild(listaCards);
            containerVitrine.appendChild(blocoCategoria);
        }
    });
}

function carregarProdutoParaEdicao(id) {
    const produto = produtosSalvos.find(p => p.id === id);
    if (!produto) return;

    produtoEmEdicaoId = produto.id;

    // 1. Preenche os campos básicos
    document.getElementById('prod-nome').value = produto.nome;
    document.getElementById('prod-preco').value = produto.preco;
    document.getElementById('prod-select-vinculo').value = produto.categoria;

    // 2. Altera os textos visuais para modo edição
    document.querySelector('.cardapio-card-box h3').innerHTML = `<i class="fas fa-edit"></i> Editando Produto: ${produto.nome}`;
    document.querySelector('.btn-save-product').textContent = "Salvar Alterações do Produto";

    // 3. Remonta os chips de ingredientes
    const containerChips = document.getElementById('container-ingredientes-chips');
    containerChips.innerHTML = "";
    if (produto.ingredientes) {
        const lista = produto.ingredientes.split(', ');
        lista.forEach(texto => {
            if (texto.trim() !== "") {
                const chip = document.createElement('div');
                chip.className = 'ingredient-chip';
                chip.innerHTML = `${texto} <i class="fas fa-times-circle btn-remove-chip"></i>`;
                containerChips.appendChild(chip);
            }
        });
    }

    // 4. Remonta a estrutura de grupos e opcionais com as estrelas salvas
    const builderContainer = document.querySelector('.product-optionals-builder');
    if (builderContainer) {
        const gruposAntigos = builderContainer.querySelectorAll('.optional-group-card');
        gruposAntigos.forEach(g => g.remove());

        if (produto.opcionais && produto.opcionais.length > 0) {
            produto.opcionais.forEach((grupo, grupoIdx) => {
                const novoGrupo = document.createElement('div');
                novoGrupo.className = 'optional-group-card';
                novoGrupo.innerHTML = `
                    <div class="opt-group-header">
                        <input type="text" class="input-inline" value="${grupo.nome_grupo}">
                        <div class="opt-rules">
                            <label>Min:</label> <input type="number" value="${grupo.minimo}">
                            <label>Max:</label> <input type="number" value="${grupo.maximo}">
                        </div>
                    </div>
                    <div class="optional-items-table">
                        ${grupo.itens.map(item => `
                            <div class="opt-item-row">
                                <input type="text" value="${item.nome_adicional}">
                                <input type="number" step="0.01" value="${item.preco_adicional}">
                                <label class="radio-destaque-label" title="Destaque na Vitrine">
                                    <input type="radio" name="destaque_produto_${grupoIdx}" class="radio-destaque" ${item.destaque ? 'checked' : ''}>
                                    <i class="fas fa-star"></i>
                                </label>
                                <button type="button" class="btn-text-delete"><i class="fas fa-times"></i></button>
                            </div>
                        `).join('')}
                        <button type="button" class="btn-secondary-sm"><i class="fas fa-plus"></i> Adicionar Item Extra</button>
                    </div>
                `;
                const btnNewGroup = builderContainer.querySelector('.btn-secondary');
                builderContainer.insertBefore(novoGrupo, btnNewGroup);
            });
        }
    }

    // 5. Força o clique de troca de aba para o formulário de cadastro
    document.getElementById('tab-menu').click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deletarProdutoReal(id) {
    const produto = produtosSalvos.find(p => p.id === id);
    if (!produto) return;

    if (confirm(`⚠️ Deseja realmente remover o produto "${produto.nome}" do seu cardápio?`)) {
        produtosSalvos = produtosSalvos.filter(p => p.id !== id);
        
        // Se o produto deletado era o que estava em edição, limpa o estado
        if (produtoEmEdicaoId === id) {
            produtoEmEdicaoId = null;
            document.querySelector('.cardapio-card-box h3').innerHTML = `<i class="fas fa-hamburger"></i> Cadastro de Produto`;
            document.querySelector('.btn-save-product').textContent = "Salvar Produto no Cardápio";
        }

        salvarEstadoNoCache();
        renderizarPreviewCardapioReal(); // Atualiza a vitrine imediatamente
        alert('Produto removido com sucesso!');
    }
}

/* ==========================================================================
   ABA DE DESIGN E LAYOUT DO CARDÁPIO EXTERNO (ISOLADO POR LOJA)
   ========================================================================== */
function inicializarControleDesignCardapio() {
    const secaoDesign = document.getElementById('content-design');
    if (!secaoDesign) return;

    const inputCorPrincipal = secaoDesign.querySelectorAll('input[type="color"]')[0];
    const inputCorFundo = secaoDesign.querySelectorAll('input[type="color"]')[1];
    const btnSalvarDesign = secaoDesign.querySelector('button[type="button"]');

    if (localStorage.getItem(`realce_design_principal_${lojaSelecionadaId}`)) inputCorPrincipal.value = localStorage.getItem(`realce_design_principal_${lojaSelecionadaId}`);
    if (localStorage.getItem(`realce_design_fundo_${lojaSelecionadaId}`)) inputCorFundo.value = localStorage.getItem(`realce_design_fundo_${lojaSelecionadaId}`);
    
    const estiloSalvo = localStorage.getItem(`realce_design_layout_${lojaSelecionadaId}`) || 'lista';
    const radios = secaoDesign.querySelectorAll('input[type="radio"]');
    if (estiloSalvo === 'grade' && radios[1]) radios[1].checked = true;

    if (btnSalvarDesign) {
        btnSalvarDesign.addEventListener('click', () => {
            const layoutSelecionado = radios[0].checked ? 'lista' : 'grade';
            localStorage.setItem(`realce_design_principal_${lojaSelecionadaId}`, inputCorPrincipal.value);
            localStorage.setItem(`realce_design_fundo_${lojaSelecionadaId}`, inputCorFundo.value);
            localStorage.setItem(`realce_design_layout_${lojaSelecionadaId}`, layoutSelecionado);
            alert('🎨 Configurações de Layout salvas com sucesso para esta loja!');
        });
    }
}