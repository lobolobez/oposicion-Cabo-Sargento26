// ============================================
// FIREBASE ANALYTICS - TRACKING DE USUARIOS
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
const ADMIN_PASSWORD = "sepei2026admin";

// Variables globales
let database = null;
let isAdmin = false;

// Inicializar Firebase
function initFirebase() {
    try {
        // Inicializar app
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        // Verificar si es admin
        checkAdminAccess();
        
        // Registrar usuario
        registerUser();
        
        console.log("Firebase inicializado correctamente");
    } catch (error) {
        console.error("Error inicializando Firebase:", error);
    }
}

// Verificar acceso admin
function checkAdminAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get('admin');
    
    if (adminKey === ADMIN_PASSWORD) {
        isAdmin = true;
        setTimeout(showAdminPanel, 1000); // Esperar a que cargue la página
    }
}

// Generar ID único para el usuario
function getUserId() {
    let visitorId = localStorage.getItem('sepei_visitor_id');
    
    if (!visitorId) {
        visitorId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sepei_visitor_id', visitorId);
    }
    
    return visitorId;
}

// Registrar usuario en Firebase
function registerUser() {
    if (!database) return;
    
    const visitorId = getUserId();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Datos del usuario
    const userData = {
        lastVisit: now.toISOString(),
        visitCount: firebase.database.ServerValue.increment(1),
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        category: localStorage.getItem('selectedCategory') || 'none'
    };
    
    // Actualizar usuario
    database.ref('users/' + visitorId).update(userData);
    
    // Registrar visita diaria
    database.ref('visits/' + today + '/' + visitorId).set({
        timestamp: now.toISOString(),
        device: userData.device
    });
    
    // Incrementar contador global
    database.ref('stats/totalVisits').transaction(count => (count || 0) + 1);
    
    // Marcar usuario como activo hoy
    database.ref('stats/dailyUsers/' + today + '/' + visitorId).set(true);
}

// Actualizar categoría seleccionada
function updateUserCategory(category) {
    if (!database) return;
    
    const visitorId = getUserId();
    database.ref('users/' + visitorId + '/category').set(category);
}

