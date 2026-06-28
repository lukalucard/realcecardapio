document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM do WhatsApp carregado!');
    
    inicializarAbas();
    carregarMensagensDoBanco();
    configurarBotaoSalvar();
    iniciarRadarWhatsApp();
    configurarBotaoDesconectar();
});

function inicializarAbas() {
    const botoesAba = document.querySelectorAll('.tab-btn');
    const conteudosAba = document.querySelectorAll('.whatsapp-tab-content');

    botoesAba.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesAba.forEach(b => b.classList.remove('active'));
            conteudosAba.forEach(c => c.style.display = 'none');

            botao.classList.add('active');
            const alvoId = botao.getAttribute('data-tab');
            const conteudo = document.getElementById(alvoId);
            if (conteudo) conteudo.style.display = 'block';
        });
    });
}

function iniciarRadarWhatsApp() {
    const statusBadge = document.getElementById('whatsapp-status-global');
    const qrcodeArea = document.getElementById('qrcode-area');
    const btnDesconectar = document.getElementById('btn-desconectar');

    if (!statusBadge || !qrcodeArea) {
        console.error('❌ Elementos do WhatsApp não encontrados!');
        return;
    }

    async function checarStatus() {
        try {
            const resposta = await fetch('/api/whatsapp/status');
            
            if (!resposta.ok) {
                throw new Error(`HTTP ${resposta.status}`);
            }
            
            const dados = await resposta.json();
            console.log('📡 Status:', dados.status, 'QR Code:', !!dados.qrCode);

            // Atualiza o badge de status
            if (dados.status === 'conectado') {
                statusBadge.className = 'status-badge-conectado';
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Sincronizado e Ativo';
                if (btnDesconectar) btnDesconectar.disabled = false;
                
                qrcodeArea.innerHTML = `
                    <div class="qrcode-placeholder" style="color: #10b981;">
                        <i class="fas fa-mobile-alt" style="font-size: 3rem;"></i>
                        <span style="font-weight: 600;">✅ Aparelho Conectado!</span>
                        <p style="font-size: 0.9rem; color: #64748b; margin-top: 8px;">
                            WhatsApp sincronizado com sucesso!
                        </p>
                    </div>
                `;
                return;
            }

            // ÁREA DO QR CODE 
            if (dados.qrCode) {
                statusBadge.className = 'status-badge-desconectado';
                statusBadge.innerHTML = '<i class="fas fa-circle"></i> Aguardando Leitura do QR Code';
                if (btnDesconectar) btnDesconectar.disabled = true;
                
                qrcodeArea.innerHTML = `
                    <img src="${dados.qrCode}" alt="QR Code do WhatsApp" style="width: 100%; height: 100%; object-fit: contain; display: block;">
                `;
                return;
            }

            // Fallback: aguardando
            statusBadge.className = 'status-badge-desconectado';
            statusBadge.innerHTML = '<i class="fas fa-circle"></i> Aguardando Conexão';
            if (btnDesconectar) btnDesconectar.disabled = true;

            qrcodeArea.innerHTML = `
                <div class="qrcode-placeholder">
                    <i class="fas fa-sync-alt fa-spin" style="font-size: 2.5rem; color: #FF6B00;"></i>
                    <span>Gerando código seguro...</span>
                </div>
            `;

        } catch (erro) {
            console.error('❌ Erro:', erro);
            qrcodeArea.innerHTML = `
                <div class="qrcode-placeholder" style="color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem;"></i>
                    <span>⚠️ Erro de conexão</span>
                </div>
            `;
        }
    }

    // Executa imediatamente e depois a cada 3 segundos
    checarStatus();
    setInterval(checarStatus, 3000);
}

function configurarBotaoDesconectar() {
    const btnDesconectar = document.getElementById('btn-desconectar');
    if (!btnDesconectar) return;

    btnDesconectar.addEventListener('click', async () => {
        if (!confirm("Tem certeza que deseja desconectar?")) return;

        btnDesconectar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Desconectando...';
        btnDesconectar.disabled = true;

        try {
            const resposta = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
            const dados = await resposta.json();
            alert(dados.success ? "Desconectado!" : dados.message);
        } catch (erro) {
            alert("Erro ao desconectar.");
        } finally {
            btnDesconectar.innerHTML = '<i class="fas fa-unlink"></i> Desconectar Aparelho';
            btnDesconectar.disabled = false;
        }
    });
}

async function carregarMensagensDoBanco() {
    try {
        const resposta = await fetch('/api/whatsapp/config');
        if (!resposta.ok) throw new Error("Erro ao carregar");
        
        const dados = await resposta.json();
        
        const msgNovo = document.getElementById('msg-novo');
        const msgPreparo = document.getElementById('msg-preparo');
        const msgEntrega = document.getElementById('msg-entrega');
        
        if (msgNovo) msgNovo.value = dados.msg_novo || '';
        if (msgPreparo) msgPreparo.value = dados.msg_preparo || '';
        if (msgEntrega) msgEntrega.value = dados.msg_entrega || '';
    } catch (erro) {
        console.error('❌ Erro ao carregar mensagens:', erro);
    }
}

function configurarBotaoSalvar() {
    const btnSalvar = document.getElementById('btn-salvar-mensagens');
    if (!btnSalvar) return;
    
    btnSalvar.addEventListener('click', async () => {
        const msgNovo = document.getElementById('msg-novo')?.value || '';
        const msgPreparo = document.getElementById('msg-preparo')?.value || '';
        const msgEntrega = document.getElementById('msg-entrega')?.value || '';
        
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnSalvar.disabled = true;

        try {
            const resposta = await fetch('/api/whatsapp/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ msg_novo, msg_preparo, msg_entrega })
            });
            
            if (!resposta.ok) throw new Error("Erro ao salvar");
            
            alert("✅ Mensagens salvas com sucesso!");
        } catch (erro) {
            alert("❌ Erro ao salvar mensagens.");
        } finally {
            btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar Mensagens';
            btnSalvar.disabled = false;
        }
    });
}