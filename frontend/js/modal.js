document.addEventListener('DOMContentLoaded', () => {
    // CORRIGIDO: Agora apontando para o servidor certo do RealceCardápio
    const API_URL = 'https://realcecardapio.onrender.com';

    /* ==========================================================================
       1. SELETORES GERAIS DE ELEMENTOS
       ========================================================================== */
    const openLoginBtn = document.getElementById("openLogin");
    const registerButtons = document.querySelectorAll(".btn-open-modal");
    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");
    const overlays = document.querySelectorAll(".modal-overlay");
    const goRegister = document.getElementById("goRegister");
    const goLogin = document.getElementById("goLogin");
    
    // Seletores da Sidebar (Modo mobile da Landing Page se necessário)
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");

    /* ==========================================================================
       2. CONTROLE DOS MODAIS (ABRIR, FECHAR E ALTERNAR)
       ========================================================================== */
    // Abrir modal de Login
    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', () => {
            loginModal.classList.add("active");
        });
    }

    // Abrir modal de Registro (Aplica em todos os botões com a classe)
    registerButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            registerModal.classList.add("active");
        });
    });

    // Alternar do Login para o Registro
    if (goRegister) {
        goRegister.addEventListener('click', () => {
            loginModal.classList.remove("active");
            registerModal.classList.add("active");
        });
    }

    // Alternar do Registro para o Login
    if (goLogin) {
        goLogin.addEventListener('click', () => {
            registerModal.classList.remove("active");
            loginModal.classList.add("active");
        });
    }

    // Fechar modais ao clicar na área escura (Overlay)
    overlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            loginModal.classList.remove("active");
            registerModal.classList.remove("active");
        });
    });

    /* ==========================================================================
       3. CONTROLE DE SIDEBAR MOBILE
       ========================================================================== */
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }

    /* ==========================================================================
       4. VERIFICAÇÃO DE DISPONIBILIDADE DO PERFIL (NOME DA LOJA)
       ========================================================================== */
    const regPerfil = document.getElementById('regPerfil');
    const perfilStatus = document.getElementById('perfilStatus');

    if (regPerfil && perfilStatus) {
        regPerfil.addEventListener('input', async () => {
            const perfil = regPerfil.value.trim();
            
            if (perfil.length < 3) {
                perfilStatus.textContent = "";
                return;
            }

            try {
                const response = await fetch(`${API_URL}/check-perfil?perfil=${perfil}`);
                const data = await response.json();

                if (data.available) {
                    perfilStatus.textContent = "✔ Nome disponível";
                    perfilStatus.style.color = "#FF6B00"; // Laranja de sucesso do RealceCardápio
                    regPerfil.style.borderColor = "#FF6B00";
                } else {
                    perfilStatus.textContent = "✖ Este nome já está em uso";
                    perfilStatus.style.color = "#ff4d4d"; 
                    regPerfil.style.borderColor = "#ff4d4d";
                }
            } catch (err) {
                console.error("Erro ao checar perfil:", err);
            }
        });
    }

    /* ==========================================================================
       5. EXIBIÇÃO DE SENHAS (TOGGLE DO ÍCONE DE OLHO)
       ========================================================================== */
    function configurarToggleSenha(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        if (toggle && input) {
            toggle.addEventListener('click', function() {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.classList.toggle('active');
            });
        }
    }

    configurarToggleSenha('toggleLoginPassword', 'loginPassword');
    configurarToggleSenha('toggleRegPassword', 'regPassword');
    configurarToggleSenha('toggleConfirmPassword', 'regConfirmPassword');

    /* ==========================================================================
       6. MÁSCARA DO CAMPO DE TELEFONE
       ========================================================================== */
    const phoneInput = document.getElementById('regPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); 
            if (value.length > 11) value = value.slice(0, 11); 

            let formatted = "";
            if (value.length > 0) {
                formatted = '(' + value.slice(0, 2);
                if (value.length > 2) {
                    formatted += ') ' + value.slice(2, 7);
                    if (value.length > 7) {
                        formatted += '-' + value.slice(7, 11);
                    }
                }
            }
            e.target.value = formatted;
        });
    }

    /* ==========================================================================
       7. VALIDAÇÃO DOS REQUISITOS DE SENHA FORTE
       ========================================================================== */
    const regPassword = document.getElementById('regPassword');
    const requirements = {
        length: document.getElementById('req-length'),
        upper: document.getElementById('req-upper'),
        lower: document.getElementById('req-lower'),
        number: document.getElementById('req-number'),
        special: document.getElementById('req-special')
    };

    if (regPassword) {
        regPassword.addEventListener('input', () => {
            const val = regPassword.value;
            const checks = {
                length: val.length >= 8,
                upper: /[A-Z]/.test(val),
                lower: /[a-z]/.test(val),
                number: /[0-9]/.test(val),
                special: /[^A-Za-z0-9]/.test(val)
            };

            Object.keys(checks).forEach(key => {
                if (requirements[key]) {
                    if (checks[key]) {
                        requirements[key].classList.add('valid');
                    } else {
                        requirements[key].classList.remove('valid');
                    }
                }
            });
        });
    }

    /* ==========================================================================
       8. ENVIO DO FORMULÁRIO DE LOGIN (POST)
       ========================================================================== */
    const loginSubmitBtn = document.querySelector('#loginModal .btn-primary');

    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                return alert("Preencha todos os campos para entrar.");
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Armazena com segurança a sessão no navegador do lojista
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Redireciona o lojista para o Dashboard principal
                    window.location.href = 'admin/dashboard.html'; 
                } else {
                    alert("❌ " + data.message);
                }
            } catch (error) {
                console.error("Erro no login:", error);
                alert("Servidor fora do ar. Verifique o terminal!");
            }
        });
    }

    /* ==========================================================================
       9. ENVIO DO FORMULÁRIO DE CADASTRO (POST)
       ========================================================================== */
    const registerSubmitBtn = document.querySelector('#registerModal .btn-primary');

    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const perfil = document.getElementById('regPerfil').value;
            const email = document.getElementById('regEmail').value;
            const phone = document.getElementById('regPhone').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const termsCheck = document.getElementById('termsCheck').checked;
            const name = document.getElementById('regName').value || perfil;

            if (!termsCheck) return alert("Por favor, aceite os termos de uso.");
            if (password !== confirmPassword) return alert("As senhas não coincidem!");

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, perfil, email, phone, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("✅ Conta RealceCardápio criada com sucesso!");
                    location.reload(); 
                } else {
                    alert("❌ " + data.message);
                }
            } catch (error) {
                console.error("Erro no cadastro:", error);
                alert("Erro ao conectar com o servidor.");
            }
        });
    }
});