import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser } from '../features/authService';
import { createUsuario } from '../services/api';

function Register() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanNombre = nombre.trim();
    const cleanApellido = apellido.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanNombre || !cleanApellido || !cleanEmail || !cleanPassword) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('El correo electrónico no tiene un formato válido con dominio completo (ej. usuario@gmail.com).');
      return;
    }

    if (!PWD_REGEX.test(cleanPassword)) {
      setError('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.');
      return;
    }

    setLoading(true);

    try {
      const res = await createUsuario({
        nombre: cleanNombre,
        apellido: cleanApellido,
        email: cleanEmail,
        password: cleanPassword,
        es_atleta: 1,
        es_admin: 0
      });

      if (res?.success && res.data) {
        const usuarioCreado = {
          ...res.data,
          rol: 'atleta',
          email_verificado: 0
        };
        saveUser(usuarioCreado);
        navigate('/verify-email');
      } else {
        setError(res?.message || 'Error al registrar la cuenta.');
      }
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
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
              <span className="input-label">Nombre</span>
              <input
                type="text"
                placeholder="Tu nombre"
                className="input-field has-label"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-wrapper blue">
            <div className="input-inner">
              <span className="input-label">Apellido</span>
              <input
                type="text"
                placeholder="Tu apellido"
                className="input-field has-label"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-wrapper blue">
            <div className="input-inner">
              <span className="input-label">Correo electrónico</span>
              <input
                type="email"
                placeholder="tu@email.com"
                className="input-field has-label"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                title="Ingrese un correo electrónico válido con dominio completo (ej. usuario@gmail.com)"
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
                onChange={(e) => setPassword(e.target.value)}
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
          <p className="field-hint" style={{ fontSize: '11px', color: '#8fb8d6', margin: '4px 0 12px 6px' }}>
            Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
          </p>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
          </button>
        </form>

        <p className="signup-text">
          ¿Ya tenés cuenta?{' '}
          <a className="signup-link" onClick={() => navigate('/')}>Iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
