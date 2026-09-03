import { useNavigate } from 'react-router-dom';
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

        <div className="admin-main">
          
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
              <img
                src="/logo.png"
                alt="Lifting Up"
                className="home-logo"
              />
              <h1>
                “Hola, {user?.nombre || 'Atleta'}” 👋
              </h1>
              <p className="motivational-quote">
                “Pequeños avances grandes cambios.✨”
              </p>
            </section>

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

              <div className="home-card" onClick={() => navigate('/registrar-entrenamiento')} style={{ cursor: 'pointer' }}>
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
