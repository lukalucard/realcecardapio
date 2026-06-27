document.addEventListener('DOMContentLoaded', () => {
    inicializarAbas();
    carregarMensagensDoBanco();
    configurarBotaoSalvar();
});

/* ==========================================================================
   MOTOR DE ABAS (TABS)
   ========================================================================== */
function inicializarAbas() {
    const botoesAba = document.querySelectorAll('.tab-btn');
    const conteudosAba = document.querySelectorAll('.whatsapp-tab-content');

    botoesAba.forEach(botao => {
        botao.addEventListener('click', () => {
            // Remove 'active' de todos os botões e oculta todos os conteúdos
            botoesAba.forEach(b => b.classList.remove('active'));
            conteudosAba.forEach(c => c.style.display = 'none');

            // Adiciona 'active' no botão clicado e mostra o conteúdo dele
            botao.classList.add('active');
            const alvoId = botao.getAttribute('data-tab');
            document.getElementById(alvoId).style.display = 'block';
        });
    });
}

/* ==========================================================================
   BANCO DE DADOS: MENSAGENS AUTOMÁTICAS
   ========================================================================== */
async function carregarMensagensDoBanco() {
    try {
        const resposta = await fetch('/api/whatsapp/config');
        if (!resposta.ok) throw new Error("Erro ao carregar dados do servidor.");
        
        const dadosConfig = await resposta.json();
        
        if (document.getElementById('msg-novo')) {
            document.getElementById('msg-novo').value = dadosConfig.msg_novo || '';
        }
        if (document.getElementById('msg-preparo')) {
            document.getElementById('msg-preparo').value = dadosConfig.msg_preparo || '';
        }
        if (document.getElementById('msg-entrega')) {
            document.getElementById('msg-entrega').value = dadosConfig.msg_entrega || '';
        }
    } catch (erro) {
        console.error("❌ Falha ao carregar templates do WhatsApp:", erro);
    }
}

function configurarBotaoSalvar() {
    const btnSalvar = document.getElementById('btn-salvar-mensagens');
    if (!btnSalvar) return;
    
    btnSalvar.addEventListener('click', async () => {
        const msgNovo = document.getElementById('msg-novo').value;
        const msgPreparo = document.getElementById('msg-preparo').value;
        const msgEntrega = document.getElementById('msg-entrega').value;
        
        const textoOriginal = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnSalvar.disabled = true;

        try {
            const resposta = await fetch('/api/whatsapp/config', {
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
        } finally {
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;
        }
    });
}