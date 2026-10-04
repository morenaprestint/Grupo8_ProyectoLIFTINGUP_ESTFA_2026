import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, LogOut, ShieldCheck, Activity, Award } from 'lucide-react';
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
    password: currentUser?.password || '••••••••',
    peso: currentUser?.peso ? Number(currentUser.peso) : 82,
    altura: currentUser?.altura ? Number(currentUser.altura) : 1.80,
    objetivo: currentUser?.objetivo || 'Ganar masa muscular',
    nivel_entrenamiento: currentUser?.nivel_entrenamiento || 'Intermedio'
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

  // Cargar datos desde el endpoint GET /api/usuarios/perfil
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
            password: d.password || perfil.password,
            peso: d.peso != null ? Number(d.peso) : perfil.peso,
            altura: d.altura != null ? Number(d.altura) : perfil.altura,
            objetivo: d.objetivo || perfil.objetivo,
            nivel_entrenamiento: d.nivel_entrenamiento || perfil.nivel_entrenamiento
          };
          setPerfil(actualizado);
          setFormEdit(actualizado);
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
        password: formEdit.password,
        peso: Number(formEdit.peso) || 0,
        altura: Number(formEdit.altura) || 0
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

      mostrarNotificacion(res?.message || '¡Perfil actualizado con éxito!', 'success');
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      const nuevoPerfil = {
        ...perfil,
        ...formEdit,
        nombre_completo: `${formEdit.nombre} ${formEdit.apellido}`.trim()
      };
      setPerfil(nuevoPerfil);
      setModalEdicion(false);
      if (currentUser) saveUser({ ...currentUser, ...nuevoPerfil });
      mostrarNotificacion('Perfil actualizado localmente', 'success');
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
                title="Editar Peso"
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
            <h2 className="perfil-card-title">Información de Sesiones y Cuenta</h2>
            <span className="perfil-card-icon" role="img" aria-label="musculo">💪</span>
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
              </div>
            </div>

            <div className="perfil-info-row">
              <div>
                <span className="perfil-info-label-inline">Contraseña:</span>
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
      </div>

      {/* ─── Modal de Edición de Perfil ─── */}
      {modalEdicion && (
        <div className="perfil-modal-overlay" onClick={() => setModalEdicion(false)}>
          <div className="perfil-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="perfil-modal-title">Editar Perfil de Atleta</h3>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="perfil-form-group">
                  <label className="perfil-form-label">Peso (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="perfil-form-input"
                    value={formEdit.peso}
                    onChange={(e) => setFormEdit({ ...formEdit, peso: e.target.value })}
                  />
                </div>
                <div className="perfil-form-group">
                  <label className="perfil-form-label">Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="perfil-form-input"
                    value={formEdit.altura}
                    onChange={(e) => setFormEdit({ ...formEdit, altura: e.target.value })}
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
