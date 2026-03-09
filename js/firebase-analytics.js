// ============================================
// FIREBASE - SISTEMA DE REGISTRO Y ADMIN
// ============================================

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAogVXyWDiLGblm6SL_nu1oKU4YUhjHHGI",
    authDomain: "oposicion-sepei-cbsg.firebaseapp.com",
    databaseURL: "https://oposicion-sepei-cbsg-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "oposicion-sepei-cbsg",
    storageBucket: "oposicion-sepei-cbsg.firebasestorage.app",
    messagingSenderId: "1013948891310",
    appId: "1:1013948891310:web:b39cfb976cb6cc9a13ad3f"
};

// Contraseña para acceder al panel admin
const ADMIN_PASSWORD = "S3peiAdmin2026Lob";

// Lista de parques SEPEI
const PARQUES_SEPEI = [
    "Parque de Hellín",
    "Parque de Villarrobledo",
    "Parque de Almansa",
    "Parque de La Roda",
    "Parque de Casas Ibáñez",
    "Parque de Alcaraz",
    "Parque de Molinicos"
];

// Variables globales
let database = null;
let isAdmin = false;
let currentUser = null;
let adminLoginShown = false; // Nueva flag para evitar mostrar registro si estamos en modo admin

// ============================================
// INICIALIZACIÓN
// ============================================

function initFirebase() {
    console.log("=== INIT FIREBASE ===");
    console.log("URL:", window.location.href);
    
    // PRIMERO: Verificar si quiere acceder como admin
    const urlParams = new URLSearchParams(window.location.search);
    const wantsAdmin = urlParams.has('admin');
    
    console.log("wantsAdmin:", wantsAdmin);
    
    if (wantsAdmin) {
        console.log("Solicitud de acceso admin detectada - mostrando login admin");
        adminLoginShown = true;
        showAdminLoginForm();
        return; // No continuar con el flujo normal
    }
    
    // Timeout de seguridad: si no conecta en 10 segundos, mostrar registro
    const connectionTimeout = setTimeout(() => {
        console.log("Timeout de conexión - mostrando registro");
        showRegistrationForm();
    }, 10000);
    
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        // Verificar conexión a Firebase
        database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                console.log("Conectado a Firebase");
                clearTimeout(connectionTimeout);
                
                // Verificar registro de usuario
                checkUserRegistration();
            }
        });
        
        console.log("Firebase inicializado correctamente");
    } catch (error) {
        console.error("Error inicializando Firebase:", error);
        clearTimeout(connectionTimeout);
        showRegistrationForm();
    }
}

// ============================================
// LOGIN DE ADMIN
// ============================================

