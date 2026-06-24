document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       1. FORMATAÇÃO MÁGICA DO NOME (Sem números, Iniciais Maiúsculas)
       ========================================================================== */
    const inputNome = document.getElementById('checkout-nome');
    if (inputNome) {
        inputNome.addEventListener('input', function() {
            // Remove números e caracteres especiais (permite acentos)
            let valor = this.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
            
            // Coloca a primeira letra de cada palavra em maiúscula
            valor = valor.split(' ').map(palavra => {
                if (palavra.length > 0) {
                    return palavra[0].toUpperCase() + palavra.slice(1).toLowerCase();
                }
                return '';
            }).join(' ');

            this.value = valor;
        });
    }

    /* ==========================================================================
       2. MÁSCARA DO WHATSAPP: (XX) 9XXXX-XXXX
       ========================================================================== */
    const inputWhatsapp = document.getElementById('checkout-whatsapp');
    if (inputWhatsapp) {
        inputWhatsapp.addEventListener('input', function() {
            let numero = this.value.replace(/\D/g, ''); // Só aceita números
            numero = numero.substring(0, 11); // Limite de 11 dígitos

            if (numero.length > 2 && numero[2] !== '9') {
                numero = numero.substring(0, 2) + '9' + numero.substring(2);
            }

            let formatado = numero;
            if (numero.length > 2) {
                formatado = `(${numero.substring(0, 2)}) `;
                if (numero.length > 7) {
                    formatado += `${numero.substring(2, 7)}-${numero.substring(7)}`;
                } else {
                    formatado += numero.substring(2);
                }
            }
            this.value = formatado;
        });
    }

    /* ==========================================================================
       3. BUSCA AUTOMÁTICA DE CEP (ViaCEP)
       ========================================================================== */
    const inputCep = document.getElementById('checkout-cep');
    if (inputCep) {
        // Máscara simples do CEP (XXXXX-XXX)
        inputCep.addEventListener('input', function() {
            let cep = this.value.replace(/\D/g, '').substring(0, 8);
            if (cep.length > 5) cep = cep.replace(/^(\d{5})(\d)/, '$1-$2');
            this.value = cep;
        });

        // Quando o usuário termina de digitar e tira o foco do campo
        inputCep.addEventListener('blur', async function() {
            const cepLimpo = this.value.replace(/\D/g, '');
            const statusLabel = document.getElementById('cep-status');

            if (cepLimpo.length === 8) {
                statusLabel.textContent = "Buscando endereço...";
                statusLabel.style.color = "#3b82f6"; // Azul

                try {
                    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                    const dados = await resposta.json();
                    
                    if (!dados.erro) {
                        document.getElementById('checkout-rua').value = dados.logradouro;
                        document.getElementById('checkout-bairro').value = dados.bairro;
                        document.getElementById('checkout-cidade').value = dados.localidade;
                        
                        statusLabel.textContent = "Endereço encontrado!";
                        statusLabel.style.color = "#10b981"; // Verde
                        
                        // Joga o cliente direto para o campo de número para ganhar tempo
                        document.getElementById('checkout-numero').focus();
                    } else {
                        statusLabel.textContent = "CEP não encontrado. Preencha manualmente.";
                        statusLabel.style.color = "#ef4444"; // Vermelho
                    }
                } catch (erro) {
                    statusLabel.textContent = "Erro ao buscar. Preencha manualmente.";
                }
            }
        });
    }

    /* ==========================================================================
       4. REGRA DE VALIDAÇÃO: Número vs (Quadra e Lote)
       ========================================================================== */
    const inputNumero = document.getElementById('checkout-numero');
    const inputQuadra = document.getElementById('checkout-quadra');
    const inputLote = document.getElementById('checkout-lote');
    const checkSemNumero = document.getElementById('checkout-sem-numero');

    if (checkSemNumero) {
        checkSemNumero.addEventListener('change', function() {
            if (this.checked) {
                inputNumero.value = '';
                inputNumero.disabled = true;
                inputNumero.style.backgroundColor = '#f3f4f6';
                inputQuadra.focus(); // Direciona para a quadra
            } else {
                inputNumero.disabled = false;
                inputNumero.style.backgroundColor = '#fff';
                inputNumero.focus();
            }
        });
    }
});

// FUNÇÃO PARA O SEU BOTÃO DE "FINALIZAR PEDIDO" USAR ANTES DE ENVIAR
function validarFormulario() {
    const temNumero = document.getElementById('checkout-numero').value.trim() !== '' || document.getElementById('checkout-sem-numero').checked;
    const temQuadra = document.getElementById('checkout-quadra').value.trim() !== '';
    const temLote = document.getElementById('checkout-lote').value.trim() !== '';

    // Se não tem número, TEM que ter Quadra OU Lote
    if (!temNumero && !temQuadra && !temLote) {
        alert("Por favor, preencha o Número da residência ou informe a Quadra/Lote (ou marque a opção 'Sem Número').");
        return false;
    }
    
    return true; // Passou na validação!
}