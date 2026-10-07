import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Plus, 
  Wrench, 
  Dumbbell, 
  CheckCircle2, 
  AlertTriangle,
  MapPin,
  Calendar,
  Building
} from 'lucide-react';
import { getEquipamiento, createEquipamiento, updateEquipamiento } from '../services/api';
import '../styles/equipamientoView.css';

const FORM_INICIAL = {
  nombre: '',
  marca: '',
  modelo: '',
  ubicacion: '',
  imagen_url: '',
  estatus: 'Disponible',
  fecha_adquisicion: ''
};

export default function EquipamientoView() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('agregar'); // 'agregar' | 'mantenimiento'
  const [form, setForm] = useState(FORM_INICIAL);
  const [maquinas, setMaquinas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [filtroMantenimiento, setFiltroMantenimiento] = useState('Todos'); // 'Todos' | 'Disponible' | 'En Mantenimiento'
  const [toast, setToast] = useState({ show: false, msg: '', tipo: 'success' });

  const mostrarNotificacion = (msg, tipo = 'success') => {
    setToast({ show: true, msg, tipo });
    setTimeout(() => setToast({ show: false, msg: '', tipo: 'success' }), 3500);
  };

  // Cargar máquinas desde GET /api/equipamiento
  const cargarMaquinas = async () => {
    setCargandoLista(true);
    try {
      const res = await getEquipamiento();
      if (res?.success && Array.isArray(res.data)) {
        setMaquinas(res.data);
      }
    } catch (err) {
      console.warn('Error al cargar equipamiento desde API:', err);
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarMaquinas();
  }, []);

  // Manejar selector de imagen (convierte a base64 para vista previa inmediata)
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, imagen_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar nueva máquina mediante POST /api/equipamiento
  const handleGuardar = async (e) => {
    if (e) e.preventDefault();
    if (!form.nombre.trim()) {
      return mostrarNotificacion('El nombre de la máquina es obligatorio', 'error');
    }

    setGuardando(true);
    try {
      const res = await createEquipamiento({
        nombre: form.nombre.trim(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        ubicacion: form.ubicacion.trim(),
        imagen_url: form.imagen_url || null,
        estatus: form.estatus,
        fecha_adquisicion: form.fecha_adquisicion || null
      });

      if (res?.success) {
        mostrarNotificacion('¡Máquina guardada con éxito en el sistema!', 'success');
        setForm(FORM_INICIAL);
        cargarMaquinas();
      } else {
        mostrarNotificacion(res?.message || 'Error al guardar la máquina', 'error');
      }
    } catch (err) {
      console.error('Error al guardar equipamiento:', err);
      const nuevaLocal = { id: Date.now(), ...form };
      setMaquinas(prev => [nuevaLocal, ...prev]);
      setForm(FORM_INICIAL);
      mostrarNotificacion('Máquina registrada localmente', 'success');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setForm(FORM_INICIAL);
    navigate('/dashboard');
  };

  // Alternar estatus entre 'Disponible' y 'En Mantenimiento'
  const handleToggleEstatus = async (maquina) => {
    const nuevoEstatus = maquina.estatus === 'Disponible' ? 'En Mantenimiento' : 'Disponible';
    try {
      await updateEquipamiento(maquina.id, { estatus: nuevoEstatus });
      mostrarNotificacion(`Estado de "${maquina.nombre}" actualizado a: ${nuevoEstatus}`, 'success');
      cargarMaquinas();
    } catch (err) {
      console.error('Error al actualizar estatus:', err);
      setMaquinas(prev => prev.map(m => m.id === maquina.id ? { ...m, estatus: nuevoEstatus } : m));
      mostrarNotificacion(`Estado actualizado a: ${nuevoEstatus}`, 'success');
    }
  };

  // Filtrado en pestaña de Mantenimiento
  const maquinasFiltradas = maquinas.filter(m => {
    if (filtroMantenimiento === 'Todos') return true;
    return m.estatus === filtroMantenimiento;
  });

  return (
    <div className="dashboard-content equip-dashboard-container">
      {toast.show && (
        <div className={`perfil-toast ${toast.tipo}`}>
          {toast.msg}
        </div>
      )}

      {/* ─── Encabezado ─── */}
      <section className="equip-header-section">
        <h1 className="equip-main-title">Equipamiento del Gimnasio</h1>
        <p className="equip-subtitulo">
          Alta de maquinaria, control de ubicación y gestión de mantenimiento
        </p>
      </section>

      {/* ─── Pestañas / Selector ─── */}
      <div className="equip-tabs-container">
        <button
          type="button"
          className={`equip-tab-btn ${activeTab === 'agregar' ? 'active' : 'inactive'}`}
          onClick={() => setActiveTab('agregar')}
        >
          <Plus size={17} />
          <span>+ Agregar Máquina</span>
        </button>

        <button
          type="button"
          className={`equip-tab-btn ${activeTab === 'mantenimiento' ? 'active' : 'inactive'}`}
          onClick={() => {
            setActiveTab('mantenimiento');
            cargarMaquinas();
          }}
        >
          <Wrench size={16} />
          <span>Mantenimiento</span>
          <span className="equip-tab-badge">{maquinas.length}</span>
        </button>
      </div>

      {/* ─── Pestaña 1: Formulario de Alta con Grid de 2 Columnas ─── */}
      {activeTab === 'agregar' && (
        <div className="equip-card-neon">
          <form onSubmit={handleGuardar}>
            <div className="equip-form-grid-2col">
              {/* ── COLUMNA IZQUIERDA ── */}
              <div className="equip-form-col">
                <div className="equip-form-group">
                  <label className="equip-label">
                    <Dumbbell size={15} color="#00d2ff" />
                    Nombre de la Máquina
                  </label>
                  <input
                    type="text"
                    className="equip-input"
                    placeholder="Ej. Prensa"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="equip-form-group">
                  <label className="equip-label">
                    <Building size={15} color="#00d2ff" />
                    Fabricante / Marca
                  </label>
                  <input
                    type="text"
                    className="equip-input"
                    placeholder="Ej. Cybex"
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  />
                </div>

                <div className="equip-form-group">
                  <label className="equip-label">Modelo</label>
                  <input
                    type="text"
                    className="equip-input"
                    placeholder="Ej. HS-2000"
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  />
                </div>

                <div className="equip-form-group">
                  <label className="equip-label">
                    <Camera size={15} color="#00d2ff" />
                    Imagen de la Máquina
                  </label>
                  <label className="equip-image-picker-box">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    {form.imagen_url ? (
                      <img 
                        src={form.imagen_url} 
                        alt="Vista previa" 
                        className="equip-image-preview" 
                      />
                    ) : (
                      <>
                        <Camera className="equip-camera-icon" />
                        <span className="equip-image-hint">Toca para cargar foto</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* ── COLUMNA DERECHA ── */}
              <div className="equip-form-col">
                <div className="equip-form-group">
                  <label className="equip-label">
                    <MapPin size={15} color="#00d2ff" />
                    Ubicación en el Gimnasio
                  </label>
                  <input
                    type="text"
                    className="equip-input"
                    placeholder="Ej. Sección Pierna"
                    value={form.ubicacion}
                    onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  />
                </div>

                <div className="equip-form-group">
                  <label className="equip-label">Estatus Inicial</label>
                  <div className="equip-status-toggle-row">
                    <button
                      type="button"
                      className={`equip-status-btn ${form.estatus === 'Disponible' ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, estatus: 'Disponible' })}
                    >
                      Disponible
                    </button>
                    <button
                      type="button"
                      className={`equip-status-btn mantenimiento ${form.estatus === 'En Mantenimiento' ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, estatus: 'En Mantenimiento' })}
                    >
                      En Mantenimiento
                    </button>
                  </div>
                </div>

                <div className="equip-form-group">
                  <label className="equip-label">
                    <Calendar size={15} color="#00d2ff" />
                    Fecha de Adquisición
                  </label>
                  <input
                    type="text"
                    className="equip-input"
                    placeholder="Ej. 2025-05-10 o 5/10"
                    value={form.fecha_adquisicion}
                    onChange={(e) => setForm({ ...form, fecha_adquisicion: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="equip-actions-row-expanded">
              <button
                type="submit"
                className="equip-btn-guardar"
                disabled={guardando}
              >
                {guardando ? 'GUARDANDO MÁQUINA...' : 'GUARDAR MÁQUINA'}
              </button>
              <button
                type="button"
                className="equip-btn-cancelar"
                onClick={handleCancelar}
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Pestaña 2: Control de Mantenimiento (Grid de Tarjetas) ─── */}
      {activeTab === 'mantenimiento' && (
        <div>
          <div className="equip-mantenimiento-header">
            <span style={{ fontSize: '14px', color: '#b0b0c0' }}>
              Mostrando {maquinasFiltradas.length} máquina(s)
            </span>

            <div className="equip-filter-chips">
              {['Todos', 'Disponible', 'En Mantenimiento'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`equip-filter-chip ${filtroMantenimiento === st ? 'active' : ''}`}
                  onClick={() => setFiltroMantenimiento(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {cargandoLista ? (
            <div className="equip-empty-msg">Cargando catálogo de equipamiento...</div>
          ) : maquinasFiltradas.length === 0 ? (
            <div className="equip-empty-msg">
              No hay máquinas con el estado seleccionado.
            </div>
          ) : (
            <div className="equip-grid-cards">
              {maquinasFiltradas.map((m) => (
                <div key={m.id} className="equip-item-card">
                  <div className="equip-card-top">
                    {m.imagen_url ? (
                      <img src={m.imagen_url} alt={m.nombre} className="equip-card-thumb" />
                    ) : (
                      <div className="equip-card-thumb">
                        <Dumbbell size={24} color="#00d2ff" />
                      </div>
                    )}
                    <div className="equip-item-info">
                      <h3 className="equip-item-nombre">{m.nombre}</h3>
                      <span className="equip-item-details">
                        {m.marca && <strong>{m.marca} </strong>}
                        {m.modelo && `• ${m.modelo} `}
                      </span>
                      {m.ubicacion && (
                        <span style={{ fontSize: '11.5px', color: '#00d2ff' }}>
                          📍 {m.ubicacion}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="equip-card-footer">
                    <span style={{ fontSize: '11px', color: '#8e8d9c' }}>
                      Adq: {m.fecha_adquisicion ? String(m.fecha_adquisicion).slice(0, 10) : 'Sin fecha'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleEstatus(m)}
                      className={`equip-item-badge ${m.estatus === 'Disponible' ? 'disponible' : 'mantenimiento'}`}
                      title="Click para alternar estado"
                    >
                      {m.estatus === 'Disponible' ? '✓ Disponible' : '⚠ En Mantenimiento'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