function showAdminLoginForm() {
    // Ocultar pantalla de carga
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    
    const loginHTML = `
        <div class="admin-login-overlay" id="admin-login-overlay">
            <div class="admin-login-box">
                <div class="admin-login-header">
                    <span class="admin-icon">🔐</span>
                    <h2>Panel de Administración</h2>
                </div>
                <p>Introduce la contraseña de administrador:</p>
                <input type="password" id="admin-password-input" placeholder="Contraseña" autocomplete="off">
                <div class="admin-login-buttons">
                    <button onclick="verifyAdminPassword()" class="btn-admin-login">Acceder</button>
                    <button onclick="cancelAdminLogin()" class="btn-admin-cancel">Cancelar</button>
                </div>
                <p id="admin-login-error" class="admin-error" style="display: none;">Contraseña incorrecta</p>
            </div>
        </div>
        <style>
            .admin-login-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .admin-login-box {
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .admin-login-header {
                margin-bottom: 20px;
            }
            .admin-icon {
                font-size: 48px;
                display: block;
                margin-bottom: 10px;
            }
            .admin-login-box h2 {
                color: #f39c12;
                margin: 0;
                font-size: 24px;
            }
            .admin-login-box p {
                color: #ccc;
                margin: 15px 0;
            }
            #admin-password-input {
                width: 100%;
                padding: 15px;
                font-size: 16px;
                border: 2px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                background: rgba(0,0,0,0.3);
                color: white;
                text-align: center;
                box-sizing: border-box;
                margin-bottom: 20px;
            }
            #admin-password-input:focus {
                outline: none;
                border-color: #f39c12;
            }
            .admin-login-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .btn-admin-login {
                background: #27ae60;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .btn-admin-login:hover { background: #2ecc71; }
            .btn-admin-cancel {
                background: #7f8c8d;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .btn-admin-cancel:hover { background: #95a5a6; }
            .admin-error {
                color: #e74c3c !important;
                font-weight: bold;
                margin-top: 15px !important;
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loginHTML);
    
    // Focus en el input y permitir Enter
    const input = document.getElementById('admin-password-input');
    input.focus();
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAdminPassword();
        }
    });
}

function verifyAdminPassword() {
    const input = document.getElementById('admin-password-input');
    const password = input.value;
    
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        document.body.classList.add('authorized');
        
        // Remover formulario de login
        const overlay = document.getElementById('admin-login-overlay');
        if (overlay) overlay.remove();
        
        // Inicializar Firebase y mostrar panel
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            database = firebase.database();
            showAdminPanel();
        } catch (error) {
            console.error("Error:", error);
            alert("Error conectando con Firebase");
        }
    } else {
        // Mostrar error
        document.getElementById('admin-login-error').style.display = 'block';
        input.value = '';
        input.focus();
    }
}

function cancelAdminLogin() {
    // Redirigir a la app sin parámetro admin
    window.location.href = window.location.pathname;
}

// ============================================
// VERIFICACIÓN DE ACCESO
// ============================================

function checkAdminAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get('admin');
    
    if (adminKey === ADMIN_PASSWORD) {
        isAdmin = true;
        // Dar acceso completo al admin
        document.body.classList.add('authorized');
        setTimeout(showAdminPanel, 500);
    }
}

function checkUserRegistration() {
    const userId = localStorage.getItem('sepei_user_id');
    
    if (!userId) {
        showRegistrationForm();
        return;
    }
    
    database.ref('registeredUsers/' + userId).once('value', snapshot => {
        const userData = snapshot.val();
        
        if (!userData) {
            localStorage.removeItem('sepei_user_id');
            showRegistrationForm();
            return;
        }
        
        if (userData.status === 'pending') {
            showPendingScreen(userData);
        } else if (userData.status === 'approved') {
            currentUser = userData;
            allowAccess();
            updateUserActivity(userId);
        } else if (userData.status === 'rejected') {
            showRejectedScreen();
        }
    });
}

// ============================================
// PANTALLAS DE REGISTRO
// ============================================

function showRegistrationForm() {
    // Si estamos en modo admin, no mostrar el formulario de registro
    if (adminLoginShown || isAdmin) {
        console.log("showRegistrationForm cancelado - modo admin activo");
        return;
    }
    
    console.log("Mostrando formulario de registro");
    document.getElementById('home-screen').style.display = 'none';
    
    const formHTML = `
        <div class="registration-overlay" id="registration-overlay">
            <div class="registration-container">
                <div class="registration-header">
                    <i class="fas fa-fire-extinguisher"></i>
                    <h1>SEPEI</h1>
                    <p>Registro de Acceso</p>
                </div>
                
                <form id="registration-form" onsubmit="submitRegistration(event)">
                    <div class="form-group">
                        <label for="reg-name">
                            <i class="fas fa-user"></i> Nombre completo
                        </label>
                        <input type="text" id="reg-name" required placeholder="Tu nombre y apellidos">
                    </div>
                    
                    <div class="form-group">
                        <label for="reg-phone">
                            <i class="fas fa-phone"></i> Teléfono móvil
                        </label>
                        <input type="tel" id="reg-phone" required placeholder="612 345 678" 
                               pattern="[0-9]{9}" title="Introduce 9 dígitos">
                    </div>
                    
                    <div class="form-group">
                        <label for="reg-email">
                            <i class="fas fa-envelope"></i> Correo electrónico
                        </label>
                        <input type="email" id="reg-email" required placeholder="tu@email.com">
                    </div>
                    
                    <div class="form-group">
                        <label for="reg-parque">
                            <i class="fas fa-building"></i> Parque SEPEI
                        </label>
                        <select id="reg-parque" required>
                            <option value="">Selecciona tu parque</option>
                            ${PARQUES_SEPEI.map(p => `<option value="${p}">${p}</option>`).join('')}
                        </select>
                    </div>
                    
                    <button type="submit" class="btn-register">
                        <i class="fas fa-paper-plane"></i> Solicitar Acceso
                    </button>
                </form>
                
                <p class="registration-note">
                    <i class="fas fa-info-circle"></i>
                    Tu solicitud será revisada por un administrador.
                    Recibirás acceso una vez aprobada.
                </p>
            </div>
        </div>
    `;
    
    addRegistrationStyles();
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function showPendingScreen(userData) {
    document.getElementById('home-screen').style.display = 'none';
    
    addRegistrationStyles();
    
    const pendingHTML = `
        <div class="registration-overlay" id="registration-overlay">
            <div class="registration-container pending">
                <div class="pending-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h2>Solicitud Pendiente</h2>
                <p class="pending-message">
                    Tu solicitud de acceso está siendo revisada por un administrador.
                </p>
                <div class="user-info-card">
                    <p><strong>Nombre:</strong> ${userData.name}</p>
                    <p><strong>Teléfono:</strong> ${userData.phone}</p>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Parque:</strong> ${userData.parque}</p>
                    <p><strong>Fecha solicitud:</strong> ${new Date(userData.registrationDate).toLocaleDateString('es-ES')}</p>
                </div>
                <button class="btn-refresh" onclick="location.reload()">
                    <i class="fas fa-sync"></i> Comprobar estado
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', pendingHTML);
}

