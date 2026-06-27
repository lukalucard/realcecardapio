document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM do WhatsApp carregado!');
    
    inicializarAbas();
    carregarMensagensDoBanco();
    configurarBotaoSalvar();
    iniciarRadarWhatsApp();
    configurarBotaoDesconectar();
});

/* ==========================================================================
   MOTOR DE ABAS (TABS)
   ========================================================================== */
function inicializarAbas() {
    const botoesAba = document.querySelectorAll('.tab-btn');
    const conteudosAba = document.querySelectorAll('.whatsapp-tab-content');

    console.log('📌 Abas encontradas:', botoesAba.length);

    botoesAba.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesAba.forEach(b => b.classList.remove('active'));
            conteudosAba.forEach(c => c.style.display = 'none');

            botao.classList.add('active');
            const alvoId = botao.getAttribute('data-tab');
            document.getElementById(alvoId).style.display = 'block';
        });
    });
}

/* ==========================================================================
   RADAR DO WHATSAPP (MONITORAMENTO EM TEMPO REAL)
   ========================================================================== */
function iniciarRadarWhatsApp() {
    const statusBadge = document.getElementById('whatsapp-status-global');
    const qrcodeArea = document.getElementById('qrcode-area');
    const btnDesconectar = document.getElementById('btn-desconectar');

    console.log('📡 Iniciando radar WhatsApp...');
    console.log('📌 Elementos encontrados:', {
        statusBadge: !!statusBadge,
        qrcodeArea: !!qrcodeArea,
        btnDesconectar: !!btnDesconectar
    });

    // Se os elementos não existirem, não continua
    if (!statusBadge || !qrcodeArea) {
        console.error('❌ Elementos do WhatsApp não encontrados no DOM!');
        return;
    }

    const checarStatus = async () => {
        try {
            console.log('🔄 Buscando status do WhatsApp...');
            const resposta = await fetch('/api/whatsapp/status');
            const dados = await resposta.json();
            
            console.log('📡 Status recebido:', dados);

            if (dados.status === 'conectado') {
                statusBadge.className = 'status-badge-conectado';
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Sincronizado e Ativo';
                if (btnDesconectar) btnDesconectar.disabled = false;
                
                qrcodeArea.innerHTML = `
                    <div class="qrcode-placeholder" style="color: #10b981;">
                        <i class="fas fa-mobile-alt" style="font-size: 3rem;"></i>
                        <span style="font-weight: 600;">Aparelho Conectado!</span>
                        <p style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">Seu sistema já está pronto para enviar mensagens.</p>
                    </div>
                `;
            } else if (dados.status === 'aguardando_qr' && dados.qrCode) {
                statusBadge.className = 'status-badge-desconectado';
                statusBadge.innerHTML = '<i class="fas fa-circle"></i> Aguardando Leitura do QR Code';
                if (btnDesconectar) btnDesconectar.disabled = true;
                
                qrcodeArea.innerHTML = `
                    <img src="${dados.qrCode}" alt="QR Code do WhatsApp" style="width: 100%; height: 100%; object-fit: contain;">
                    <p style="text-align: center; margin-top: 10px; font-size: 0.9rem; color: #6b7280;">
                        📱 Abra o WhatsApp no celular, vá em <strong>Aparelhos conectados</strong> e escaneie
                    </p>
                `;
            } else {
                statusBadge.className = 'status-badge-desconectado';
                statusBadge.innerHTML = '<i class="fas fa-circle"></i> Aguardando Conexão';
                if (btnDesconectar) btnDesconectar.disabled = true;

                qrcodeArea.innerHTML = `
                    <div class="qrcode-placeholder">
                        <i class="fas fa-sync-alt fa-spin" style="font-size: 2.5rem; color: #FF6B00;"></i>
                        <span>Gerando código seguro...</span>
                    </div>
                `;
            }
        } catch (erro) {
            console.error("❌ Erro ao checar status do WhatsApp:", erro);
            qrcodeArea.innerHTML = `
                <div class="qrcode-placeholder" style="color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem;"></i>
                    <span>⚠️ Erro de conexão com o servidor</span>
                    <p style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">
                        Verifique se o backend está rodando em: 
                        <a href="/api/test" target="_blank">/api/test</a>
                    </p>
                </div>
            `;
        }
    };

    checarStatus();
    setInterval(checarStatus, 3000);
}

/* ==========================================================================
   BOTÃO DE DESCONECTAR O APARELHO
   ========================================================================== */
function configurarBotaoDesconectar() {
    const btnDesconectar = document.getElementById('btn-desconectar');
    if (!btnDesconectar) return;

    btnDesconectar.addEventListener('click', async () => {
        const confirmar = confirm("Tem certeza que deseja desconectar o WhatsApp do sistema?");
        if (!confirmar) return;

        const textoOriginal = btnDesconectar.innerHTML;
        btnDesconectar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Desconectando...';
        btnDesconectar.disabled = true;

        try {
            const resposta = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
            const dados = await resposta.json();
            
            if (dados.success) {
                alert("Aparelho desconectado! O sistema vai gerar um novo QR Code.");
            } else {
                alert(dados.message);
            }
        } catch (erro) {
            alert("Erro ao tentar desconectar.");
        } finally {
            btnDesconectar.innerHTML = textoOriginal;
        }
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