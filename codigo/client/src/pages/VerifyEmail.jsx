import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, saveUser, logout } from '../features/authService';
import '../styles/verifyEmail.css';

const cleanUrl = (rawUrl) => {
  if (!rawUrl) return 'http://localhost:3001/api';
  // Elimina corchetes, comillas y espacios accidentales
  let cleaned = rawUrl.replace(/[\[\]"']/g, '').trim();
  // Si contiene paréntesis de un link markdown [texto](url), extrae solo la URL
  if (cleaned.includes('(') && cleaned.includes(')')) {
    const match = cleaned.match(/\(([^)]+)\)/);
    if (match) cleaned = match[1];
  }
  return cleaned.replace(/\/$/, ''); // Quita la barra final si la tiene
};
const API_URL = cleanUrl(import.meta.env.VITE_API_URL);
console.log("API_URL configurada actualmente:", API_URL);

function VerifyEmail() {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  const handleVolver = () => {
    logout();
    navigate('/');
  };
  const user = getCurrentUser();

  useEffect(() => {
    if (!user || !user.email) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerificar = async () => {
    if (codigo.length !== 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }

    setCargando(true);
    setError('');
    setSuccessMsg('');

    try {
      console.log("Enviando email a verificar:", user?.email);
      const response = await fetch(`${API_URL}/usuarios/verificar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, codigo })
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar usuario en localStorage con email_verificado = 1 y activo = 1
        const updatedUser = {
          ...user,
          email_verificado: 1,
          activo: 1
        };
        saveUser(updatedUser);
        navigate('/home');
      } else {
        setError(data.message || 'Error al verificar el código.');
      }
    } catch (err) {
      setError('Error de red. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const handleReenviar = async () => {
    setReenviando(true);
    setError('');
    setSuccessMsg('');

    try {
      console.log("Enviando email a verificar:", user?.email);
      const response = await fetch(`${API_URL}/usuarios/reenviar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMsg('Código reenviado. Revisa tu bandeja de entrada.');
        setCooldown(60);
      } else {
        setError(data.message || 'No se pudo reenviar el código.');
        if (data.message && data.message.includes('esperar')) {
          const match = data.message.match(/\d+/);
          if (match) {
            setCooldown(parseInt(match[0], 10));
          }
        }
      }
    } catch (err) {
      setError('Error de red al intentar reenviar.');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-content">
        <header className="verify-header">
          <button className="verify-back-btn" onClick={handleVolver}>
            <img
              src="/icons/admin/volver.png"
              alt="Volver"
              className="verify-back-icon"
            />
          </button>
          <img src="/logo.png" alt="LIFTING UP" className="verify-logo" />
          <button className="perfil-btn-top" onClick={() => navigate('/perfil')}>
            <img src="/icons/atleta/perfil.png" alt="Perfil" className="perfil-icon" />
            <span>Perfil</span>
          </button>
        </header>

        <h1 className="verify-title">Verifica tu Email</h1>

        <div className="verify-box">
          {/* We use home.png here just as a placeholder since we don't have the big email envelope icon */}
          <img src="/logo2.png" alt="Email" className="email-icon-large" />

          <p className="verify-instructions">
            Por favor, revisa tu bandeja de<br />
            entrada para verificar tu cuenta
          </p>

          {error && <div className="error-message">{error}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          <input
            type="text"
            className="code-input"
            placeholder="Ingresar código"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          />

          <button
            className="continue-btn"
            onClick={handleVerificar}
            disabled={cargando || codigo.length !== 6}
          >
            {cargando ? 'Verificando...' : 'Continuar'}
          </button>
        </div>

        <div className="resend-section">
          ¿No recibiste el código?
          <button
            className="resend-btn"
            onClick={handleReenviar}
            disabled={reenviando || cooldown > 0}
          >
            {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
