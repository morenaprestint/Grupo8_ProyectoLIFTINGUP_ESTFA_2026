import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { getCurrentUser, logout } from '../features/authService';
import AtletaNavbar from './AtletaNavbar';

import RutinasView from './views/RutinasView';
import AsistenciaView from './views/AsistenciaView';
import CalendarioView from './views/CalendarioView';
import NutricionView from './views/NutricionView';
import EntrenamientoView from './views/EntrenamientoView';
import ProgresoView from './views/ProgresoView';
import PerfilAtletaView from './views/PerfilAtletaView';

import '../styles/adminDashboard.css';

function Toast({ msg, tipo }) {
    if (!msg) return null;
    return (
        <div className={`toast ${tipo}`}>
            {msg}
        </div>
    );
}

function AtletaDashboard({ vista }) {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const [toast, setToast] = useState({ msg: '', tipo: 'success' });

    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3500);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const moduloPendiente = (nombre) => {
        mostrarToast(`Sección en desarrollo`, 'error');
    };

    return (
        <div className="admin-page">
            <div className="admin-layout">
                {/* Ojo: El AtletaNavbar original usa rutas. Si se quiere interceptar "Sección en desarrollo" allí, se debe modificar AtletaNavbar. */}
                {/* De momento, AtletaNavbar ya está configurado con rutas, y las que no existen podemos interceptarlas o las controlamos en App.jsx */}
                <AtletaNavbar onLogout={handleLogout} moduloPendiente={moduloPendiente} />

                <div className="admin-main atleta-main main-content">
                    <header className="admin-topbar">
                        <div className="topbar-left">
                            <button type="button" className="topbar-action mobile-logout" onClick={handleLogout}>
                                <img src="/icons/admin/cerrar-sesion.png" alt="Cerrar sesión" className="topbar-icon-img" />
                            </button>
                        </div>
                        <img src="/logo.png" alt="Lifting Up" className="admin-logo-mobile" />
                        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/entrenamiento')}
                                style={{
                                    background: 'linear-gradient(135deg, #6c5ce7, #00d2ff)',
                                    border: 'none',
                                    borderRadius: '999px',
                                    padding: '6px 12px',
                                    color: '#ffffff',
                                    fontSize: '11.5px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 2px 10px rgba(108, 92, 231, 0.4)'
                                }}
                                title="Modo Entrenar Hoy"
                            >
                                <Zap size={13} fill="#ffffff" />
                                <span>Entrenar</span>
                            </button>
                            <button type="button" className="topbar-action perfil-admin-topbar" onClick={() => navigate('/perfil')}>
                                <img src="/icons/atleta/perfil.png" alt="Perfil" className="perfil-icon-img" style={{ width: '25px', height: '25px' }} />
                                <span>Perfil</span>
                            </button>
                        </div>
                    </header>

                    <main className="admin-content" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        {toast.msg && <Toast msg={toast.msg} tipo={toast.tipo} />}
                        
                        {vista === 'rutina' && <RutinasView />}
                        {vista === 'asistencia' && <AsistenciaView />}
                        {vista === 'calendario' && <CalendarioView />}
                        {vista === 'nutricion' && <NutricionView />}
                        {vista === 'entrenamiento' && <EntrenamientoView />}
                        {vista === 'progreso' && <ProgresoView />}
                        {vista === 'perfil' && <PerfilAtletaView />}
                        {/* Otras vistas se pueden ir agregando aquí */}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default AtletaDashboard;
