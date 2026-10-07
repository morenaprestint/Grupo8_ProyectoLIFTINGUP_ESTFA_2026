import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Edit2,
  LogOut,
  ShieldCheck,
  Activity,
  Award
} from 'lucide-react';
import { getCurrentUser, logout, saveUser } from '../features/authService';
import { getPerfilUsuario, updatePerfilUsuario } from '../services/api';
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
    peso: currentUser?.peso ? Number(currentUser.peso) : 82,
    altura: currentUser?.altura ? Number(currentUser.altura) : 1.80,
    objetivo: currentUser?.objetivo || 'Ganar masa muscular',
    nivel_entrenamiento: currentUser?.nivel_entrenamiento || 'Intermedio',
    rol: 'atleta'
  });

  // Modal de edición de datos personales
  const [modalEdicion, setModalEdicion] = useState(false);

  // Formulario de edición de datos personales (Nombre, Apellido, Peso, Altura)
  const [formEdit, setFormEdit] = useState({
    nombre: perfil.nombre,
    apellido: perfil.apellido,
    peso: perfil.peso,
    altura: perfil.altura
  });

  // Estados de carga y alertas
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', tipo: 'success' });

  const mostrarNotificacion = (msg, tipo = 'success') => {
    setToast({ show: true, msg, tipo });
    setTimeout(() => setToast({ show: false, msg: '', tipo: 'success' }), 3500);
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

  // ─── Guardar Datos Personales (Nombre, Apellido, Peso, Altura) ────────────
  const handleGuardarPerfil = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      const payload = {
        id: perfil.id,
        nombre: formEdit.nombre.trim(),
        apellido: formEdit.apellido.trim(),
        peso: Number(formEdit.peso) || null,
        altura: Number(formEdit.altura) || null
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

  // Cálculo de IMC estimado
  const imc = (perfil.peso && perfil.altura && perfil.altura > 0)
    ? (perfil.peso / (perfil.altura * perfil.altura)).toFixed(1)
    : '25.3';

  return (
    <div className="dashboard-content perfil-dashboard-container">
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
              <span className="perfil-fisico-value">{perfil.peso} Kg</span>
              <span className="perfil-fisico-label">Peso actual</span>
            </div>

            {/* Altura */}
            <div className="perfil-fisico-box perfil-fisico-box-purple">
              <span className="perfil-fisico-value">
                {Number(perfil.altura).toFixed(2)} m
              </span>
              <span className="perfil-fisico-label">Altura</span>
            </div>
          </div>

          {/* Ficha Resumen de Métricas */}
          <div className="perfil-datos-extra-card">
            <div className="perfil-datos-extra-row">
              <span><Activity size={14} style={{ display: 'inline', marginRight: '4px' }} /> IMC Estimado:</span>
              <strong>{imc} kg/m²</strong>
            </div>
            <div className="perfil-datos-extra-row">
              <span><Award size={14} style={{ display: 'inline', marginRight: '4px' }} /> Objetivo:</span>
              <strong>{perfil.objetivo}</strong>
            </div>
            <div className="perfil-datos-extra-row">
              <span>Nivel:</span>
              <strong>{perfil.nivel_entrenamiento}</strong>
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
              <div>
                <span className="perfil-info-label-inline">Email:</span>
                <span className="perfil-info-value-inline">{perfil.email}</span>
                <span className="perfil-readonly-tag">🔒 No editable</span>
              </div>
            </div>

            <div className="perfil-info-row">
              <div>
                <span className="perfil-info-label-inline">Rol de Cuenta:</span>
                <span className="perfil-info-value-inline" style={{ textTransform: 'capitalize' }}>{perfil.rol}</span>
                <span className="perfil-readonly-tag">🔒 No editable</span>
              </div>
            </div>

            <div className="perfil-info-row">
              <div>
                <span className="perfil-info-label-inline">Contraseña:</span>
                <span className="perfil-password-dots">••••••••••••</span>
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

      {/* ─── MODAL: Modificación de Datos Personales ─── */}
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
                  <label className="perfil-form-label">Peso Corporal (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    className="perfil-form-input"
                    value={formEdit.peso || ''}
                    onChange={(e) => setFormEdit({ ...formEdit, peso: e.target.value })}
                    placeholder="Ej: 82.5"
                  />
                </div>
                <div className="perfil-form-group">
                  <label className="perfil-form-label">Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.0"
                    max="2.5"
                    className="perfil-form-input"
                    value={formEdit.altura || ''}
                    onChange={(e) => setFormEdit({ ...formEdit, altura: e.target.value })}
                    placeholder="Ej: 1.80"
                  />
                </div>
              </div>

              {/* Campos estrictamente deshabilitados / Read-Only */}
              <div className="perfil-form-group">
                <label className="perfil-form-label">
                  Email
                  <span className="perfil-readonly-tag">🔒 Solo Lectura</span>
                </label>
                <input
                  type="email"
                  className="perfil-form-input"
                  value={perfil.email}
                  disabled
                  readOnly
                  title="El email de cuenta no puede modificarse por el atleta"
                />
              </div>

              <div className="perfil-form-group">
                <label className="perfil-form-label">
                  Rol de Usuario
                  <span className="perfil-readonly-tag">🔒 Solo Lectura</span>
                </label>
                <input
                  type="text"
                  className="perfil-form-input"
                  value="Atleta"
                  disabled
                  readOnly
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
                  {loading ? 'Guardando...' : 'Guardar Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
