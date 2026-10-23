import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, saveUser, getCurrentUser } from '../features/authService';
import DualRoleModal from '../components/auth/DualRoleModal';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para Modal de Selección de Doble Rol
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (Number(user.email_verificado) === 0) {
        navigate('/verify-email');
      } else if (user.rol === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/atleta-home');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Limpiamos espacios accidentales del teclado
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      // 2. Enviamos las credenciales al login
      const user = await login(cleanEmail, cleanPassword);

      if (!user) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }

      // 3. Bloqueo estricto por Email No Verificado (tanto administrador como atleta)
      if (user.email_no_verificado || Number(user.email_verificado) === 0) {
        const tieneAdmin = user.es_admin === 1 || user.es_admin === true || user.es_admin === '1';
        const rolFinal = tieneAdmin ? 'admin' : 'atleta';
        saveUser({ ...user, rol: rolFinal, email_verificado: 0 });
        navigate('/verify-email');
        setLoading(false);
        return;
      }

      // 4. Verificamos si posee DOBLE ROL (es_admin === 1 && es_atleta === 1)
      const tieneAdmin = user.es_admin === 1 || user.es_admin === true || user.es_admin === '1';
      const tieneAtleta = user.es_atleta === 1 || user.es_atleta === true || user.es_atleta === '1';

      if (tieneAdmin && tieneAtleta) {
        setPendingUser(user);
        setShowRoleModal(true);
        setLoading(false);
        return;
      }

      // 5. Si tiene un único rol definido
      const rolFinal = tieneAdmin ? 'admin' : 'atleta';
      const userConRol = { ...user, rol: rolFinal };
      saveUser(userConRol);

      if (Number(userConRol.email_verificado) === 0) {
        navigate('/verify-email');
      } else if (rolFinal === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/atleta-home');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección interactiva de rol desde el Modal
  const handleSelectRole = (rolElegido) => {
    if (!pendingUser) return;
    const userFinal = { ...pendingUser, rol: rolElegido };
    saveUser(userFinal);
    setShowRoleModal(false);

    if (Number(userFinal.email_verificado) === 0) {
      navigate('/verify-email');
    } else if (rolElegido === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/atleta-home');
    }
  };

  return (
    <div className="login-container">
      <div className="logo-section">
        <img src="/logo.png" alt="Lifting Up" className="logo-img" />
      </div>

      <div className="form-section">
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper blue">
            <div className="input-inner">
              <span className="input-label">Correo electrónico</span>
              <input
                type="email"
                placeholder="Tu@email.com"
                className="input-field has-label"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-wrapper">
            <div className="input-inner">
              <span className="input-label">Contraseña</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-field has-label"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                aria-label="Ver u ocultar contraseña"
              >
                {showPassword ? '👁' : '👁‍🗨'}
              </span>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'INGRESANDO...' : 'COMENZAR AHORA'}
          </button>
        </form>
      </div>

      {/* Modal Interactivo de Selección de Doble Rol */}
      <DualRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSelectRole={handleSelectRole}
        userName={pendingUser?.nombre}
      />
    </div>
  );
}

export default Login;
