import { useState, useEffect, useCallback } from 'react';
import { getRutinas, createRutina, updateRutina, deleteRutina, getEjercicios } from '../../services/api';
import { getCurrentUser } from '../../features/authService';
import '../../styles/adminDashboard.css';

const FORM_RUTINA_INICIAL = { nombre: '', descripcion: '', dia_asignado: '', es_favorita: 0 };

function RutinasView() {
    const user = getCurrentUser();
    // 2 pestañas principales requeridas: 'crear' ('Crear Rutina Personalizada') y 'mis-rutinas' ('Mis Rutinas / Favoritas')
    const [tab, setTab] = useState('mis-rutinas');
    const [filtroFavoritas, setFiltroFavoritas] = useState(false); // Subfiltro dentro de Mis Rutinas

    const [rutinas, setRutinas] = useState([]);
    const [ejercicios, setEjercicios] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para Crear / Editar Rutina
    const [rutinaEditandoId, setRutinaEditandoId] = useState(null);
    const [formRutina, setFormRutina] = useState(FORM_RUTINA_INICIAL);
    const [rutinaEjercicios, setRutinaEjercicios] = useState([]);
    const [ejercicioSeleccionadoId, setEjercicioSeleccionadoId] = useState('');
    const [guardando, setGuardando] = useState(false);

    const [toast, setToast] = useState({ msg: '', tipo: 'success' });
    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3200);
    };

    const userId = user?.id ?? user?.id_usuario;

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            // Se obtienen las rutinas del atleta (solo_usuario = true para excluir las del sistema)
            const [resRutinas, resEjercicios] = await Promise.all([
                getRutinas(userId || '', false, true),
                getEjercicios()
            ]);
            if (resRutinas?.success && Array.isArray(resRutinas.data)) {
                // Filtro defensivo estricto: solo rutinas creadas por el propio atleta
                const soloPropias = resRutinas.data.filter(r => r.id_usuario != null && Number(r.id_usuario) === Number(userId));
                setRutinas(soloPropias);
            }
            if (resEjercicios?.success && Array.isArray(resEjercicios.data)) {
                setEjercicios(resEjercicios.data);
            }
        } catch (error) {
            console.error('Error al cargar datos de rutinas:', error);
            mostrarToast('Error al cargar rutinas y ejercicios', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Agregar ejercicio del catálogo a la rutina
    const agregarEjercicioARutina = () => {
        if (!ejercicioSeleccionadoId) {
            return mostrarToast('Selecciona un ejercicio del catálogo', 'error');
        }
        const ej = ejercicios.find(e => e.id_ejercicio === parseInt(ejercicioSeleccionadoId, 10));
        if (ej) {
            setRutinaEjercicios(prev => [
                ...prev,
                {
                    id_ejercicio: ej.id_ejercicio,
                    nombre: ej.nombre,
                    grupo_muscular: ej.grupo_muscular,
                    gif: ej.gif,
                    series: 3,
                    repeticiones: 12,
                    peso: 0
                }
            ]);
            setEjercicioSeleccionadoId('');
        }
    };

    const updateEjercicioRutina = (index, field, value) => {
        setRutinaEjercicios(prev => {
            const copy = [...prev];
            copy[index][field] = value;
            return copy;
        });
    };

    const removerEjercicioRutina = (index) => {
        setRutinaEjercicios(prev => prev.filter((_, i) => i !== index));
    };

    // Iniciar edición de una rutina existente
    const iniciarEdicion = (rutina) => {
        setRutinaEditandoId(rutina.id_rutina);
        setFormRutina({
            nombre: rutina.nombre || '',
            descripcion: rutina.descripcion || '',
            dia_asignado: rutina.dia_asignado || '',
            es_favorita: rutina.es_favorita ? 1 : 0
        });

        if (Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0) {
            setRutinaEjercicios(
                rutina.ejercicios.map(e => ({
                    id_ejercicio: e.id_ejercicio,
                    nombre: e.nombre,
                    grupo_muscular: e.grupo_muscular,
                    gif: e.gif,
                    series: Number(e.series) || 3,
                    repeticiones: Number(e.repeticiones) || 12,
                    peso: Number(e.peso) || 0
                }))
            );
        } else {
            setRutinaEjercicios([]);
        }

        setTab('crear');
        mostrarToast(`Editando rutina "${rutina.nombre}"`, 'success');
    };

    const cancelarEdicion = () => {
        setRutinaEditandoId(null);
        setFormRutina(FORM_RUTINA_INICIAL);
        setRutinaEjercicios([]);
        setTab('mis-rutinas');
    };

    // Guardar (Crear nueva o Actualizar existente)
    const handleGuardarRutina = async () => {
        if (!formRutina.nombre.trim()) {
            return mostrarToast('El nombre de la rutina es obligatorio', 'error');
        }
        if (rutinaEjercicios.length === 0) {
            return mostrarToast('Agrega al menos un ejercicio del catálogo oficial', 'error');
        }

        setGuardando(true);
        try {
            if (rutinaEditandoId) {
                // Actualización (PUT)
                const res = await updateRutina(rutinaEditandoId, {
                    ...formRutina,
                    ejercicios: rutinaEjercicios
                });
                if (res?.success) {
                    mostrarToast('¡Rutina actualizada correctamente!', 'success');
                    cancelarEdicion();
                    cargarDatos();
                }
            } else {
                // Creación (POST)
                const res = await createRutina({
                    ...formRutina,
                    id_usuario: userId,
                    ejercicios: rutinaEjercicios
                });
                if (res?.success) {
                    mostrarToast('¡Tu rutina personalizada ha sido creada exitosamente!', 'success');
                    setFormRutina(FORM_RUTINA_INICIAL);
                    setRutinaEjercicios([]);
                    setTab('mis-rutinas');
                    cargarDatos();
                }
            }
        } catch (error) {
            mostrarToast(error.message || 'Error al procesar rutina', 'error');
        } finally {
            setGuardando(false);
        }
    };

    // Alternar estado favorito
    const handleToggleFavorita = async (rutina) => {
        const nuevoEstado = rutina.es_favorita === 1 ? 0 : 1;
        try {
            await updateRutina(rutina.id_rutina, { es_favorita: nuevoEstado });
            mostrarToast(nuevoEstado === 1 ? 'Añadida a favoritas ⭐' : 'Removida de favoritas', 'success');
            cargarDatos();
        } catch (error) {
            mostrarToast('Error al actualizar favorita', 'error');
        }
    };

    // Eliminar rutina propia
    const handleEliminarRutina = async (idRutina, nombre) => {
        if (!window.confirm(`¿Seguro que deseas eliminar tu rutina "${nombre}"? Esta acción no se puede deshacer.`)) return;
        try {
            await deleteRutina(idRutina);
            mostrarToast('Rutina eliminada correctamente', 'success');
            if (rutinaEditandoId === idRutina) {
                cancelarEdicion();
            }
            cargarDatos();
        } catch (error) {
            mostrarToast('Error al eliminar rutina', 'error');
        }
    };

    // Rutinas a mostrar en la pestaña "Mis Rutinas / Favoritas"
    const rutinasFiltradas = filtroFavoritas
        ? rutinas.filter(r => r.es_favorita === 1)
        : rutinas;

    const totalFavoritas = rutinas.filter(r => r.es_favorita === 1).length;

    return (
        <div style={{ width: '100%', padding: '16px 14px 100px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <h1 className="admin-titulo" style={{ textAlign: 'center', marginBottom: '18px', fontSize: '24px' }}>
                RUTINAS DE ENTRENAMIENTO
            </h1>

            {/* 2 PESTAÑAS PRINCIPALES DIFERENCIADAS */}
            <div className="tipo-usuario-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
                <button
                    type="button"
                    className={`tipo-usuario-btn ${tab === 'crear' ? 'seleccionado' : ''}`}
                    onClick={() => setTab('crear')}
                    style={{ flex: 1, padding: '12px 8px', fontSize: '14px', fontWeight: '600' }}
                >
                    {rutinaEditandoId ? 'Editar rutina' : 'Crear rutina'}
                </button>
                <button
                    type="button"
                    className={`tipo-usuario-btn ${tab === 'mis-rutinas' ? 'seleccionado' : ''}`}
                    onClick={() => setTab('mis-rutinas')}
                    style={{ flex: 1, padding: '12px 8px', fontSize: '14px', fontWeight: '600' }}
                >
                    Mis rutinas
                </button>
            </div>

            {toast.msg && <div className={`toast ${toast.tipo}`}>{toast.msg}</div>}

            {/* ─── PESTAÑA 1: CREAR / EDITAR RUTINA PERSONALIZADA ────────── */}
            {tab === 'crear' && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        background: '#181528',
                        padding: '22px',
                        borderRadius: '16px',
                        border: '1px solid rgba(138, 43, 226, 0.7)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                        maxWidth: '850px',
                        margin: '0 auto'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '19px', fontWeight: '600' }}>
                                {rutinaEditandoId ? 'Editar Rutina Personalizada' : 'Crear Nueva Rutina'}
                            </h2>
                            <p style={{ color: '#a0a0a0', fontSize: '13px', margin: '4px 0 0 0' }}>
                                {rutinaEditandoId
                                    ? 'Modifica los datos generales y ajusta los ejercicios, series y repeticiones.'
                                    : 'Diseña tu propio plan seleccionando ejercicios oficiales del gimnasio.'}
                            </p>
                        </div>
                        {rutinaEditandoId && (
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={cancelarEdicion}
                                style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                                Cancelar Edición
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--admin-celeste, #00d2ff)' }}>
                            Nombre de la Rutina *
                        </label>
                        <input
                            className="input-modal"
                            placeholder="Ej. Torso Pesado, Tren Inferior Potencia..."
                            value={formRutina.nombre}
                            onChange={e => setFormRutina({ ...formRutina, nombre: e.target.value })}
                            style={{ marginBottom: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--admin-celeste, #00d2ff)' }}>
                            Descripción u Observaciones (opcional)
                        </label>
                        <textarea
                            className="input-modal"
                            placeholder="Notas personales, tiempos de descanso, enfoque del entrenamiento..."
                            value={formRutina.descripcion}
                            onChange={e => setFormRutina({ ...formRutina, descripcion: e.target.value })}
                            style={{ minHeight: '65px', marginBottom: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--admin-celeste, #00d2ff)' }}>
                                Día Asignado en Calendario
                            </label>
                            <select
                                className="input-modal"
                                value={formRutina.dia_asignado || ''}
                                onChange={e => setFormRutina({ ...formRutina, dia_asignado: e.target.value })}
                                style={{ marginBottom: 0 }}
                            >
                                <option value="">Sin día asignado</option>
                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--admin-celeste, #00d2ff)' }}>
                                Favorita
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white', fontSize: '14px' }}>
                                <input
                                    type="checkbox"
                                    checked={formRutina.es_favorita === 1}
                                    onChange={e => setFormRutina({ ...formRutina, es_favorita: e.target.checked ? 1 : 0 })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--admin-violet)' }}
                                />
                                Marcar como favorita ⭐
                            </label>
                        </div>
                    </div>

                    {/* SELECCIONAR EJERCICIO DEL CATÁLOGO */}
                    <div style={{ borderTop: '1px solid rgba(140, 88, 211, 0.3)', paddingTop: '16px', marginTop: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'white', display: 'block', marginBottom: '8px' }}>
                            Añadir Ejercicio desde el Catálogo Oficial:
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select
                                className="input-modal"
                                value={ejercicioSeleccionadoId}
                                onChange={e => setEjercicioSeleccionadoId(e.target.value)}
                                style={{ flex: 1, marginBottom: 0 }}
                            >
                                <option value="">Selecciona un ejercicio ({ejercicios.length} disponibles)...</option>
                                {ejercicios.map(e => (
                                    <option key={e.id_ejercicio} value={e.id_ejercicio}>
                                        {e.nombre} ({e.grupo_muscular || 'Gral'})
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={agregarEjercicioARutina}
                                style={{ padding: '0 20px', minHeight: '48px', borderRadius: '9px', fontWeight: 'bold' }}
                                title="Agregar a la rutina"
                            >
                                + Agregar
                            </button>
                        </div>
                    </div>

                    {/* LISTA DE EJERCICIOS CONFIGURADOS EN LA RUTINA */}
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--admin-celeste, #00d2ff)', marginBottom: '10px' }}>
                            Ejercicios incluidos ({rutinaEjercicios.length}):
                        </div>

                        {rutinaEjercicios.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {rutinaEjercicios.map((e, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            border: '1px solid rgba(0, 210, 255, 0.4)',
                                            background: 'rgba(20, 14, 55, 0.85)',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            gap: '14px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {e.gif ? (
                                            <img
                                                src={e.gif}
                                                alt={e.nombre}
                                                style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                                onError={(ev) => { ev.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#888', flexShrink: 0 }}>
                                                Sin GIF
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h5 style={{ margin: 0, color: 'white', fontSize: '15px' }}>{e.nombre}</h5>
                                                <button
                                                    type="button"
                                                    onClick={() => removerEjercicioRutina(index)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ffb2b4', cursor: 'pointer', fontSize: '18px' }}
                                                    title="Quitar ejercicio"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Series</label>
                                                    <input
                                                        type="number"
                                                        className="input-modal"
                                                        style={{ minHeight: '34px', padding: '4px 8px', marginBottom: 0 }}
                                                        value={e.series}
                                                        onChange={ev => updateEjercicioRutina(index, 'series', ev.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Reps</label>
                                                    <input
                                                        type="number"
                                                        className="input-modal"
                                                        style={{ minHeight: '34px', padding: '4px 8px', marginBottom: 0 }}
                                                        value={e.repeticiones}
                                                        onChange={ev => updateEjercicioRutina(index, 'repeticiones', ev.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Peso (kg)</label>
                                                    <input
                                                        type="number"
                                                        className="input-modal"
                                                        style={{ minHeight: '34px', padding: '4px 8px', marginBottom: 0 }}
                                                        value={e.peso}
                                                        onChange={ev => updateEjercicioRutina(index, 'peso', ev.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', fontSize: '13px', fontStyle: 'italic', margin: '4px 0' }}>
                                Aún no has agregado ejercicios a esta rutina. Usa el selector arriba.
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        className="btn-neon-grad"
                        onClick={handleGuardarRutina}
                        disabled={guardando}
                        style={{ width: '100%', marginTop: '16px', height: '48px', fontSize: '15px' }}
                    >
                        {guardando
                            ? 'GUARDANDO...'
                            : (rutinaEditandoId ? 'ACTUALIZAR RUTINA PERSONALIZADA' : 'GUARDAR RUTINA PERSONALIZADA')}
                    </button>
                </div>
            )}

            {/* ─── PESTAÑA 2: MIS RUTINAS / FAVORITAS (SOLO CREADAS POR EL ATLETA) ── */}
            {tab === 'mis-rutinas' && (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {/* BARRA DE FILTRO: TODAS vs SOLO FAVORITAS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                className={`tipo-usuario-btn ${!filtroFavoritas ? 'seleccionado' : ''}`}
                                onClick={() => setFiltroFavoritas(false)}
                                style={{ padding: '7px 14px', fontSize: '13px', minWidth: 'auto' }}
                            >
                                Todas mis rutinas
                            </button>
                            <button
                                type="button"
                                className={`tipo-usuario-btn ${filtroFavoritas ? 'seleccionado' : ''}`}
                                onClick={() => setFiltroFavoritas(true)}
                                style={{ padding: '7px 14px', fontSize: '13px', minWidth: 'auto' }}
                            >
                                Favoritas
                            </button>
                        </div>

                        <button
                            type="button"
                            className="btn-guardar"
                            onClick={() => {
                                setRutinaEditandoId(null);
                                setFormRutina(FORM_RUTINA_INICIAL);
                                setRutinaEjercicios([]);
                                setTab('crear');
                            }}
                            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
                        >
                            + Nueva Rutina
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner" />
                            <p>Cargando tus rutinas personalizadas...</p>
                        </div>
                    ) : rutinasFiltradas.length > 0 ? (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {rutinasFiltradas.map(r => (
                                <div
                                    key={r.id_rutina}
                                    style={{
                                        border: r.es_favorita === 1 ? '1px solid #c307cd' : '1px solid rgba(0, 210, 255, 0.4)',
                                        background: '#181528',
                                        padding: '18px',
                                        borderRadius: '14px',
                                        color: 'white',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>{r.nombre}</h3>
                                                {r.es_favorita === 1 && (
                                                    <span style={{ fontSize: '14px' }} title="Rutina favorita">⭐</span>
                                                )}
                                                {r.dia_asignado && (
                                                    <span className="badge-estado activo" style={{ fontSize: '11px', padding: '2px 8px' }}>
                                                        Día: {r.dia_asignado}
                                                    </span>
                                                )}
                                            </div>
                                            {r.descripcion && (
                                                <p style={{ margin: '8px 0 0 0', color: '#a0a0a0', fontSize: '13px' }}>
                                                    {r.descripcion}
                                                </p>
                                            )}
                                        </div>

                                        {/* ACCIONES CRUD: FAVORITA, EDITAR, ELIMINAR */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleFavorita(r)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    fontSize: '18px',
                                                    cursor: 'pointer',
                                                    opacity: r.es_favorita === 1 ? 1 : 0.4
                                                }}
                                                title={r.es_favorita === 1 ? 'Quitar de favoritas' : 'Marcar favorita'}
                                            >
                                                ⭐
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => iniciarEdicion(r)}
                                                style={{
                                                    background: 'rgba(0, 210, 255, 0.15)',
                                                    border: '1px solid #00d2ff',
                                                    color: '#00d2ff',
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                                title="Editar rutina"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEliminarRutina(r.id_rutina, r.nombre)}
                                                style={{
                                                    background: 'rgba(255, 178, 180, 0.15)',
                                                    border: '1px solid #a10d10',
                                                    color: '#ffb2b4',
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                                title="Eliminar rutina"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </div>

                                    {/* LISTA DE EJERCICIOS DE LA RUTINA */}
                                    <div style={{
                                        background: 'rgba(15, 12, 27, 0.8)',
                                        borderRadius: '10px',
                                        padding: '12px',
                                        marginTop: '14px',
                                        border: '1px solid rgba(140, 88, 211, 0.25)'
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--admin-celeste, #00d2ff)', marginBottom: '8px' }}>
                                            Ejercicios incluidos ({r.ejercicios?.length || 0}):
                                        </div>
                                        {r.ejercicios && r.ejercicios.length > 0 ? (
                                            <div style={{ display: 'grid', gap: '8px' }}>
                                                {r.ejercicios.map((ej, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#d8ecf8', borderBottom: idx === r.ejercicios.length - 1 ? 'none' : '1px dashed rgba(140,88,211,0.2)', paddingBottom: '4px' }}>
                                                        <span>• <b>{ej.nombre}</b> <span style={{ color: '#888', fontSize: '11px' }}>({ej.grupo_muscular || 'Gral'})</span></span>
                                                        <span style={{ color: '#00d2ff', fontWeight: '600' }}>
                                                            {ej.series} series × {ej.repeticiones} reps {Number(ej.peso) > 0 ? `| ${ej.peso} kg` : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#7f7f7f' }}>Sin ejercicios configurados</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="usuarios-vacio">
                            <div className="usuarios-vacio-icon">📋</div>
                            <p>
                                {filtroFavoritas
                                    ? 'No tienes ninguna rutina marcada como favorita aún.'
                                    : 'Aún no has creado ninguna rutina personalizada.'}
                            </p>
                            <button
                                type="button"
                                className="btn-neon-grad"
                                onClick={() => setTab('crear')}
                                style={{ marginTop: '16px' }}
                            >
                                + Crear Mi Primera Rutina
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default RutinasView;
