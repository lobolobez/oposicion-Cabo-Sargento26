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
    
    // DEBUG: Saltar verificación para desarrollo
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('dev')) {
        console.log("MODO DESARROLLO - Saltando verificación");
        document.body.classList.add('authorized');
        return;
    }
    
    // PRIMERO: Verificar si quiere acceder como admin
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
                    <svg class="flame-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 8 C50 8, 68 28, 68 50 C68 62, 60 72, 50 76
                                 C55 68, 55 58, 48 52 C48 60, 42 66, 38 72
                                 C30 64, 28 54, 32 44 C26 52, 24 60, 26 70
                                 C18 60, 20 42, 32 30 C28 38, 30 46, 36 50
                                 C36 36, 42 20, 50 8Z"
                              fill="#F97316" stroke="#F97316" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                    <h1>SEPEI <span>UNIDO</span></h1>
                    <p>Registro de Acceso</p>
                </div>
                
                <form id="registration-form" onsubmit="showDisclaimerModal(event)">
                    <div class="form-group">
                        <label for="reg-name">
                            <i class="fas fa-user"></i> Nombre completo <span class="required-asterisk">*</span>
                        </label>
                        <input type="text" id="reg-name" required placeholder="Ej: Juan García López" minlength="5" maxlength="100">
                        <span class="field-hint">Introduce tu nombre y apellidos reales (mínimo 5 caracteres)</span>
                        <span class="field-error" id="name-error"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="reg-phone">
                            <i class="fas fa-phone"></i> Teléfono móvil <span class="required-asterisk">*</span>
                        </label>
                        <input type="tel" id="reg-phone" required placeholder="Ej: 612345678" 
                               pattern="[0-9]{9}" title="Introduce exactamente 9 dígitos" maxlength="9">
                        <span class="field-hint">Teléfono de contacto válido (9 dígitos sin espacios)</span>
                        <span class="field-error" id="phone-error"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="reg-email">
                            <i class="fas fa-envelope"></i> Correo electrónico <span class="required-asterisk">*</span>
                        </label>
                        <input type="email" id="reg-email" required placeholder="Ej: tu.nombre@email.com">
                        <span class="field-hint">Email real al que tengas acceso</span>
                        <span class="field-error" id="email-error"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="reg-parque">
                            <i class="fas fa-building"></i> Parque SEPEI <span class="required-asterisk">*</span>
                        </label>
                        <select id="reg-parque" required>
                            <option value="">-- Selecciona tu parque --</option>
                            ${PARQUES_SEPEI.map(p => `<option value="${p}">${p}</option>`).join('')}
                        </select>
                        <span class="field-hint">Selecciona el parque donde trabajas</span>
                        <span class="field-error" id="parque-error"></span>
                    </div>
                    
                    <button type="submit" class="btn-register">
                        <i class="fas fa-arrow-right"></i> Continuar
                    </button>
                </form>
                
                <p class="registration-note">
                    <i class="fas fa-info-circle"></i>
                    Tu solicitud será revisada por un administrador.
                    Recibirás acceso una vez aprobada y verificados tus datos.
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
                <div class="registration-header">
                    <svg class="flame-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 8 C50 8, 68 28, 68 50 C68 62, 60 72, 50 76
                                 C55 68, 55 58, 48 52 C48 60, 42 66, 38 72
                                 C30 64, 28 54, 32 44 C26 52, 24 60, 26 70
                                 C18 60, 20 42, 32 30 C28 38, 30 46, 36 50
                                 C36 36, 42 20, 50 8Z"
                              fill="#F97316" stroke="#F97316" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                    <h1>SEPEI <span>UNIDO</span></h1>
                </div>
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
                <div class="registration-header">
                    <svg class="flame-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 8 C50 8, 68 28, 68 50 C68 62, 60 72, 50 76
                                 C55 68, 55 58, 48 52 C48 60, 42 66, 38 72
                                 C30 64, 28 54, 32 44 C26 52, 24 60, 26 70
                                 C18 60, 20 42, 32 30 C28 38, 30 46, 36 50
                                 C36 36, 42 20, 50 8Z"
                              fill="#F97316" stroke="#F97316" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                    <h1>SEPEI <span>UNIDO</span></h1>
                </div>
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

