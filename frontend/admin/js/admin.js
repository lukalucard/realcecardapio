document.addEventListener('DOMContentLoaded', async () => {
    
    // URL Corrigida automaticamente para o seu ambiente oficial de produção
    const API_URL = 'https://realcecardapio.onrender.com';

    /* ==========================================================================
       1. CONTROLE E TRAVA DE SEGURANÇA (LOGADO VS VISITANTE)
       ========================================================================== */
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const guestMode = localStorage.getItem('guestMode') === 'true';

    // Se não estiver logado E não for um visitante autorizado, barra o acesso
    if (!guestMode && (!token || !userJson)) {
        window.location.href = '../index.html';
        return;
    }

    const userData = userJson ? JSON.parse(userJson) : null;

    /* ==========================================================================
       2. INJEÇÃO DO COMPONENTE SIDEBAR NA TELA
       ========================================================================== */
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    try {
        const response = await fetch('components/sidebar.html');
        const html = await response.text();
        sidebarContainer.innerHTML = html;

        // Mapeamento de elementos após a injeção acontecer
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');
        const toggleIcon = document.getElementById('toggle-icon');
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.content-section');
        const userMenu = document.getElementById('userMenu');
        const userDropdown = document.getElementById('userDropdown');
        const chevronIcon = document.getElementById('chevronIcon');
        const logoutBtn = document.getElementById('logoutBtn');

        /* ==========================================================================
           3. ROTEAMENTO INTERNO E ATIVAÇÃO DE ABAS (.content-section)
           ========================================================================== */
        function ativarPagina(target) {
            navItems.forEach(item => item.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            const btnAtivo = document.querySelector(`[data-target="${target}"]`);
            const secaoAtiva = document.getElementById(target);

            if (btnAtivo) btnAtivo.classList.add('active');
            if (secaoAtiva) secaoAtiva.classList.add('active');
        }

        // Adiciona evento de clique em cada botão da sidebar
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.getAttribute('data-target');
                if (!target) return;

                localStorage.setItem('paginaAtiva', target);
                ativarPagina(target);
            });
        });

        // Restaura a aba ativa onde o usuário parou
        const paginaSalva = localStorage.getItem('paginaAtiva');
        if (paginaSalva) {
            ativarPagina(paginaSalva);
        } else {
            ativarPagina('dashboard'); // Página padrão inicial
        }

        /* ==========================================================================
           4. LÓGICA DE RECOLHER A BARRA (COMPACTAR)
           ========================================================================== */
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            if (toggleIcon) toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
            if (toggleBtn) toggleBtn.setAttribute('data-tooltip', 'Abrir menu');
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                const collapsedActive = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', collapsedActive);

                if (collapsedActive) {
                    toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
                    toggleBtn.setAttribute('data-tooltip', 'Abrir menu');
                    userDropdown.classList.remove('active'); // Fecha dropdown para não flutuar solto
                } else {
                    toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                    toggleBtn.setAttribute('data-tooltip', 'Fechar menu');
                }
            });
        }

        /* ==========================================================================
           5. ADAPTAÇÃO VISUAL DO PERFIL (AVATAR E SESSÕES INTERNAS)
           ========================================================================== */
        const guestSection = document.getElementById('guestSection');
        const userSectionA = document.getElementById('userSectionA');
        const logoutText = document.getElementById('logoutText');

        function configurarAvatarUsuario(data) {
            const avatarContainer = document.getElementById('userAvatarContainer');
            if (!avatarContainer) return;
            
            const imgElement = document.getElementById('user-display-avatar');
            const initialsElement = document.getElementById('user-initials-fallback');
            const nameDisplay = document.getElementById('userNameDisplay');

            if (data && data.name) {
                // Modo Lojista Cadastrado
                if (nameDisplay) nameDisplay.textContent = data.name;

                const inicial = data.name.charAt(0).toUpperCase();
                if (initialsElement) initialsElement.textContent = inicial;

                if (data.foto) {
                    if (imgElement) {
                        imgElement.src = data.foto;
                        imgElement.style.display = 'block';
                    }
                    if (initialsElement) initialsElement.style.display = 'none';
                    avatarContainer.style.background = 'transparent';
                } else {
                    if (imgElement) imgElement.style.display = 'none';
                    if (initialsElement) initialsElement.style.display = 'block';
                    avatarContainer.style.background = '#FF6B00';
                }
                
                if (guestSection) guestSection.style.display = 'none';
                if (userSectionA) userSectionA.style.display = 'block';
                if (logoutText) logoutText.textContent = "Sair da Conta";
            } else {
                // Modo Visitante Sem Cadastro
                if (nameDisplay) nameDisplay.textContent = "Visitante";
                if (initialsElement) initialsElement.textContent = "V";
                if (imgElement) imgElement.style.display = 'none';
                if (initialsElement) initialsElement.style.display = 'block';
                avatarContainer.style.background = '#64748b';

                if (guestSection) guestSection.style.display = 'block';
                if (userSectionA) userSectionA.style.display = 'none';
                if (logoutText) logoutText.textContent = "Voltar ao Início";
            }
        }

        // Renderiza imediatamente com os dados locais salvos no login
        configurarAvatarUsuario(userData);

        /* ==========================================================================
           6. GERENCIAMENTO DA JANELA FLUTUANTE (OPEN / CLOSE DROPDOWN)
           ========================================================================== */
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                if (sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed'); // Expande a barra ao clicar se tiver fechada
                    if (toggleIcon) toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                }
                userDropdown.classList.toggle('active');
                if (chevronIcon) {
                    if (userDropdown.classList.contains('active')) {
                        chevronIcon.style.transform = 'rotate(180deg)';
                    } else {
                        chevronIcon.style.transform = 'rotate(0deg)';
                    }
                }
            });
        }

        document.addEventListener('click', () => {
            if (userDropdown) userDropdown.classList.remove('active');
            if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
        });

        if (userDropdown) {
            userDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        /* ==========================================================================
           7. SISTEMA DE DESCONEXÃO E SAÍDA (LOGOUT)
           ========================================================================== */
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('paginaAtiva');
                localStorage.removeItem('guestMode');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '../index.html';
            });
        }

        // Redirecionamento dos links internos de visitantes para a home
        document.getElementById('btn-dropdown-register').addEventListener('click', () => {
            window.location.href = '../index.html?action=register';
        });
        document.getElementById('btn-dropdown-login').addEventListener('click', () => {
            window.location.href = '../index.html?action=login';
        });

        /* ==========================================================================
           8. SESSÃO EXTRA: VERIFICAÇÃO DE ASSINATURA EM TEMPO REAL NO NEON
           ========================================================================== */
        if (token && userData) {
            try {
                const res = await fetch(`${API_URL}/me`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const freshData = await res.json();
                    configurarAvatarUsuario(freshData); // Atualiza com dados atualizados do Postgres
                } else if (res.status === 401) {
                    localStorage.clear();
                    window.location.href = '../index.html';
                }
            } catch (error) {
                console.log("Servidor offline ou instável, mantendo cache local de segurança.");
            }
        }

    } catch (error) {
        console.error("Erro crítico no carregamento do ecossistema administrativo:", error);
    }
});