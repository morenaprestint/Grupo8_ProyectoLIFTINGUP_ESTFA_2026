import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { getCurrentUser, logout } from '../features/authService';
import AtletaNavbar from '../components/AtletaNavbar';

// Reuse admin styles for identical look, and homeAtleta for specific overrides (e.g. font)
import '../styles/adminDashboard.css';
import '../styles/homeAtleta.css';

function Home() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-page">
      <div className="admin-layout">
        
        {/* The Sidebar (PC) / Bottom Nav (Mobile) is handled by AtletaNavbar now */}
        <AtletaNavbar onLogout={handleLogout} />

        <div className="admin-main atleta-main main-content">
          
          {/* Topbar matching AdminDashboard */}
          <header className="admin-topbar">
            {/* IZQUIERDA */}
            <div className="topbar-left">
              <button
                type="button"
                className="topbar-action mobile-logout"
                onClick={handleLogout}
              >
                <img
                  src="/icons/admin/cerrar-sesion.png"
                  alt="Cerrar sesión"
                  className="topbar-icon-img"
                />
              </button>
            </div>

            {/* CENTRO */}
            <img
              src="/logo.png"
              alt="Lifting Up"
              className="admin-logo-mobile"
            />

            {/* DERECHA */}
            <div className="topbar-right">
              <button
                type="button"
                className="topbar-action perfil-admin-topbar"
                onClick={() => navigate('/perfil')}
              >
                <img
                  src="/icons/atleta/perfil.png"
                  alt="Perfil"
                  className="perfil-icon-img"
                  style={{ width: '25px', height: '25px' }}
                />
                <span>Perfil</span>
              </button>
            </div>
          </header>

          {/* Main Content matching AdminDashboard Home */}
          <main className="admin-content admin-home">
            
            <section className="home-welcome">
              <h1>
                “Hola, {user?.nombre || 'Atleta'}” 👋
              </h1>
              <p className="motivational-quote">
                “Pequeños avances grandes cambios.✨”
              </p>
            </section>

            {/* BOTÓN DESTACADO: EMPEZAR A ENTRENAR (#6c5ce7 / #00d2ff) */}
            <div style={{ margin: '0 auto 20px', maxWidth: '440px', width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>
              <button
                type="button"
                onClick={() => navigate('/entrenamiento')}
                style={{
                  width: '100%',
                  padding: '16px 22px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6c5ce7 0%, #00d2ff 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '800',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(108, 92, 231, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <Zap size={20} fill="#ffffff" />
                Empezar a Entrenar
              </button>
            </div>

            <section className="home-cards">
              
              <div className="home-card" onClick={() => navigate('/rutina')} style={{ cursor: 'pointer' }}>
                <img
                  src="/icons/admin/flecha-derecha.png"
                  alt=""
                  className="summary-arrow-img"
                />
                <h2>Rutina de hoy</h2>
                <p>No hay una rutina asignada para hoy</p>
                <div className="home-card-icons">
                  <img
                    src="/icons/atleta/rutina-hoy.png"
                    alt="Rutina"
                    className="summary-icon-img"
                  />
                </div>
              </div>

              <div className="home-card" onClick={() => navigate('/progreso')} style={{ cursor: 'pointer' }}>
                <img
                  src="/icons/admin/flecha-derecha.png"
                  alt=""
                  className="summary-arrow-img"
                />
                <h2>Progreso</h2>
                <div className="home-card-icons">
                  <img
                    src="/icons/atleta/progreso1.png"
                    alt="Progreso"
                    className="summary-icon-img"
                  />
                </div>
              </div>

              <div className="home-card" onClick={() => navigate('/entrenamiento')} style={{ cursor: 'pointer' }}>
                <img
                  src="/icons/admin/flecha-derecha.png"
                  alt=""
                  className="summary-arrow-img"
                />
                <h2>Registrar entrenamiento</h2>
                <div className="home-card-icons">
                  <img
                    src="/icons/atleta/registrar-entrenamiento.png"
                    alt="Registrar"
                    className="summary-icon-img"
                  />
                </div>
              </div>

            </section>

          </main>
        </div>
      </div>
    </div>
  );
}

export default Home;
