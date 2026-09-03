import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/adminDashboard.css';

// Accept onLogout and moduloPendiente props
function AtletaNavbar({ onLogout, moduloPendiente }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/home', icon: 'home.png', developed: true },
    { name: 'Progreso', path: '/progreso', icon: 'progreso.png', developed: false },
    { name: 'Nutrición', path: '/nutricion', icon: 'nutricion.png', developed: false },
    { name: 'Rutina', path: '/rutina', icon: 'rutina.png', developed: true },
    { name: 'Calendario', path: '/calendario', icon: 'calendario.png', developed: true },
    { name: 'Asistencia', path: '/asistencia', icon: 'asistencia.png', developed: true }
  ];

  const handleNavClick = (item) => {
    if (item.developed) {
      navigate(item.path);
    } else {
      if (moduloPendiente) {
        moduloPendiente(item.name);
      } else {
        // Fallback global toast if not provided
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerText = 'Sección en desarrollo';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
      }
    }
  };

  return (
    <nav className="admin-sidebar atleta-sidebar">
      
      <div className="sidebar-logo-container">
        <img
          src="/logo.png"
          alt="Lifting Up"
          className="admin-logo"
        />
      </div>

      <div className="sidebar-menu">
        {navItems.map((item) => (
          <button
            key={item.name}
            type="button"
            className={`sidebar-item ${location.pathname === item.path ? 'activo' : ''}`}
            onClick={() => handleNavClick(item)}
          >
            <img
              src={`/icons/atleta/${item.icon}`}
              alt={item.name}
              className="sidebar-icon-img"
            />
            <span className="sidebar-text">{item.name}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-item logout-btn"
          onClick={onLogout}
        >
          <img
            src="/icons/admin/cerrar-sesion.png"
            alt=""
            className="sidebar-icon-img"
          />
          <span className="sidebar-text">
            Cerrar sesión
          </span>
        </button>
      </div>

    </nav>
  );
}

export default AtletaNavbar;