function validateName(name) {
    // El nombre debe tener al menos 5 caracteres y contener al menos un espacio (nombre y apellido)
    if (name.length < 5) return false;
    // Debe contener al menos letras
    if (!/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(name)) return false;
    // No debe ser solo números
    if (/^[0-9\s]+$/.test(name)) return false;
    // No debe contener caracteres especiales extraños
    if (/[<>{}\[\]\\"\';]/.test(name)) return false;
    return true;
}

function validatePhone(phone) {
    // El teléfono debe ser exactamente 9 dígitos y empezar por 6, 7 o 9
    const phoneClean = phone.replace(/\s/g, '');
    if (!/^[679][0-9]{8}$/.test(phoneClean)) return false;
    // No debe ser un número repetitivo
    if (/^(\d)\1{8}$/.test(phoneClean)) return false;
    return true;
}

function showFieldError(fieldId, message) {
    const errorSpan = document.getElementById(fieldId + '-error');
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.style.display = 'block';
    }
    const input = document.getElementById('reg-' + fieldId);
    if (input) {
        input.classList.add('input-error');
    }
}

function clearFieldError(fieldId) {
    const errorSpan = document.getElementById(fieldId + '-error');
    if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.style.display = 'none';
    }
    const input = document.getElementById('reg-' + fieldId);
    if (input) {
        input.classList.remove('input-error');
    }
}

function clearAllErrors() {
    ['name', 'phone', 'email', 'parque', 'confirm', 'privacy'].forEach(field => clearFieldError(field));
}

function showEmailError(message) {
    showFieldError('email', message);
}

function clearEmailError() {
    clearFieldError('email');
}

// Variable temporal para almacenar datos del formulario
let pendingRegistrationData = null;

