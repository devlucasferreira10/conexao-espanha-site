// ==========================================
// 1. CONFIGURAÇÃO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://tiwkrplockbangyzscjl.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_dCgcIw1HcLaeK5FhPtCdLQ_CFOPf_WJ'; 
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referências DOM
const userEmailDisplay = document.getElementById('user-email-display');
const profileEmail = document.getElementById('profile-email');
const profileFirstName = document.getElementById('profile-first-name');
const profileLastName = document.getElementById('profile-last-name');
const profilePhone = document.getElementById('profile-phone');
const profileAddress = document.getElementById('profile-address');
const profileTravelDate = document.getElementById('profile-travel-date');
const profileStatus = document.getElementById('profile-status');
const logoutBtn = document.getElementById('logout-btn');
const countdownDisplay = document.getElementById('countdown-display');
const checklistInput = document.getElementById('checklist-input');
const addChecklistItemBtn = document.getElementById('add-checklist-item-btn');
const checklistList = document.getElementById('checklist-list');
const checklistFullSection = document.getElementById('checklist-full-section');
const setTravelDateBtn = document.getElementById('set-travel-date-btn');

let currentChecklist = [];

// ==========================================
// 2. AUTENTICAÇÃO E CARREGAMENTO
// ==========================================

async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    userEmailDisplay.textContent = user.email; 
    if(profileEmail) profileEmail.value = user.email;
    loadUserProfile(user.id);
}

async function loadUserProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select(`first_name, last_name, phone, address, travel_date, checklist`) 
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Erro:', error.message);
        return;
    }

    if (data) {
        profileFirstName.value = data.first_name || '';
        profileLastName.value = data.last_name || '';
        if (data.first_name) userEmailDisplay.textContent = data.first_name;
        
        profilePhone.value = data.phone || '';
        profileAddress.value = data.address || '';

        if (data.travel_date) {
            profileTravelDate.value = data.travel_date;
            startCountdown(data.travel_date);
            checklistFullSection.style.display = 'block';
        }

        currentChecklist = data.checklist || [];
        renderChecklist();
    }
}

// ==========================================
// 3. CONTROLE DE ABAS (CORRIGIDO)
// ==========================================

function setupTabs() {
    const tabButtons = document.querySelectorAll('.sidebar-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Resetar estados
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none'; 
            });

            // Ativar alvo
            button.classList.add('active');
            const targetElement = document.getElementById(`${targetTab}-tab`);
            if (targetElement) {
                targetElement.classList.add('active');
                targetElement.style.display = 'block';
            }
        });
    });
}

// ==========================================
// 4. PERSISTÊNCIA DE DADOS
// ==========================================

async function saveProfile(e) {
    e.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const firstName = profileFirstName.value.trim();
    const lastName = profileLastName.value.trim();

    if (!firstName || !lastName) {
        showStatus('Nome e Sobrenome são obrigatórios.', 'error');
        return;
    }

    const { error } = await supabaseClient
        .from('profiles')
        .upsert({
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            phone: profilePhone.value,
            address: profileAddress.value,
        });

    if (error) showStatus('Erro: ' + error.message, 'error');
    else {
        userEmailDisplay.textContent = firstName;
        showStatus('Perfil salvo com sucesso!', 'success');
    }
}

async function saveTravelDate() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const date = profileTravelDate.value;

    if (!date) return alert('Selecione uma data.');

    const { error } = await supabaseClient
        .from('profiles')
        .upsert({ id: user.id, travel_date: date });

    if (!error) {
        startCountdown(date);
        checklistFullSection.style.display = 'block';
        alert('Data salva!');
    }
}

// ==========================================
// 5. CHECKLIST E UTILITÁRIOS
// ==========================================

function renderChecklist() {
    checklistList.innerHTML = '';
    currentChecklist.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.innerHTML = `
            <input type="checkbox" id="item-${index}" ${item.completed ? 'checked' : ''}>
            <label for="item-${index}" class="${item.completed ? 'completed' : ''}">${item.text}</label>
            <button class="delete-btn" data-index="${index}">Remover</button>
        `;
        checklistList.appendChild(li);
    });
}

async function saveChecklistToDB() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    await supabaseClient.from('profiles').upsert({ id: user.id, checklist: currentChecklist });
}

function showStatus(msg, type) {
    profileStatus.textContent = msg;
    profileStatus.style.backgroundColor = type === 'error' ? '#f8d7da' : '#d4edda';
    profileStatus.style.color = type === 'error' ? '#721c24' : '#155724';
    setTimeout(() => { profileStatus.textContent = ''; }, 3000);
}

function startCountdown(dateStr) {
    const travelDate = new Date(dateStr).getTime();
    setInterval(() => {
        const now = new Date().getTime();
        const diff = travelDate - now;
        if (diff < 0) {
            countdownDisplay.innerHTML = "✈️ Já está na Espanha!";
            return;
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        countdownDisplay.innerHTML = `<p>Faltam: <span>${d}d ${h}h ${m}m ${s}s</span></p>`;
    }, 1000);
}

// ==========================================
// 6. EVENT LISTENERS E INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    checkAuth();
});

document.getElementById('profile-form').addEventListener('submit', saveProfile);
setTravelDateBtn.addEventListener('click', saveTravelDate);
addChecklistItemBtn.addEventListener('click', () => {
    const text = checklistInput.value.trim();
    if (text) {
        currentChecklist.push({ text, completed: false });
        checklistInput.value = '';
        renderChecklist();
        saveChecklistToDB();
    }
});

checklistList.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox') {
        const index = e.target.id.split('-')[1];
        currentChecklist[index].completed = e.target.checked;
        saveChecklistToDB();
        renderChecklist();
    }
    if (e.target.classList.contains('delete-btn')) {
        currentChecklist.splice(e.target.dataset.index, 1);
        saveChecklistToDB();
        renderChecklist();
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});