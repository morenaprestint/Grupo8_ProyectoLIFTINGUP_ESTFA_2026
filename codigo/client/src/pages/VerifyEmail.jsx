import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, saveUser, logout } from '../features/authService';
import ModalAlerta from '../components/ModalAlerta';
import '../styles/verifyEmail.css';

const cleanUrl = (rawUrl) => {
  if (!rawUrl) return 'https://lifting-up-backend.onrender.com/api';
  let cleaned = String(rawUrl).trim();
  // Si contiene formato markdown [texto](url), extraer la URL dentro de los paréntesis
  const markdownMatch = cleaned.match(/\((https?:\/\/[^\s\)]+)\)/);
  if (markdownMatch) {
    cleaned = markdownMatch[1];
  }
  // Elimina corchetes, comillas, backticks y espacios accidentales
  return cleaned.replace(/[\[\]"'`]/g, '').trim().replace(/\/+$/, '');
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

  // Modal Popup para validaciones y avisos de expiración
  const [alertaModal, setAlertaModal] = useState({ isOpen: false, titulo: '', mensaje: '' });
  const mostrarModalError = (mensaje, titulo = 'Acción no permitida') => {
    setAlertaModal({ isOpen: true, titulo, mensaje });
  };

  const navigate = useNavigate();

  const handleVolver = () => {
    logout();
    navigate('/');
  };
  const user = getCurrentUser();
  const targetEmail = user?.email_pendiente || user?.email;

  useEffect(() => {
    if (!user || !targetEmail) {
      navigate('/');
    }
  }, [user, targetEmail, navigate]);

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
      const msg = 'El código debe tener 6 dígitos.';
      setError(msg);
      mostrarModalError('Acción no permitida: el código de verificación debe contener exactamente 6 dígitos numéricos.');
      return;
    }

    setCargando(true);
    setError('');
    setSuccessMsg('');

    try {
      console.log("Enviando email a verificar:", targetEmail);
      const response = await fetch(`${API_URL}/usuarios/verificar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, codigo })
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar usuario en localStorage: si se verificó un email pendiente, consolidarlo
        const emailDefinitivo = data.nuevoEmail || user.email_pendiente || user.email;
        const updatedUser = {
          ...user,
          email: emailDefinitivo,
          email_pendiente: null,
          email_verificado: 1,
          activo: 1
        };
        saveUser(updatedUser);
        navigate(updatedUser.rol === 'admin' ? '/admin-dashboard' : '/atleta-home');
      } else {
        const msg = data.message || 'Error al verificar el código.';
        setError(msg);
        const esExpirado = msg.toLowerCase().includes('venc') || msg.toLowerCase().includes('expir');
        mostrarModalError(
          esExpirado
            ? 'El código de verificación ha vencido. Debes solicitar uno nuevo mediante el botón "Reenviar".'
            : msg,
          esExpirado ? 'Código vencido' : 'Acción no permitida'
        );
      }
    } catch (err) {
      const netErr = 'Error de red. Intenta nuevamente.';
      setError(netErr);
      mostrarModalError(netErr, 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const handleReenviar = async () => {
    setReenviando(true);
    setError('');
    setSuccessMsg('');

    try {
      console.log("Reenviando código a:", targetEmail);
      const response = await fetch(`${API_URL}/usuarios/reenviar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
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
            Por favor, revisa la bandeja de entrada de<br />
            <strong style={{ color: '#00d2ff', wordBreak: 'break-all' }}>{targetEmail}</strong><br />
            para ingresar el código de 6 dígitos.
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

      <ModalAlerta
        isOpen={alertaModal.isOpen}
        titulo={alertaModal.titulo}
        mensaje={alertaModal.mensaje}
        onClose={() => setAlertaModal({ isOpen: false, titulo: '', mensaje: '' })}
      />
    </div>
  );
}

export default VerifyEmail;
