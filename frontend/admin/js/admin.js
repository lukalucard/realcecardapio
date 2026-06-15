document.addEventListener('DOMContentLoaded', () => {
    
    const API_URL = 'https://realcecardapio.onrender.com';
    const sidebarContainer = document.getElementById('sidebar-container');

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
       2. CONTROLE INSTANTÂNEO DE LAYOUT (ANTI-PULO)
       ========================================================================== */
    if (sidebarContainer) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebarContainer.classList.add('collapsed');
        }
    }

    /* ==========================================================================
       3. ESTRATÉGIA DE CACHE LOCAL (ANTI-PISCADA BRANCA)
       ========================================================================== */
    if (sidebarContainer) {
        const cachedHTML = localStorage.getItem('sidebarTemplateCache');
        
        if (cachedHTML) {
            // Se tiver cache, injeta na velocidade da luz
            sidebarContainer.innerHTML = cachedHTML;
            inicializarMecanismosSidebar();
        } else {
            // Se for a primeira vez do usuário, busca do servidor e salva no cache
            carregarSidebarDoServidor();
        }
    }

    async function carregarSidebarDoServidor() {
        try {
            const response = await fetch('components/sidebar.html');
            const html = await response.text();
            
            // Grava no cache do navegador para os próximos cliques
            localStorage.setItem('sidebarTemplateCache', html);
            
            sidebarContainer.innerHTML = html;
            inicializarMecanismosSidebar();
        } catch (error) {
            console.error("Erro ao buscar a sidebar do servidor:", error);
        }
    }

    /* ==========================================================================
       4. ATIVAÇÃO DOS DIRECIONAMENTOS E EVENTOS DA SIDEBAR
       ========================================================================== */
    function inicializarMecanismosSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');
        const toggleIcon = document.getElementById('toggle-icon');
        const userMenu = document.getElementById('userMenu');
        const userDropdown = document.getElementById('userDropdown');
        const chevronIcon = document.getElementById('chevronIcon');
        const logoutBtn = document.getElementById('logoutBtn');
        const navLinks = document.querySelectorAll('.nav-item');

        // Sincroniza a classe de recolhimento na tag interna <aside>
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && sidebar) {
            sidebar.classList.add('collapsed');
            if (toggleIcon) toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
            if (toggleBtn) toggleBtn.setAttribute('data-tooltip', 'Abrir menu');
        }

        // Roteamento de Destaque das Abas Ativas
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split("/").pop(); 

        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if (currentPage === linkHref) {
                link.classList.add('active');
            }
        });

        // Evento do Botão de Recolher/Abrir
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                sidebarContainer.classList.toggle('collapsed');
                
                const collapsedActive = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', collapsedActive);

                if (collapsedActive) {
                    if (toggleIcon) toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
                    toggleBtn.setAttribute('data-tooltip', 'Abrir menu');
                    if (userDropdown) userDropdown.classList.remove('active'); 
                } else {
                    if (toggleIcon) toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                    toggleBtn.setAttribute('data-tooltip', 'Recolher Menu');
                }
            });
        }

        // Configuração dinâmica do perfil do usuário
        configurarDadosDoPerfil();

        // Controle do Dropdown Flutuante do Usuário
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                if (sidebar && sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed');
                    sidebarContainer.classList.remove('collapsed');
                    localStorage.setItem('sidebarCollapsed', 'false');
                    if (toggleIcon) toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                }
                if (userDropdown) userDropdown.classList.toggle('active');
                if (chevronIcon && userDropdown) {
                    chevronIcon.style.transform = userDropdown.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        }

        document.addEventListener('click', () => {
            if (userDropdown) userDropdown.classList.remove('active');
            if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
        });

        if (userDropdown) {
            userDropdown.addEventListener('click', (e) => e.stopPropagation());
        }

        // Eventos de saída e redirecionamentos de login/cadastro dentro do menu
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = '../index.html';
            });
        }

        const btnReg = document.getElementById('btn-dropdown-register');
        if (btnReg) {
            btnReg.addEventListener('click', () => {
                window.location.href = '../index.html?action=register';
            });
        }

        const btnLog = document.getElementById('btn-dropdown-login');
        if (btnLog) {
            btnLog.addEventListener('click', () => {
                window.location.href = '../index.html?action=login';
            });
        }
    }

    /* ==========================================================================
       5. MONTAGEM DO VISUAL DO PERFIL (VISITANTE VS CADASTRADO)
       ========================================================================== */
    function configurarDadosDoPerfil() {
        const guestSection = document.getElementById('guestSection');
        const userSectionA = document.getElementById('userSectionA');
        const logoutText = document.getElementById('logoutText');
        const avatarContainer = document.getElementById('userAvatarContainer');
        const imgElement = document.getElementById('user-display-avatar');
        const initialsElement = document.getElementById('user-initials-fallback');
        const nameDisplay = document.getElementById('userNameDisplay');

        if (userData && userData.name) {
            if (nameDisplay) nameDisplay.textContent = userData.name;
            if (initialsElement) initialsElement.textContent = userData.name.charAt(0).toUpperCase();

            if (userData.foto) {
                if (imgElement) {
                    imgElement.src = userData.foto;
                    imgElement.style.display = 'block';
                }
                if (initialsElement) initialsElement.style.display = 'none';
                if (avatarContainer) avatarContainer.style.background = 'transparent';
            } else {
                if (imgElement) imgElement.style.display = 'none';
                if (initialsElement) initialsElement.style.display = 'block';
                if (avatarContainer) avatarContainer.style.background = '#FF9F4A';
            }
            
            if (guestSection) guestSection.style.display = 'none';
            if (userSectionA) userSectionA.style.display = 'block';
            if (logoutText) logoutText.textContent = "Sair da Conta";
        } else {
            if (nameDisplay) nameDisplay.textContent = "Visitante";
            if (initialsElement) initialsElement.textContent = "V";
            if (imgElement) imgElement.style.display = 'none';
            if (initialsElement) initialsElement.style.display = 'block';
            if (avatarContainer) avatarContainer.style.background = '#64748b';

            if (guestSection) guestSection.style.display = 'block';
            if (userSectionA) userSectionA.style.display = 'none';
            if (logoutText) logoutText.textContent = "Voltar ao Início";
        }
    }

    /* ==========================================================================
       6. SINCRO ASSÍNCRONA DE DADOS COM O NEON (BACKEND)
       ========================================================================== */
    if (token && userData) {
        try {
            const res = await fetch(`${API_URL}/me`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const freshData = await res.json();
                localStorage.setItem('user', JSON.stringify(freshData));
                configurarDadosDoPerfil(); 
            } else if (res.status === 401) {
                localStorage.clear();
                window.location.href = '../index.html';
            }
        } catch (error) {
            console.log("Servidor em standby. Mantendo dados locais.");
        }
    }
});