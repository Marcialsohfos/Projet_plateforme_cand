// --- CONFIGURATION ---
const APP_KEY = "scsm_candidatures";
const ADMIN_CODE = "13245@10001a"; // Le code de votre fichier exemple

// --- UTILITAIRES ---
function getCandidatures() {
    return JSON.parse(localStorage.getItem(APP_KEY)) || [];
}

function saveCandidatureData(candidature) {
    const list = getCandidatures();
    list.push(candidature);
    localStorage.setItem(APP_KEY, JSON.stringify(list));
}

// --- PARTIE PUBLIQUE (index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Gestion de l'upload visuel
    const setupUpload = (areaId, fileId, labelId) => {
        const area = document.getElementById(areaId);
        const fileInput = document.getElementById(fileId);
        const label = document.getElementById(labelId);

        if(!area) return;

        area.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                const fileName = e.target.files[0].name;
                label.textContent = fileName;
                area.classList.add('uploaded');
                // Icon change
                area.querySelector('i').className = "fas fa-check-circle";
            }
        });
    };

    setupUpload('cv-area', 'cv_file', 'cv-filename');
    setupUpload('lm-area', 'lm_file', 'lm-filename');

    // 2. Soumission du formulaire
    const form = document.getElementById('candidatureForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            // NOTE : Sur Netlify, le formulaire est envoyé automatiquement grâce à data-netlify="true"
            // Ici, nous interceptons aussi pour la DEMO locale (localStorage)
            
            // Pour la démo locale, on empêche le rechargement pour voir la modal
            // En prod réelle Netlify, on laisserait le submit faire son travail ou on utiliserait fetch.
            e.preventDefault(); 

            const formData = new FormData(form);
            const ref = 'CAND-' + Math.floor(Math.random() * 10000);
            
            // Création de l'objet pour localStorage (Simulation Backend)
            const newCandidature = {
                id: ref,
                date: new Date().toLocaleDateString(),
                nom: formData.get('nom_complet'),
                email: formData.get('email'),
                ville: formData.get('ville'),
                competences: formData.get('competences'),
                motivation: formData.get('motivation'),
                portfolio: formData.get('portfolio_lien'),
                statut: 'Nouvelle'
            };

            saveCandidatureData(newCandidature);

            // Affichage Modal Succès
            document.getElementById('confName').textContent = newCandidature.nom;
            document.getElementById('confRef').textContent = ref;
            document.getElementById('confirmationModal').classList.remove('hidden');
            form.reset();
            
            // Reset visuel uploads
            document.querySelectorAll('.upload-area').forEach(el => {
                el.classList.remove('uploaded');
                el.querySelector('span').textContent = "Cliquez pour ajouter";
                el.querySelector('i').className = "fas fa-cloud-upload-alt";
            });
        });
    }

    // --- PARTIE ADMIN (admin.html) ---
    if (document.body.classList.contains('admin-body')) {
        checkAuth();
        loadDashboard();
    }
});

function closeModal() {
    document.getElementById('confirmationModal').classList.add('hidden');
}

// --- LOGIQUE ADMIN ---

function checkAuth() {
    // Vérification basique session (localStorage)
    const isLogged = sessionStorage.getItem('admin_logged');
    if (!isLogged) {
        window.location.href = 'login.html';
    }
}

function logout() {
    sessionStorage.removeItem('admin_logged');
    window.location.href = 'login.html';
}

function loadDashboard() {
    const list = getCandidatures();
    
    // Stats
    document.getElementById('totalCandidatures').textContent = list.length;
    const nouvelles = list.filter(c => c.statut === 'Nouvelle').length;
    document.getElementById('newCandidatures').textContent = nouvelles;
    
    // Table
    const tbody = document.getElementById('candidaturesTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Trier par plus récent
    list.reverse().forEach((c, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.date}</td>
            <td><strong>${c.nom}</strong><br><small>${c.email}</small></td>
            <td>${c.ville}</td>
            <td>${c.competences.substring(0, 30)}...</td>
            <td><span class="badge ${c.statut}">${c.statut}</span></td>
            <td>
                <button class="admin-btn" onclick="openCandidateModal('${c.id}')"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal Admin (Détails)
let currentCandidateId = null;

function openCandidateModal(id) {
    const list = getCandidatures();
    const candidate = list.find(c => c.id === id);
    if (!candidate) return;

    currentCandidateId = id;
    document.getElementById('modalName').textContent = candidate.nom;
    
    const body = document.getElementById('modalBody');
    body.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
            <div>
                <p><strong>Email:</strong> ${candidate.email}</p>
                <p><strong>Ville:</strong> ${candidate.ville}</p>
                <p><strong>Portfolio:</strong> <a href="${candidate.portfolio}" target="_blank">Lien</a></p>
            </div>
            <div>
                <p><strong>Réf:</strong> ${candidate.id}</p>
                <p><strong>Date:</strong> ${candidate.date}</p>
                <p><strong>Statut:</strong> <span class="badge ${candidate.statut}">${candidate.statut}</span></p>
            </div>
        </div>
        <hr>
        <div style="margin-top:15px;">
            <h4>Lettre de motivation</h4>
            <p style="background:#f9f9f9; padding:10px; border-radius:5px;">${candidate.motivation}</p>
        </div>
        <div style="margin-top:15px;">
            <h4>Compétences</h4>
            <p>${candidate.competences}</p>
        </div>
    `;
    
    document.getElementById('candidateModal').classList.remove('hidden');
}

function closeCandidateModal() {
    document.getElementById('candidateModal').classList.add('hidden');
}

function updateStatus(newStatus) {
    if (!currentCandidateId) return;
    
    const list = getCandidatures();
    const index = list.findIndex(c => c.id === currentCandidateId);
    
    if (index !== -1) {
        list[index].statut = newStatus;
        localStorage.setItem(APP_KEY, JSON.stringify(list));
        closeCandidateModal();
        loadDashboard(); // Rafraîchir la table
        alert(`Statut mis à jour : ${newStatus}`);
    }
}