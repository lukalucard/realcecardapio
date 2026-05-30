const API_BASE = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', () => {
    inicializarMenu();
    carregarDadosDashboard();

    // Evento de submit do filtro
    const formFiltros = document.getElementById('form-filtros');
    if (formFiltros) {
        formFiltros.addEventListener('submit', (e) => {
            e.preventDefault();
            carregarDadosDashboard(); // Recarrega os dados aplicando os filtros selecionados
        });
    }
});

// 1. Gerenciamento inteligente e dinâmico do Menu Lateral
function inicializarMenu() {
    let currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === '' || currentPage === 'index.html' || currentPage === '/') {
        currentPage = 'dashboard.html'; // Padrão se cair na raiz do sistema
    }

    const menuLinks = document.querySelectorAll('.menu-nav a');
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const parentLi = link.closest('li');
        if (!parentLi) return;

        if (href === currentPage || currentPage.endsWith(href)) {
            parentLi.classList.add('active');
        } else {
            parentLi.classList.remove('active');
        }
    });
}

// 2. Conectando com a API para trazer dados em tempo real
async function carregarDadosDashboard() {
    const periodo = document.getElementById('periodo').value;
    const horaInicio = document.getElementById('hora_inicio').value;
    const horaFim = document.getElementById('hora_fim').value;

    try {
        // Exemplo de requisição enviando filtros por query string para sua API futura de relatórios
        // const response = await fetch(`${API_BASE}/relatorios?periodo=${periodo}&inicio=${horaInicio}&fim=${horaFim}`);
        
        // Simulando a resposta da API enquanto você popula a tabela de pedidos no banco
        const dadosSimulados = {
            faturamento: 3450.80,
            ticketMedio: 45.40,
            totalPedidos: 76,
            maisVendidos: [
                { nome: 'Pizza Calabresa', qtd: 42, total: 1680.00 },
                { nome: 'Burguer Duplo Crispy', qtd: 28, total: 980.00 },
                { nome: 'Batata Frita Suprema', qtd: 19, total: 475.00 }
            ]
        };

        // Atualizando a interface dinamicamente
        document.getElementById('faturamento-total').innerText = `R$ ${dadosSimulados.faturamento.toFixed(2).replace('.', ',')}`;
        document.getElementById('ticket-medio').innerText = `R$ ${dadosSimulados.ticketMedio.toFixed(2).replace('.', ',')}`;
        document.getElementById('total-pedidos').innerText = dadosSimulados.totalPedidos;

        // Renderizando a lista de produtos mais vendidos dinamicamente
        const listaContainer = document.getElementById('lista-mais-vendidos');
        if (dadosSimulados.maisVendidos.length === 0) {
            listaContainer.innerHTML = '<p class="empty-message"><i class="fas fa-box-open"></i> Nenhum produto vendido no período</p>';
        } else {
            listaContainer.innerHTML = '';
            dadosSimulados.maisVendidos.forEach(prod => {
                const item = document.createElement('div');
                item.className = 'item-mais-vendido';
                item.innerHTML = `
                    <span class="prod-nome"><strong>${prod.qtd}x</strong> ${prod.nome}</span>
                    <span class="prod-total">R$ ${prod.total.toFixed(2).replace('.', ',')}</span>
                `;
                listaContainer.appendChild(item);
            });
        }

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        document.getElementById('lista-mais-vendidos').innerHTML = '<p class="empty-message">Erro ao carregar dados do servidor.</p>';
    }
}