function showRejectedScreen() {
    document.getElementById('home-screen').style.display = 'none';
    
    addRegistrationStyles();
    
    const rejectedHTML = `
        <div class="registration-overlay" id="registration-overlay">
            <div class="registration-container rejected">
                <div class="rejected-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h2>Acceso Denegado</h2>
                <p class="rejected-message">
                    Tu solicitud de acceso ha sido rechazada.
                    Si crees que es un error, contacta con el administrador.
                </p>
                <button class="btn-retry" onclick="retryRegistration()">
                    <i class="fas fa-redo"></i> Solicitar de nuevo
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', rejectedHTML);
}

function retryRegistration() {
    localStorage.removeItem('sepei_user_id');
    location.reload();
}

// ============================================
// ENVÍO DE REGISTRO
// ============================================

function validateEmail(email) {
    // Expresión regular para validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showEmailError(message) {
    let errorDiv = document.getElementById('email-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'email-error';
        errorDiv.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 5px;';
        document.getElementById('reg-email').parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

function clearEmailError() {
    const errorDiv = document.getElementById('email-error');
    if (errorDiv) {
        errorDiv.textContent = '';
    }
}

function submitRegistration(event) {
    event.preventDefault();
    
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim().replace(/\s/g, '');
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const parque = document.getElementById('reg-parque').value;
    
    // Validar formato de email
    if (!validateEmail(email)) {
        showEmailError('Por favor, introduce un email válido (ej: nombre@dominio.com)');
        document.getElementById('reg-email').focus();
        return;
    }
    clearEmailError();
    
    const visitorId = 'user_' + phone + '_' + Date.now().toString(36);
    
    const userData = {
        name: name,
        phone: phone,
        email: email,
        parque: parque,
        status: 'pending',
        registrationDate: new Date().toISOString(),
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };
    
    const submitBtn = document.querySelector('.btn-register');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    database.ref('registeredUsers/' + visitorId).set(userData)
        .then(() => {
            localStorage.setItem('sepei_user_id', visitorId);
            
            database.ref('pendingApprovals/' + visitorId).set({
                name: name,
                phone: phone,
                email: email,
                parque: parque,
                date: userData.registrationDate
            });
            
            database.ref('stats/totalRegistrations').transaction(count => (count || 0) + 1);
            
            document.getElementById('registration-overlay').remove();
            showPendingScreen(userData);
        })
        .catch(error => {
            console.error("Error en registro:", error);
            alert("Error al enviar la solicitud. Inténtalo de nuevo.");
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar Acceso';
            submitBtn.disabled = false;
        });
}

// ============================================
// ACCESO PERMITIDO
// ============================================

function allowAccess() {
    // Añadir clase authorized al body para mostrar la app
    document.body.classList.add('authorized');
    
    // Mostrar pantalla principal
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) {
        homeScreen.style.display = 'block';
        homeScreen.classList.add('active');
    }
    
    // Remover overlay si existe
    const overlay = document.getElementById('registration-overlay');
    if (overlay) overlay.remove();
}

// Variable para tracking de tiempo
let sessionStartTime = null;
let timeTrackingInterval = null;

function updateUserActivity(userId) {
    if (!database) return;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Iniciar tracking de tiempo de sesión
    sessionStartTime = Date.now();
    startTimeTracking(userId);
    
    database.ref('registeredUsers/' + userId).update({
        lastVisit: now.toISOString(),
        visitCount: firebase.database.ServerValue.increment(1)
    });
    
    database.ref('stats/totalVisits').transaction(count => (count || 0) + 1);
    database.ref('stats/dailyUsers/' + today + '/' + userId).set(true);
}

function startTimeTracking(userId) {
    // Actualizar tiempo cada minuto
    timeTrackingInterval = setInterval(() => {
        if (sessionStartTime && database) {
            const minutesSpent = Math.floor((Date.now() - sessionStartTime) / 60000);
            if (minutesSpent > 0) {
                database.ref('registeredUsers/' + userId + '/totalMinutes').transaction(mins => (mins || 0) + 1);
            }
        }
    }, 60000); // Cada minuto
    
    // Guardar tiempo al cerrar/recargar la página
    window.addEventListener('beforeunload', () => {
        if (sessionStartTime && database) {
            const minutesSpent = Math.floor((Date.now() - sessionStartTime) / 60000);
            if (minutesSpent > 0) {
                // Usar sendBeacon para enviar datos antes de cerrar
                const userId = localStorage.getItem('sepei_user_id');
                if (userId) {
                    database.ref('registeredUsers/' + userId + '/totalMinutes').transaction(mins => (mins || 0) + minutesSpent);
                }
            }
        }
    });
}

// Función para actualizar estadísticas de aciertos del usuario
function updateUserStats(correct, total) {
    if (!database) return;
    
    const userId = localStorage.getItem('sepei_user_id');
    if (!userId) return;
    
    database.ref('registeredUsers/' + userId).transaction(userData => {
        if (!userData) return userData;
        
        userData.totalAnswered = (userData.totalAnswered || 0) + total;
        userData.totalCorrect = (userData.totalCorrect || 0) + correct;
        
        return userData;
    });
}

function updateUserCategory(category) {
    if (!database) return;
    
    const userId = localStorage.getItem('sepei_user_id');
    if (userId) {
        database.ref('registeredUsers/' + userId + '/category').set(category);
    }
}

// ============================================
// PANEL DE ADMINISTRADOR
// ============================================

function showAdminPanel() {
    const styles = `
        .admin-panel {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            z-index: 10000;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .admin-header {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .admin-header h1 {
            color: #f39c12;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 20px;
        }
        .admin-close {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        }
        .admin-close:hover { background: #c0392b; }
        .admin-content {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .admin-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .admin-tab {
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }
        .admin-tab:hover { background: rgba(255,255,255,0.2); }
        .admin-tab.active {
            background: #3498db;
            font-weight: bold;
        }
        .admin-tab .badge {
            background: #e74c3c;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 12px;
            margin-left: 8px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .stat-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.15); }
        .stat-card h3 {
            color: #95a5a6;
            font-size: 11px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .stat-card .number {
            font-size: 32px;
            font-weight: bold;
            color: #3498db;
        }
        .stat-card.highlight .number { color: #2ecc71; }
        .stat-card.warning .number { color: #f39c12; }
        .stat-card.danger .number { color: #e74c3c; }
        .admin-section {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .admin-section h2 {
            color: #f39c12;
            margin-bottom: 20px;
            font-size: 18px;
        }
        .admin-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        .admin-table th, .admin-table td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .admin-table th {
            color: #f39c12;
            font-weight: 600;
            background: rgba(0,0,0,0.2);
            font-size: 12px;
        }
        .admin-table tr:hover { background: rgba(255,255,255,0.05); }
        .badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-pending { background: #f39c12; color: #000; }
        .badge-approved { background: #2ecc71; color: #000; }
        .badge-rejected { background: #e74c3c; color: #fff; }
        .badge-cabo { background: #e74c3c; color: #fff; }
        .badge-sargento { background: #27ae60; color: #fff; }
        .stat-percent {
            font-weight: bold;
            padding: 3px 8px;
            border-radius: 4px;
        }
        .stat-percent.good { background: #27ae60; color: white; }
        .stat-percent.medium { background: #f39c12; color: #000; }
        .stat-percent.low { background: #e74c3c; color: white; }
        .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin: 2px;
            transition: all 0.3s;
        }
        .btn-approve { background: #2ecc71; color: #000; }
        .btn-approve:hover { background: #27ae60; }
        .btn-reject { background: #e74c3c; color: #fff; }
        .btn-reject:hover { background: #c0392b; }
        .btn-delete { background: #95a5a6; color: #fff; }
        .btn-delete:hover { background: #7f8c8d; }
        .refresh-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 15px;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .empty-message {
            text-align: center;
            padding: 40px;
            color: #95a5a6;
        }
        .empty-message i { font-size: 48px; margin-bottom: 15px; display: block; }
        @media (max-width: 768px) {
            .admin-table { font-size: 11px; }
            .admin-table th, .admin-table td { padding: 8px 4px; }
            .action-btn { padding: 4px 6px; font-size: 10px; }
            .stat-card .number { font-size: 24px; }
        }
    `;
    
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.id = 'admin-panel';
    panel.innerHTML = `
        <style>${styles}</style>
        
        <div class="admin-header">
            <h1><i class="fas fa-shield-alt"></i> Panel Administrador SEPEI</h1>
            <button class="admin-close" onclick="document.getElementById('admin-panel').remove()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        </div>
        
        <div class="admin-content">
            <div class="stats-grid" id="admin-stats">
                <div class="stat-card warning">
                    <h3>Pendientes</h3>
                    <div class="number" id="stat-pending">-</div>
                </div>
                <div class="stat-card highlight">
                    <h3>Aprobados</h3>
                    <div class="number" id="stat-approved">-</div>
                </div>
                <div class="stat-card danger">
                    <h3>Rechazados</h3>
                    <div class="number" id="stat-rejected">-</div>
                </div>
                <div class="stat-card">
                    <h3>Visitas Totales</h3>
                    <div class="number" id="stat-visits">-</div>
                </div>
                <div class="stat-card">
                    <h3>Hoy</h3>
                    <div class="number" id="stat-today">-</div>
                </div>
                <div class="stat-card">
                    <h3>Cabo</h3>
                    <div class="number" id="stat-cabo">-</div>
                </div>
                <div class="stat-card">
                    <h3>Sargento</h3>
                    <div class="number" id="stat-sargento">-</div>
                </div>
            </div>
            
            <div class="admin-tabs">
                <button class="admin-tab active" onclick="showTab('pending', this)">
                    <i class="fas fa-clock"></i> Pendientes <span class="badge" id="tab-pending-count">0</span>
                </button>
                <button class="admin-tab" onclick="showTab('approved', this)">
                    <i class="fas fa-check"></i> Aprobados
                </button>
                <button class="admin-tab" onclick="showTab('rejected', this)">
                    <i class="fas fa-times"></i> Rechazados
                </button>
                <button class="admin-tab" onclick="showTab('all', this)">
                    <i class="fas fa-users"></i> Todos
                </button>
            </div>
            
            <div class="tab-content active" id="tab-pending">
                <div class="admin-section">
                    <h2><i class="fas fa-user-clock"></i> Solicitudes Pendientes</h2>
                    <button class="refresh-btn" onclick="loadAdminData()">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                    <div id="pending-list"></div>
                </div>
            </div>
            
            <div class="tab-content" id="tab-approved">
                <div class="admin-section">
                    <h2><i class="fas fa-user-check"></i> Usuarios Aprobados</h2>
                    <button class="refresh-btn" onclick="loadAdminData()">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                    <div id="approved-list"></div>
                </div>
            </div>
            
            <div class="tab-content" id="tab-rejected">
                <div class="admin-section">
                    <h2><i class="fas fa-user-times"></i> Usuarios Rechazados</h2>
                    <button class="refresh-btn" onclick="loadAdminData()">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                    <div id="rejected-list"></div>
                </div>
            </div>
            
            <div class="tab-content" id="tab-all">
                <div class="admin-section">
                    <h2><i class="fas fa-users"></i> Todos los Usuarios</h2>
                    <button class="refresh-btn" onclick="loadAdminData()">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                    <div id="all-users-list"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    loadAdminData();
}

function showTab(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    
    document.getElementById('tab-' + tabName).classList.add('active');
    btn.classList.add('active');
}

function loadAdminData() {
    if (!database) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    database.ref('registeredUsers').once('value', snapshot => {
        const users = snapshot.val() || {};
        const userList = Object.entries(users);
        
        let pending = [], approved = [], rejected = [];
        let caboCount = 0, sargentoCount = 0;
        
        userList.forEach(([id, data]) => {
            const userData = { id, ...data };
            
            if (data.status === 'pending') pending.push(userData);
            else if (data.status === 'approved') approved.push(userData);
            else if (data.status === 'rejected') rejected.push(userData);
            
            if (data.category === 'cabo') caboCount++;
            if (data.category === 'sargento') sargentoCount++;
        });
        
        document.getElementById('stat-pending').textContent = pending.length;
        document.getElementById('stat-approved').textContent = approved.length;
        document.getElementById('stat-rejected').textContent = rejected.length;
        document.getElementById('stat-cabo').textContent = caboCount;
        document.getElementById('stat-sargento').textContent = sargentoCount;
        document.getElementById('tab-pending-count').textContent = pending.length;
        
        renderUserList('pending-list', pending, 'pending');
        renderUserList('approved-list', approved, 'approved');
        renderUserList('rejected-list', rejected, 'rejected');
        renderUserList('all-users-list', userList.map(([id, data]) => ({ id, ...data })), 'all');
    });
    
    database.ref('stats/totalVisits').once('value', snapshot => {
        document.getElementById('stat-visits').textContent = snapshot.val() || 0;
    });
    
    database.ref('stats/dailyUsers/' + today).once('value', snapshot => {
        const todayUsers = snapshot.val() || {};
        document.getElementById('stat-today').textContent = Object.keys(todayUsers).length;
    });
}

function renderUserList(containerId, users, type) {
    const container = document.getElementById(containerId);
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-inbox"></i>
                <p>No hay usuarios en esta categoría</p>
            </div>
        `;
        return;
    }
    
    users.sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0));
    
    let tableHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Parque</th>
                    <th>Estudiando</th>
                    <th>Tiempo</th>
                    <th>Aciertos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const date = user.registrationDate ? new Date(user.registrationDate).toLocaleDateString('es-ES') : '-';
        const statusBadge = user.status === 'pending' ? '<span class="badge badge-pending">Pendiente</span>' :
                           user.status === 'approved' ? '<span class="badge badge-approved">Aprobado</span>' :
                           '<span class="badge badge-rejected">Rechazado</span>';
        
        const categoryBadge = user.category === 'cabo' ? '<span class="badge badge-cabo">Cabo</span>' :
                             user.category === 'sargento' ? '<span class="badge badge-sargento">Sargento</span>' : '-';
        
        // Calcular tiempo de uso
        const totalMinutes = user.totalMinutes || 0;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeDisplay = totalMinutes > 0 ? `${hours}h ${mins}m` : '-';
        
        // Calcular porcentaje de aciertos
        const totalAnswered = user.totalAnswered || 0;
        const totalCorrect = user.totalCorrect || 0;
        const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        const percentageDisplay = totalAnswered > 0 
            ? `<span class="stat-percent ${percentage >= 70 ? 'good' : percentage >= 50 ? 'medium' : 'low'}">${percentage}%</span> <small>(${totalCorrect}/${totalAnswered})</small>` 
            : '-';
        
        let actions = '';
        if (user.status === 'pending') {
            actions = `
                <button class="action-btn btn-approve" onclick="approveUser('${user.id}')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="action-btn btn-reject" onclick="rejectUser('${user.id}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else if (user.status === 'approved') {
            actions = `
                <button class="action-btn btn-reject" onclick="rejectUser('${user.id}')">
                    <i class="fas fa-ban"></i>
                </button>
            `;
        } else {
            actions = `
                <button class="action-btn btn-approve" onclick="approveUser('${user.id}')">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="action-btn btn-delete" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        
        tableHTML += `
            <tr>
                <td><strong>${user.name || '-'}</strong><br><small style="color:#888;">${user.phone || ''}</small></td>
                <td style="font-size:11px;">${user.email || '-'}</td>
                <td style="font-size:11px;">${user.parque || '-'}</td>
                <td>${categoryBadge}</td>
                <td><i class="fas fa-clock" style="color:#3498db;"></i> ${timeDisplay}</td>
                <td>${percentageDisplay}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// ============================================
// ACCIONES DE ADMIN
// ============================================

function approveUser(userId) {
    if (!confirm('¿Aprobar acceso a este usuario?')) return;
    
    database.ref('registeredUsers/' + userId).update({
        status: 'approved',
        approvedDate: new Date().toISOString()
    }).then(() => {
        database.ref('pendingApprovals/' + userId).remove();
        loadAdminData();
    });
}

function rejectUser(userId) {
    if (!confirm('¿Rechazar/revocar acceso a este usuario?')) return;
    
    database.ref('registeredUsers/' + userId).update({
        status: 'rejected',
        rejectedDate: new Date().toISOString()
    }).then(() => {
        database.ref('pendingApprovals/' + userId).remove();
        loadAdminData();
    });
}

function deleteUser(userId) {
    if (!confirm('¿Eliminar permanentemente este usuario?')) return;
    
    database.ref('registeredUsers/' + userId).remove().then(() => {
        database.ref('pendingApprovals/' + userId).remove();
        loadAdminData();
    });
}

// ============================================
// ESTILOS DE REGISTRO
// ============================================

function addRegistrationStyles() {
    if (document.getElementById('registration-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'registration-styles';
    styles.textContent = `
        .registration-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            overflow-y: auto;
        }
        .registration-container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 450px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
            margin: auto;
        }
        .registration-header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        .registration-header i {
            font-size: 50px;
            color: #f39c12;
            margin-bottom: 10px;
        }
        .registration-header h1 {
            font-size: 28px;
            margin: 10px 0 5px;
        }
        .registration-header p {
            color: #95a5a6;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            color: #bdc3c7;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .form-group label i {
            margin-right: 8px;
            color: #f39c12;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            background: rgba(255,255,255,0.05);
            color: white;
            font-size: 16px;
            transition: all 0.3s;
            box-sizing: border-box;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #f39c12;
            background: rgba(255,255,255,0.1);
        }
        .form-group input::placeholder { color: #7f8c8d; }
        .form-group select option {
            background: #1a1a2e;
            color: white;
        }
        .btn-register {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #f39c12, #e67e22);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn-register:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(243, 156, 18, 0.4);
        }
        .btn-register:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        .registration-note {
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
            margin-top: 20px;
            line-height: 1.5;
        }
        .registration-note i { color: #3498db; }
        
        .registration-container.pending .pending-icon {
            text-align: center;
            font-size: 60px;
            color: #f39c12;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        .registration-container.pending h2,
        .registration-container.rejected h2 {
            color: white;
            text-align: center;
            margin-bottom: 15px;
        }
        .pending-message, .rejected-message {
            color: #bdc3c7;
            text-align: center;
            margin-bottom: 25px;
        }
        .user-info-card {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .user-info-card p {
            color: #ecf0f1;
            margin: 8px 0;
            font-size: 14px;
        }
        .user-info-card strong { color: #f39c12; }
        .btn-refresh, .btn-retry {
            width: 100%;
            padding: 14px;
            background: #3498db;
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 14px;
            cursor: pointer;
        }
        .btn-retry { background: #95a5a6; }
        
        .registration-container.rejected .rejected-icon {
            text-align: center;
            font-size: 60px;
            color: #e74c3c;
            margin-bottom: 20px;
        }
        .registration-container.rejected h2 { color: #e74c3c; }
    `;
    document.head.appendChild(styles);
}

// ============================================
// INICIAR
// ============================================

document.addEventListener('DOMContentLoaded', initFirebase);
