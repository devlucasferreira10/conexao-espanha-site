// ==========================================
// SUPABASE CONFIGURAÇÃO (CORRIGIDA)
// ==========================================

// URL da API (Link do Projeto)
const SUPABASE_URL = 'https://tiwkrplockbangyzscjl.supabase.co'; 

// Chave anon (pública) (Token Longo)
const SUPABASE_ANON_KEY = 'sb_publishable_dCgcIw1HcLaeK5FhPtCdLQ_CFOPf_WJ'; 

// Inicializa o cliente Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ==========================================
// REFERÊNCIAS E LÓGICA DO MODAL
// ==========================================

const authModal = document.getElementById('auth-modal');
const openAuthModalBtn = document.getElementById('open-auth-modal');
const closeAuthModalBtn = document.querySelector('.close-btn');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authForm = document.getElementById('auth-form');

const switchToSignupLink = document.getElementById('switch-to-signup');
const switchToLoginLink = document.getElementById('switch-to-login');
const signupOnlyElements = document.querySelectorAll('.signup-only');

let isSigningUp = false; // true = Cadastro, false = Login

// --- 1. ABRIR / FECHAR MODAL ---

openAuthModalBtn.onclick = () => {
    authModal.style.display = 'block';
    toggleAuthMode(false); // Sempre começa no modo Login
};

closeAuthModalBtn.onclick = () => {
    authModal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === authModal) {
        authModal.style.display = 'none';
    }
};

// --- 2. ALTERNAR ENTRE LOGIN E CADASTRO ---

function toggleAuthMode(isSignup) {
    isSigningUp = isSignup;
    if (isSignup) {
        authTitle.textContent = 'Crie sua Conta';
        authSubmitBtn.textContent = 'Cadastrar';
        signupOnlyElements.forEach(el => el.style.display = 'block');
    } else {
        authTitle.textContent = 'Faça Login';
        authSubmitBtn.textContent = 'Entrar';
        signupOnlyElements.forEach(el => el.style.display = 'none');
    }
}

switchToSignupLink.onclick = (e) => {
    e.preventDefault();
    toggleAuthMode(true);
};

switchToLoginLink.onclick = (e) => {
    e.preventDefault();
    toggleAuthMode(false);
};


// ==========================================
// LÓGICA DE AUTENTICAÇÃO COM SUPABASE
// ==========================================

authForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    authSubmitBtn.disabled = true; // Desabilita o botão

    let authResult;

    if (isSigningUp) {
        // --- TENTATIVA DE CADASTRO (SIGN UP) ---
        authResult = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                // Redireciona o usuário para o site após confirmar o e-mail
                emailRedirectTo: window.location.origin 
            }
        });
    } else {
        // --- TENTATIVA DE LOGIN (SIGN IN) ---
        authResult = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
    }

    authSubmitBtn.disabled = false; // Reabilita o botão

    if (authResult.error) {
        // Exibe erro de forma clara
        alert(`Erro de Autenticação: ${authResult.error.message}`);
    } else if (authResult.data.user || authResult.data.session) {
        // Sucesso no Login ou Cadastro
        if (isSigningUp) {
             alert('Sucesso! Verifique seu e-mail para confirmar a sua conta. Você será redirecionado após a confirmação.');
        } else {
             // Login bem-sucedido
             alert('Login bem-sucedido! Bem-vindo(a) de volta!');
             authModal.style.display = 'none';
             // **CORREÇÃO: REDIRECIONAR PARA A PÁGINA DE PERFIL**
             window.location.href = 'profile.html'; 
        }
    } else {
        // Caso de Cadastro, mas que precisa de confirmação por e-mail
        alert('Cadastro efetuado! Por favor, verifique a caixa de entrada do seu e-mail para confirmar a sua conta.');
    }
};

// ==========================================
// VERIFICAÇÃO DE STATUS DE LOGIN NA INICIALIZAÇÃO
// ==========================================

async function checkUserStatus() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const authNavBtn = document.getElementById('open-auth-modal');

    if (user) {
        console.log('Usuário logado:', user.email);
        
        // Altera o botão da Navbar
        if (authNavBtn) {
            authNavBtn.textContent = 'Olá, Usuário!'; 
            authNavBtn.disabled = true; 
        }
    }
}

checkUserStatus();