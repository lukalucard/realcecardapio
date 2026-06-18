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
            sidebarContainer.innerHTML = cachedHTML;
            inicializarMecanismosSidebar();
        } else {
            carregarSidebarDoServidor();
        }
    }

    async function carregarSidebarDoServidor() {
        try {
            const response = await fetch('components/sidebar.html');
            const html = await response.text();
            
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

        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && sidebar) {
            sidebar.classList.add('collapsed');
            if (toggleIcon) toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
            if (toggleBtn) toggleBtn.setAttribute('data-tooltip', 'Abrir menu');
        }

        const currentPath = window.location.pathname;
        const currentPage = currentPath.split("/").pop(); 

        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if (currentPage === linkHref) {
                link.classList.add('active');
            }
        });

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

        configurarDadosDoPerfil();

        // Controle do Dropdown Flutuante do Usuário (Sem forçar a abertura da barra)
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // REMOVIDO: Tiramos o código que dava classList.remove('collapsed')
                
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

        // CORREÇÃO CIRÚRGICA AQUI: Envelopando a chamada assíncrona do Neon corretamente
        if (token && userData) {
            sincronizarDadosComServidor();
        }

        /* ==========================================================================
        INTERCEPTADOR DE MODAL DA SIDEBAR PARA A LANDING PAGE
   ========================================================================== */
        const modalTriggers = document.querySelectorAll('[data-trigger-modal]');

        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                // Pega o tipo do modal: 'login' ou 'register'
                const modalType = trigger.getAttribute('data-trigger-modal');
                
                // Salva a instrução na memória para a Landing Page ler logo em seguida
                localStorage.setItem('openModalTarget', modalType);
            });
        });
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
       6. SINCRO ASSÍNCRONA DE DADOS COM O NEON (CORRIGIDO COM ASYNC)
       ========================================================================== */
    async function sincronizarDadosComServidor() {
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
    
    /**
     * DISPARA UM MODAL DE ALERTA PERSONALIZADO PARA VISITANTES
     * @param {string} mensagem - Texto que será exibido no modal
     * @param {string} iconClass - Classe do Font Awesome (ex: 'fas fa-lock')
     */
    function mostrarAlertaVisitante(mensagem, iconClass = 'fas fa-lock') {
        // Evita duplicar o modal caso já exista um aberto
        if (document.querySelector('.custom-alert-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';

        // Ajuste as URLs abaixo dependendo de onde sua página de login/cadastro está (ex: '../index.html')
        const urlDestino = '../index.html'; 

        overlay.innerHTML = `
            <div class="custom-alert-box">
                <div class="custom-alert-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="custom-alert-text">${mensagem}</div>
                <div class="custom-alert-buttons">
                    <a href="${urlDestino}" class="custom-alert-btn btn-alert-login">Já tenho conta</a>
                    <a href="${urlDestino}" class="custom-alert-btn btn-alert-register">Cadastrar Grátis</a>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }
});