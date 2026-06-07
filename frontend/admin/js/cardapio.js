/* ==========================================================================
   ESTADO GLOBAL DO SISTEMA (Banco de Dados em Memória)
   ========================================================================== */
let categoriasSalvas = []; 
let produtosSalvos = []; 
let categoriaEmEdicao = null; 

document.addEventListener('DOMContentLoaded', () => {
    inicializarAbasDoSistema();
    inicializarControleCategorias();
    inicializarGerenciadorIngredientes();
    inicializarConstrutorOpcionais();
    inicializarEnvioFormulario();
    
    // Força o estado inicial vazio escondendo o bloco das ativas
    renderizarSelectCategorias();
});

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
   2. GERENCIADOR DE CATEGORIAS (VINCULADO AO SELECT EM LINHA)
   ========================================================================== */
function inicializarControleCategorias() {
    const holderSugestoes = document.querySelector('.suggestions-holder');
    const inputCategoria = document.getElementById('input-nova-categoria');
    const btnConfirmar = document.getElementById('btn-add-categoria');
    const selectCategoria = document.getElementById('prod-categoria');
    const btnEditar = document.getElementById('btn-edit-categoria');
    const btnDeletar = document.getElementById('btn-delete-categoria');

    if (!holderSugestoes || !inputCategoria || !btnConfirmar || !selectCategoria) return;

    // Sugestões capturam o texto no clique
    holderSugestoes.addEventListener('click', (e) => {
        const btnSugestao = e.target.closest('.badge-suggestion');
        if (btnSugestao) {
            e.preventDefault();
            inputCategoria.value = btnSugestao.textContent.trim();
            inputCategoria.focus();
        }
    });

    // Confirmar criação / Alteração de escrita
    btnConfirmar.addEventListener('click', (e) => {
        e.preventDefault();
        const nomeCategoria = inputCategoria.value.trim();

        if (nomeCategoria === "") {
            alert("Por favor, informe um nome para a categoria antes de confirmar.");
            return;
        }

        if (categoriaEmEdicao !== null) {
            // Modo Edição: Renomeia no array principal
            const index = categoriasSalvas.indexOf(categoriaEmEdicao);
            if (index !== -1) {
                categoriasSalvas[index] = nomeCategoria;
            }
            
            // Cascata: Atualiza os produtos cadastrados com o nome antigo
            produtosSalvos.forEach(p => {
                if (p.categoria === categoriaEmEdicao) p.categoria = nomeCategoria;
            });

            categoriaEmEdicao = null;
            btnConfirmar.textContent = "Confirmar";
            document.getElementById('label-acao-categoria').textContent = "Criar categorias";
        } else {
            // Modo Criação: Adiciona nova categoria
            if (categoriasSalvas.includes(nomeCategoria)) {
                alert("Esta categoria já existe!");
                return;
            }
            categoriasSalvas.push(nomeCategoria);
        }

        inputCategoria.value = "";
        renderizarSelectCategorias();
    });

    // Ação do Botão Configurar (Editar) ao lado do Select
    if (btnEditar) {
        btnEditar.addEventListener('click', (e) => {
            e.preventDefault();
            const valorSelecionado = selectCategoria.value;

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

    // Ação do Botão Deletar ao lado do Select
    if (btnDeletar) {
        btnDeletar.addEventListener('click', (e) => {
            e.preventDefault();
            const valorSelecionado = selectCategoria.value;

            if (!valorSelecionado || valorSelecionado === "") {
                alert("Selecione uma categoria válida para deletar.");
                return;
            }

            if (confirm(`Deseja realmente remover a categoria "${valorSelecionado}"?`)) {
                categoriasSalvas = categoriasSalvas.filter(cat => cat !== valorSelecionado);
                
                if (categoriaEmEdicao === valorSelecionado) {
                    categoriaEmEdicao = null;
                    btnConfirmar.textContent = "Confirmar";
                    document.getElementById('label-acao-categoria').textContent = "Criar categorias";
                    inputCategoria.value = "";
                }
                
                renderizarSelectCategorias();
            }
        });
    }
}

// Controla a visibilidade e popula os dois seletores da tela simultaneamente
function renderizarSelectCategorias() {
    const selectCategoria = document.getElementById('prod-categoria');
    const selectVinculo = document.getElementById('prod-select-vinculo');
    const wrapperAtivas = document.getElementById('wrapper-categorias-ativas');
    
    if (!selectCategoria || !selectVinculo || !wrapperAtivas) return;

    // Se estiver vazio, esconde o bloco inteiro de "Categorias Ativas" da tela
    if (categoriasSalvas.length === 0) {
        wrapperAtivas.classList.add('hidden');
        selectCategoria.innerHTML = "";
        selectVinculo.innerHTML = `<option value="">Crie uma categoria primeiro</option>`;
        return;
    }

    // Exibe o bloco em linha perfeitamente
    wrapperAtivas.classList.remove('hidden');
    selectCategoria.innerHTML = "";
    selectVinculo.innerHTML = "";

    categoriasSalvas.forEach(cat => {
        // Popula o select de gerência
        const opt1 = document.createElement('option');
        opt1.value = cat;
        opt1.textContent = cat;
        selectCategoria.appendChild(opt1);

        // Popula o select de vínculo de produtos
        const opt2 = document.createElement('option');
        opt2.value = cat;
        opt2.textContent = cat;
        selectVinculo.appendChild(opt2);
    });
}

/* ==========================================================================
   3. CHIPS DE INGREDIENTES
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
   4. CONSTRUTOR DE OPCIONAIS
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
   5. ENVIO DO FORMULÁRIO (CORRIGIDO ERROS DE DIGITAÇÃO)
   ========================================================================== */
function inicializarEnvioFormulario() {
    const formulario = document.querySelector('.cardapio-form-grid');
    if (!formulario) return;

    formulario.addEventListener('submit', (e) => {
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

        const chips = document.querySelectorAll('.ingredient-chip');
        const listaIngredientes = [];
        chips.forEach(chip => {
            listaIngredientes.push(chip.textContent.replace('X', '').trim());
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
                // CORRIGIDO: Alterado de inline para linha de forma definitiva
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
            nome,
            preco,
            categoria,
            ingredients: listaIngredientes.join(', '),
            opcionais: gruposOpcionais
        };

        // CORRIGIDO: Alterado de novoProduct para novoProduto
        produtosSalvos.push(novoProduto); 
        alert(`Sucesso! "${nome}" salvo com êxito no cardápio.`);

        formulario.reset();
        document.getElementById('container-ingredientes-chips').innerHTML = "";
    });
}

/* ==========================================================================
   6. RENDERIZAÇÃO DA VITRINE SIMULADA
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
                card.innerHTML = `
                    <div class="mock-card-details">
                        <h5>${produto.nome}</h5>
                        <p>${produto.ingredients || 'Sem ingredientes base.'}</p>
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