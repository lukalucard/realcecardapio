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
    
    // Força o estado inicial vazio na tela
    atualizarInterfaceCategorias();
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
   2. GERENCIADOR DE CATEGORIAS (CADA ITEM GANHA SEU EDITAR E EXCLUIR)
   ========================================================================== */
function inicializarControleCategorias() {
    const holderSugestoes = document.querySelector('.suggestions-holder');
    const inputCategoria = document.getElementById('input-nova-categoria');
    const btnConfirmar = document.getElementById('btn-add-categoria');
    const containerLista = document.getElementById('lista-categorias-container');

    if (!holderSugestoes || !inputCategoria || !btnConfirmar || !containerLista) return;

    // Sugestões preenchem o input
    holderSugestoes.addEventListener('click', (e) => {
        const btnSugestao = e.target.closest('.badge-suggestion');
        if (btnSugestao) {
            e.preventDefault();
            inputCategoria.value = btnSugestao.textContent.trim();
            inputCategoria.focus();
        }
    });

    // Confirmar criação ou salvamento de edição
    btnConfirmar.addEventListener('click', (e) => {
        e.preventDefault();
        const nomeCategoria = inputCategoria.value.trim();

        if (nomeCategoria === "") {
            alert("Por favor, informe um nome para a categoria antes de confirmar.");
            return;
        }

        if (categoriaEmEdicao !== null) {
            // Modo Edição: substitui o valor antigo pelo novo ajustado
            const index = categoriesSalvas.indexOf(categoriaEmEdicao);
            if (index !== -1) {
                categoriesSalvas[index] = nomeCategoria;
            }
            
            // Cascata: atualiza os produtos salvos que usavam a escrita antiga
            produtosSalvos.forEach(p => {
                if (p.categoria === categoriaEmEdicao) p.categoria = nomeCategoria;
            });

            categoriaEmEdicao = null;
            btnConfirmar.textContent = "Confirmar";
            document.getElementById('label-acao-categoria').textContent = "Criar categorias";
        } else {
            // Modo Criação: adiciona se não for repetida
            if (categoriesSalvas.includes(nomeCategoria)) {
                alert("Esta categoria já existe!");
                return;
            }
            categoriesSalvas.push(nomeCategoria);
        }

        inputCategoria.value = "";
        atualizarInterfaceCategorias();
    });

    // Eventos individuais usando Delegação para capturar cliques nos botões de cada linha criada
    containerLista.addEventListener('click', (e) => {
        const btnEdit = e.target.closest('.edit');
        const btnDelete = e.target.closest('.delete');

        if (btnEdit) {
            e.preventDefault();
            const catNome = btnEdit.getAttribute('data-categoria');
            inputCategoria.value = catNome;
            categoriaEmEdicao = catNome;
            btnConfirmar.textContent = "Salvar Alteração";
            document.getElementById('label-acao-categoria').textContent = "Editando categoria";
            inputCategoria.focus();
        }

        if (btnDelete) {
            e.preventDefault();
            const catNome = btnDelete.getAttribute('data-categoria');
            if (confirm(`Deseja realmente remover a categoria "${catNome}"? Os produtos dela perderão o vínculo.`)) {
                categoriesSalvas = categoriesSalvas.filter(cat => cat !== catNome);
                atualizarInterfaceCategorias();
            }
        }
    });
}

// Injeta visualmente as linhas com botões próprios e sincroniza o select do produto
function atualizarInterfaceCategorias() {
    const containerLista = document.getElementById('lista-categorias-container');
    const selectProd = document.getElementById('prod-categoria');

    if (containerLista) {
        containerLista.innerHTML = "";
        
        if (categoriesSalvas.length === 0) {
            containerLista.innerHTML = `<p style="font-size: 0.85rem; color: #9ca3af; font-style: italic; padding: 10px 0;">Nenhuma categoria criada ainda.</p>`;
        } else {
            // Monta cada item criado com suas ações individuais de edição/exclusão
            categoriesSalvas.forEach(cat => {
                const item = document.createElement('div');
                item.className = 'category-lits-item';
                item.style.marginBottom = '8px';
                item.innerHTML = `
                    <strong>${cat}</strong>
                    <div class="cat-actions">
                        <button type="button" class="btn-icon edit" data-categoria="${cat}"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn-icon delete" data-categoria="${cat}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
                containerLista.appendChild(item);
            });
        }
    }

    // Sincroniza o dropdown interno do formulário de produtos lá embaixo
    if (selectProd) {
        selectProd.innerHTML = "";
        if (categoriesSalvas.length === 0) {
            selectProd.innerHTML = `<option value="">Crie uma categoria primeiro</option>`;
        } else {
            categoriesSalvas.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                selectProd.appendChild(option);
            });
        }
    }
}

/* ==========================================================================
   3. CHIPS DE INGREDIENTES
   ========================================================================== */
function inicializerGerenciadorIngredientes() {
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
   5. ENVIO DO FORMULÁRIO (CORRIGIDO ERRO DE DIGITAÇÃO DO PRODUCT)
   ========================================================================== */
function inicializarEnvioFormulario() {
    const formulario = document.querySelector('.cardapio-form-grid');
    if (!formulario) return;

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();

        const inputNome = document.getElementById('prod-nome');
        const inputPreco = document.getElementById('prod-preco');
        const selectCategoria = document.getElementById('prod-categoria');

        if (!inputNome || !inputPreco || !selectCategoria) return;

        const nome = inputNome.value.trim();
        const preco = parseFloat(inputPreco.value || 0).toFixed(2);
        const categoria = selectCategoria.value;

        if (!categoria || categoria === "") {
            alert("Crie e selecione uma categoria válida para o produto.");
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
                const inputs = inline.querySelectorAll('input');
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
            ingredientes: listaIngredientes.join(', '),
            opcionais: gruposOpcionais
        };

        // CORREÇÃO CRÍTICA AQUI: Alterado de novoProduct para novoProduto para destravar o script
        produtosSalvos.push(novoProduto);
        alert(`Sucesso! "${nome}" salvo com êxito.`);

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
        containerVitrine.innerHTML = `<p style="text-align: center; color: #9ca3af; padding: 40px 20px; font-style: italic;">Nenhum produto cadastrado.</p>`;
        return;
    }

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
                        <p>${produto.ingredientes || 'Sem ingredientes base.'}</p>
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