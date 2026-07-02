require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const pool = require('./config/db');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const chromium = require('chrome-aws-lambda');

const app = express();

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// ============================================================
// ROTA DE TESTE
// ============================================================
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor RealceCardápio funcionando! ✅' });
});

// ============================================================
// INICIALIZAÇÃO DO WHATSAPP (COM CHROME-AWS-LAMBDA)
// ============================================================
let waStatus = 'desconectado';
let waQrCode = null;
let waClient = null;

async function iniciarWhatsApp() {
    try {
        console.log('🔄 Iniciando cliente WhatsApp...');
        
        // Tenta diferentes caminhos para o Chrome no Render
        let executablePath = null;
        try {
            // Tenta o chrome-aws-lambda primeiro
            executablePath = await chromium.executablePath;
            console.log('✅ Chrome encontrado em:', executablePath);
        } catch (err) {
            console.log('⚠️ chrome-aws-lambda não encontrou Chrome, tentando caminho alternativo...');
            // Fallback para o caminho padrão do Render
            const possiblePaths = [
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/opt/render/.cache/chrome/chrome'
            ];
            for (const path of possiblePaths) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(path)) {
                        executablePath = path;
                        console.log('✅ Chrome encontrado em:', executablePath);
                        break;
                    }
                } catch (e) {}
            }
        }

        if (!executablePath) {
            console.log('⚠️ Chrome não encontrado! Usando Puppeteer sem caminho específico.');
        }

        waClient = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                ...(executablePath && { executablePath }),
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ],
                headless: true
            }
        });

        waClient.on('qr', async (qr) => {
            waStatus = 'aguardando_qr';
            try {
                waQrCode = await qrcode.toDataURL(qr);
                console.log('✅ QR Code gerado com sucesso!');
                console.log('📱 QR Code (primeiros 50 caracteres):', qr.substring(0, 50));
            } catch (err) {
                console.error('❌ Erro ao gerar QR Code:', err);
            }
        });

        waClient.on('ready', () => {
            waStatus = 'conectado';
            waQrCode = null;
            console.log('✅ WhatsApp conectado e pronto!');
        });

        waClient.on('disconnected', (reason) => {
            waStatus = 'desconectado';
            waQrCode = null;
            console.log('❌ WhatsApp desconectado:', reason);
        });

        await waClient.initialize();
        console.log('✅ WhatsApp inicializado com sucesso!');
        
    } catch (err) {
        console.error('❌ Erro ao inicializar WhatsApp:', err);
    }
}

// Inicia o WhatsApp
iniciarWhatsApp();

// ============================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secreto_temporario');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido ou expirado' });
    }
}

// ============================================================
// ROTAS DE AUTENTICAÇÃO
// ============================================================
app.get('/check-perfil', async (req, res) => {
    const { perfil } = req.query;
    if (!perfil) return res.json({ available: false });

    try {
        const result = await pool.query('SELECT id FROM users WHERE perfil = $1', [perfil.toLowerCase().trim()]);
        res.json({ available: result.rows.length === 0 });
    } catch (error) {
        console.error("Erro ao checar perfil:", error.message);
        res.status(500).json({ error: "Erro ao consultar banco" });
    }
});

