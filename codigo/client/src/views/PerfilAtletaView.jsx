import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Edit2,
  LogOut,
  ShieldCheck,
  Activity,
  Award,
  Camera,
  Mail,
  Lock,
  KeyRound,
  X
} from 'lucide-react';
import { getCurrentUser, logout, saveUser } from '../features/authService';
import { getPerfilUsuario, updatePerfilUsuario, uploadFotoPerfil, cambiarEmail, cambiarPassword, getImageUrl } from '../services/api';
import ModalAlerta from '../components/ModalAlerta';
import '../styles/perfilViews.css';

export default function PerfilAtletaView() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [perfil, setPerfil] = useState({
    id: currentUser?.id || currentUser?.id_usuario || 1,
    nombre: currentUser?.nombre || 'Morena',
    apellido: currentUser?.apellido || 'Rocco',
    nombre_completo: `${currentUser?.nombre || 'Morena'} ${currentUser?.apellido || 'Rocco'}`.trim(),
    email: currentUser?.email || 'Morenarocco@gmail.com',
    foto_perfil: currentUser?.foto_perfil || null,
    peso: currentUser?.peso ? Number(currentUser.peso) : 82,
    altura: currentUser?.altura ? Number(currentUser.altura) : 1.80,
    objetivo: currentUser?.objetivo || 'Ganar masa muscular',
    nivel_entrenamiento: currentUser?.nivel_entrenamiento || 'Intermedio',
    rol: 'atleta'
  });

  // Modal de edición de datos personales (Nombre, Apellido, Peso, Altura)
  const [modalEdicion, setModalEdicion] = useState(false);
  const [formEdit, setFormEdit] = useState({
    nombre: perfil.nombre,
    apellido: perfil.apellido,
    peso: perfil.peso,
    altura: perfil.altura
  });

  // Modal de cambio de correo electrónico seguro (requiere contraseña actual)
  const [modalEmail, setModalEmail] = useState(false);
  const [formEmail, setFormEmail] = useState({
    nuevo_email: '',
    password_actual: ''
  });
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Modal de cambio de contraseña seguro (requiere contraseña actual)
  const [modalPassword, setModalPassword] = useState(false);
  const [formPassword, setFormPassword] = useState({
    password_actual: '',
    nueva_password: '',
    confirm_password: ''
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', tipo: 'success' });

  // Modal Popup de validación y errores (estilo neón oscuro)
  const [alertaModal, setAlertaModal] = useState({ isOpen: false, titulo: '', mensaje: '' });
  const mostrarModalError = (mensaje, titulo = 'Acción no permitida') => {
    setAlertaModal({ isOpen: true, titulo, mensaje });
  };

  const mostrarNotificacion = (msg, tipo = 'success') => {
    setToast({ show: true, msg, tipo });
    setTimeout(() => setToast({ show: false, msg: '', tipo: 'success' }), 4000);
  };

  // Cargar datos reales desde el endpoint GET /api/usuarios/perfil
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const userId = currentUser?.id || currentUser?.id_usuario;
        const res = await getPerfilUsuario(userId, currentUser?.email);
        if (res?.success && res.data) {
          const d = res.data;
          const actualizado = {
            id: d.id_usuario || d.id,
            nombre: d.nombre || perfil.nombre,
            apellido: d.apellido || perfil.apellido,
            nombre_completo: d.nombre_completo || `${d.nombre || ''} ${d.apellido || ''}`.trim() || perfil.nombre_completo,
            email: d.email || perfil.email,
            foto_perfil: d.foto_perfil || perfil.foto_perfil,
            peso: d.peso != null ? Number(d.peso) : perfil.peso,
            altura: d.altura != null ? Number(d.altura) : perfil.altura,
            objetivo: d.objetivo || perfil.objetivo,
            nivel_entrenamiento: d.nivel_entrenamiento || perfil.nivel_entrenamiento,
            rol: 'atleta'
          };
          setPerfil(actualizado);
          setFormEdit({
            nombre: actualizado.nombre,
            apellido: actualizado.apellido,
            peso: actualizado.peso,
            altura: actualizado.altura
          });
        }
      } catch (err) {
        console.warn('Usando datos de perfil locales:', err.message);
      }
    };

    fetchPerfil();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOpenEdit = () => {
    setFormEdit({
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      peso: perfil.peso,
      altura: perfil.altura
    });
    setModalEdicion(true);
  };

  // ─── Subida de Foto de Perfil (Backend con Multer) ─────────────────────────
  const handleSubirFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    const extensionesPermitidas = ['.png', '.jpg', '.jpeg'];
    const mimesPermitidos = ['image/png', 'image/jpeg'];

    if (!extensionesPermitidas.includes(ext) || !mimesPermitidos.includes(file.type)) {
      mostrarNotificacion('Formato de imagen inválido. Solo se admiten formatos PNG y JPEG/JPG.', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      mostrarNotificacion('La imagen no debe superar los 5 MB', 'error');
      e.target.value = '';
      return;
    }

    setSubiendoFoto(true);
    try {
      const res = await uploadFotoPerfil(perfil.id, file);
      if (res?.success) {
        const rutaFoto = res.foto_perfil;
        setPerfil(prev => ({ ...prev, foto_perfil: rutaFoto }));

        if (currentUser) {
          saveUser({ ...currentUser, foto_perfil: rutaFoto });
        }
        mostrarNotificacion('¡Foto de perfil actualizada correctamente!', 'success');
      } else {
        mostrarNotificacion(res?.message || 'Error al subir foto de perfil', 'error');
      }
    } catch (err) {
      console.error('Error al subir foto:', err);
      mostrarNotificacion(err?.message || 'Error al conectar con el servidor', 'error');
    } finally {
      setSubiendoFoto(false);
      e.target.value = ''; // Reset input
    }
  };

  // ─── Guardar Datos Personales con Validación Estricta ───────────────────────
  const handleGuardarPerfil = async (e) => {
    e?.preventDefault();

    const alturaNum = Number(formEdit.altura);
    if (isNaN(alturaNum) || alturaNum < 1.00 || alturaNum > 2.50) {
      return mostrarNotificacion('La altura debe estar estrictamente en el rango de 1.00 a 2.50 metros.', 'error');
    }

    const pesoNum = Number(String(formEdit.peso).replace(',', '.'));
    if (isNaN(pesoNum) || pesoNum < 40 || pesoNum > 200) {
      return mostrarNotificacion('Error: Ingrese un peso válido (el peso corporal debe estar estrictamente entre 40 kg y 200 kg).', 'error');
    }

    setLoading(true);

    try {
      const payload = {
        id: perfil.id,
        nombre: formEdit.nombre.trim(),
        apellido: formEdit.apellido.trim(),
        peso: pesoNum,
        altura: alturaNum
      };

      const res = await updatePerfilUsuario(payload);

      const nuevoPerfil = {
        ...perfil,
        ...payload,
        nombre_completo: `${payload.nombre} ${payload.apellido}`.trim()
      };

      setPerfil(nuevoPerfil);
      setModalEdicion(false);

      if (currentUser) {
        saveUser({
          ...currentUser,
          ...nuevoPerfil
        });
      }

      mostrarNotificacion(res?.message || '¡Datos personales actualizados con éxito!', 'success');
    } catch (err) {
      console.error('Error al actualizar datos personales:', err);
      mostrarNotificacion(err?.message || 'Error al actualizar los datos personales', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Modificar Correo Electrónico Seguro (Bcrypt) ─────────────────────────
  const handleConfirmarCambioEmail = async (e) => {
    e?.preventDefault();

    const nuevoEmailClean = formEmail.nuevo_email.trim().toLowerCase();
    const passActualClean = formEmail.password_actual.trim();

    if (!nuevoEmailClean) {
      return mostrarNotificacion('Ingresá el nuevo correo electrónico', 'error');
    }
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(nuevoEmailClean)) {
      return mostrarNotificacion('El correo electrónico no tiene un formato válido con dominio completo (ej. usuario@gmail.com).', 'error');
    }

    if (!passActualClean) {
      return mostrarNotificacion('Debes ingresar tu contraseña actual para confirmar', 'error');
    }
    if (nuevoEmailClean === perfil.email.toLowerCase()) {
      return mostrarNotificacion('El nuevo correo debe ser diferente al actual', 'error');
    }

    setLoadingEmail(true);

    try {
      const res = await cambiarEmail({
        id: perfil.id,
        nuevo_email: nuevoEmailClean,
        password_actual: passActualClean
      });

      if (res?.success) {
        setModalEmail(false);
        setFormEmail({ nuevo_email: '', password_actual: '' });

        // Conservar el email principal activo y registrar email_pendiente para verificación
        const updated = {
          ...perfil,
          email_pendiente: nuevoEmailClean
        };
        setPerfil(updated);

        if (currentUser) {
          saveUser({
            ...currentUser,
            email_pendiente: nuevoEmailClean
          });
        }

        if (res?.requiereRevalidarSesion) {
          mostrarNotificacion('Has solicitado cambiar tu correo electrónico. Por seguridad, se ha cerrado tu sesión. Por favor verifica tu nuevo correo e inicia sesión nuevamente.', 'info');
          setTimeout(() => {
            logout();
            localStorage.clear();
            navigate('/login');
          }, 2000);
          return;
        }

        mostrarNotificacion('Se envió un código de 6 dígitos al nuevo correo. Redirigiendo a verificación...', 'success');
        setTimeout(() => {
          navigate('/verify-email');
        }, 1500);
      } else {
        mostrarNotificacion(res?.message || 'Error al cambiar correo', 'error');
      }
    } catch (err) {
      console.error('Error al cambiar email:', err);
      mostrarNotificacion(err?.message || 'Contraseña incorrecta o error al cambiar el correo', 'error');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleConfirmarCambioPassword = async (e) => {
    e?.preventDefault();
    if (!formPassword.password_actual.trim()) {
      mostrarModalError('Acción no permitida: debes ingresar tu contraseña actual.', 'Campo requerido');
      return;
    }
    if (!formPassword.nueva_password.trim()) {
      mostrarModalError('Acción no permitida: debes ingresar la nueva contraseña.', 'Campo requerido');
      return;
    }
    if (formPassword.nueva_password !== formPassword.confirm_password) {
      mostrarModalError('Acción no permitida: las contraseñas ingresadas no coinciden.', 'Validación de contraseña');
      return;
    }
    const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!PWD_REGEX.test(formPassword.nueva_password)) {
      mostrarModalError('Acción no permitida: la nueva contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número.', 'Contraseña insegura');
      return;
    }

    setLoadingPassword(true);
    try {
      const res = await cambiarPassword({
        id: perfil.id,
        password_actual: formPassword.password_actual.trim(),
        nueva_password: formPassword.nueva_password.trim(),
        confirm_password: formPassword.confirm_password.trim()
      });
      if (res?.success) {
        mostrarNotificacion('¡Contraseña actualizada exitosamente!', 'success');
        setModalPassword(false);
        setFormPassword({ password_actual: '', nueva_password: '', confirm_password: '' });
      } else {
        mostrarModalError(res?.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      mostrarModalError(err?.message || 'Error al conectar con el servidor para actualizar la contraseña');
    } finally {
      setLoadingPassword(false);
    }
  };


  // Cálculo de IMC estimado
  const imc = (perfil.peso && perfil.altura && Number(perfil.altura) > 0)
    ? (Number(perfil.peso) / (Number(perfil.altura) * Number(perfil.altura))).toFixed(1)
    : 'No especificado';

  return (
    <div className="dashboard-content perfil-dashboard-container">
      {toast.show && (
        <div className={`perfil-toast ${toast.tipo}`}>
          {toast.msg}
        </div>
      )}

      {/* ─── Hero / Banner Superior con Avatar Interactivo ─── */}
      <section className="perfil-hero-banner">
        <div
          className="perfil-avatar-glow-ring"
          title="Toca para cambiar foto de perfil"
        >
          <input
            type="file"
            id="atleta-avatar-upload"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleSubirFoto}
          />
          <label htmlFor="atleta-avatar-upload" className="perfil-avatar-inner" style={{ cursor: 'pointer' }}>
            {subiendoFoto ? (
              <span style={{ fontSize: '12px', color: '#00d2ff', fontWeight: 'bold' }}>Subiendo...</span>
            ) : perfil.foto_perfil ? (
              <img
                src={getImageUrl(perfil.foto_perfil)}
                alt={perfil.nombre_completo}
                className="perfil-avatar-img"
              />
            ) : (
              <User className="perfil-avatar-silhouette" />
            )}
            <div className="perfil-avatar-camera-badge">
              <Camera size={14} />
            </div>
          </label>
        </div>

        <div className="perfil-hero-info">
          <h1 className="perfil-user-name">{perfil.nombre_completo}</h1>
          <div className="perfil-role-badge">
            <ShieldCheck size={14} />
            <span>Usuario Atleta</span>
          </div>
        </div>
      </section>

      {/* ─── Grid de 2 Columnas (Desktop) / 1 Columna (Móvil) ─── */}
      <div className="perfil-grid-2col">
        {/* ── COLUMNA 1: Tarjeta "Datos Físicos" ── */}
        <section className="perfil-card">
          <div className="perfil-card-header">
            <h2 className="perfil-card-title">Datos Físicos</h2>
            <span className="perfil-card-icon" role="img" aria-label="pesa">🏋️</span>
          </div>
          <div className="perfil-neon-divider-cyan" />

          {/* Bloques Métricos Principales */}
          <div className="perfil-fisicos-grid">
            {/* Peso actual */}
            <div className="perfil-fisico-box">
              <button
                type="button"
                className="perfil-edit-pencil-btn"
                title="Editar Datos Personales y Peso"
                onClick={handleOpenEdit}
              >
                <Edit2 size={16} />
              </button>
              <span className="perfil-fisico-value">
                {perfil.peso != null && perfil.peso !== '' ? `${perfil.peso} Kg` : 'No especificado'}
              </span>
              <span className="perfil-fisico-label">Peso actual</span>
            </div>

            {/* Altura */}
            <div className="perfil-fisico-box perfil-fisico-box-purple">
              <span className="perfil-fisico-value">
                {perfil.altura != null && perfil.altura !== '' ? `${Number(perfil.altura).toFixed(2)} m` : 'No especificado'}
              </span>
              <span className="perfil-fisico-label">Altura</span>
            </div>
          </div>

          {/* Ficha Resumen de Métricas */}
          <div className="perfil-datos-extra-card">
            <div className="perfil-datos-extra-row">
              <span><Activity size={14} style={{ display: 'inline', marginRight: '4px' }} /> IMC Estimado:</span>
              <strong>{imc !== 'No especificado' ? `${imc} kg/m²` : 'No especificado'}</strong>
            </div>
            <div className="perfil-datos-extra-row">
              <span><Award size={14} style={{ display: 'inline', marginRight: '4px' }} /> Objetivo:</span>
              <strong>{perfil.objetivo || 'No especificado'}</strong>
            </div>
            <div className="perfil-datos-extra-row">
              <span>Nivel:</span>
              <strong>{perfil.nivel_entrenamiento || 'No especificado'}</strong>
            </div>
          </div>
        </section>

        {/* ── COLUMNA 2: Tarjeta "Información de Sesiones y Cuenta" ── */}
        <section className="perfil-card">
          <div className="perfil-card-header">
            <h2 className="perfil-card-title">Información de Cuenta y Seguridad</h2>
            <span className="perfil-card-icon" role="img" aria-label="seguridad">🔒</span>
          </div>
          <div className="perfil-neon-divider-purple" />

          <div className="perfil-info-list">
            <div className="perfil-info-row">
              <div>
                <span className="perfil-info-label-inline">Nombre Completo:</span>
                <span className="perfil-info-value-inline">{perfil.nombre_completo}</span>
              </div>
            </div>

            <div className="perfil-info-row">
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span className="perfil-info-label-inline">Email:</span>
                <span className="perfil-info-value-inline">{perfil.email}</span>
                <button
                  type="button"
                  className="perfil-btn-cambiar-email"
                  onClick={() => setModalEmail(true)}
                  title="Cambiar correo con confirmación de contraseña"
                >
                  <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Modificar Correo
                </button>
              </div>
            </div>

            <div className="perfil-info-row">
              <div>
                <span className="perfil-info-label-inline">Rol de Cuenta:</span>
                <span className="perfil-info-value-inline" style={{ textTransform: 'capitalize' }}>{perfil.rol}</span>
                <span className="perfil-readonly-tag">🔒 Asignado</span>
              </div>
            </div>

            <div className="perfil-info-row">
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span className="perfil-info-label-inline">Contraseña:</span>
                <span className="perfil-password-dots">••••••••••••</span>
                <button
                  type="button"
                  className="perfil-btn-cambiar-email"
                  onClick={() => setModalPassword(true)}
                  title="Modificar tu contraseña con confirmación de la actual"
                >
                  <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Modificar Contraseña
                </button>
              </div>
            </div>
          </div>

          <div className="perfil-card-buttons">
            <button
              type="button"
              className="perfil-btn-pill logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
            <button
              type="button"
              className="perfil-btn-pill primary"
              onClick={handleOpenEdit}
            >
              <Edit2 size={15} />
              <span>Editar Datos Personales</span>
            </button>
          </div>
        </section>
      </div>

      {/* ─── MODAL 1: Modificación de Datos Personales (Altura 1.00 - 2.50 y Peso >= 0) ─── */}
      {modalEdicion && (
        <div className="perfil-modal-overlay" onClick={() => setModalEdicion(false)}>
          <div className="perfil-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="perfil-modal-title">Editar Datos Personales</h3>
            <form onSubmit={handleGuardarPerfil}>
              <div className="perfil-form-group">
                <label className="perfil-form-label">Nombre</label>
                <input
                  type="text"
                  className="perfil-form-input"
                  value={formEdit.nombre}
                  onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="perfil-form-group">
                <label className="perfil-form-label">Apellido</label>
                <input
                  type="text"
                  className="perfil-form-input"
                  value={formEdit.apellido}
                  onChange={(e) => setFormEdit({ ...formEdit, apellido: e.target.value })}
                  placeholder="Tu apellido"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="perfil-form-group">
                  <label className="perfil-form-label">Peso Corporal (Kg) [40 a 200 kg] *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="perfil-form-input"
                    value={formEdit.peso || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (val === '' || /^\d*(\.\d*)?$/.test(val)) {
                        setFormEdit({ ...formEdit, peso: val });
                      }
                    }}
                    placeholder="Ej: 89.6 (40 a 200 kg)"
                    required
                  />
                </div>
                <div className="perfil-form-group">
                  <label className="perfil-form-label">Altura (m) [1.00 a 2.50] *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    max="2.50"
                    className="perfil-form-input"
                    value={formEdit.altura || ''}
                    onChange={(e) => setFormEdit({ ...formEdit, altura: e.target.value })}
                    placeholder="Ej: 1.80 (m)"
                    required
                  />
                </div>
              </div>

              <div className="perfil-modal-actions">
                <button
                  type="button"
                  className="perfil-btn-cancelar"
                  onClick={() => setModalEdicion(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="perfil-btn-guardar"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Cambio Seguro de Correo Electrónico (Exige Contraseña Actual con Bcrypt) ─── */}
      {modalEmail && (
        <div className="perfil-modal-overlay" onClick={() => setModalEmail(false)}>
          <div className="perfil-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="perfil-modal-title">Modificar Correo Electrónico</h3>
            <p style={{ fontSize: '13px', color: '#b0b0c0', marginBottom: '18px', lineHeight: '1.4' }}>
              Por motivos de seguridad, para modificar tu dirección de correo debes ingresar tu contraseña actual.
              El nuevo correo requerirá ser verificado mediante código.
            </p>

            <form onSubmit={handleConfirmarCambioEmail}>
              <div className="perfil-form-group">
                <label className="perfil-form-label">Correo Actual</label>
                <input
                  type="email"
                  className="perfil-form-input"
                  value={perfil.email}
                  disabled
                  readOnly
                  style={{ opacity: 0.6 }}
                />
              </div>

              <div className="perfil-form-group">
                <label className="perfil-form-label">Nuevo Correo Electrónico *</label>
                <input
                  type="email"
                  className="perfil-form-input"
                  placeholder="ejemplo@nuevoemail.com"
                  value={formEmail.nuevo_email}
                  onChange={(e) => setFormEmail({ ...formEmail, nuevo_email: e.target.value })}
                  required
                />
              </div>

              <div className="perfil-form-group">
                <label className="perfil-form-label">
                  <KeyRound size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Contraseña Actual de Confirmación *
                </label>
                <input
                  type="password"
                  className="perfil-form-input"
                  placeholder="Tu contraseña actual"
                  value={formEmail.password_actual}
                  onChange={(e) => setFormEmail({ ...formEmail, password_actual: e.target.value })}
                  required
                />
              </div>

              <div className="perfil-modal-actions">
                <button
                  type="button"
                  className="perfil-btn-cancelar"
                  onClick={() => setModalEmail(false)}
                  disabled={loadingEmail}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="perfil-btn-guardar"
                  disabled={loadingEmail}
                >
                  {loadingEmail ? 'Verificando...' : 'Confirmar Cambio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Modificación de Contraseña Segura ─── */}
      {modalPassword && (
        <div className="perfil-modal-overlay" onClick={() => setModalPassword(false)}>
          <div className="perfil-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 className="perfil-modal-title" style={{ margin: 0 }}>Modificar Contraseña</h3>
              <button
                type="button"
                className="perfil-modal-close"
                onClick={() => setModalPassword(false)}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#b0b0c0', marginBottom: '18px', lineHeight: '1.4' }}>
              Por motivos de seguridad, ingresa tu contraseña actual antes de establecer la nueva contraseña.
            </p>

            <form onSubmit={handleConfirmarCambioPassword}>
              <div className="perfil-form-group">
                <label className="perfil-form-label">
                  <KeyRound size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  className="perfil-form-input"
                  placeholder="Tu contraseña actual"
                  value={formPassword.password_actual}
                  onChange={(e) => setFormPassword({ ...formPassword, password_actual: e.target.value })}
                  required
                />
              </div>

              <div className="perfil-form-group">
                <label className="perfil-form-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  className="perfil-form-input"
                  placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número"
                  value={formPassword.nueva_password}
                  onChange={(e) => setFormPassword({ ...formPassword, nueva_password: e.target.value })}
                  required
                />
              </div>

              <div className="perfil-form-group">
                <label className="perfil-form-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  className="perfil-form-input"
                  placeholder="Repite la nueva contraseña"
                  value={formPassword.confirm_password}
                  onChange={(e) => setFormPassword({ ...formPassword, confirm_password: e.target.value })}
                  required
                />
              </div>

              <div className="perfil-modal-actions">
                <button
                  type="button"
                  className="perfil-btn-cancelar"
                  onClick={() => setModalPassword(false)}
                  disabled={loadingPassword}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="perfil-btn-guardar"
                  disabled={loadingPassword}
                >
                  {loadingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Popup para validaciones y avisos */}
      <ModalAlerta
        isOpen={alertaModal.isOpen}
        titulo={alertaModal.titulo}
        mensaje={alertaModal.mensaje}
        onClose={() => setAlertaModal({ isOpen: false, titulo: '', mensaje: '' })}
      />
    </div>
  );
}
