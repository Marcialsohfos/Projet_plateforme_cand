// --- CONFIGURATION ---
const APP_KEY = "scsm_candidatures";
const ADMIN_CODE = "13245@10001a"; 

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

    // 2. Soumission du formulaire (CORRIGÉ POUR NETLIFY)
    const form = document.getElementById('candidatureForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // On empêche le rechargement de page
            
            const submitBtn = form.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
            submitBtn.disabled = true;

            const formData = new FormData(form);

            // --- CORRECTION MAJEURE ICI ---
            // Envoi direct du FormData pour supporter les fichiers
            fetch("/", {
                method: "POST",
                body: formData
            })
            .then(() => {
                // --- SUCCÈS NETLIFY ---
                
                // 1. Générer une référence
                const ref = 'CAND-' + Math.floor(Math.random() * 10000);
                
                // 2. Sauvegarde Locale (Pour votre démo Admin locale)
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

                // 3. Afficher le Modal
                document.getElementById('confName').textContent = newCandidature.nom;
                document.getElementById('confRef').textContent = ref;
                document.getElementById('confirmationModal').classList.remove('hidden');
                document.getElementById('confirmationModal').style.display = 'flex'; // Force display flex for centering
                
                // 4. Reset du formulaire
                form.reset();
                document.querySelectorAll('.upload-area').forEach(el => {
                    el.classList.remove('uploaded');
                    el.querySelector('span').textContent = "Cliquez pour ajouter";
                    el.querySelector('i').className = "fas fa-cloud-upload-alt";
                });
            })
            .catch((error) => {
                alert("Erreur lors de l'envoi : " + error);
                console.error(error);
            })
            .finally(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
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
    const modal = document.getElementById('confirmationModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
}

// --- LOGIQUE ADMIN ---

function checkAuth() {
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
    const totalEl = document.getElementById('totalCandidatures');
    if(totalEl) totalEl.textContent = list.length;
    
    const newEl = document.getElementById('newCandidatures');
    if(newEl) {
        const nouvelles = list.filter(c => c.statut === 'Nouvelle').length;
        newEl.textContent = nouvelles;
    }
    
    // Table
    const tbody = document.getElementById('candidaturesTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    list.reverse().forEach((c) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.date}</td>
            <td><strong>${c.nom}</strong><br><small>${c.email}</small></td>
            <td>${c.ville}</td>
            <td>${c.competences ? c.competences.substring(0, 30) : ''}...</td>
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
    
    // Sécurisation des éléments DOM
    const nameEl = document.getElementById('modalName');
    const bodyEl = document.getElementById('modalBody');
    const modalEl = document.getElementById('candidateModal');
    
    if(!nameEl || !bodyEl || !modalEl) return;

    nameEl.textContent = candidate.nom;
    
    bodyEl.innerHTML = `
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
        <div class="alert-info" style="margin-bottom:15px; font-size:0.9em; background:#e3f2fd; padding:10px; border-radius:5px; border-left:4px solid #2196f3;">
            <i class="fas fa-info-circle"></i> Pour voir les pièces jointes (CV, Lettre), connectez-vous à votre compte Netlify > Onglet "Forms".
        </div>
        <hr>
        <div style="margin-top:15px;">
            <h4>Lettre de motivation</h4>
            <p style="background:#f9f9f9; padding:10px; border-radius:5px; white-space: pre-wrap;">${candidate.motivation}</p>
        </div>
        <div style="margin-top:15px;">
            <h4>Compétences</h4>
            <p style="white-space: pre-wrap;">${candidate.competences}</p>
        </div>
    `;
    
    modalEl.classList.remove('hidden');
    modalEl.style.display = 'flex';
}

function closeCandidateModal() {
    const modalEl = document.getElementById('candidateModal');
    if(modalEl) {
        modalEl.classList.add('hidden');
        modalEl.style.display = 'none';
    }
}

function updateStatus(newStatus) {
    if (!currentCandidateId) return;
    
    const list = getCandidatures();
    const index = list.findIndex(c => c.id === currentCandidateId);
    
    if (index !== -1) {
        list[index].statut = newStatus;
        localStorage.setItem(APP_KEY, JSON.stringify(list));
        closeCandidateModal();
        loadDashboard(); 
        alert(`Statut mis à jour : ${newStatus}`);
    }
}