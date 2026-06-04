const { Pool } = require('pg');

let pool;

// 1. Se estiver no Render, ele usa a URL de produção automaticamente
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    // 2. Ambiente local (Seu computador com as credenciais resgatadas)
    pool = new Pool({
        user: 'postgres', 
        host: 'localhost',
        database: 'realce_cardapio',
        password: '725104',
        port: 5432
    });
}

// Teste de conexão ao iniciar o servidor
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados PostgreSQL:', err.message);
    } else {
        console.log('🔌 Banco de Dados PostgreSQL conectado com sucesso!');
    }
});

module.exports = pool;