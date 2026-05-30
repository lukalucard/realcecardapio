const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: '725104',
    host: '127.0.0.1',
    port: 5432,
    database: 'realcecardapio',
    ssl: false
});

// Teste de conexão inicial
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Erro ao conectar ao banco de dados PostgreSQL:', err.stack);
    }
    console.log('🔌 Banco de Dados PostgreSQL conectado com sucesso!');
    release();
});

module.exports = pool;