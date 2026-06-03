document.addEventListener('DOMContentLoaded', () => {
    carregarMensagensDoBanco();
    configurarBotaoSalvar();
});

/**
 * Busca as mensagens gravadas no Postgres e injeta nos textareas
 */
async function carregarMensagensDoBanco() {
    try {
        // Altere para a porta 3002:
        const resposta = await fetch('http://localhost:3002/api/whatsapp/config');
        if (!resposta.ok) throw new Error("Erro ao carregar dados do servidor.");
        
        const dadosConfig = await resposta.json();
        
        // Alimenta as caixas de texto com o que veio do banco
        if (document.getElementById('msg-novo')) {
            document.getElementById('msg-novo').value = dadosConfig.msg_novo;
        }
        if (document.getElementById('msg-preparo')) {
            document.getElementById('msg-preparo').value = dadosConfig.msg_preparo;
        }
        if (document.getElementById('msg-entrega')) {
            document.getElementById('msg-entrega').value = dadosConfig.msg_entrega;
        }
    } catch (erro) {
        console.error("❌ Falha ao carregar templates do WhatsApp:", erro);
    }
}

/**
 * Captura o clique de salvar e faz o PUT para atualizar o banco
 */
function configurarBotaoSalvar() {
    const btnSalvar = document.getElementById('btn-salvar-mensagens');
    
    if (!btnSalvar) return;
    
    btnSalvar.addEventListener('click', async () => {
        // Coleta os textos atuais das caixas
        const msgNovo = document.getElementById('msg-novo').value;
        const msgPreparo = document.getElementById('msg-preparo').value;
        const msgEntrega = document.getElementById('msg-entrega').value;
        
        try {
            // Altere para a porta 3002:
            const resposta = await fetch('http://localhost:3002/api/whatsapp/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    msg_novo: msgNovo,
                    msg_preparo: msgPreparo,
                    msg_entrega: msgEntrega
                })
            });
            
            if (!resposta.ok) throw new Error("Erro ao salvar no servidor.");
            
            alert("✓ Mensagens automáticas salvas com sucesso!");
        } catch (erro) {
            console.error("❌ Erro ao salvar configurações:", erro);
            alert("Houve um erro ao tentar salvar as mensagens.");
        }
    });
}