/* ==========================================================================
   ESTADO GLOBAL DO SISTEMA (Simulando o Banco de Dados em Memória)
   ========================================================================== */
let categoriesSalvas = []; 
let produtosSalvos = []; 
let categoriaEmEdicao = null; 

document.addEventListener('DOMContentLoaded', () => {
    inicializarAbasDoSistema();
    inicializarControleCategorias();
    inicializarGerenciadorIngredientes();
    inicializarConstrutorOpcionais();
    inicializarEnvioFormulario();
    
    // Inicia o seletor com o estado vazio
    renderizarSelectCategorias();
});

/* ==========================================================================
   1. GERENCIADOR DE ABAS (PRODUTOS / VISUALIZAR CARDÁPIO / DESIGN)
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
        // Renderiza a vitrine simulada do cliente atualizada com os dados da memória
        renderizarPreviewCardapioReal();
    });

    btnDesign.addEventListener('click', () => {
        btnDesign.classList.add('active');
        [btnMenu, btnPreview].forEach(b => b.classList.remove('active'));
        contentDesign.classList.remove('hidden');
        [contentMenu, contentPreview].forEach(c => c.classList.add('hidden'));
    });

    function alternarAbas(abaAtiva, abasInativas, conteudoAtivo, conteudosInativos) {
        abaAtiva.classList.add('active');
        abasInativas.forEach(b => b.classList.remove('active'));
        conteudoAtivo.classList.remove('hidden');
        conteudosInativos.forEach(c => c.classList.add('hidden'));
    }
}

/* ==========================================================================
   2. GERENCIADOR DE CATEGORIAS (SUGESTÕES, CRIAÇÃO, EDIÇÃO E EXCLUSÃO)
   ========================================================================== */
function inicializarControleCategorias() {
    const holderSugestoes = document.querySelector('.suggestions-holder');
    const inputCategoria = document.getElementById('input-nova-categoria');
    const btnConfirmar = document.getElementById('btn-add-categoria');
    const selectCategoria = document.getElementById('prod-categoria');
    const btnEditar = document.getElementById('btn-edit-categoria');
    const btnDeletar = document.getElementById('btn-delete-categoria');

    if (!holderSugestoes || !inputCategoria || !btnConfirmar || !selectCategoria) return;

    // Sugestões rápidas jogam o texto direto para o input
    holderSugestoes.addEventListener('click', (e) => {
        const btnSugestao = e.target.closest('.badge-suggestion');
        if (btnSugestao) {
            e.preventDefault();
            inputCategoria.value = btnSugestao.textContent.trim();
            inputCategoria.focus();
        }
    });

    // Confirmar criação ou ajuste de caligrafia
    btnConfirmar.addEventListener('click', (e) => {
        e.preventDefault();
        const nomeCategoria = inputCategoria.value.trim();

        if (nomeCategoria === "") {
            alert("Por favor, informe um nome para a categoria antes de confirmar.");
            return;
        }

        if (categoriaEmEdicao !== null) {
            // Se estamos editando, atualiza o nome antigo no array
            const index = categoriesSalvas.indexOf(categoriaEmEdicao);
            if (index !== -1) {
                categoriesSalvas[index] = nomeCategoria;
            }
            
            // Cascata de segurança: atualiza a categoria dos produtos vinculados
            produtosSalvos.forEach(p => {
                if (p.categoria === categoriaEmEdicao) p.categoria = nomeCategoria;
            });

            categoriaEmEdicao = null;
            btnConfirmar.textContent = "Confirmar";
            document.getElementById('label-acao-categoria').textContent = "Criar categorias";
        } else {
            // Se for nova, valida duplicados
            if (categoriesSalvas.includes(nomeCategoria)) {
                alert("Esta categoria já existe!");
                return;
            }
            categoriesSalvas.push(nomeCategoria);
        }

        inputCategoria.value = "";
        renderizarSelectCategorias();
    });

    // Configurar / Editar: Carrega o item atualmente selecionado no select de volta para o input
    if (btnEditar) {
        btnEditar.addEventListener('click', (e) => {
            e.preventDefault();
            const valorSelecionado = selectCategoria.value;

            if (!valorSelecionado || valorSelecionado === "Nenhuma categoria cadastrada") {
                alert("Selecione uma categoria válida na lista abaixo para configurar.");
                return;
            }

            inputCategoria.value = valorSelecionado;
            categoriaEmEdicao = valorSelecionado;
            btnConfirmar.textContent = "Salvar Alteração";
            document.getElementById('label-acao-categoria').textContent = "Editando categoria";
            inputCategoria.focus();
        });
    }

    // Deletar: Remove a categoria selecionada no select e limpa os produtos dela
    if (btnDeletar) {
        btnDeletar.addEventListener('click', (e) => {
            e.preventDefault();
            const valorSelecionado = selectCategoria.value;

            if (!valorSelecionado || valorSelecionado === "Nenhuma categoria cadastrada") {
                alert("Selecione uma categoria válida para deletar.");
                return;
            }

            if (confirm(`Deseja realmente remover a categoria "${valorSelecionado}"? Todos os produtos vinculados a ela perderão o vínculo.`)) {
                categoriesSalvas = categoriesSalvas.filter(cat => cat !== valorSelecionado);
                renderizarSelectCategorias();
            }
        });
    }
}

