// ==========================================
// SUPABASE CONFIGURAÇÃO (USE SUAS PRÓPRIAS CHAVES)
// ==========================================
const SUPABASE_URL = 'https://tiwkrplockbangyzscjl.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_dCgcIw1HcLaeK5FhPtCdLQ_CFOPf_WJ'; 
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos DOM
const userEmailDisplay = document.getElementById('user-email-display');
const profileEmail = document.getElementById('profile-email');
// NOVAS REFERÊNCIAS
const profileFirstName = document.getElementById('profile-first-name');
const profileLastName = document.getElementById('profile-last-name');
// FIM NOVAS REFERÊNCIAS
const profilePhone = document.getElementById('profile-phone');
const profileAddress = document.getElementById('profile-address');
const profileTravelDate = document.getElementById('profile-travel-date');
const saveProfileBtn = document.getElementById('save-profile-btn');
const setTravelDateBtn = document.getElementById('set-travel-date-btn');
const profileStatus = document.getElementById('profile-status');
const logoutBtn = document.getElementById('logout-btn');
const countdownDisplay = document.getElementById('countdown-display');
const checklistInput = document.getElementById('checklist-input');
const addChecklistItemBtn = document.getElementById('add-checklist-item-btn');
const checklistList = document.getElementById('checklist-list');
const checklistFullSection = document.getElementById('checklist-full-section');

// Variável global para o checklist
let currentChecklist = [];

// ==========================================
// 1. FUNÇÕES DE AUTENTICAÇÃO E REDIRECIONAMENTO
// ==========================================

async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html'; // Redireciona se não estiver logado
        return;
    }
    const userEmail = user.email;
    
    // Exibir email temporariamente, o loadUserProfile mudará para o nome
    userEmailDisplay.textContent = userEmail; 
    profileEmail.value = userEmail;
    loadUserProfile(user.id);
}

// ==========================================
// 2. FUNÇÃO DE CONTROLE DE ABAS (AJUSTADO PARA SIDEBAR)
// ==========================================

function setupTabs() {
    // SELECIONA OS BOTÕES DA SIDEBAR (NOVO HTML)
    const tabButtons = document.querySelectorAll('.profile-sidebar .sidebar-button'); 
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove a classe 'active' de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Adiciona a classe 'active' ao botão e conteúdo alvo
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}


// ==========================================
// 3. FUNÇÕES DO PERFIL (LOAD / SAVE)
// ==========================================

async function loadUserProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        // ADICIONADO first_name E last_name
        .select(`first_name, last_name, phone, address, travel_date, checklist`) 
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = Não encontrado (primeiro acesso)
        console.error('Erro ao carregar perfil:', error.message);
        return;
    }

    let userName = profileEmail.value; // Padrão de segurança: Email
    
    if (data) {
        // PREENCHE OS NOVOS CAMPOS DO FORMULÁRIO
        profileFirstName.value = data.first_name || '';
        profileLastName.value = data.last_name || '';
        
        // Se o nome existir, muda a saudação
        if (data.first_name) {
             userName = data.first_name;
        }
        
        // Campos existentes
        profilePhone.value = data.phone || '';
        profileAddress.value = data.address || '';

        // Carregar e processar a data de viagem
        if (data.travel_date) {
            profileTravelDate.value = data.travel_date;
            startCountdown(data.travel_date);
            // Mostrar seção de checklist se a data estiver definida
            checklistFullSection.style.display = 'block';
        }

        // Carregar e renderizar o checklist
        currentChecklist = data.checklist || [];
        renderChecklist();
    }
    
    // ATUALIZA A SAUDAÇÃO FINAL (Nome ou Email)
    userEmailDisplay.textContent = userName; 
}

