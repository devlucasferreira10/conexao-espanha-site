const SUPABASE_URL = 'https://tiwkrplockbangyzscjl.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_dCgcIw1HcLaeK5FhPtCdLQ_CFOPf_WJ'; 
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authModal = document.getElementById('auth-modal');
const openAuthModalBtn = document.getElementById('open-auth-modal');
const closeAuthModalBtn = document.querySelector('.close-btn');
const authForm = document.getElementById('auth-form');
const logoutBtn = document.getElementById('logout-btn');

// Abrir/Fechar Modal
if(openAuthModalBtn) openAuthModalBtn.onclick = () => authModal.style.display = 'block';
if(closeAuthModalBtn) closeAuthModalBtn.onclick = () => authModal.style.display = 'none';

// Lógica de Login/Cadastro
if(authForm) {
    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        
        if (error) alert("Erro: " + error.message);
        else window.location.href = 'profile.html';
    };
}

// Lógica Global do Botão Sair
async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

async function checkUserStatus() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const loginBtn = document.getElementById('open-auth-modal');
    const logoutBtnNav = document.getElementById('logout-btn');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtnNav) {
            logoutBtnNav.style.display = 'block';
            logoutBtnNav.onclick = handleLogout;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtnNav) logoutBtnNav.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', checkUserStatus);