const API_BASE = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', () => {
    inicializarMenu();
    carregarDadosDashboard();

    // Evento de submit do filtro (Com checagem de segurança)
    const formFiltros = document.getElementById('form-filtros');
    if (formFiltros) {
        formFiltros.addEventListener('submit', (e) => {
            e.preventDefault();
            carregarDadosDashboard(); 
        });
    }
});

// 1. Gerenciamento inteligente e dinâmico do Menu Lateral
function inicializarMenu() {
    let currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === '' || currentPage === 'index.html' || currentPage === '/') {
        currentPage = 'dashboard.html'; 
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

// 2. Conectando com a API para trazer dados em tempo real (TRAVADO CONTRA ERROS)
async function carregarDadosDashboard() {
    // Pegamos os elementos primeiro
    const elPeriodo = document.getElementById('periodo');
    const elHoraInicio = document.getElementById('hora_inicio');
    const elHoraFim = document.getElementById('hora_fim');

    // SEGURANÇA: Se não existirem na página atual (como em pedidos.html), interrompe a função sem quebrar o sistema
    if (!elPeriodo || !elHoraInicio || !elHoraFim) {
        return; 
    }

    // Se eles existem, segue o fluxo normal com segurança
    const periodo = elPeriodo.value;
    const horaInicio = elHoraInicio.value;
    const horaFim = elHoraFim.value;

    try {
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

        // Elementos de texto das caixas de relatório
        const elFaturamento = document.getElementById('faturamento-total');
        const elTicket = document.getElementById('ticket-medio');
        const elTotal = document.getElementById('total-pedidos');

        if (elFaturamento) elFaturamento.innerText = `R$ ${dadosSimulados.faturamento.toFixed(2).replace('.', ',')}`;
        if (elTicket) elTicket.innerText = `R$ ${dadosSimulados.ticketMedio.toFixed(2).replace('.', ',')}`;
        if (elTotal) elTotal.innerText = dadosSimulados.totalPedidos;

        // Renderizando a lista de produtos mais vendidos dinamicamente
        const listaContainer = document.getElementById('lista-mais-vendidos');
        if (listaContainer) {
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
        }

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        const listaContainer = document.getElementById('lista-mais-vendidos');
        if (listaContainer) {
            listaContainer.innerHTML = '<p class="empty-message">Erro ao carregar dados do servidor.</p>';
        }
    }
}