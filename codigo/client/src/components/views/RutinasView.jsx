import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Heart,
    Copy,
    Plus,
    Trash2,
    Pencil,
    Search,
    Dumbbell,
    Calendar,
    ArrowLeft,
    Check,
    X,
    Filter,
    Sparkles
} from 'lucide-react';
import {
    getRutinas,
    createRutina,
    updateRutina,
    deleteRutina,
    getEjercicios
} from '../../services/api';
import { getCurrentUser } from '../../features/authService';
import ModalAlerta from '../ModalAlerta';
import '../../styles/rutinasView.css';

const FORM_RUTINA_INICIAL = {
    nombre: '',
    descripcion: '',
    dia_asignado: '',
    es_favorita: 0
};

const CATEGORIAS_FILTRO = [
    'Todas',
    'Pierna / Glúteo',
    'Pecho',
    'Espalda / Hombros',
    'Brazos',
    'Core / Abdomen'
];

const formatearGrupoMuscular = (grupo) => {
    if (!grupo) return 'General';
    const g = String(grupo).trim();
    if (['pierna', 'piernas'].includes(g.toLowerCase())) {
        return 'Pierna / Glúteo';
    }
    return g;
};

function RutinasView() {
    const user = getCurrentUser();
    const userId = user?.id ?? user?.id_usuario;

    // Pestaña principal: 'disponibles' (Rutinas Disponibles / Predefinidas) | 'mis-rutinas' (Mis Rutinas)
    const [activeTab, setActiveTab] = useState('disponibles');

    // Filtro por Chips / Tags horizontales
    const [categoriaActiva, setCategoriaActiva] = useState('Todas');
    const [filtroFavoritas, setFiltroFavoritas] = useState(false);

    // Listas de datos
    const [rutinasDisponibles, setRutinasDisponibles] = useState([]);
    const [misRutinas, setMisRutinas] = useState([]);
    const [ejerciciosCatalogo, setEjerciciosCatalogo] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para modo Borrador (Crear / Editar Rutina)
    const [modoBorrador, setModoBorrador] = useState(false);
    const [rutinaEditandoId, setRutinaEditandoId] = useState(null);
    const [formRutina, setFormRutina] = useState(FORM_RUTINA_INICIAL);
    const [draftEjercicios, setDraftEjercicios] = useState([]);
    const [guardando, setGuardando] = useState(false);

    // Búsqueda y filtro dentro del catálogo de ejercicios en el borrador
    const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
    const [categoriaCatalogo, setCategoriaCatalogo] = useState('Todas');

    // Toast de notificación unificado
    const [toast, setToast] = useState({ msg: '', tipo: 'success' });
    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3200);
    };

    // Modal Popup de validación y errores (estilo neón oscuro)
    const [alertaModal, setAlertaModal] = useState({ isOpen: false, titulo: '', mensaje: '' });
    const mostrarModalError = (mensaje, titulo = 'Acción no permitida') => {
        setAlertaModal({ isOpen: true, titulo, mensaje });
    };

    // ─── Carga de datos ──────────────────────────────────────────────────────────
    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            const [resPrearmadas, resUsuario, resEjercicios] = await Promise.all([
                getRutinas('', true), // prearmadas = true (id_usuario IS NULL)
                getRutinas(userId || '', false, true), // solo_usuario = true
                getEjercicios()
            ]);

            if (resPrearmadas?.success && Array.isArray(resPrearmadas.data)) {
                setRutinasDisponibles(resPrearmadas.data);
            }
            if (resUsuario?.success && Array.isArray(resUsuario.data)) {
                const soloPropias = resUsuario.data.filter(
                    r => r.id_usuario != null && Number(r.id_usuario) === Number(userId)
                );
                setMisRutinas(soloPropias);
            }
            if (resEjercicios?.success && Array.isArray(resEjercicios.data)) {
                setEjerciciosCatalogo(resEjercicios.data);
            }
        } catch (error) {
            console.error('Error al cargar datos de rutinas:', error);
            mostrarToast('Error al cargar las rutinas del sistema', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // ─── Lógica de filtrado por categoría (Rutinas) ──────────────────────────────
    const coincideCategoria = (rutina, categoria) => {
        if (categoria === 'Todas') return true;
        const norm = categoria.toLowerCase();
        const nombreRut = (rutina.nombre || '').toLowerCase();
        const descRut = (rutina.descripcion || '').toLowerCase();

        if (norm.includes('pierna') && (nombreRut.includes('pierna') || descRut.includes('pierna'))) return true;
        if (norm.includes('pecho') && (nombreRut.includes('pecho') || descRut.includes('pecho'))) return true;
        if (norm.includes('espalda') && (nombreRut.includes('espalda') || nombreRut.includes('hombro') || descRut.includes('espalda') || descRut.includes('hombro'))) return true;
        if (norm.includes('brazo') && (nombreRut.includes('brazo') || nombreRut.includes('bicep') || nombreRut.includes('tricep'))) return true;
        if (norm.includes('core') && (nombreRut.includes('core') || nombreRut.includes('abdomen') || nombreRut.includes('abs'))) return true;

        if (Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0) {
            return rutina.ejercicios.some(ej => {
                const gm = (ej.grupo_muscular || '').toLowerCase();
                const nm = (ej.nombre || '').toLowerCase();
                if (norm.includes('pierna')) return gm.includes('pierna') || gm.includes('cuadricep') || gm.includes('gluteo') || nm.includes('sentadilla') || nm.includes('prensa') || nm.includes('estocada');
                if (norm.includes('pecho')) return gm.includes('pecho') || nm.includes('press') || nm.includes('pecho');
                if (norm.includes('espalda') && norm.includes('hombro')) return gm.includes('espalda') || gm.includes('hombro') || nm.includes('remo') || nm.includes('jalon') || nm.includes('dominada') || nm.includes('elevaciones');
                if (norm.includes('brazo')) return gm.includes('brazo') || gm.includes('bicep') || gm.includes('tricep');
                if (norm.includes('core')) return gm.includes('abdomen') || gm.includes('core') || nm.includes('plank');
                return gm.includes(norm);
            });
        }
        return false;
    };

    const rutinasMostradas = useMemo(() => {
        let lista = activeTab === 'disponibles' ? rutinasDisponibles : misRutinas;

        if (activeTab === 'mis-rutinas' && filtroFavoritas) {
            lista = lista.filter(r => r.es_favorita === 1);
        }

        if (categoriaActiva !== 'Todas') {
            lista = lista.filter(r => coincideCategoria(r, categoriaActiva));
        }

        return lista;
    }, [activeTab, rutinasDisponibles, misRutinas, filtroFavoritas, categoriaActiva]);

    // ─── Acciones sobre Rutinas ──────────────────────────────────────────────────
    const handleToggleFavorita = async (rutina) => {
        const nuevoEstado = rutina.es_favorita === 1 ? 0 : 1;
        try {
            await updateRutina(rutina.id_rutina, { es_favorita: nuevoEstado });
            mostrarToast(nuevoEstado === 1 ? 'Añadida a favoritas' : 'Removida de favoritas', 'success');
            cargarDatos();
        } catch (error) {
            mostrarToast('Error al actualizar favorita', 'error');
        }
    };

    const handleCopiarAMisRutinas = async (rutina) => {
        try {
            const ejerciciosPayload = (rutina.ejercicios || []).map(e => ({
                id_ejercicio: e.id_ejercicio,
                series: Number(e.series) || 4,
                repeticiones: Number(e.repeticiones) || 12,
                peso: Number(e.peso) || 0
            }));

            const res = await createRutina({
                nombre: `${rutina.nombre} (Copia)`,
                descripcion: rutina.descripcion || '',
                id_usuario: userId,
                es_favorita: 0,
                dia_asignado: rutina.dia_asignado || '',
                ejercicios: ejerciciosPayload
            });

            if (res?.success) {
                mostrarToast(`¡"${rutina.nombre}" copiada a Mis Rutinas!`, 'success');
                cargarDatos();
                setActiveTab('mis-rutinas');
            }
        } catch (error) {
            console.error('Error al copiar rutina:', error);
            mostrarToast('No se pudo copiar la rutina', 'error');
        }
    };

    const handleEliminarRutina = async (idRutina, nombre) => {
        if (!window.confirm(`¿Deseas eliminar la rutina "${nombre}"? Esta acción no se puede deshacer.`)) return;
        try {
            await deleteRutina(idRutina);
            mostrarToast('Rutina eliminada correctamente', 'success');
            cargarDatos();
        } catch (error) {
            mostrarToast('Error al eliminar rutina', 'error');
        }
    };

    // ─── Flujo de Creación / Edición (Borrador) ──────────────────────────────────
    const iniciarCreacion = () => {
        setRutinaEditandoId(null);
        setFormRutina(FORM_RUTINA_INICIAL);
        setDraftEjercicios([]);
        setModoBorrador(true);
    };

    const iniciarEdicion = (rutina) => {
        setRutinaEditandoId(rutina.id_rutina);
        setFormRutina({
            nombre: rutina.nombre || '',
            descripcion: rutina.descripcion || '',
            dia_asignado: rutina.dia_asignado || '',
            es_favorita: rutina.es_favorita ? 1 : 0
        });

        if (Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0) {
            setDraftEjercicios(
                rutina.ejercicios.map(e => ({
                    id_ejercicio: e.id_ejercicio,
                    nombre: e.nombre,
                    grupo_muscular: e.grupo_muscular,
                    gif: e.gif,
                    series: Number(e.series) || 4,
                    repeticiones: Number(e.repeticiones) || 12,
                    peso: Number(e.peso) || 0
                }))
            );
        } else {
            setDraftEjercicios([]);
        }

        setModoBorrador(true);
    };

    const cancelarBorrador = () => {
        setModoBorrador(false);
        setRutinaEditandoId(null);
        setFormRutina(FORM_RUTINA_INICIAL);
        setDraftEjercicios([]);
    };

    const handleAgregarEjercicioAlBorrador = (ejercicio) => {
        const existe = draftEjercicios.some(e => e.id_ejercicio === ejercicio.id_ejercicio);
        if (existe) {
            return mostrarToast(`"${ejercicio.nombre}" ya está en la lista`, 'error');
        }

        setDraftEjercicios(prev => [
            ...prev,
            {
                id_ejercicio: ejercicio.id_ejercicio,
                nombre: ejercicio.nombre,
                grupo_muscular: ejercicio.grupo_muscular,
                gif: ejercicio.gif,
                series: 4,
                repeticiones: 12,
                peso: 0
            }
        ]);

        mostrarToast(`"${ejercicio.nombre}" añadido al borrador`, 'success');
    };

    const handleUpdateMetricaInline = (index, campo, valor) => {
        if (valor === '') {
            setDraftEjercicios(prev => {
                const copia = [...prev];
                copia[index][campo] = '';
                return copia;
            });
            return;
        }

        const numVal = Number(valor);

        if (isNaN(numVal) || numVal < 0) {
            mostrarModalError('Acción no permitida: el valor ingresado es inválido. Ingrese un valor numérico mayor o igual a 0.');
            return;
        }

        if (campo === 'series') {
            if (numVal < 1 || numVal > 5) {
                mostrarModalError('Acción no permitida: el valor ingresado es inválido. Las series deben estar estrictamente entre 1 y 5.');
                return;
            }
        }

        if (campo === 'repeticiones') {
            if (numVal < 1 || numVal > 15) {
                mostrarModalError('Acción no permitida: el valor ingresado es inválido. Las repeticiones deben estar estrictamente entre 1 y 15.');
                return;
            }
        }

        if (campo === 'peso' && numVal > 350) {
            mostrarModalError('Acción no permitida: el valor ingresado es inválido. El peso máximo permitido es de 350 kg.');
            return;
        }

        setDraftEjercicios(prev => {
            const copia = [...prev];
            copia[index][campo] = valor;
            return copia;
        });
    };

    const handleRemoverEjercicioBorrador = (index) => {
        setDraftEjercicios(prev => prev.filter((_, i) => i !== index));
    };

    const handleGuardarRutina = async () => {
        if (!formRutina.nombre.trim()) {
            return mostrarModalError('Acción no permitida: ingresa un nombre para la rutina.', 'Campo requerido');
        }
        if (draftEjercicios.length === 0) {
            return mostrarModalError('Acción no permitida: agrega al menos un ejercicio a la rutina.', 'Ejercicios requeridos');
        }

        const tieneMetricaInvalida = draftEjercicios.some(e => {
            const p = Number(e.peso);
            const s = Number(e.series);
            const r = Number(e.repeticiones);
            return isNaN(p) || p < 0 || p > 350 || isNaN(s) || s < 1 || s > 5 || isNaN(r) || r < 1 || r > 15;
        });

        if (tieneMetricaInvalida) {
            mostrarModalError('Acción no permitida: el valor ingresado es inválido. Verifique que los valores cumplan: Series (1-5), Repeticiones (1-15) y Peso (0-350 kg).');
            return;
        }

        setGuardando(true);
        try {
            const ejerciciosPayload = draftEjercicios.map(e => ({
                id_ejercicio: e.id_ejercicio,
                series: Math.max(1, Math.min(5, Number(e.series) || 1)),
                repeticiones: Math.max(1, Math.min(15, Number(e.repeticiones) || 1)),
                peso: Math.max(0, Math.min(350, Number(e.peso) || 0))
            }));

            if (rutinaEditandoId) {
                const res = await updateRutina(rutinaEditandoId, {
                    ...formRutina,
                    ejercicios: ejerciciosPayload
                });
                if (res?.success) {
                    mostrarToast('Rutina actualizada exitosamente', 'success');
                    cancelarBorrador();
                    cargarDatos();
                }
            } else {
                const res = await createRutina({
                    ...formRutina,
                    id_usuario: userId,
                    ejercicios: ejerciciosPayload
                });
                if (res?.success) {
                    mostrarToast('¡Rutina creada con éxito!', 'success');
                    cancelarBorrador();
                    setActiveTab('mis-rutinas');
                    cargarDatos();
                }
            }
        } catch (error) {
            mostrarModalError(error?.response?.data?.error || error?.response?.data?.message || error.message || 'Error al guardar la rutina');
        } finally {
            setGuardando(false);
        }
    };

    const ejerciciosCatalogoFiltrados = useMemo(() => {
        return ejerciciosCatalogo.filter(ej => {
            const coincideTexto = busquedaCatalogo === '' ||
                (ej.nombre || '').toLowerCase().includes(busquedaCatalogo.toLowerCase()) ||
                (ej.grupo_muscular || '').toLowerCase().includes(busquedaCatalogo.toLowerCase());

            const grupo = (ej.grupo_muscular || '').toLowerCase();
            const cat = categoriaCatalogo.toLowerCase();

            let coincideGrupo = false;
            if (cat === 'todas') {
                coincideGrupo = true;
            } else if (cat.includes('espalda') && cat.includes('hombros')) {
                coincideGrupo = grupo.includes('espalda') || grupo.includes('hombro');
            } else if (cat.includes('pierna') || cat.includes('gluteo') || cat.includes('glúteo')) {
                coincideGrupo = grupo.includes('pierna') || grupo.includes('cuadricep') || grupo.includes('gluteo') || grupo.includes('glúteo') || grupo.includes('femoral') || grupo.includes('pantorrilla');
            } else if (cat.includes('pecho')) {
                coincideGrupo = grupo.includes('pecho');
            } else if (cat.includes('brazos')) {
                coincideGrupo = grupo.includes('brazo') || grupo.includes('bicep') || grupo.includes('tricep');
            } else if (cat.includes('core')) {
                coincideGrupo = grupo.includes('core') || grupo.includes('abdomen');
            } else {
                coincideGrupo = grupo.includes(cat);
            }

            return coincideTexto && coincideGrupo;
        });
    }, [ejerciciosCatalogo, busquedaCatalogo, categoriaCatalogo]);

    return (
        <div className="rutinas-container">
            <h1 className="rutinas-header-title">
                {modoBorrador
                    ? (rutinaEditandoId ? 'Editar Rutina' : 'Nueva Rutina')
                    : 'Rutinas de Entrenamiento'}
            </h1>

            {toast.msg && (
                <div className={`rutinas-toast ${toast.tipo}`}>
                    {toast.tipo === 'success' ? <Check size={16} /> : <X size={16} />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {!modoBorrador ? (
                <>
                    <div className="rutinas-nav-tabs">
                        <button
                            type="button"
                            className={`rutinas-nav-tab-btn ${activeTab === 'disponibles' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('disponibles');
                                setCategoriaActiva('Todas');
                            }}
                        >
                            <Sparkles size={16} />
                            Rutinas Disponibles
                        </button>
                        <button
                            type="button"
                            className={`rutinas-nav-tab-btn ${activeTab === 'mis-rutinas' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('mis-rutinas');
                                setCategoriaActiva('Todas');
                            }}
                        >
                            <Dumbbell size={16} />
                            Mis Rutinas
                        </button>
                    </div>

                    <div className="rutinas-chips-bar">
                        {CATEGORIAS_FILTRO.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                className={`rutinas-chip-btn ${categoriaActiva === cat ? 'active' : ''}`}
                                onClick={() => setCategoriaActiva(cat)}
                            >
                                <Filter size={13} />
                                {cat}
                            </button>
                        ))}

                        {activeTab === 'mis-rutinas' && (
                            <button
                                type="button"
                                className={`rutinas-chip-btn chip-favoritas ${filtroFavoritas ? 'active' : ''}`}
                                onClick={() => setFiltroFavoritas(!filtroFavoritas)}
                            >
                                <Heart size={13} fill={filtroFavoritas ? 'currentColor' : 'none'} />
                                Favoritas
                            </button>
                        )}
                    </div>

                    <div className="rutinas-sub-action-bar">
                        <span style={{ fontSize: '13px', color: 'var(--rut-text-muted)' }}>
                            Mostrando {rutinasMostradas.length} {rutinasMostradas.length === 1 ? 'rutina' : 'rutinas'}
                        </span>
                        {activeTab === 'mis-rutinas' && (
                            <button
                                type="button"
                                className="btn-crear-rutina-cta"
                                onClick={iniciarCreacion}
                            >
                                <Plus size={16} />
                                Crear Rutina
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="rutinas-empty-state">
                            <Dumbbell size={36} className="rutinas-empty-icon" />
                            <p className="rutinas-empty-text">Cargando rutinas de entrenamiento...</p>
                        </div>
                    ) : rutinasMostradas.length > 0 ? (
                        <div className="rutinas-list-grid">
                            {rutinasMostradas.map(rutina => (
                                <article
                                    key={rutina.id_rutina}
                                    className={`rutina-direct-card ${rutina.es_favorita === 1 ? 'favorita' : ''}`}
                                >
                                    <div className="rutina-card-top">
                                        <div className="rutina-card-meta">
                                            <div className="rutina-card-title-row">
                                                <h3 className="rutina-card-title">{rutina.nombre}</h3>
                                                {rutina.dia_asignado && (
                                                    <span className="rutina-card-badge badge-dia">
                                                        <Calendar size={11} />
                                                        {rutina.dia_asignado}
                                                    </span>
                                                )}
                                                {rutina.id_usuario == null && (
                                                    <span className="rutina-card-badge badge-prearmada">
                                                        Oficial
                                                    </span>
                                                )}
                                            </div>
                                            {rutina.descripcion && (
                                                <p className="rutina-card-desc">{rutina.descripcion}</p>
                                            )}
                                        </div>

                                        <div className="rutina-card-actions-top">
                                            {activeTab === 'disponibles' ? (
                                                <button
                                                    type="button"
                                                    className="rutina-action-icon-btn btn-copiar"
                                                    onClick={() => handleCopiarAMisRutinas(rutina)}
                                                    title="Copiar y guardar en Mis Rutinas"
                                                    aria-label="Copiar rutina"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className={`rutina-action-icon-btn btn-fav ${rutina.es_favorita === 1 ? 'active' : ''}`}
                                                        onClick={() => handleToggleFavorita(rutina)}
                                                        title="Favorito"
                                                        aria-label="Favorito"
                                                    >
                                                        <Heart
                                                            size={16}
                                                            fill={rutina.es_favorita === 1 ? 'currentColor' : 'none'}
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rutina-action-icon-btn btn-editar"
                                                        onClick={() => iniciarEdicion(rutina)}
                                                        title="Editar rutina"
                                                        aria-label="Editar rutina"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rutina-action-icon-btn btn-eliminar"
                                                        onClick={() => handleEliminarRutina(rutina.id_rutina, rutina.nombre)}
                                                        title="Eliminar rutina"
                                                        aria-label="Eliminar rutina"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rutina-ejercicios-container">
                                        {Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0 ? (
                                            rutina.ejercicios.map((ej, index) => (
                                                <div key={index} className="rutina-ejercicio-direct-row">
                                                    <div className="rutina-ejercicio-left">
                                                        <span className="rutina-ejercicio-num">{index + 1}.</span>
                                                        <div className="rutina-ejercicio-thumb-box">
                                                            {ej.gif ? (
                                                                <img
                                                                    src={ej.gif}
                                                                    alt={ej.nombre}
                                                                    className="rutina-ejercicio-gif-img"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        if (e.currentTarget.nextSibling) {
                                                                            e.currentTarget.nextSibling.style.display = 'flex';
                                                                        }
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className="rutina-ejercicio-thumb-placeholder"
                                                                style={{ display: ej.gif ? 'none' : 'flex' }}
                                                            >
                                                                <Dumbbell size={18} />
                                                            </div>
                                                        </div>
                                                        <div className="rutina-ejercicio-details">
                                                            <span className="rutina-ejercicio-name">{ej.nombre}</span>
                                                            <span className="rutina-ejercicio-musculo">
                                                                {formatearGrupoMuscular(ej.grupo_muscular)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="rutina-ejercicio-metrics-pill">
                                                        <span>{ej.series} series × {ej.repeticiones} reps</span>
                                                        {Number(ej.peso) > 0 && (
                                                            <span className="rutina-ejercicio-peso-badge">
                                                                {ej.peso} kg
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ margin: '6px 0', fontSize: '12px', color: 'var(--rut-text-muted)' }}>
                                                Sin ejercicios configurados en esta rutina.
                                            </p>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rutinas-empty-state">
                            <Dumbbell size={40} className="rutinas-empty-icon" />
                            <p className="rutinas-empty-text">
                                {activeTab === 'disponibles'
                                    ? 'No se encontraron rutinas predefinidas con el filtro seleccionado.'
                                    : (filtroFavoritas
                                        ? 'No tienes ninguna rutina marcada como favorita.'
                                        : 'Aún no has creado ninguna rutina personalizada.')}
                            </p>
                            {activeTab === 'mis-rutinas' && !filtroFavoritas && (
                                <button
                                    type="button"
                                    className="btn-crear-rutina-cta"
                                    onClick={iniciarCreacion}
                                    style={{ marginTop: '8px' }}
                                >
                                    <Plus size={16} />
                                    Crear Mi Primera Rutina
                                </button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="rutina-draft-panel">
                    <div className="rutina-draft-header">
                        <div>
                            <h2 className="rutina-draft-title">
                                {rutinaEditandoId ? 'Editar Rutina' : 'Crear Nueva Rutina'}
                            </h2>
                            <p className="rutina-draft-subtitle">
                                Agrega ejercicios del catálogo y ajusta series, repeticiones y peso directamente.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="rutina-action-icon-btn"
                            onClick={cancelarBorrador}
                            title="Volver"
                        >
                            <ArrowLeft size={16} />
                        </button>
                    </div>

                    <div className="rutina-form-group">
                        <label className="rutina-form-label">Nombre de la Rutina *</label>
                        <input
                            type="text"
                            className="rutina-input-text"
                            placeholder="Ej. Piernas Potencia, Torso Fuerza..."
                            value={formRutina.nombre}
                            onChange={e => setFormRutina({ ...formRutina, nombre: e.target.value })}
                        />
                    </div>

                    <div className="rutina-form-grid-2">
                        <div className="rutina-form-group">
                            <label className="rutina-form-label">Día Asignado (opcional)</label>
                            <select
                                className="rutina-select"
                                value={formRutina.dia_asignado || ''}
                                onChange={e => setFormRutina({ ...formRutina, dia_asignado: e.target.value })}
                            >
                                <option value="">Sin día asignado</option>
                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className="rutina-form-group" style={{ justifyContent: 'center' }}>
                            <label className="rutina-form-label">Favorita</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', marginTop: '6px' }}>
                                <input
                                    type="checkbox"
                                    checked={formRutina.es_favorita === 1}
                                    onChange={e => setFormRutina({ ...formRutina, es_favorita: e.target.checked ? 1 : 0 })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--rut-neon-purple)' }}
                                />
                                Marcar como favorita
                            </label>
                        </div>
                    </div>

                    <div className="rutina-form-group">
                        <label className="rutina-form-label">Descripción u Observaciones (opcional)</label>
                        <input
                            type="text"
                            className="rutina-input-text"
                            placeholder="Tiempos de descanso, enfoque del entrenamiento..."
                            value={formRutina.descripcion || ''}
                            onChange={e => setFormRutina({ ...formRutina, descripcion: e.target.value })}
                        />
                    </div>

                    <div className="rutina-draft-section-title">
                        <Dumbbell size={16} />
                        Ejercicios en la Rutina ({draftEjercicios.length})
                    </div>

                    {draftEjercicios.length > 0 ? (
                        <div className="rutina-draft-ejercicios-list">
                            {draftEjercicios.map((item, index) => (
                                <div key={index} className="rutina-draft-item-card">
                                    <div className="rutina-draft-item-info">
                                        <div className="rutina-ejercicio-thumb-box">
                                            {item.gif ? (
                                                <img
                                                    src={item.gif}
                                                    alt={item.nombre}
                                                    className="rutina-ejercicio-gif-img"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        if (e.currentTarget.nextSibling) {
                                                            e.currentTarget.nextSibling.style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="rutina-ejercicio-thumb-placeholder"
                                                style={{ display: item.gif ? 'none' : 'flex' }}
                                            >
                                                <Dumbbell size={18} />
                                            </div>
                                        </div>

                                        <div className="rutina-ejercicio-details">
                                            <span className="rutina-ejercicio-name">{item.nombre}</span>
                                            <span className="rutina-ejercicio-musculo">
                                                {formatearGrupoMuscular(item.grupo_muscular)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rutina-draft-inline-metrics">
                                        <div className="rutina-inline-metric-box">
                                            <span className="rutina-inline-metric-label">Series (1-5)</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                className="rutina-inline-metric-input"
                                                value={item.series}
                                                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                onChange={e => handleUpdateMetricaInline(index, 'series', e.target.value)}
                                            />
                                        </div>
                                        <div className="rutina-inline-metric-box">
                                            <span className="rutina-inline-metric-label">Reps (1-15)</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="15"
                                                className="rutina-inline-metric-input"
                                                value={item.repeticiones}
                                                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                onChange={e => handleUpdateMetricaInline(index, 'repeticiones', e.target.value)}
                                            />
                                        </div>
                                        <div className="rutina-inline-metric-box">
                                            <span className="rutina-inline-metric-label">Peso (kg)</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="350"
                                                step="0.5"
                                                className="rutina-inline-metric-input"
                                                value={item.peso}
                                                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                onChange={e => handleUpdateMetricaInline(index, 'peso', e.target.value)}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="rutina-draft-delete-btn"
                                            onClick={() => handleRemoverEjercicioBorrador(index)}
                                            title="Quitar ejercicio"
                                            aria-label="Quitar ejercicio"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '13px', color: 'var(--rut-text-muted)', fontStyle: 'italic', margin: '4px 0' }}>
                            Aún no has agregado ejercicios a esta rutina. Selecciona de la lista de disponibles abajo.
                        </p>
                    )}

                    <div className="rutina-catalogo-container">
                        <div className="rutina-draft-section-title" style={{ marginBottom: '10px' }}>
                            <Search size={15} />
                            Ejercicios Disponibles del Catálogo ({ejerciciosCatalogoFiltrados.length})
                        </div>

                        <div className="rutina-catalogo-search-box">
                            <Search size={16} color="var(--rut-text-muted)" />
                            <input
                                type="text"
                                className="rutina-catalogo-search-input"
                                placeholder="Buscar por nombre o músculo..."
                                value={busquedaCatalogo}
                                onChange={e => setBusquedaCatalogo(e.target.value)}
                            />
                            {busquedaCatalogo && (
                                <button
                                    type="button"
                                    onClick={() => setBusquedaCatalogo('')}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--rut-text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="rutinas-chips-bar" style={{ padding: '0 0 10px' }}>
                            {CATEGORIAS_FILTRO.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`rutinas-chip-btn ${categoriaCatalogo === cat ? 'active' : ''}`}
                                    onClick={() => setCategoriaCatalogo(cat)}
                                    style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="rutina-catalogo-grid">
                            {ejerciciosCatalogoFiltrados.map(ej => {
                                const yaAgregado = draftEjercicios.some(e => e.id_ejercicio === ej.id_ejercicio);
                                return (
                                    <div key={ej.id_ejercicio} className="rutina-catalogo-item">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                            <div className="rutina-ejercicio-thumb-box" style={{ width: '40px', height: '40px' }}>
                                                {ej.gif ? (
                                                    <img
                                                        src={ej.gif}
                                                        alt={ej.nombre}
                                                        className="rutina-ejercicio-gif-img"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            if (e.currentTarget.nextSibling) {
                                                                e.currentTarget.nextSibling.style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="rutina-ejercicio-thumb-placeholder"
                                                    style={{ display: ej.gif ? 'none' : 'flex' }}
                                                >
                                                    <Dumbbell size={16} />
                                                </div>
                                            </div>

                                            <div className="rutina-ejercicio-details">
                                                <span className="rutina-ejercicio-name" style={{ fontSize: '13px' }}>
                                                    {ej.nombre}
                                                </span>
                                                <span className="rutina-ejercicio-musculo" style={{ fontSize: '11px' }}>
                                                    {formatearGrupoMuscular(ej.grupo_muscular)}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={`btn-catalogo-agregar ${yaAgregado ? 'agregado' : ''}`}
                                            onClick={() => handleAgregarEjercicioAlBorrador(ej)}
                                            disabled={yaAgregado}
                                            title={yaAgregado ? 'Ya incluido en el borrador' : 'Agregar al borrador'}
                                        >
                                            {yaAgregado ? (
                                                <>
                                                    <Check size={13} />
                                                    Agregado
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={13} />
                                                    Agregar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rutina-draft-bottom-bar">
                        <button
                            type="button"
                            className="btn-draft-guardar"
                            onClick={handleGuardarRutina}
                            disabled={guardando}
                        >
                            <Check size={18} />
                            {guardando
                                ? 'Guardando rutina...'
                                : (rutinaEditandoId ? 'Actualizar Rutina' : 'Guardar Rutina')}
                        </button>
                        <button
                            type="button"
                            className="btn-draft-cancelar"
                            onClick={cancelarBorrador}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <ModalAlerta
                isOpen={alertaModal.isOpen}
                titulo={alertaModal.titulo}
                mensaje={alertaModal.mensaje}
                onClose={() => setAlertaModal({ isOpen: false, titulo: '', mensaje: '' })}
            />
        </div>
    );
}

export default RutinasView;