// Mostrar panel de administrador
function showAdminPanel() {
    // Crear estilos del panel
    const styles = `
        .admin-panel {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.95);
            color: white;
            z-index: 10000;
            padding: 20px;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .admin-panel h1 {
            color: #f39c12;
            text-align: center;
            margin-bottom: 30px;
        }
        .admin-panel .close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .admin-panel .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto 30px;
        }
        .admin-panel .stat-card {
            background: #2c3e50;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
        }
        .admin-panel .stat-card h3 {
            color: #95a5a6;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .admin-panel .stat-card .number {
            font-size: 48px;
            font-weight: bold;
            color: #3498db;
        }
        .admin-panel .stat-card.highlight .number {
            color: #2ecc71;
        }
        .admin-panel .users-list {
            max-width: 1200px;
            margin: 0 auto;
            background: #2c3e50;
            border-radius: 15px;
            padding: 20px;
        }
        .admin-panel .users-list h2 {
            color: #f39c12;
            margin-bottom: 20px;
        }
        .admin-panel table {
            width: 100%;
            border-collapse: collapse;
        }
        .admin-panel th, .admin-panel td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #34495e;
        }
        .admin-panel th {
            color: #f39c12;
            font-weight: 600;
        }
        .admin-panel .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        .admin-panel .badge-mobile {
            background: #9b59b6;
        }
        .admin-panel .badge-desktop {
            background: #3498db;
        }
        .admin-panel .badge-cabo {
            background: #e74c3c;
        }
        .admin-panel .badge-sargento {
            background: #2ecc71;
        }
        .admin-panel .refresh-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
        }
    `;
    
    // Crear panel
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.innerHTML = `
        <style>${styles}</style>
        <button class="close-btn" onclick="this.parentElement.remove()">✕ Cerrar</button>
        <h1>🔒 Panel de Administrador - SEPEI App</h1>
        
        <div class="stats-grid">
            <div class="stat-card highlight">
                <h3>Usuarios Únicos</h3>
                <div class="number" id="admin-total-users">-</div>
            </div>
            <div class="stat-card">
                <h3>Visitas Totales</h3>
                <div class="number" id="admin-total-visits">-</div>
            </div>
            <div class="stat-card">
                <h3>Usuarios Hoy</h3>
                <div class="number" id="admin-today-users">-</div>
            </div>
            <div class="stat-card">
                <h3>Estudiando Cabo</h3>
                <div class="number" id="admin-cabo-users">-</div>
            </div>
            <div class="stat-card">
                <h3>Estudiando Sargento</h3>
                <div class="number" id="admin-sargento-users">-</div>
            </div>
            <div class="stat-card">
                <h3>Móvil / Escritorio</h3>
                <div class="number" id="admin-devices">-</div>
            </div>
        </div>
        
        <div class="users-list">
            <h2>📋 Últimos Usuarios Activos</h2>
            <button class="refresh-btn" onclick="loadAdminStats()">🔄 Actualizar datos</button>
            <table>
                <thead>
                    <tr>
                        <th>ID Usuario</th>
                        <th>Última Visita</th>
                        <th>Visitas</th>
                        <th>Dispositivo</th>
                        <th>Categoría</th>
                    </tr>
                </thead>
                <tbody id="admin-users-table">
                    <tr><td colspan="5">Cargando...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Cargar estadísticas
    loadAdminStats();
}

// Cargar estadísticas del admin
function loadAdminStats() {
    if (!database) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Obtener usuarios
    database.ref('users').once('value', snapshot => {
        const users = snapshot.val() || {};
        const userList = Object.entries(users);
        
        // Contar totales
        let totalUsers = userList.length;
        let caboUsers = 0;
        let sargentoUsers = 0;
        let mobileUsers = 0;
        let desktopUsers = 0;
        
        userList.forEach(([id, data]) => {
            if (data.category === 'cabo') caboUsers++;
            if (data.category === 'sargento') sargentoUsers++;
            if (data.device === 'mobile') mobileUsers++;
            if (data.device === 'desktop') desktopUsers++;
        });
        
        // Actualizar UI
        document.getElementById('admin-total-users').textContent = totalUsers;
        document.getElementById('admin-cabo-users').textContent = caboUsers;
        document.getElementById('admin-sargento-users').textContent = sargentoUsers;
        document.getElementById('admin-devices').textContent = `${mobileUsers}/${desktopUsers}`;
        
        // Tabla de usuarios (últimos 20)
        const sortedUsers = userList
            .sort((a, b) => new Date(b[1].lastVisit || 0) - new Date(a[1].lastVisit || 0))
            .slice(0, 20);
        
        const tableBody = document.getElementById('admin-users-table');
        tableBody.innerHTML = sortedUsers.map(([id, data]) => {
            const lastVisit = data.lastVisit ? new Date(data.lastVisit).toLocaleString('es-ES') : 'Desconocido';
            const deviceBadge = data.device === 'mobile' 
                ? '<span class="badge badge-mobile">📱 Móvil</span>'
                : '<span class="badge badge-desktop">💻 PC</span>';
            const categoryBadge = data.category === 'cabo'
                ? '<span class="badge badge-cabo">Cabo</span>'
                : data.category === 'sargento'
                    ? '<span class="badge badge-sargento">Sargento</span>'
                    : '-';
            
            return `
                <tr>
                    <td>${id.substring(0, 15)}...</td>
                    <td>${lastVisit}</td>
                    <td>${data.visitCount || 1}</td>
                    <td>${deviceBadge}</td>
                    <td>${categoryBadge}</td>
                </tr>
            `;
        }).join('');
    });
    
    // Obtener visitas totales
    database.ref('stats/totalVisits').once('value', snapshot => {
        document.getElementById('admin-total-visits').textContent = snapshot.val() || 0;
    });
    
    // Obtener usuarios de hoy
    database.ref('stats/dailyUsers/' + today).once('value', snapshot => {
        const todayUsers = snapshot.val() || {};
        document.getElementById('admin-today-users').textContent = Object.keys(todayUsers).length;
    });
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', initFirebase);
