import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, LogOut, ShieldAlert, KeyRound, Mail, UserCheck } from 'lucide-react';
import { getCurrentUser, logout, saveUser } from '../features/authService';
import { getPerfilAdmin, updatePerfilAdmin } from '../services/api';
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
    password: currentAdmin?.password || '••••••••'
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [formEdit, setFormEdit] = useState({ ...perfil });
  const [loading, setLoading] = useState(false);
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
    setFormEdit({ ...perfil });
    setModalEdicion(true);
  };

  const handleGuardarPerfil = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      const payload = {
        id: perfil.id,
        nombre: formEdit.nombre.trim(),
        apellido: formEdit.apellido.trim(),
        email: formEdit.email.trim(),
        password: formEdit.password
      };

      const res = await updatePerfilAdmin(payload);

      const nuevoPerfil = {
        ...perfil,
        ...payload,
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

      {/* ─── Hero / Banner Superior ─── */}
      <section className="perfil-hero-banner">
        <div className="perfil-avatar-glow-ring">
          <div className="perfil-avatar-inner">
            <User className="perfil-avatar-silhouette" />
          </div>
        </div>

        <div className="perfil-hero-info">
          <h1 className="perfil-user-name">{perfil.nombre_completo}</h1>
          <div className="perfil-role-badge admin">
            <ShieldAlert size={14} />
            <span>Usuario Administrador</span>
          </div>
        </div>
      </section>

      {/* ─── Tarjeta: Información de Cuenta (OMITE Datos Físicos) ─── */}
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
              <span className="perfil-password-dots">
                {mostrarPassword ? (perfil.password || '••••••••') : '••••••••'}
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
                <label className="perfil-form-label">Contraseña</label>
                <input
                  type="text"
                  className="perfil-form-input"
                  value={formEdit.password}
                  onChange={(e) => setFormEdit({ ...formEdit, password: e.target.value })}
                />
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
