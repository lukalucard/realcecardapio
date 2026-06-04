const { Pool } = require('pg');

// Conecta temporariamente no banco padrão 'postgres' que sempre existe
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: '725104',
    port: 5432,
    database: 'postgres' 
});

pool.query('CREATE DATABASE realce_cardapio;', (err, res) => {
    if (err) {
        if (err.code === '42P04') {
            console.log('💡 O banco "realce_cardapio" já existe!');
        } else {
            console.error('❌ Erro ao criar o banco:', err.message);
        }
    } else {
        console.log('✅ Banco de dados "realce_cardapio" criado com sucesso! 🎉');
    }
    pool.end(); // Fecha a conexão
});