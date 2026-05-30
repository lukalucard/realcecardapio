// ==========================================================================
// LÓGICA DO GESTOR DE PEDIDOS (KANBAN & SUBMENU)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarSubmenu();
    carregarPedidosDoBanco();
});

/**
 * 1. Controla a troca de abas (Submenu Superior)
 */
function inicializarSubmenu() {
    const botoesMenu = document.querySelectorAll('.tab-link');
    const painelKanban = document.getElementById('painel-kanban');
    const painelHistorico = document.getElementById('painel-historico');

    botoesMenu.forEach(botao => {
        botao.addEventListener('click', () => {
            // Remove a classe ativa de todos os botões
            botoesMenu.forEach(b => b.classList.remove('active'));
            
            // Adiciona a classe ativa no botão clicado
            botao.classList.add('active');

            const origemSelecionada = botao.getAttribute('data-origem');

            if (origemSelecionada === 'historico') {
                // Se clicar em Histórico, esconde o Kanban e mostra a tabela
                painelKanban.style.display = 'none';
                painelHistorico.style.display = 'block';
                buscarHistoricoBanco();
            } else {
                // Se clicar em Delivery ou Balcão, mostra o Kanban e esconde o histórico
                painelKanban.style.display = 'grid';
                painelHistorico.style.display = 'none';
                
                // Aqui no futuro vamos filtrar os cards na tela por origem:
                // delivery (com entrega) ou balcao (retirada/mesa)
                filtrarCardsPorOrigem(origemSelecionada);
            }
        });
    });

    // --- LÓGICA COMPLEMENTAR: Filtros do Histórico Geral ---
    const botoesFiltroTempo = document.querySelectorAll('.btn-filtro');
    botoesFiltroTempo.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesFiltroTempo.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const periodo = btn.getAttribute('data-periodo');
            console.log(`📅 Filtrando histórico pelo período: ${periodo}`);
            // Futuro: chamar a rota enviando o período selecionado
        });
    });
}

/**
 * 2. Função (Simulação por enquanto) para buscar dados do Backend/PostgreSQL
 */
function carregarPedidosDoBanco() {
    console.log("🔄 Buscando novos pedidos no PostgreSQL...");
    // Em breve faremos o fetch() para a rota do backend aqui
}

/**
 * 3. Função para buscar o histórico de pedidos finalizados
 */
function buscarHistoricoBanco() {
    console.log("📜 Carregando histórico de pedidos do dia...");
    // Em breve faremos o fetch() para puxar os pedidos com status 'Entregue' ou 'Cancelado'
}

/**
 * 4. Filtra os cards visíveis no Kanban com base na aba (Delivery ou Balcão)
 */
function filtrarCardsPorOrigem(origem) {
    console.log(`📌 Filtrando painel para mostrar apenas: ${origem}`);
    // Lógica para esconder/mostrar os cards baseado no tipo de entrega
}