import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, LogOut, ShieldAlert, KeyRound, Mail, UserCheck, Camera } from 'lucide-react';
import { getCurrentUser, logout, saveUser } from '../features/authService';
import { getPerfilAdmin, updatePerfilAdmin, uploadFotoPerfil, getImageUrl } from '../services/api';
import '../styles/perfilViews.css';

export default function PerfilAdminView() {
  const navigate = useNavigate();
  const currentAdmin = getCurrentUser();

  const [perfil, setPerfil] = useState({
    id: currentAdmin?.id || currentAdmin?.id_admin || 1,
    nombre: currentAdmin?.nombre || 'Maximo',
    apellido: currentAdmin?.apellido || 'Paz',
    nombre_completo: `${currentAdmin?.nombre || 'Maximo'} ${currentAdmin?.apellido || 'Paz'}`.trim(),
    email: currentAdmin?.email || 'MaximoPAz@gmail.com',
    foto_perfil: currentAdmin?.foto_perfil || null,
    password: currentAdmin?.password || '••••••••'
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [formEdit, setFormEdit] = useState({ ...perfil });
  const [loading, setLoading] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', tipo: 'success' });

  const mostrarNotificacion = (msg, tipo = 'success') => {
    setToast({ show: true, msg, tipo });
    setTimeout(() => setToast({ show: false, msg: '', tipo: 'success' }), 3500);
  };

  // Cargar datos desde el endpoint GET /api/admins/perfil
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const adminId = currentAdmin?.id || currentAdmin?.id_admin;
        const res = await getPerfilAdmin(adminId, currentAdmin?.email);
        if (res?.success && res.data) {
          const d = res.data;
          const actualizado = {
            id: d.id_admin || d.id,
            nombre: d.nombre || perfil.nombre,
            apellido: d.apellido || perfil.apellido,
            nombre_completo: d.nombre_completo || `${d.nombre || ''} ${d.apellido || ''}`.trim() || perfil.nombre_completo,
            email: d.email || perfil.email,
            foto_perfil: d.foto_perfil || perfil.foto_perfil,
            password: d.password || perfil.password
          };
          setPerfil(actualizado);
          setFormEdit(actualizado);
        }
      } catch (err) {
        console.warn('Usando datos de perfil admin locales:', err.message);
      }
    };

    fetchPerfil();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOpenEdit = () => {
    setFormEdit({ ...perfil, password: '', password_actual: '' });
    setModalEdicion(true);
  };

  const handleSubirFoto = async (e) => {
    const file = e.target.files?.[0];
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
        if (currentAdmin) {
          saveUser({ ...currentAdmin, foto_perfil: rutaFoto });
        }
        mostrarNotificacion('¡Foto de perfil actualizada correctamente!', 'success');
      } else {
        mostrarNotificacion(res?.message || 'Error al subir foto', 'error');
      }
    } catch (err) {
      console.error('Error al subir foto admin:', err);
      mostrarNotificacion(err?.message || 'Error al conectar con el servidor', 'error');
    } finally {
      setSubiendoFoto(false);
      e.target.value = '';
    }
  };

  const handleGuardarPerfil = async (e) => {
    e?.preventDefault();

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(formEdit.email.trim())) {
      mostrarNotificacion('El correo electrónico no tiene un formato válido con dominio completo (ej. admin@liftingup.com)', 'error');
      return;
    }

    const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (formEdit.password && formEdit.password.trim()) {
      if (!formEdit.password_actual || !formEdit.password_actual.trim()) {
        mostrarNotificacion('Debes ingresar tu contraseña actual para confirmar el cambio', 'error');
        return;
      }
      if (!PWD_REGEX.test(formEdit.password.trim())) {
        mostrarNotificacion('La nueva contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        id: perfil.id,
        nombre: formEdit.nombre.trim(),
        apellido: formEdit.apellido.trim(),
        email: formEdit.email.trim()
      };
      if (formEdit.password && formEdit.password.trim()) {
        payload.password = formEdit.password.trim();
        payload.password_actual = formEdit.password_actual.trim();
      }

      const res = await updatePerfilAdmin(payload);

      const nuevoPerfil = {
        ...perfil,
        ...payload,
        password: perfil.password,
        nombre_completo: `${payload.nombre} ${payload.apellido}`.trim()
      };

      setPerfil(nuevoPerfil);
      setModalEdicion(false);

      if (currentAdmin) {
        saveUser({
          ...currentAdmin,
          ...nuevoPerfil
        });
      }

      mostrarNotificacion(res?.message || '¡Perfil de administrador actualizado!', 'success');
    } catch (err) {
      console.error('Error al actualizar perfil admin:', err);
      const nuevoPerfil = {
        ...perfil,
        ...formEdit,
        nombre_completo: `${formEdit.nombre} ${formEdit.apellido}`.trim()
      };
      setPerfil(nuevoPerfil);
      setModalEdicion(false);
      if (currentAdmin) saveUser({ ...currentAdmin, ...nuevoPerfil });
      mostrarNotificacion('Perfil actualizado localmente', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content perfil-dashboard-container" style={{ maxWidth: '850px' }}>
      {toast.show && (
        <div className={`perfil-toast ${toast.tipo}`}>
          {toast.msg}
        </div>
      )}

      {/* ─── Hero / Banner Superior con Avatar y Subida con Multer ─── */}
      <section className="perfil-hero-banner">
        <div className="perfil-avatar-glow-ring" title="Toca para cambiar foto de perfil">
          <input
            type="file"
            id="admin-avatar-upload"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleSubirFoto}
          />
          <label htmlFor="admin-avatar-upload" className="perfil-avatar-inner" style={{ cursor: 'pointer' }}>
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
          <div className="perfil-role-badge admin">
            <ShieldAlert size={14} />
            <span>Usuario Administrador</span>
          </div>
        </div>
      </section>

      {/* ─── Tarjeta: Información de Cuenta ─── */}
      <section className="perfil-card">
        <div className="perfil-card-header">
          <h2 className="perfil-card-title">Información de Cuenta</h2>
          <span className="perfil-card-icon" role="img" aria-label="llave">🔑</span>
        </div>
        <div className="perfil-neon-divider-cyan" />

        <div className="perfil-info-list">
          <div className="perfil-info-row">
            <div>
              <span className="perfil-info-label-inline">
                <UserCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Nombre Completo:
              </span>
              <span className="perfil-info-value-inline">{perfil.nombre_completo}</span>
            </div>
          </div>

          <div className="perfil-info-row">
            <div>
              <span className="perfil-info-label-inline">
                <Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Email:
              </span>
              <span className="perfil-info-value-inline">{perfil.email}</span>
            </div>
          </div>

          <div className="perfil-info-row">
            <div>
              <span className="perfil-info-label-inline">
                <KeyRound size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Contraseña:
              </span>
              <span className="perfil-password-dots" style={mostrarPassword ? { fontSize: '0.88rem', color: '#00d2ff', fontStyle: 'italic', letterSpacing: 'normal' } : {}}>
                {mostrarPassword ? 'Contraseña encriptada por seguridad' : '••••••••'}
              </span>
            </div>
            <button
              type="button"
              className="perfil-btn-ver-clave"
              onClick={() => setMostrarPassword(!mostrarPassword)}
            >
              {mostrarPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        {/* Ficha Resumen de Privilegios Administrativos */}
        <div className="perfil-datos-extra-card" style={{ marginTop: '16px' }}>
          <div className="perfil-datos-extra-row">
            <span>Rol Administrativo:</span>
            <strong>Superadministrador</strong>
          </div>
          <div className="perfil-datos-extra-row">
            <span>Privilegios:</span>
            <strong>Gestión de atletas, asistencia, rutinas y equipamiento</strong>
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
            <span>Editar Perfil</span>
          </button>
        </div>
      </section>

      {/* ─── Modal de Edición ─── */}
      {modalEdicion && (
        <div className="perfil-modal-overlay" onClick={() => setModalEdicion(false)}>
          <div className="perfil-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="perfil-modal-title">Editar Perfil de Administrador</h3>
            <form onSubmit={handleGuardarPerfil}>
              <div className="perfil-form-group">
                <label className="perfil-form-label">Nombre</label>
                <input
                  type="text"
                  className="perfil-form-input"
                  value={formEdit.nombre}
                  onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })}
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
                  required
                />
              </div>

              <div className="perfil-form-group">
                <label className="perfil-form-label">Email</label>
                <input
                  type="email"
                  className="perfil-form-input"
                  value={formEdit.email}
                  onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
                  required
                />
              </div>

              <div className="perfil-form-group">
                <label className="perfil-form-label">Nueva Contraseña (opcional)</label>
                <input
                  type="password"
                  className="perfil-form-input"
                  placeholder="Dejar en blanco para conservar la actual"
                  value={formEdit.password || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, password: e.target.value })}
                />
                <span className="field-hint" style={{ fontSize: '11px', color: '#8fb8d6', marginTop: '4px', display: 'block' }}>
                  Opcional. Si se modifica: mín. 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.
                </span>
              </div>

              {formEdit.password && formEdit.password.trim() ? (
                <div className="perfil-form-group">
                  <label className="perfil-form-label">Contraseña Actual * (Requerida para confirmar el cambio)</label>
                  <input
                    type="password"
                    className="perfil-form-input"
                    placeholder="Ingresa tu contraseña actual"
                    value={formEdit.password_actual || ''}
                    onChange={(e) => setFormEdit({ ...formEdit, password_actual: e.target.value })}
                    required
                  />
                </div>
              ) : null}

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
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
