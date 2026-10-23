import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Plus,
  Wrench,
  Dumbbell,
  MapPin,
  Calendar,
  Building,
  Trash2,
  Pencil,
  X
} from 'lucide-react';
import {
  getEquipamiento,
  createEquipamiento,
  updateEquipamiento,
  deleteEquipamiento
} from '../services/api';
import ModalAlerta from '../components/ModalAlerta';
import UsuarioModal from '../components/UsuarioModal';
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

  // Estados para modal de edición y eliminación
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [formEdit, setFormEdit] = useState(FORM_INICIAL);
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  // Modal Popup para validaciones y errores (estilo neón oscuro)
  const [alertaModal, setAlertaModal] = useState({ isOpen: false, titulo: '', mensaje: '' });
  const mostrarModalError = (mensaje, titulo = 'Acción no permitida') => {
    setAlertaModal({ isOpen: true, titulo, mensaje });
  };

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
      mostrarNotificacion('Error al conectar con el servidor', 'error');
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarMaquinas();
  }, []);

  // Manejar selector de imagen para alta (convierte a base64 para vista previa inmediata)
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

  // Manejar selector de imagen para edición modal
  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormEdit(prev => ({ ...prev, imagen_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar nueva máquina mediante POST /api/equipamiento
  const handleGuardar = async (e) => {
    if (e) e.preventDefault();

    const NOMBRE_MAQUINA_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.]{3,50}$/;
    const ALFANUMERICO_OPCIONAL_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.\/]{1,100}$/;

    if (!form.nombre || !form.nombre.trim() || !NOMBRE_MAQUINA_REGEX.test(form.nombre.trim())) {
      return mostrarModalError('Acción no permitida: el nombre del equipamiento debe tener entre 3 y 50 caracteres válidos sin caracteres extraños.');
    }

    if (form.marca && form.marca.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(form.marca.trim())) {
      return mostrarModalError('Acción no permitida: el campo marca solo permite caracteres alfanuméricos válidos.');
    }
    if (form.modelo && form.modelo.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(form.modelo.trim())) {
      return mostrarModalError('Acción no permitida: el campo modelo solo permite caracteres alfanuméricos válidos.');
    }
    if (form.ubicacion && form.ubicacion.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(form.ubicacion.trim())) {
      return mostrarModalError('Acción no permitida: el campo ubicación solo permite caracteres alfanuméricos válidos.');
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
        setActiveTab('mantenimiento');
      } else {
        mostrarModalError(res?.message || 'Error al guardar la máquina');
      }
    } catch (err) {
      console.error('Error al guardar equipamiento:', err);
      mostrarModalError(err?.response?.data?.message || err?.message || 'Error al registrar el equipamiento');
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
      const res = await updateEquipamiento(maquina.id, { estatus: nuevoEstatus });
      if (res?.success) {
        mostrarNotificacion(`Estado de "${maquina.nombre}" actualizado a: ${nuevoEstatus}`, 'success');
        cargarMaquinas();
      } else {
        mostrarModalError(res?.message || 'No se pudo actualizar el estatus');
      }
    } catch (err) {
      console.error('Error al actualizar estatus:', err);
      mostrarModalError(err?.response?.data?.message || err?.message || 'Error de conexión al actualizar el estatus');
    }
  };

  // Abrir modal de edición con los datos precargados de la máquina seleccionada
  const handleAbrirEditar = (maquina) => {
    setFormEdit({
      id: maquina.id,
      nombre: maquina.nombre || '',
      marca: maquina.marca || '',
      modelo: maquina.modelo || '',
      ubicacion: maquina.ubicacion || '',
      imagen_url: maquina.imagen_url || '',
      estatus: maquina.estatus || 'Disponible',
      fecha_adquisicion: maquina.fecha_adquisicion ? String(maquina.fecha_adquisicion).slice(0, 10) : ''
    });
    setModalEditarOpen(true);
  };

  const handleCerrarEditar = () => {
    setModalEditarOpen(false);
    setFormEdit(FORM_INICIAL);
  };

  // Confirmar y actualizar máquina mediante PUT /api/equipamiento/:id
  const handleConfirmarEdicion = async (e) => {
    if (e) e.preventDefault();

    const NOMBRE_MAQUINA_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.]{3,50}$/;
    const ALFANUMERICO_OPCIONAL_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.\/]{1,100}$/;

    if (!formEdit.nombre || !formEdit.nombre.trim() || !NOMBRE_MAQUINA_REGEX.test(formEdit.nombre.trim())) {
      return mostrarModalError('Acción no permitida: el nombre del equipamiento debe tener entre 3 y 50 caracteres válidos sin caracteres extraños.');
    }

    if (formEdit.marca && formEdit.marca.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(formEdit.marca.trim())) {
      return mostrarModalError('Acción no permitida: el campo marca solo permite caracteres alfanuméricos válidos.');
    }
    if (formEdit.modelo && formEdit.modelo.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(formEdit.modelo.trim())) {
      return mostrarModalError('Acción no permitida: el campo modelo solo permite caracteres alfanuméricos válidos.');
    }
    if (formEdit.ubicacion && formEdit.ubicacion.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(formEdit.ubicacion.trim())) {
      return mostrarModalError('Acción no permitida: el campo ubicación solo permite caracteres alfanuméricos válidos.');
    }

    setGuardandoEdit(true);
    try {
      const res = await updateEquipamiento(formEdit.id, {
        nombre: formEdit.nombre.trim(),
        marca: formEdit.marca?.trim() || '',
        modelo: formEdit.modelo?.trim() || '',
        ubicacion: formEdit.ubicacion?.trim() || '',
        imagen_url: formEdit.imagen_url || null,
        estatus: formEdit.estatus,
        fecha_adquisicion: formEdit.fecha_adquisicion || null
      });

      if (res?.success) {
        mostrarNotificacion('¡Máquina actualizada exitosamente!', 'success');
        handleCerrarEditar();
        cargarMaquinas();
      } else {
        mostrarModalError(res?.message || 'Error al actualizar la máquina');
      }
    } catch (err) {
      console.error('Error al actualizar equipamiento:', err);
      mostrarModalError(err?.response?.data?.message || err?.message || 'Error al actualizar la máquina');
    } finally {
      setGuardandoEdit(false);
    }
  };

  // Eliminar máquina mediante modal personalizado (sin window.confirm nativo)
  const handleConfirmarEliminar = async () => {
    if (!confirmEliminar) return;
    const { id } = confirmEliminar;

    setEliminandoId(id);
    try {
      const res = await deleteEquipamiento(id);
      if (res?.success) {
        mostrarNotificacion('Máquina eliminada correctamente del inventario', 'success');
        setConfirmEliminar(null);
        cargarMaquinas();
      } else {
        mostrarModalError(res?.message || 'Error al eliminar la máquina');
      }
    } catch (err) {
      console.error('Error al eliminar equipamiento:', err);
      mostrarModalError(err?.response?.data?.message || err?.message || 'Error de conexión al eliminar la máquina');
    } finally {
      setEliminandoId(null);
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
          <span>Inventario & Mantenimiento</span>
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
                    Nombre de la Máquina *
                  </label>
                  <input
                    type="text"
                    className="equip-input"
                    placeholder="Ej. Prensa de Piernas"
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
                    type="date"
                    min="2010-01-01"
                    max={new Date().toISOString().slice(0, 10)}
                    className="equip-input"
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

                  {/* ── Acciones de Administrador (Editar y Eliminar) ── */}
                  <div className="equip-card-actions-bar">
                    <button
                      type="button"
                      className="equip-card-btn-edit"
                      onClick={() => handleAbrirEditar(m)}
                      title="Editar máquina"
                    >
                      <Pencil size={14} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      className="equip-card-btn-delete"
                      onClick={() => setConfirmEliminar({ id: m.id, nombre: m.nombre })}
                      disabled={eliminandoId === m.id}
                      title="Eliminar máquina"
                      aria-label={`Eliminar ${m.nombre}`}
                    >
                      <Trash2 size={16} />
                    </button>
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

      {/* ─── MODAL EDITAR MÁQUINA (PUT) ─── */}
      {modalEditarOpen && (
        <div className="equip-modal-overlay" onClick={handleCerrarEditar}>
          <div
            className="equip-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="equip-modal-title"
          >
            <div className="equip-modal-header">
              <div className="equip-modal-header-info">
                <div className="equip-modal-icon-badge">
                  <Pencil size={18} color="#00d2ff" />
                </div>
                <div>
                  <h2 id="equip-modal-title" className="equip-modal-title">Editar Máquina</h2>
                  <p className="equip-modal-subtitle">Modifica los datos del equipo y confirma los cambios</p>
                </div>
              </div>
              <button
                type="button"
                className="equip-modal-btn-close"
                onClick={handleCerrarEditar}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarEdicion} className="equip-modal-form">
              <div className="equip-modal-body">
                <div className="equip-form-grid-2col">
                  {/* Columna Izquierda */}
                  <div className="equip-form-col">
                    <div className="equip-form-group">
                      <label className="equip-label">
                        <Dumbbell size={15} color="#00d2ff" />
                        Nombre de la Máquina *
                      </label>
                      <input
                        type="text"
                        className="equip-input"
                        placeholder="Ej. Prensa"
                        value={formEdit.nombre}
                        onChange={(e) => setFormEdit(prev => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="equip-form-group">
                      <label className="equip-label">
                        <Building size={15} color="#00d2ff" />
                        Marca / Fabricante
                      </label>
                      <input
                        type="text"
                        className="equip-input"
                        placeholder="Ej. Cybex"
                        value={formEdit.marca}
                        onChange={(e) => setFormEdit(prev => ({ ...prev, marca: e.target.value }))}
                      />
                    </div>

                    <div className="equip-form-group">
                      <label className="equip-label">Modelo</label>
                      <input
                        type="text"
                        className="equip-input"
                        placeholder="Ej. HS-2000"
                        value={formEdit.modelo}
                        onChange={(e) => setFormEdit(prev => ({ ...prev, modelo: e.target.value }))}
                      />
                    </div>

                    <div className="equip-form-group">
                      <label className="equip-label">
                        <Camera size={15} color="#00d2ff" />
                        Imagen URL
                      </label>
                      <input
                        type="text"
                        className="equip-input"
                        placeholder="https://ejemplo.com/foto.jpg"
                        value={formEdit.imagen_url && formEdit.imagen_url.startsWith('data:') ? 'Imagen local cargada' : formEdit.imagen_url}
                        onChange={(e) => setFormEdit(prev => ({ ...prev, imagen_url: e.target.value }))}
                        style={{ marginBottom: '8px' }}
                      />
                      <label className="equip-image-picker-box">
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleEditImageChange}
                        />
                        {formEdit.imagen_url ? (
                          <img
                            src={formEdit.imagen_url}
                            alt="Vista previa"
                            className="equip-image-preview"
                          />
                        ) : (
                          <>
                            <Camera className="equip-camera-icon" />
                            <span className="equip-image-hint">Toca para cambiar foto</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="equip-form-col">
                    <div className="equip-form-group">
                      <label className="equip-label">
                        <MapPin size={15} color="#00d2ff" />
                        Ubicación / Sección
                      </label>
                      <input
                        type="text"
                        className="equip-input"
                        placeholder="Ej. Sección Pierna"
                        value={formEdit.ubicacion}
                        onChange={(e) => setFormEdit(prev => ({ ...prev, ubicacion: e.target.value }))}
                      />
                    </div>

                    <div className="equip-form-group">
                      <label className="equip-label">Estado / Estatus</label>
                      <div className="equip-status-toggle-row">
                        <button
                          type="button"
                          className={`equip-status-btn ${formEdit.estatus === 'Disponible' ? 'selected' : ''}`}
                          onClick={() => setFormEdit(prev => ({ ...prev, estatus: 'Disponible' }))}
                        >
                          Disponible
                        </button>
                        <button
                          type="button"
                          className={`equip-status-btn mantenimiento ${formEdit.estatus === 'En Mantenimiento' ? 'selected' : ''}`}
                          onClick={() => setFormEdit(prev => ({ ...prev, estatus: 'En Mantenimiento' }))}
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
                        type="date"
                        min="2010-01-01"
                        max={new Date().toISOString().slice(0, 10)}
                        className="equip-input"
                        value={formEdit.fecha_adquisicion ? String(formEdit.fecha_adquisicion).slice(0, 10) : ''}
                        onChange={(e) => setFormEdit(prev => ({ ...prev, fecha_adquisicion: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción del Modal */}
              <div className="equip-modal-footer">
                <button
                  type="button"
                  className="equip-btn-cancelar"
                  onClick={handleCerrarEditar}
                  disabled={guardandoEdit}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="equip-btn-guardar"
                  disabled={guardandoEdit}
                >
                  {guardandoEdit ? 'GUARDANDO CAMBIOS...' : 'CONFIRMAR Y ACTUALIZAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar máquina sin alerts nativos */}
      <UsuarioModal
        isOpen={Boolean(confirmEliminar)}
        title="¿Eliminar máquina del inventario?"
        onClose={() => setConfirmEliminar(null)}
        onSave={handleConfirmarEliminar}
        saveText={eliminandoId ? 'Eliminando...' : 'Sí, eliminar'}
        disabled={Boolean(eliminandoId)}
        isSmall
      >
        {confirmEliminar && (
          <p className="confirm-texto" style={{ color: '#d4cae8', fontSize: '14px', lineHeight: '1.5' }}>
            ¿Estás seguro de eliminar la máquina <strong style={{ color: '#00d2ff' }}>{confirmEliminar.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
        )}
      </UsuarioModal>

      {/* Modal Popup de errores y validaciones preventivas */}
      <ModalAlerta
        isOpen={alertaModal.isOpen}
        titulo={alertaModal.titulo}
        mensaje={alertaModal.mensaje}
        onClose={() => setAlertaModal({ isOpen: false, titulo: '', mensaje: '' })}
      />
    </div>
  );
}