async function saveProfile(e) {
    e.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    
    // NOVOS CAMPOS: VALIDAÇÃO E LEITURA
    const firstName = profileFirstName.value.trim();
    const lastName = profileLastName.value.trim();

    if (!firstName || !lastName) {
        profileStatus.textContent = 'Nome e Sobrenome são obrigatórios.';
        profileStatus.style.backgroundColor = '#f8d7da';
        profileStatus.style.color = '#721c24';
        setTimeout(() => { profileStatus.textContent = ''; }, 3000);
        return;
    }


    const profileData = {
        id: user.id, // Chave primária para upsert
        first_name: firstName, // NOVO CAMPO
        last_name: lastName,   // NOVO CAMPO
        phone: profilePhone.value,
        address: profileAddress.value,
    };

    // Salva/Atualiza
    const { error } = await supabaseClient
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

    if (error) {
        profileStatus.textContent = 'Erro ao salvar: ' + error.message;
        profileStatus.style.backgroundColor = '#f8d7da';
        profileStatus.style.color = '#721c24';
    } else {
        // ATUALIZA A SAUDAÇÃO NA TELA
        userEmailDisplay.textContent = firstName; 
        
        profileStatus.textContent = 'Informações pessoais salvas com sucesso!';
        profileStatus.style.backgroundColor = '#d4edda';
        profileStatus.style.color = '#155724';
    }

    setTimeout(() => { profileStatus.textContent = ''; }, 3000);
}


// ==========================================
// 4. FUNÇÃO DE DATA DE VIAGEM E CONTAGEM REGRESSIVA
// ==========================================

async function saveTravelDate() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const date = profileTravelDate.value;
    if (!date) {
        alert('Por favor, selecione uma data.');
        return;
    }

    const { error } = await supabaseClient
        .from('profiles')
        .upsert({ id: user.id, travel_date: date }, { onConflict: 'id' });

    if (!error) {
        startCountdown(date);
        checklistFullSection.style.display = 'block'; // Mostra o checklist
        alert('Data de viagem atualizada!');
    } else {
        alert('Erro ao salvar data: ' + error.message);
    }
}

function startCountdown(travelDateStr) {
    const travelDate = new Date(travelDateStr);

    function updateCountdown() {
        const now = new Date();
        const diff = travelDate.getTime() - now.getTime();

        if (diff < 0) {
            countdownDisplay.innerHTML = `<strong>✈️ Você já está na Espanha!</strong>`;
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownDisplay.innerHTML = `
            <p>Faltam:</p>
            <span>${days}</span> Dias 
            <span>${hours}</span> Horas 
            <span>${minutes}</span> Minutos 
            <span>${seconds}</span> Segundos
        `;
    }

    updateCountdown();
    // Atualiza a cada segundo
    setInterval(updateCountdown, 1000);
}


// ==========================================
// 5. FUNÇÕES DO CHECKLIST (CRUD)
// ==========================================

function renderChecklist() {
    checklistList.innerHTML = ''; // Limpa a lista atual
    
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
    if (!user) return;

    // Salva o array 'currentChecklist' no campo 'checklist' (JSONB)
    const { error } = await supabaseClient
        .from('profiles')
        .upsert({ id: user.id, checklist: currentChecklist }, { onConflict: 'id' });

    if (error) {
        console.error('Erro ao salvar checklist:', error);
        alert('Erro ao salvar checklist.');
    } else {
        // Opcional: feedback rápido.
    }
}

function addChecklistItem() {
    const text = checklistInput.value.trim();
    if (text) {
        currentChecklist.push({ text: text, completed: false });
        checklistInput.value = '';
        renderChecklist();
        saveChecklistToDB();
    }
}

function handleChecklistInteraction(e) {
    // Marcar/Desmarcar como Completo
    if (e.target.type === 'checkbox') {
        const index = e.target.id.split('-')[1];
        currentChecklist[index].completed = e.target.checked;
        e.target.nextElementSibling.classList.toggle('completed', e.target.checked);
        saveChecklistToDB();
    }
    
    // Remover Item
    if (e.target.classList.contains('delete-btn')) {
        const index = e.target.dataset.index;
        currentChecklist.splice(index, 1);
        renderChecklist();
        saveChecklistToDB();
    }
}


// ==========================================
// 6. LISTENERS E INICIALIZAÇÃO
// ==========================================

// Event Listeners
document.getElementById('profile-form').addEventListener('submit', saveProfile);
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});
setTravelDateBtn.addEventListener('click', saveTravelDate);
addChecklistItemBtn.addEventListener('click', addChecklistItem);
checklistList.addEventListener('click', handleChecklistInteraction);


// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    checkAuth();
});