// Función para mostrar el modal de disclaimers después de validar el formulario
function showDisclaimerModal(event) {
    event.preventDefault();
    
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim().replace(/\s/g, '');
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const parque = document.getElementById('reg-parque').value;
    
    // Limpiar errores anteriores
    clearAllErrors();
    
    let hasErrors = false;
    
    // Validar nombre
    if (!name) {
        showFieldError('name', 'El nombre es obligatorio');
        hasErrors = true;
    } else if (!validateName(name)) {
        showFieldError('name', 'Introduce tu nombre y apellidos reales (mínimo 5 caracteres, sin caracteres especiales)');
        hasErrors = true;
    }
    
    // Validar teléfono
    if (!phone) {
        showFieldError('phone', 'El teléfono es obligatorio');
        hasErrors = true;
    } else if (!validatePhone(phone)) {
        showFieldError('phone', 'Introduce un número de móvil español válido (9 dígitos, comenzando por 6, 7 o 9)');
        hasErrors = true;
    }
    
    // Validar email
    if (!email) {
        showFieldError('email', 'El email es obligatorio');
        hasErrors = true;
    } else if (!validateEmail(email)) {
        showFieldError('email', 'Introduce un email válido (ej: nombre@dominio.com)');
        hasErrors = true;
    }
    
    // Validar parque
    if (!parque) {
        showFieldError('parque', 'Debes seleccionar tu parque SEPEI');
        hasErrors = true;
    }
    
    // Si hay errores, no continuar
    if (hasErrors) {
        const firstError = document.querySelector('.field-error[style*="block"]');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Guardar datos temporalmente
    pendingRegistrationData = { name, phone, email, parque };
    
    // Mostrar modal de disclaimers
    const disclaimerModalHTML = `
        <div class="disclaimer-modal-overlay" id="disclaimer-modal">
            <div class="disclaimer-modal">
                <div class="disclaimer-modal-header">
                    <i class="fas fa-file-contract"></i>
                    <h2>Términos y Condiciones</h2>
                    <p>Antes de completar tu solicitud, lee y acepta los siguientes términos:</p>
                </div>
                
                <div class="disclaimer-modal-body">
                    <!-- Resumen de datos introducidos -->
                    <div class="data-summary">
                        <h4><i class="fas fa-user-check"></i> Datos de tu solicitud:</h4>
                        <ul>
                            <li><strong>Nombre:</strong> ${name}</li>
                            <li><strong>Teléfono:</strong> ${phone}</li>
                            <li><strong>Email:</strong> ${email}</li>
                            <li><strong>Parque:</strong> ${parque}</li>
                        </ul>
                    </div>
                    
                    <!-- Disclaimer 1: Veracidad de datos -->
                    <div class="disclaimer-summary disclaimer-warning-summary">
                        <div class="disclaimer-summary-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="disclaimer-summary-content">
                            <h4>Veracidad de los datos</h4>
                            <p>Los datos proporcionados deben ser <strong>reales y verificables</strong>. No se autorizará el acceso a usuarios con datos falsos o inventados.</p>
                            <a href="#" onclick="showFullDisclaimer('datos'); return false;" class="read-more-link">
                                <i class="fas fa-external-link-alt"></i> Leer aviso completo
                            </a>
                        </div>
                    </div>
                    
                    <!-- Disclaimer 2: Protección de datos -->
                    <div class="disclaimer-summary disclaimer-privacy-summary">
                        <div class="disclaimer-summary-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="disclaimer-summary-content">
                            <h4>Protección de datos personales</h4>
                            <p>Tus datos serán tratados por SEPEI UNIDO únicamente para gestionar el acceso a la plataforma. Puedes ejercer tus derechos ARCO en cualquier momento.</p>
                            <a href="#" onclick="showFullDisclaimer('privacidad'); return false;" class="read-more-link">
                                <i class="fas fa-external-link-alt"></i> Leer política completa
                            </a>
                        </div>
                    </div>
                    
                    <!-- Checkboxes de aceptación -->
                    <div class="disclaimer-checkboxes">
                        <label class="disclaimer-checkbox-label">
                            <input type="checkbox" id="accept-datos">
                            <span class="disclaimer-checkmark"></span>
                            <span>Confirmo que los datos introducidos son <strong>reales y verídicos</strong></span>
                        </label>
                        <span class="disclaimer-check-error" id="datos-check-error"></span>
                        
                        <label class="disclaimer-checkbox-label">
                            <input type="checkbox" id="accept-privacidad">
                            <span class="disclaimer-checkmark"></span>
                            <span>He leído y acepto la <strong>política de protección de datos</strong></span>
                        </label>
                        <span class="disclaimer-check-error" id="privacidad-check-error"></span>
                    </div>
                </div>
                
                <div class="disclaimer-modal-footer">
                    <button class="btn-disclaimer-back" onclick="closeDisclaimerModal()">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                    <button class="btn-disclaimer-submit" onclick="submitFromDisclaimer()">
                        <i class="fas fa-paper-plane"></i> Enviar Solicitud
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', disclaimerModalHTML);
}

// Función para mostrar el disclaimer completo
function showFullDisclaimer(type) {
    let title, content;
    
    if (type === 'datos') {
        title = 'AVISO: DATOS OBLIGATORIOS';
        content = `
            <p>Todos los campos del formulario de registro son <strong>obligatorios</strong> y deben contener <strong>información real y verificable</strong>.</p>
            
            <p><strong>⚠️ IMPORTANTE:</strong></p>
            <ul>
                <li>Los datos proporcionados serán verificados por un administrador antes de conceder el acceso.</li>
                <li>No se autorizará el acceso a ningún usuario con datos incompletos, falsos o inventados.</li>
                <li>El nombre debe coincidir con tu identidad real.</li>
                <li>El teléfono y email deben ser medios de contacto reales y activos.</li>
                <li>El parque SEPEI indicado debe ser aquel donde actualmente prestas servicio.</li>
            </ul>
            
            <p>La finalidad de estos requisitos es garantizar que la plataforma de estudio sea utilizada exclusivamente por personal del SEPEI de la Diputación de Albacete.</p>
            
            <p>El incumplimiento de estas condiciones resultará en la denegación inmediata del acceso y la eliminación de los datos proporcionados.</p>
        `;
    } else {
        title = 'POLÍTICA DE PROTECCIÓN DE DATOS PERSONALES';
        content = `
            <p><strong>1. Responsable del tratamiento:</strong><br>
            SEPEI UNIDO (Movimiento Asindical)<br>
            Email de contacto: <a href="mailto:sepeiunido@gmail.com">sepeiunido@gmail.com</a></p>
            
            <p><strong>2. Finalidad del tratamiento:</strong><br>
            Los datos personales recogidos serán utilizados para:<br>
            - Gestionar el acceso a la plataforma de estudio para oposiciones.<br>
            - Verificar que los usuarios pertenecen al colectivo SEPEI de la Diputación de Albacete.<br>
            - Enviar comunicaciones relacionadas con la plataforma (opcional).</p>
            
            <p><strong>3. Legitimación:</strong><br>
            El tratamiento de tus datos se basa en el consentimiento que prestas al aceptar estos términos.</p>
            
            <p><strong>4. Destinatarios:</strong><br>
            Los datos no serán cedidos a terceros, salvo obligación legal. Los datos se almacenan en servidores de Firebase (Google) ubicados en la Unión Europea.</p>
            
            <p><strong>5. Derechos del interesado:</strong><br>
            Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición escribiendo a <a href="mailto:sepeiunido@gmail.com">sepeiunido@gmail.com</a>, indicando en el asunto "Protección de Datos".</p>
            
            <p><strong>6. Conservación de datos:</strong><br>
            Los datos se conservarán mientras el usuario mantenga acceso a la plataforma o hasta que solicite su eliminación.</p>
            
            <p><strong>7. Medidas de seguridad:</strong><br>
            Se han adoptado las medidas técnicas y organizativas necesarias para garantizar la seguridad de los datos personales.</p>
        `;
    }
    
    const fullDisclaimerHTML = `
        <div class="full-disclaimer-overlay" id="full-disclaimer-modal">
            <div class="full-disclaimer-modal">
                <div class="full-disclaimer-header">
                    <h3>${title}</h3>
                    <button class="btn-close-disclaimer" onclick="closeFullDisclaimer()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="full-disclaimer-content">
                    ${content}
                </div>
                <div class="full-disclaimer-footer">
                    <button class="btn-understood" onclick="closeFullDisclaimer()">
                        <i class="fas fa-check"></i> Entendido
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', fullDisclaimerHTML);
}

function closeFullDisclaimer() {
    const modal = document.getElementById('full-disclaimer-modal');
    if (modal) modal.remove();
}

function closeDisclaimerModal() {
    const modal = document.getElementById('disclaimer-modal');
    if (modal) modal.remove();
    pendingRegistrationData = null;
}

function submitFromDisclaimer() {
    const acceptDatos = document.getElementById('accept-datos').checked;
    const acceptPrivacidad = document.getElementById('accept-privacidad').checked;
    
    // Limpiar errores
    document.getElementById('datos-check-error').textContent = '';
    document.getElementById('privacidad-check-error').textContent = '';
    
    let hasErrors = false;
    
    if (!acceptDatos) {
        document.getElementById('datos-check-error').textContent = 'Debes confirmar que los datos son reales';
        hasErrors = true;
    }
    
    if (!acceptPrivacidad) {
        document.getElementById('privacidad-check-error').textContent = 'Debes aceptar la política de protección de datos';
        hasErrors = true;
    }
    
    if (hasErrors) return;
    
    // Cerrar modal y enviar
    const submitBtn = document.querySelector('.btn-disclaimer-submit');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    // Llamar a la función de envío
    submitRegistration();
}

function submitRegistration() {
    if (!pendingRegistrationData) {
        console.error("No hay datos de registro pendientes");
        return;
    }
    
    const { name, phone, email, parque } = pendingRegistrationData;
    
    // PRIMERO: Buscar si ya existe un usuario con el mismo email o teléfono
    database.ref('registeredUsers').once('value')
        .then(snapshot => {
            const users = snapshot.val();
            let existingUserId = null;
            let existingUserData = null;
            
            // Buscar usuario existente por email o teléfono
            if (users) {
                for (const [id, user] of Object.entries(users)) {
                    if (user.email === email || user.phone === phone) {
                        existingUserId = id;
                        existingUserData = user;
                        break;
                    }
                }
            }
            
            if (existingUserId) {
                // Usuario ya existe - recuperar acceso sin crear duplicado
                console.log("Usuario existente encontrado:", existingUserId);
                localStorage.setItem('sepei_user_id', existingUserId);
                
                // Actualizar última visita
                database.ref('registeredUsers/' + existingUserId).update({
                    lastVisit: new Date().toISOString(),
                    device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                });
                
                // Cerrar modales
                const disclaimerModal = document.getElementById('disclaimer-modal');
                if (disclaimerModal) disclaimerModal.remove();
                document.getElementById('registration-overlay').remove();
                
                // Redirigir según el estado del usuario
                if (existingUserData.status === 'approved') {
                    currentUser = existingUserData;
                    allowAccess();
                    updateUserActivity(existingUserId);
                } else if (existingUserData.status === 'pending') {
                    showPendingScreen(existingUserData);
                } else if (existingUserData.status === 'rejected') {
                    showRejectedScreen();
                }
            } else {
                // Usuario nuevo - crear registro
                createNewUser(name, phone, email, parque);
            }
        })
        .catch(error => {
            console.error("Error verificando usuario:", error);
            // Si hay error, intentar crear usuario nuevo
            createNewUser(name, phone, email, parque);
        });
}

// Función para crear un nuevo usuario
function createNewUser(name, phone, email, parque) {
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
            
            // Cerrar modales
            const disclaimerModal = document.getElementById('disclaimer-modal');
            if (disclaimerModal) disclaimerModal.remove();
            const registrationOverlay = document.getElementById('registration-overlay');
            if (registrationOverlay) registrationOverlay.remove();
            
            showPendingScreen(userData);
        })
        .catch(error => {
            console.error("Error en registro:", error);
            alert("Error al enviar la solicitud. Inténtalo de nuevo.");
            const submitBtn = document.querySelector('.btn-disclaimer-submit');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud';
                submitBtn.disabled = false;
            }
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

// Función para guardar resultado de examen en Firebase
function saveExamResult(examData) {
    if (!database) return;
    
    const userId = localStorage.getItem('sepei_user_id');
    if (!userId) return;
    
    // Guardar el examen en el historial del usuario
    database.ref('registeredUsers/' + userId + '/exams').push({
        date: new Date().toISOString(),
        category: examData.category,
        score: examData.score,
        correct: examData.correct,
        incorrect: examData.incorrect,
        blank: examData.blank,
        percentage: examData.percentage,
        passed: examData.passed
    });
    
    // Incrementar contador de exámenes
    database.ref('registeredUsers/' + userId + '/examsCompleted').transaction(count => (count || 0) + 1);
    
    // Actualizar mejor puntuación si es mayor
    database.ref('registeredUsers/' + userId + '/bestScore').transaction(best => {
        if (!best || examData.score > best) {
            return examData.score;
        }
        return best;
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
        .exam-count {
            font-weight: bold;
            background: #9b59b6;
            color: white;
            padding: 3px 10px;
            border-radius: 12px;
            margin-right: 5px;
        }
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
                    <th>Parque</th>
                    <th>Estudiando</th>
                    <th>Tiempo</th>
                    <th>Aciertos</th>
                    <th>Exámenes</th>
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
        
        // Información de exámenes
        const examsCount = user.examsCompleted || 0;
        const bestScore = user.bestScore ? user.bestScore.toFixed(1) : '-';
        const examsDisplay = examsCount > 0 
            ? `<span class="exam-count">${examsCount}</span> <small>Mejor: ${bestScore}</small>`
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
                <td style="font-size:11px;">${user.parque || '-'}</td>
                <td>${categoryBadge}</td>
                <td><i class="fas fa-clock" style="color:#3498db;"></i> ${timeDisplay}</td>
                <td>${percentageDisplay}</td>
                <td><i class="fas fa-file-alt" style="color:#9b59b6;"></i> ${examsDisplay}</td>
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
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;600;700&display=swap');
        
        .registration-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #111111 0%, #0D0D0D 100%);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            overflow-y: auto;
        }
        .registration-container {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 40px;
            max-width: 450px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            border: 1px solid rgba(249, 115, 22, 0.2);
            border-top: 3px solid #F97316;
            margin: auto;
        }
        .registration-header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        .registration-header .flame-logo {
            width: 70px;
            height: 70px;
            margin-bottom: 15px;
        }
        .registration-header h1 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 32px;
            letter-spacing: 3px;
            margin: 10px 0 5px;
        }
        .registration-header h1 span {
            color: #F97316;
        }
        .registration-header p {
            color: #6B7280;
            font-size: 12px;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            color: #9CA3AF;
            margin-bottom: 8px;
            font-size: 14px;
            font-family: 'Barlow', sans-serif;
        }
        .form-group label i {
            margin-right: 8px;
            color: #F97316;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid rgba(249, 115, 22, 0.2);
            border-radius: 10px;
            background: rgba(255,255,255,0.05);
            color: white;
            font-size: 16px;
            font-family: 'Barlow', sans-serif;
            transition: all 0.3s;
            box-sizing: border-box;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #F97316;
            background: rgba(249, 115, 22, 0.1);
        }
        .form-group input::placeholder { color: #6B7280; }
        .form-group select option {
            background: #111111;
            color: white;
        }
        .btn-register {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #F97316, #EA580C);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            font-family: 'Barlow', sans-serif;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn-register:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(249, 115, 22, 0.4);
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
        
        /* === ESTILOS PARA DISCLAIMERS === */
        .disclaimers-section {
            margin: 25px 0;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .disclaimer-box {
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .disclaimer-header {
            padding: 12px 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            font-size: 12px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        
        .disclaimer-header i {
            font-size: 16px;
        }
        
        .disclaimer-content {
            padding: 15px;
            font-size: 12px;
            line-height: 1.6;
        }
        
        .disclaimer-content p {
            margin: 8px 0;
            color: #bdc3c7;
        }
        
        .disclaimer-content strong {
            color: #ecf0f1;
        }
        
        .disclaimer-content a {
            color: #3498db;
            text-decoration: none;
        }
        
        .disclaimer-content a:hover {
            text-decoration: underline;
        }
        
        /* Disclaimer de Datos Obligatorios (Amarillo/Naranja) */
        .disclaimer-warning {
            border-color: rgba(243, 156, 18, 0.4);
        }
        
        .disclaimer-warning .disclaimer-header {
            background: linear-gradient(135deg, rgba(243, 156, 18, 0.25), rgba(230, 126, 34, 0.2));
            color: #f39c12;
        }
        
        .disclaimer-warning .disclaimer-content {
            background: rgba(243, 156, 18, 0.08);
        }
        
        .disclaimer-highlight {
            color: #e74c3c !important;
            font-weight: 600;
            background: rgba(231, 76, 60, 0.1);
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 10px !important;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .disclaimer-highlight i {
            color: #e74c3c;
        }
        
        /* Disclaimer de Protección de Datos (Azul) */
        .disclaimer-privacy {
            border-color: rgba(52, 152, 219, 0.4);
        }
        
        .disclaimer-privacy .disclaimer-header {
            background: linear-gradient(135deg, rgba(52, 152, 219, 0.25), rgba(41, 128, 185, 0.2));
            color: #3498db;
        }
        
        .disclaimer-privacy .disclaimer-content {
            background: rgba(52, 152, 219, 0.08);
        }
        
        .required-asterisk {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .field-hint {
            display: block;
            color: #6B7280;
            font-size: 11px;
            margin-top: 6px;
            font-style: italic;
        }
        
        .field-error {
            display: none;
            color: #e74c3c;
            font-size: 12px;
            margin-top: 6px;
            font-weight: 500;
        }
        
        .form-group input.input-error,
        .form-group select.input-error {
            border-color: #e74c3c !important;
            background: rgba(231, 76, 60, 0.1) !important;
            animation: shake 0.3s ease-in-out;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        .checkbox-group {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .checkbox-label {
            display: flex !important;
            align-items: flex-start;
            gap: 12px;
            cursor: pointer;
            color: #9CA3AF !important;
        }
        
        .checkbox-label input[type="checkbox"] {
            width: auto !important;
            height: auto;
            margin-top: 3px;
            flex-shrink: 0;
            cursor: pointer;
            accent-color: #F97316;
        }
        
        .checkbox-text {
            font-size: 12px;
            line-height: 1.5;
            color: #9CA3AF;
        }
        
        .checkbox-text strong {
            color: #F97316;
        }
        
        /* Validación visual en tiempo real */
        .form-group input:valid:not(:placeholder-shown),
        .form-group select:valid:not([value=""]) {
            border-color: rgba(46, 204, 113, 0.5);
        }
        
        .form-group input:invalid:not(:placeholder-shown):not(:focus) {
            border-color: rgba(231, 76, 60, 0.5);
        }
        
        /* === ESTILOS PARA MODAL DE DISCLAIMERS === */
        .disclaimer-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            overflow-y: auto;
        }
        
        .disclaimer-modal {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 16px;
            max-width: 550px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 80px rgba(0,0,0,0.6);
            border: 1px solid rgba(249, 115, 22, 0.3);
        }
        
        .disclaimer-modal-header {
            padding: 25px;
            text-align: center;
            background: rgba(249, 115, 22, 0.1);
            border-bottom: 1px solid rgba(249, 115, 22, 0.2);
        }
        
        .disclaimer-modal-header i {
            font-size: 40px;
            color: #F97316;
            margin-bottom: 10px;
        }
        
        .disclaimer-modal-header h2 {
            color: white;
            font-family: 'Bebas Neue', sans-serif;
            font-size: 24px;
            letter-spacing: 2px;
            margin: 10px 0 5px;
        }
        
        .disclaimer-modal-header p {
            color: #9CA3AF;
            font-size: 13px;
        }
        
        .disclaimer-modal-body {
            padding: 25px;
        }
        
        .data-summary {
            background: rgba(46, 204, 113, 0.1);
            border: 1px solid rgba(46, 204, 113, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .data-summary h4 {
            color: #2ecc71;
            font-size: 14px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .data-summary ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .data-summary li {
            color: #ecf0f1;
            font-size: 13px;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .data-summary li:last-child {
            border-bottom: none;
        }
        
        .data-summary strong {
            color: #9CA3AF;
        }
        
        .disclaimer-summary {
            display: flex;
            gap: 15px;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
        }
        
        .disclaimer-summary-icon {
            font-size: 28px;
            flex-shrink: 0;
        }
        
        .disclaimer-summary-content h4 {
            font-size: 14px;
            margin-bottom: 6px;
        }
        
        .disclaimer-summary-content p {
            font-size: 12px;
            color: #bdc3c7;
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .read-more-link {
            font-size: 12px;
            color: #3498db;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: color 0.3s;
        }
        
        .read-more-link:hover {
            color: #5dade2;
            text-decoration: underline;
        }
        
        .disclaimer-warning-summary {
            background: rgba(243, 156, 18, 0.1);
            border: 1px solid rgba(243, 156, 18, 0.3);
        }
        
        .disclaimer-warning-summary .disclaimer-summary-icon {
            color: #f39c12;
        }
        
        .disclaimer-warning-summary h4 {
            color: #f39c12;
        }
        
        .disclaimer-privacy-summary {
            background: rgba(52, 152, 219, 0.1);
            border: 1px solid rgba(52, 152, 219, 0.3);
        }
        
        .disclaimer-privacy-summary .disclaimer-summary-icon {
            color: #3498db;
        }
        
        .disclaimer-privacy-summary h4 {
            color: #3498db;
        }
        
        .disclaimer-checkboxes {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .disclaimer-checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            cursor: pointer;
            margin-bottom: 15px;
            color: #bdc3c7;
            font-size: 13px;
            line-height: 1.5;
        }
        
        .disclaimer-checkbox-label input[type="checkbox"] {
            margin-top: 3px;
            flex-shrink: 0;
            accent-color: #F97316;
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .disclaimer-checkbox-label strong {
            color: #F97316;
        }
        
        .disclaimer-check-error {
            display: block;
            color: #e74c3c;
            font-size: 11px;
            margin-top: -10px;
            margin-bottom: 15px;
            margin-left: 30px;
        }
        
        .disclaimer-modal-footer {
            padding: 20px 25px;
            display: flex;
            gap: 15px;
            justify-content: space-between;
            background: rgba(0,0,0,0.2);
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .btn-disclaimer-back {
            padding: 14px 25px;
            background: #7f8c8d;
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.3s;
        }
        
        .btn-disclaimer-back:hover {
            background: #95a5a6;
        }
        
        .btn-disclaimer-submit {
            padding: 14px 25px;
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .btn-disclaimer-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(46, 204, 113, 0.4);
        }
        
        .btn-disclaimer-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        /* === MODAL DE DISCLAIMER COMPLETO === */
        .full-disclaimer-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10002;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .full-disclaimer-modal {
            background: #1a1a2e;
            border-radius: 12px;
            max-width: 600px;
            width: 100%;
            max-height: 85vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid rgba(249, 115, 22, 0.3);
        }
        
        .full-disclaimer-header {
            padding: 20px;
            background: rgba(249, 115, 22, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(249, 115, 22, 0.2);
        }
        
        .full-disclaimer-header h3 {
            color: #F97316;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 1px;
        }
        
        .btn-close-disclaimer {
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }
        
        .btn-close-disclaimer:hover {
            background: rgba(231, 76, 60, 0.3);
        }
        
        .full-disclaimer-content {
            padding: 25px;
            overflow-y: auto;
            flex: 1;
            color: #bdc3c7;
            font-size: 13px;
            line-height: 1.7;
        }
        
        .full-disclaimer-content p {
            margin-bottom: 15px;
        }
        
        .full-disclaimer-content strong {
            color: #ecf0f1;
        }
        
        .full-disclaimer-content ul {
            margin: 10px 0 15px 20px;
        }
        
        .full-disclaimer-content li {
            margin-bottom: 8px;
        }
        
        .full-disclaimer-content a {
            color: #3498db;
        }
        
        .full-disclaimer-footer {
            padding: 15px 25px;
            background: rgba(0,0,0,0.2);
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .btn-understood {
            padding: 12px 30px;
            background: linear-gradient(135deg, #F97316, #EA580C);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .btn-understood:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(249, 115, 22, 0.4);
        }
    `;
    document.head.appendChild(styles);
}

// ============================================
// INICIAR
// ============================================

document.addEventListener('DOMContentLoaded', initFirebase);
