const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db'); 

// Inicialização
const app = express();

// Middlewares Globais
app.use(cors()); 
app.use(express.json());

// O '..' faz o Node sair da pasta 'backend' e ir para a raiz do projeto
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Altere o console.log também para você ver o novo caminho no terminal:
console.log("📂 O Node agora está procurando a pasta frontend aqui:", path.join(__dirname, '..', 'frontend'));

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor RealceCardápio funcionando!' });
});

// -------------------- ROTAS DO CARDÁPIO & PEDIDOS --------------------

// Criar um novo pedido (Cliente finaliza a compra no WhatsApp/Web)
app.post('/api/pedidos', async (req, res) => {
    const { cliente_nome, cliente_telefone, cliente_endereco, itens, subtotal, taxa_entrega, total, forma_pagamento } = req.body;
    
    if (!cliente_nome || !itens || !total) {
        return res.status(400).json({ erro: 'Dados do pedido incompletos' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO pedidos 
            (cliente_nome, cliente_telefone, cliente_endereco, itens, subtotal, taxa_entrega, total, forma_pagamento) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [cliente_nome, cliente_telefone, cliente_endereco, JSON.stringify(itens), subtotal, taxa_entrega, total, forma_pagamento]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Pedido recebido com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao salvar o pedido' });
    }
});

// -------- CRUD Categorias --------

app.get('/api/categorias', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categorias ORDER BY ordem, id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar categorias' });
    }
});

app.post('/api/categorias', async (req, res) => {
    const { nome, ordem } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
    try {
        const result = await pool.query(
            'INSERT INTO categorias (nome, ordem) VALUES ($1, $2) RETURNING *',
            [nome, ordem || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao criar categoria' });
    }
});

app.put('/api/categorias/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, ordem } = req.body;
    try {
        const result = await pool.query(
            'UPDATE categorias SET nome = COALESCE($1, nome), ordem = COALESCE($2, ordem) WHERE id = $3 RETURNING *',
            [nome, ordem, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Categoria não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao atualizar categoria' });
    }
});

app.delete('/api/categorias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Categoria não encontrada' });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao excluir categoria' });
    }
});

// -------- CRUD Produtos --------

app.get('/api/produtos', async (req, res) => {
    const { categoria_id, apenas_disponiveis } = req.query;
    try {
        let query = `
            SELECT p.*, c.nome as categoria_nome 
            FROM produtos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (categoria_id) {
            query += ` AND p.categoria_id = $${paramCount}`;
            params.push(categoria_id);
            paramCount++;
        }

        if (apenas_disponiveis === 'true') {
            query += ` AND p.disponivel = true`;
        }

        query += ` ORDER BY c.ordem, p.id`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
});

app.post('/api/produtos', async (req, res) => {
    const { nome, descricao, preco, foto_url, disponivel, opcionais, categoria_id } = req.body;
    if (!nome || preco === undefined) return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
    try {
        const result = await pool.query(
            `INSERT INTO produtos 
             (nome, descricao, preco, foto_url, disponivel, opcionais, categoria_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [nome, descricao, preco, foto_url, disponivel ?? true, opcionais || [], categoria_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao criar produto' });
    }
});

app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, foto_url, disponivel, opcionais, categoria_id } = req.body;
    try {
        const result = await pool.query(
            `UPDATE produtos SET 
                nome = COALESCE($1, nome),
                descricao = COALESCE($2, descricao),
                preco = COALESCE($3, preco),
                foto_url = COALESCE($4, foto_url),
                disponivel = COALESCE($5, disponivel),
                opcionais = COALESCE($6, opcionais),
                categoria_id = COALESCE($7, categoria_id)
             WHERE id = $8 RETURNING *`,
            [nome, descricao, preco, foto_url, disponivel, opcionais, categoria_id, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao atualizar produto' });
    }
});

app.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao excluir produto' });
    }
});