// Atualiza dinamicamente o select de categorias integrado
function renderizarSelectCategorias() {
    const selectCategoria = document.getElementById('prod-categoria');
    if (!selectCategoria) return;

    selectCategoria.innerHTML = "";

    if (categoriesSalvas.length === 0) {
        const optVazia = document.createElement('option');
        optVazia.value = "";
        optVazia.textContent = "Nenhuma categoria cadastrada";
        selectCategoria.appendChild(optVazia);
        return;
    }

    categoriesSalvas.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
    });
}

/* ==========================================================================
   3. ADIÇÃO DINÂMICA DE INGREDIENTES EM CHIPS HIERÁRQUICOS
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
   4. CONSTRUTOR DINÂMICO DE OPCIONAIS E GRUPOS DE COMPLEMENTOS
   ========================================================================== */
function inicializarConstrutorOpcionais() {
    const builderContainer = document.querySelector('.product-optionals-builder');
    if (!builderContainer) return;

    builderContainer.addEventListener('click', (e) => {
        // Adicionar nova linha de item extra dentro de um grupo específico
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

        // Remover linha de item extra
        const btnDelete = e.target.closest('.btn-text-delete');
        if (btnDelete) {
            e.preventDefault();
            btnDelete.closest('.opt-item-row').remove();
        }

        // Criar um novo bloco completo de grupo de opcionais
        const btnNewGroup = e.target.closest('.btn-secondary');
        if (btnNewGroup && !btnNewGroup.classList.contains('btn-secondary-sm')) {
            e.preventDefault();
            
            const novoGrupo = document.createElement('div');
            novoGrupo.className = 'optional-group-card';
            novoGrupo.innerHTML = `
                <div class="opt-group-header">
                    <input type="text" class="input-inline" placeholder="Nome do Grupo (Ex: Escolha o Ponto)">
                    <div class="opt-rules">
                        <label>Min:</label> <input type="number" value="0">
                        <label>Max:</label> <input type="number" value="1">
                    </div>
                </div>
                <div class="optional-items-table">
                    <div class="opt-item-row">
                        <input type="text" placeholder="Opção 1">
                        <input type="number" step="0.01" placeholder="0.00">
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
   5. CAPTURA E PROCESSAMENTO DO PRODUTO PARA SALVAMENTO
   ========================================================================== */
function inicializarEnvioFormulario() {
    const formulario = document.querySelector('.cardapio-form-grid');
    if (!formulario) return;

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();

        // Como o formulário possui dois blocos de inputs, pegamos os elementos por seletores explícitos
        const inputNome = formulario.querySelector('input[placeholder*="Realce"]');
        const inputPreco = formulario.querySelector('input[type="number"]');
        const selectCategoria = document.getElementById('prod-categoria');

        if (!inputNome || !inputPreco || !selectCategoria) return;

        const nome = inputNome.value.trim();
        const preco = parseFloat(inputPreco.value || 0).toFixed(2);
        const categoria = selectCategoria.value;

        // Validação estrita de categoria ativa
        if (!categoria || categoria === "" || categoria === "Nenhuma categoria cadastrada") {
            alert("Atenção: É necessário criar e selecionar uma categoria válida para o produto.");
            return;
        }

        // Lê a lista de chips dinâmicos criados pelo gestor
        const chips = document.querySelectorAll('.ingredient-chip');
        const listaIngredientes = [];
        chips.forEach(chip => {
            const textoLimpo = chip.textContent.replace('X', '').trim();
            listaIngredientes.push(textoLimpo);
        });

        // Lê a árvore relacional de opcionais
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

        // Consolida o objeto do produto com ID exclusivo
        const novoProduto = {
            id: Date.now(),
            nome,
            preco,
            categoria,
            ingredientes: listaIngredientes.join(', '),
            opcionais: gruposOpcionais
        };

        produtosSalvos.push(novoProduct);
        alert(`Sucesso! "${nome}" adicionado com êxito à categoria "${categoria}".`);

        // Reseta os campos e limpa a área de chips de ingredientes
        formulario.reset();
        document.getElementById('container-ingredientes-chips').innerHTML = "";
    });
}

/* ==========================================================================
   6. RENDERIZAÇÃO AUTOMÁTICA DA VITRINE SIMULADA DO CLIENTE (PREVIEW REAL)
   ========================================================================== */
function renderizarPreviewCardapioReal() {
    const containerVitrine = document.querySelector('.mock-client-menu-view');
    if (!containerVitrine) return;

    containerVitrine.innerHTML = "";

    if (produtosSalvos.length === 0) {
        containerVitrine.innerHTML = `<p style="text-align: center; color: #9ca3af; padding: 40px 20px; font-style: italic;">Nenhum produto cadastrado na sua conta. Cadastre itens para simular o seu cardápio live!</p>`;
        return;
    }

    // Organiza a montagem descendo categoria por categoria de forma ordenada
    categoriesSalvas.forEach(categoria => {
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
                card.innerHTML = `
                    <div class="mock-card-details">
                        <h5>${produto.nome}</h5>
                        <p>${produto.ingredientes || 'Sem ingredientes base informados.'}</p>
                        <span class="mock-price">R$ ${produto.preco}</span>
                    </div>
                    <div class="mock-card-img">
                        <i class="fas ${categoria.toLowerCase().includes('bebida') ? 'fa-glass-cheers' : 'fa-hamburger'}"></i>
                    </div>
                `;
                listaCards.appendChild(card);
            });

            blocoCategoria.appendChild(listaCards);
            containerVitrine.appendChild(blocoCategoria);
        }
    });
}