const API_BASE = 'http://localhost:3002/api';
let categoriaAtualId = null;

// Carregar categorias
async function carregarCategorias() {
    try {
        const res = await fetch(`${API_BASE}/categorias`);
        const categorias = await res.json();
        const ul = document.getElementById('lista-categorias');
        if (!categorias.length) {
            ul.innerHTML = '<li>Nenhuma categoria cadastrada</li>';
            return;
        }
        ul.innerHTML = '';
        categorias.forEach(cat => {
            const li = document.createElement('li');
            li.className = 'categoria-item';
            if (categoriaAtualId === cat.id) li.classList.add('active');
            li.innerHTML = `
                <span class="categoria-nome">${escapeHtml(cat.nome)}</span>
                <div class="categoria-acoes">
                    <button onclick="editarCategoria(${cat.id}, '${escapeHtml(cat.nome)}', ${cat.ordem})"><i class="fas fa-edit"></i></button>
                    <button onclick="excluirCategoria(${cat.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            li.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    categoriaAtualId = cat.id;
                    carregarProdutos(cat.id);
                    highlightCategoria(cat.id);
                }
            });
            ul.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        document.getElementById('lista-categorias').innerHTML = '<li>Erro ao carregar</li>';
    }
}

function highlightCategoria(id) {
    document.querySelectorAll('.categoria-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('.categoria-acoes button')?.getAttribute('onclick')?.includes(`editarCategoria(${id}`)) {
            item.classList.add('active');
        }
    });
}

async function carregarProdutos(categoriaId) {
    try {
        const res = await fetch(`${API_BASE}/produtos?categoria_id=${categoriaId}`);
        const produtos = await res.json();
        const container = document.getElementById('lista-produtos');
        if (!produtos.length) {
            container.innerHTML = '<p>Nenhum produto nesta categoria.</p>';
            return;
        }
        container.innerHTML = '';
        produtos.forEach(p => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            card.innerHTML = `
                <div class="produto-img"><i class="fas fa-pizza-slice"></i></div>
                <div class="produto-nome">${escapeHtml(p.nome)}</div>
                <div class="produto-preco">R$ ${parseFloat(p.preco).toFixed(2)}</div>
                <div class="produto-status ${p.disponivel ? 'status-disponivel' : 'status-indisponivel'}">${p.disponivel ? 'Disponível' : 'Indisponível'}</div>
                <div class="produto-acoes">
                    <button onclick="editarProduto(${p.id}, '${escapeHtml(p.nome)}', '${escapeHtml(p.descricao || '')}', ${p.preco}, ${p.categoria_id}, ${p.disponivel})"><i class="fas fa-edit"></i></button>
                    <button onclick="excluirProduto(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('lista-produtos').innerHTML = '<p>Erro ao carregar produtos</p>';
    }
}

// Categoria CRUD
document.getElementById('btn-nova-categoria').onclick = () => {
    document.getElementById('categoria-id').value = '';
    document.getElementById('categoria-nome').value = '';
    document.getElementById('categoria-ordem').value = '0';
    document.getElementById('modal-categoria-titulo').innerText = 'Nova Categoria';
    document.getElementById('modal-categoria').style.display = 'flex';
};

window.editarCategoria = (id, nome, ordem) => {
    document.getElementById('categoria-id').value = id;
    document.getElementById('categoria-nome').value = nome;
    document.getElementById('categoria-ordem').value = ordem;
    document.getElementById('modal-categoria-titulo').innerText = 'Editar Categoria';
    document.getElementById('modal-categoria').style.display = 'flex';
};

document.getElementById('save-categoria').onclick = async () => {
    const id = document.getElementById('categoria-id').value;
    const nome = document.getElementById('categoria-nome').value.trim();
    const ordem = parseInt(document.getElementById('categoria-ordem').value) || 0;
    if (!nome) return alert('Nome é obrigatório');
    let url = `${API_BASE}/categorias`;
    let method = 'POST';
    let body = { nome, ordem };
    if (id) {
        url += `/${id}`;
        method = 'PUT';
    }
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            fecharModalCategoria();
            carregarCategorias();
            if (id && categoriaAtualId == id) carregarProdutos(categoriaAtualId);
        } else {
            alert('Erro ao salvar categoria');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão');
    }
};

window.excluirCategoria = async (id) => {
    if (!confirm('Excluir esta categoria? Os produtos serão removidos? (Ação irreversível)')) return;
    try {
        const res = await fetch(`${API_BASE}/categorias/${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (categoriaAtualId === id) {
                categoriaAtualId = null;
                document.getElementById('lista-produtos').innerHTML = '<p>Selecione uma categoria</p>';
            }
            carregarCategorias();
        } else {
            alert('Erro ao excluir categoria');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão');
    }
};

function fecharModalCategoria() {
    document.getElementById('modal-categoria').style.display = 'none';
}
document.getElementById('cancel-categoria').onclick = fecharModalCategoria;

// Produto CRUD
async function carregarSelectCategorias() {
    const res = await fetch(`${API_BASE}/categorias`);
    const cats = await res.json();
    const select = document.getElementById('produto-categoria');
    select.innerHTML = '<option value="">Selecione uma categoria</option>';
    cats.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nome;
        select.appendChild(option);
    });
}

document.getElementById('btn-novo-produto').onclick = () => {
    document.getElementById('produto-id').value = '';
    document.getElementById('produto-nome').value = '';
    document.getElementById('produto-descricao').value = '';
    document.getElementById('produto-preco').value = '';
    document.getElementById('produto-disponivel').checked = true;
    if (categoriaAtualId) {
        carregarSelectCategorias().then(() => {
            document.getElementById('produto-categoria').value = categoriaAtualId;
        });
    } else {
        carregarSelectCategorias();
        document.getElementById('produto-categoria').value = '';
    }
    document.getElementById('modal-produto-titulo').innerText = 'Novo Produto';
    document.getElementById('modal-produto').style.display = 'flex';
};

window.editarProduto = (id, nome, descricao, preco, categoriaId, disponivel) => {
    document.getElementById('produto-id').value = id;
    document.getElementById('produto-nome').value = nome;
    document.getElementById('produto-descricao').value = descricao;
    document.getElementById('produto-preco').value = preco;
    document.getElementById('produto-disponivel').checked = disponivel === true;
    carregarSelectCategorias().then(() => {
        document.getElementById('produto-categoria').value = categoriaId;
    });
    document.getElementById('modal-produto-titulo').innerText = 'Editar Produto';
    document.getElementById('modal-produto').style.display = 'flex';
};

document.getElementById('save-produto').onclick = async () => {
    const id = document.getElementById('produto-id').value;
    const nome = document.getElementById('produto-nome').value.trim();
    const descricao = document.getElementById('produto-descricao').value;
    const preco = parseFloat(document.getElementById('produto-preco').value);
    const categoria_id = parseInt(document.getElementById('produto-categoria').value) || null;
    const disponivel = document.getElementById('produto-disponivel').checked;
    if (!nome || isNaN(preco)) return alert('Nome e preço são obrigatórios');
    if (!categoria_id) return alert('Selecione uma categoria');
    let url = `${API_BASE}/produtos`;
    let method = 'POST';
    let body = { nome, descricao, preco, disponivel, categoria_id, opcionais: [] };
    if (id) {
        url += `/${id}`;
        method = 'PUT';
    }
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            fecharModalProduto();
            if (categoriaAtualId) carregarProdutos(categoriaAtualId);
        } else {
            alert('Erro ao salvar produto');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão');
    }
};

window.excluirProduto = async (id) => {
    if (!confirm('Excluir este produto?')) return;
    try {
        const res = await fetch(`${API_BASE}/produtos/${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (categoriaAtualId) carregarProdutos(categoriaAtualId);
        } else {
            alert('Erro ao excluir produto');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão');
    }
};

function fecharModalProduto() {
    document.getElementById('modal-produto').style.display = 'none';
}
document.getElementById('cancel-produto').onclick = fecharModalProduto;

// Utilitário para evitar XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Inicialização
carregarCategorias();

// Fechar modais ao clicar fora
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
};