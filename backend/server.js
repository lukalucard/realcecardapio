const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db'); // Alterado para pool para fazer sentido com o restante do código

// Inicialização
const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor RealceCardápio funcionando!' });
});

// -------------------- ROTAS DO CARDÁPIO & PEDIDOS --------------------

// Criar um novo pedido (Cliente finaliza a compra)
app.post('/api/pedidos', async (req, res) => {
    const { cliente_nome, cliente_telefone, cliente_endereco, itens, subtotal, taxa_entrega, total, forma_pagamento } = req.body;
    
    if (!cliente_nome || !itens || !total) {
        return res.status(400).json({ erro: 'Dados do pedido incompletos' });
    }

    try {
        // Adaptado para a sintaxe correta do PostgreSQL ($1, $2... e RETURNING id)
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

// Listar todas as categorias
app.get('/api/categorias', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categorias ORDER BY ordem, id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar categorias' });
    }
});

// Criar nova categoria
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

// Atualizar categoria
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

// Excluir categoria
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


// -------- CRUD Produtos (Rotas Unificadas e Corrigidas) --------

// Listar produtos (Suporta filtro por categoria e parâmetro opcional para o painel público)
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

// Criar produto
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

// Atualizar produto
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

// Excluir produto
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

// Servir arquivos estáticos do Frontend
app.use(express.static(path.join(__dirname, '../frontend/admin')));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 Servidor RealceCardápio rodando na porta ${PORT}`);
});