app.post('/register', async (req, res) => {
    const { name, perfil, email, phone, password } = req.body;

    if (!name || !perfil || !email || !phone || !password) {
        return res.status(400).json({ message: 'Preencha todos os campos' });
    }

    const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!regexSenha.test(password)) {
        return res.status(400).json({ message: 'Senha não atende aos requisitos.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, perfil, email, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, perfil, email',
            [name, perfil.toLowerCase().trim(), email.toLowerCase().trim(), phone, hashedPassword]
        );

        res.status(201).json({ message: 'Usuário criado com sucesso!', user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            if (error.detail.includes('email')) {
                return res.status(400).json({ message: 'E-mail já está em uso.' });
            }
            if (error.detail.includes('perfil')) {
                return res.status(400).json({ message: 'Perfil já está ocupado.' });
            }
        }
        console.error('Erro no registro:', error.message);
        res.status(500).json({ message: 'Erro interno no servidor' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, perfil: user.perfil },
            process.env.JWT_SECRET || 'fallback_secreto_temporario',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login realizado!',
            token,
            user: { id: user.id, name: user.name, perfil: user.perfil, email: user.email }
        });
    } catch (error) {
        console.error('Erro no login:', error.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

app.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, perfil, email FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro na rota /me:', err.message);
        res.status(403).json({ message: 'Token inválido ou expirado' });
    }
});

// ============================================================
// ROTAS DE PEDIDOS
// ============================================================
app.post('/api/pedidos', async (req, res) => {
    const { cliente_nome, cliente_telefone, cliente_endereco, itens, subtotal, taxa_entrega, total, forma_pagamento } = req.body;

    if (!cliente_nome || !itens || !total) {
        return res.status(400).json({ erro: 'Dados do pedido incompletos' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO pedidos 
            (cliente_nome, cliente_whatsapp, endereco_entrega, itens, subtotal, taxa_entrega, valor_total, forma_pagamento, status, sub_status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'novos', 'aguardando') RETURNING id`,
            [cliente_nome, cliente_telefone, cliente_endereco, itens, subtotal, taxa_entrega, total, forma_pagamento]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Pedido recebido com sucesso!' });
    } catch (error) {
        console.error("Erro ao salvar pedido:", error.message);
        res.status(500).json({ erro: 'Erro ao salvar o pedido.' });
    }
});

app.get('/api/pedidos/historico', async (req, res) => {
    const { filtro } = req.query;
    let regraDeData = "";

    if (filtro === 'dia') {
        regraDeData = "AND DATE(criado_em) = CURRENT_DATE";
    } else if (filtro === 'semana') {
        regraDeData = "AND criado_em >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (filtro === 'mes') {
        regraDeData = "AND criado_em >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (filtro === 'ano') {
        regraDeData = "AND EXTRACT(YEAR FROM criado_em) = EXTRACT(YEAR FROM CURRENT_DATE)";
    }

    try {
        const result = await pool.query(
            `SELECT * FROM pedidos 
             WHERE status IN ('entregue', 'finalizado', 'cancelado') 
             ${regraDeData}
             ORDER BY criado_em DESC LIMIT 50`
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error.message);
        res.status(500).json({ erro: 'Erro ao buscar histórico' });
    }
});

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

app.put('/api/pedidos/:id/avancar', async (req, res) => {
    const { id } = req.params;
    const { status_atual, sub_status_atual } = req.body;

    let novoStatus = status_atual;
    let novoSubStatus = 'aguardando';

    try {
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

        await pool.query(
            "UPDATE pedidos SET status = $1, sub_status = $2 WHERE id = $3",
            [novoStatus, novoSubStatus, id]
        );

        res.json({ mensagem: "Status atualizado com sucesso!", novoStatus, novoSubStatus });
    } catch (erro) {
        console.error("Erro ao atualizar status:", erro.message);
        res.status(500).json({ erro: "Erro ao atualizar status no banco." });
    }
});

// ============================================================
// CRUD CATEGORIAS
// ============================================================
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

// ============================================================
// CRUD PRODUTOS
// ============================================================
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

// ============================================================
// ROTAS DO WHATSAPP
// ============================================================

// Rota de status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
    res.json({
        status: waStatus,
        qrCode: waQrCode,
        erro: null
    });
});

// Rota para desconectar
app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
        if (waStatus === 'conectado' && waClient) {
            await waClient.logout();
            waStatus = 'desconectado';
            waQrCode = null;
            res.json({ success: true, message: 'Desconectado com sucesso.' });
        } else {
            res.json({ success: false, message: 'Nenhum aparelho conectado.' });
        }
    } catch (error) {
        console.error("Erro ao desconectar:", error);
        res.status(500).json({ error: 'Falha ao desconectar.' });
    }
});

// Rota para buscar mensagens salvas
app.get('/api/whatsapp/config', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM configuracoes_whatsapp WHERE id = 1');
        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Configuração não encontrada." });
        }
        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error("❌ Erro ao buscar configurações:", erro);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

// Rota para salvar mensagens
app.put('/api/whatsapp/config', async (req, res) => {
    const { msg_novo, msg_preparo, msg_entrega } = req.body;
    try {
        await pool.query(
            `UPDATE configuracoes_whatsapp 
             SET msg_novo = $1, msg_preparo = $2, msg_entrega = $3 
             WHERE id = 1`,
            [msg_novo, msg_preparo, msg_entrega]
        );
        res.json({ mensagem: "Configurações salvas com sucesso!" });
    } catch (erro) {
        console.error("❌ Erro ao salvar configurações:", erro);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

// ============================================================
// SERVE ARQUIVOS ESTÁTICOS (ÚLTIMA ROTA - SEMPRE NO FINAL)
// ============================================================
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 Servidor RealceCardápio rodando na porta ${PORT}`);
});