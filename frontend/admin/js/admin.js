document.addEventListener('DOMContentLoaded', async () => {
    
    const API_URL = 'https://realcecardapio.onrender.com';

    /* ==========================================================================
       1. VERIFICAÇÃO E TRAVA DE ACESSO (SEGURANÇA ATIVA)
       ========================================================================== */
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const guestMode = localStorage.getItem('guestMode') === 'true';

    if (!guestMode && (!token || !userJson)) {
        window.location.href = '../index.html';
        return;
    }

    const userData = userJson ? JSON.parse(userJson) : null;

    /* ==========================================================================
       2. INJEÇÃO DINÂMICA DA SIDEBAR GLOBAL
       ========================================================================== */
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    try {
        const response = await fetch('components/sidebar.html');
        const html = await response.text();
        sidebarContainer.innerHTML = html;

        // Mapeamento dos elementos após renderizar na tela
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');
        const toggleIcon = document.getElementById('toggle-icon');
        const userMenu = document.getElementById('userMenu');
        const userDropdown = document.getElementById('userDropdown');
        const chevronIcon = document.getElementById('chevronIcon');
        const logoutBtn = document.getElementById('logoutBtn');
        const navLinks = document.querySelectorAll('.nav-item');

        /* ==========================================================================
           3. SISTEMA DE ABA ATIVA AUTOMÁTICA (ROTEAMENTO MULTI-PÁGINAS)
           ========================================================================== */
        // Lê a URL atual do navegador (Ex: "cardapio.html")
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split("/").pop(); 

        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            
            // Se o link bater com a página atual, ele ganha o destaque roxo/laranja
            if (currentPage === linkHref) {
                link.classList.add('active');
            }
        });

        /* ==========================================================================
           4. MECANISMO DE RECOLHER/EXPANDIR MENU (PERSISTENTE)
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
                    if (toggleIcon) toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
                    toggleBtn.setAttribute('data-tooltip', 'Abrir menu');
                    userDropdown.classList.remove('active'); 
                } else {
                    if (toggleIcon) toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                    toggleBtn.setAttribute('data-tooltip', 'Recolher Menu');
                }
            });
        }

        /* ==========================================================================
           5. ADAPTAÇÃO INTERNA DO PERFIL DO USUÁRIO
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
                    avatarContainer.style.background = '#FF9F4A';
                }
                
                if (guestSection) guestSection.style.display = 'none';
                if (userSectionA) userSectionA.style.display = 'block';
                if (logoutText) logoutText.textContent = "Sair da Conta";
            } else {
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

        configurarAvatarUsuario(userData);

        /* ==========================================================================
           6. CONTROLE DA JANELA FLUTUANTE DROPDOWN (OPEN / CLOSE)
           ========================================================================== */
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                if (sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed');
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
           7. FLUXO DE DESCONEXÃO (LOGOUT)
           ========================================================================== */
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = '../index.html';
            });
        }

        document.getElementById('btn-dropdown-register').addEventListener('click', () => {
            window.location.href = '../index.html?action=register';
        });
        document.getElementById('btn-dropdown-login').addEventListener('click', () => {
            window.location.href = '../index.html?action=login';
        });

        /* ==========================================================================
           8. ATUALIZAÇÃO ASSÍNCRONA DE DADOS COM O NEON (POSTGRESQL)
           ========================================================================== */
        if (token && userData) {
            try {
                const res = await fetch(`${API_URL}/me`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const freshData = await res.json();
                    configurarAvatarUsuario(freshData); 
                } else if (res.status === 401) {
                    localStorage.clear();
                    window.location.href = '../index.html';
                }
            } catch (error) {
                console.log("Servidor em standby ou offline, mantendo dados locais de segurança.");
            }
        }

    } catch (error) {
        console.error("Erro crítico na inicialização do painel administrativo:", error);
    }
});