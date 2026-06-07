// LISTAS EM MEMÓRIA (Simulando o Banco de Dados temporariamente)
let categoriasSalvas = ['Burgers', 'Bebidas'];
let produtosSalvos = [];

document.addEventListener('DOMContentLoaded', () => {
    inicializarAbasDoSistema();
    inicializarControleCategorias();
    inicializarGerenciadorIngredientes();
    inicializarConstrutorOpcionais();
    inicializarEnvioFormulario();
    
    // Renderiza o estado inicial das categorias no seletor e no preview
    atualizarSeletoresECardapio();
});

/* ==========================================================================
   1. GERENCIADOR DE ABAS (ITENS / PREVIEW / DESIGN)
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
        // Toda vez que abrir o preview, garante que ele está atualizado
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
   2. GERENCIADOR DE CATEGORIAS DINÂMICAS
   ========================================================================== */
function inicializarControleCategorias() {
    const holderSugestoes = document.querySelector('.suggestions-holder');
    const inputCategoria = document.getElementById('input-nova-categoria');
    const btnConfirmar = document.getElementById('btn-add-categoria');

    if (!holderSugestoes || !inputCategoria || !btnConfirmar) return;

    // Clicar na sugestão joga o texto no input
    holderSugestoes.addEventListener('click', (e) => {
        const btnSugestao = e.target.closest('.badge-suggestion');
        if (btnSugestao) {
            e.preventDefault();
            inputCategoria.value = btnSugestao.textContent;
            inputCategoria.focus();
        }
    });

    // Confirmar adiciona a categoria na nossa lista global em memória
    btnConfirmar.addEventListener('click', (e) => {
        e.preventDefault();
        const nomeCategoria = inputCategoria.value.trim();

        if (nomeCategoria === "") {
            alert("Por favor, digite ou selecione uma categoria antes de confirmar.");
            return;
        }

        // Evita duplicados
        if (categoriasSalvas.includes(nomeCategoria)) {
            alert("Esta categoria já existe!");
            return;
        }

        // Salva na memória e atualiza a interface
        categoriasSalvas.push(nomeCategoria);
        atualizarSeletoresECardapio();

        // Limpa o input
        inputCategoria.value = "";
    });
}

// Atualiza o <select> do produto com as categorias criadas na hora
function atualizarSeletoresECardapio() {
    const selectCategoria = document.getElementById('prod-categoria');
    if (!selectCategoria) return;

    // Limpa as opções atuais
    selectCategoria.innerHTML = "";

    // Injeta as categorias atualizadas da memória
    categoriasSalvas.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
    });
}

/* ==========================================================================
   3. ADIÇÃO DE INGREDIENTES EM CHIPS
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
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarChip(); } });

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-chip')) {
            e.target.closest('.ingredient-chip').remove();
        }
    });
}

/* ==========================================================================
   4. CONSTRUTOR DE OPCIONAIS (RELAÇÃO 1-N)
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
   5. SALVAMENTO DO PRODUTO EM MEMÓRIA
   ========================================================================== */
function inicializarEnvioFormulario() {
    const formulario = document.querySelector('.cardapio-form-grid');
    if (!formulario) return;

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('prod-nome').value;
        const preco = parseFloat(document.getElementById('prod-preco').value).toFixed(2);
        const categoria = document.getElementById('prod-categoria').value;

        // Captura os ingredientes direto dos CHIPS dinâmicos que o usuário criou
        const chips = document.querySelectorAll('.ingredient-chip');
        const listaIngredientes = [];
        chips.forEach(chip => {
            // Remove o texto do ícone "X" para pegar apenas o nome do ingrediente
            const textoLimpo = chip.textContent.replace('X', '').trim();
            listaIngredientes.push(textoLimpo);
        });

        // Captura os grupos de opcionais
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

        // Monta o objeto completo do produto
        const novoProduto = {
            id: Date.now(), // Gera um ID único temporário
            nome,
            preco,
            categoria,
            ingredientes: listaIngredientes.join(', '), // Junta em texto para o preview
            opcionais: gruposOpcionais
        };

        // Salva na nossa lista global
        produtosSalvos.push(novoProduto);
        
        alert(`Sucesso! "${nome}" foi cadastrado na categoria "${categoria}".`);

        // Reseta o formulário e limpa os chips visuais de ingredientes
        formulario.reset();
        document.getElementById('container-ingredientes-chips').innerHTML = "";
    });
}

/* ==========================================================================
   6. ATUALIZAÇÃO DA ABA DE PREVIEW EM TEMPO REAL (SUA NOVA PÁGINA)
   ========================================================================== */
function renderizarPreviewCardapioReal() {
    const containerVitrine = document.querySelector('.mock-client-menu-view');
    if (!containerVitrine) return;

    // Limpa a simulação antiga
    containerVitrine.innerHTML = "";

    if (produtosSalvos.length === 0) {
        containerVitrine.innerHTML = `<p style="text-align: center; color: #9ca3af; padding: 20px;">Nenhum produto cadastrado ainda. Cadastre itens para vê-los aqui!</p>`;
        return;
    }

    // Organiza a exibição separando os produtos por categoria igual ao iFood
    categoriasSalvas.forEach(categoria => {
        // Filtra os produtos salvos que pertencem a essa categoria específica
        const produtosDaCategoria = produtosSalvos.filter(p => p.categoria === categoria);

        // Se houver produtos nessa categoria, renderiza o bloco na tela do simulador
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
                        <i class="fas ${categoria.toLowerCase() === 'bebidas' ? 'fa-glass-cheers' : 'fa-hamburger'}"></i>
                    </div>
                `;
                listaCards.appendChild(card);
            });

            blocoCategoria.appendChild(listaCards);
            containerVitrine.appendChild(blocoCategoria);
        }
    });
}