// ==========================================================================
// [NOVO] ROTA PARA BUSCAR PEDIDOS ATIVOS DA ESTEIRA GESTORA
// ==========================================================================
app.get('/api/pedidos/ativos', async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT id, cliente_nome, itens, valor_total, forma_pagamento, troco, status, sub_status, endereco_entrega FROM pedidos WHERE status NOT IN ('entregue', 'cancelado') ORDER BY criado_em ASC"
        );
        res.json(resultado.rows);
    } catch (erro) {
        console.error("Erro ao buscar pedidos ativos:", erro.message);
        res.status(500).json({ erro: "Erro interno ao buscar pedidos." });
    }
});


// ==========================================================================
// [NOVO] ROTA PARA AVANÇAR O STATUS DO PEDIDO NO TRILHO (CORRIGIDA)
// ==========================================================================
app.put('/api/pedidos/:id/avancar', async (req, res) => {
    const { id } = req.params;
    const { status_atual, sub_status_atual } = req.body;
    
    let novoStatus = status_atual;
    let novoSubStatus = 'aguardando';

    try {
        // Alinhamento inteligente entre os termos 'novos' e 'pedidos'
        if (status_atual === 'pedidos' || status_atual === 'novos') {
            novoStatus = 'pagamento';
            novoSubStatus = 'aguardando';
        } else if (status_atual === 'pagamento') {
            novoStatus = 'preparo';
            novoSubStatus = 'aguardando'; 
        } else if (status_atual === 'preparo') {
            if (sub_status_atual === 'aguardando') {
                novoSubStatus = 'preparando'; 
            } else if (sub_status_atual === 'preparando') {
                novoSubStatus = 'pronto'; 
            } else if (sub_status_atual === 'pronto') {
                novoStatus = 'entrega'; 
                novoSubStatus = 'aguardando';
            }
        } else if (status_atual === 'entrega') {
            if (sub_status_atual === 'aguardando') {
                novoSubStatus = 'saiu_para_entrega'; 
            } else if (sub_status_atual === 'saiu_para_entrega') {
                novoStatus = 'entregue'; 
            }
        }

        // Atualização atômica no banco de dados
        await pool.query(
            "UPDATE pedidos SET status = $1, sub_status = $2 WHERE id = $3",
            [novoStatus, novoSubStatus, id]
        );

        res.json({ mensagem: "Status atualizado com sucesso!", novoStatus, novoSubStatus });
    } catch (erro) {
        console.error("Erro ao atualizar status do pedido:", erro.message);
        res.status(500).json({ erro: "Erro ao atualizar status no banco." });
    }
});


// 1. ROTA PARA BUSCAR AS MENSAGENS SALVAS
app.get('/api/whatsapp/config', async (req, res) => {
    try {
        // Busca o registro único de configuração
        const resultado = await pool.query('SELECT * FROM configuracoes_whatsapp WHERE id = 1');
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Configuração não encontrada." });
        }
        
        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error("❌ Erro ao buscar configurações do WhatsApp:", erro);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

// 2. ROTA PARA SALVAR AS ALTERAÇÕES DO GESTOR
app.put('/api/whatsapp/config', async (req, res) => {
    const { msg_novo, msg_preparo, msg_entrega } = req.body;
    
    try {
        // Atualiza a linha fixa id = 1 com os novos textos da tela
        await pool.query(
            `UPDATE configuracoes_whatsapp 
             SET msg_novo = $1, msg_preparo = $2, msg_entrega = $3 
             WHERE id = 1`,
            [msg_novo, msg_preparo, msg_entrega]
        );
        
        res.json({ mensagem: "Configurações do WhatsApp salvas com sucesso!" });
    } catch (erro) {
        console.error("❌ Erro ao salvar configurações do WhatsApp:", erro);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});



// Servir arquivos estáticos do Frontend (Sempre por último para não interceptar as APIs!)
app.use(express.static(path.join(__dirname, '../frontend/admin')));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 Servidor RealceCardápio rodando na porta ${PORT}`);
});