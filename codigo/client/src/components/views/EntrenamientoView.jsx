import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play,
    Pause,
    RotateCcw,
    Check,
    Dumbbell,
    Timer,
    Flame,
    Trophy,
    ArrowLeft,
    Zap
} from 'lucide-react';
import { getRutinas, createHistorial } from '../../services/api';
import { getCurrentUser } from '../../features/authService';
import '../../styles/entrenamientoView.css';

function formatTiempo(segundosTotales) {
    const hrs = Math.floor(segundosTotales / 3600);
    const mins = Math.floor((segundosTotales % 3600) / 60);
    const segs = segundosTotales % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(segs)}`;
    }
    return `${pad(mins)}:${pad(segs)}`;
}

function EntrenamientoView() {
    const user = getCurrentUser();
    const userId = user?.id ?? user?.id_usuario;
    const navigate = useNavigate();

    // Estado de rutinas
    const [rutinas, setRutinas] = useState([]);
    const [rutinaSeleccionadaId, setRutinaSeleccionadaId] = useState('');
    const [ejerciciosSesion, setEjerciciosSesion] = useState([]);
    const [loadingRutinas, setLoadingRutinas] = useState(true);

    // Cronómetro en tiempo real
    const [tiempoSegundos, setTiempoSegundos] = useState(0);
    const [estadoCrono, setEstadoCrono] = useState('detenido'); // 'detenido' | 'corriendo' | 'en-pausa'
    const timerRef = useRef(null);

    // Estado para finalizar y guardar
    const [guardando, setGuardando] = useState(false);
    const [resumenModal, setResumenModal] = useState(null); // Datos de resumen al finalizar

    // Cargar rutinas del atleta y predefinidas
    useEffect(() => {
        let isMounted = true;
        async function fetchRutinas() {
            setLoadingRutinas(true);
            try {
                const [resPropias, resOficiales] = await Promise.all([
                    getRutinas(userId || '', false, true),
                    getRutinas('', true)
                ]);

                const listaPropias = (resPropias?.success && Array.isArray(resPropias.data)) ? resPropias.data : [];
                const listaOficiales = (resOficiales?.success && Array.isArray(resOficiales.data)) ? resOficiales.data : [];
                const todas = [...listaPropias, ...listaOficiales];

                if (isMounted) {
                    setRutinas(todas);
                    if (todas.length > 0) {
                        const primera = todas[0];
                        setRutinaSeleccionadaId(primera.id_rutina);
                        cargarEjerciciosDeRutina(primera);
                    }
                }
            } catch (err) {
                console.error('Error al cargar rutinas:', err);
            } finally {
                if (isMounted) setLoadingRutinas(false);
            }
        }
        fetchRutinas();
        return () => { isMounted = false; };
    }, [userId]);

    // Cambiar ejercicios al elegir rutina
    const cargarEjerciciosDeRutina = (rutina) => {
        if (!rutina || !Array.isArray(rutina.ejercicios)) {
            setEjerciciosSesion([]);
            return;
        }
        setEjerciciosSesion(
            rutina.ejercicios.map((e, idx) => ({
                id_ejercicio: e.id_ejercicio,
                nombre: e.nombre,
                grupo_muscular: e.grupo_muscular,
                gif: e.gif,
                series: Number(e.series) || 4,
                repeticiones: Number(e.repeticiones) || 12,
                peso: Number(e.peso) || 0,
                completado: false
            }))
        );
    };

    const handleSelectRutina = (e) => {
        const id = Number(e.target.value);
        setRutinaSeleccionadaId(id);
        const r = rutinas.find(item => item.id_rutina === id);
        if (r) {
            cargarEjerciciosDeRutina(r);
        }
    };

    // Manejo del Cronómetro
    useEffect(() => {
        if (estadoCrono === 'corriendo') {
            timerRef.current = setInterval(() => {
                setTiempoSegundos(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [estadoCrono]);

    const handleIniciarCrono = () => setEstadoCrono('corriendo');
    const handlePausarCrono = () => setEstadoCrono('en-pausa');
    const handleReiniciarCrono = () => {
        setEstadoCrono('detenido');
        setTiempoSegundos(0);
    };

    // Actualizar inputs inline de ejercicio
    const handleUpdateEjercicioField = (index, field, value) => {
        setEjerciciosSesion(prev => {
            const copia = [...prev];
            copia[index][field] = value;
            return copia;
        });
    };

    const handleToggleCompletado = (index) => {
        setEjerciciosSesion(prev => {
            const copia = [...prev];
            copia[index].completado = !copia[index].completado;
            return copia;
        });
    };

    // Cálculos en tiempo real
    const pesoMaximo = useMemo(() => {
        if (ejerciciosSesion.length === 0) return 0;
        const pesos = ejerciciosSesion.map(e => Number(e.peso) || 0);
        return Math.max(0, ...pesos);
    }, [ejerciciosSesion]);

    const kilosTotales = useMemo(() => {
        return ejerciciosSesion.reduce((acc, e) => {
            const s = Number(e.series) || 0;
            const r = Number(e.repeticiones) || 0;
            const p = Number(e.peso) || 0;
            // Volumen levantado: Series * Repeticiones * Peso
            // Si el peso es > 0, calcula el volumen; si es 0, suma 0
            return acc + (s * r * p);
        }, 0);
    }, [ejerciciosSesion]);

    // Finalizar entrenamiento y persistir en MySQL
    const handleFinalizarEntrenamiento = async () => {
        if (tiempoSegundos < 5 && kilosTotales === 0 && pesoMaximo === 0) {
            if (!window.confirm('El entrenamiento tiene poca actividad registrada. ¿Deseas finalizarlo de todas formas?')) {
                return;
            }
        }

        // Pausar cronómetro
        setEstadoCrono('detenido');
        setGuardando(true);

        try {
            const payload = {
                id_usuario: userId,
                id_rutina: rutinaSeleccionadaId || null,
                duracion_segundos: Math.max(1, tiempoSegundos),
                peso_maximo: pesoMaximo,
                kilos_totales: kilosTotales
            };

            const res = await createHistorial(payload);

            if (res?.success) {
                const rutinaActual = rutinas.find(r => r.id_rutina === rutinaSeleccionadaId);
                setResumenModal({
                    nombre_rutina: rutinaActual ? rutinaActual.nombre : 'Entrenamiento Libre',
                    duracion_segundos: Math.max(1, tiempoSegundos),
                    peso_maximo: pesoMaximo,
                    kilos_totales: kilosTotales
                });
            } else {
                alert('No se pudo guardar la sesión de entrenamiento');
            }
        } catch (err) {
            console.error('Error al guardar sesión:', err);
            alert('Error al registrar la sesión en la base de datos');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="entrenamiento-container">
            {/* Cabecera */}
            <div className="entrenamiento-header">
                <h1 className="entrenamiento-title">
                    <Zap size={22} color="var(--entr-cyan)" />
                    Modo Entrenar Hoy
                </h1>
                <p className="entrenamiento-subtitle">
                    Controla tu sesión en tiempo real, registra los kilos levantados y guarda tu progreso.
                </p>
            </div>

            {/* 1. Selector de Rutina */}
            <div className="entrenamiento-rutina-selector-card">
                <label className="entrenamiento-label">
                    <Dumbbell size={14} />
                    Seleccionar Rutina del Día
                </label>
                <select
                    className="entrenamiento-select-rutina"
                    value={rutinaSeleccionadaId}
                    onChange={handleSelectRutina}
                    disabled={estadoCrono === 'corriendo'}
                >
                    {rutinas.map(r => (
                        <option key={r.id_rutina} value={r.id_rutina}>
                            {r.nombre} {r.dia_asignado ? `(${r.dia_asignado})` : ''} {r.id_usuario ? '- Personal' : '- Oficial'}
                        </option>
                    ))}
                </select>
            </div>

            {/* 2. Cronómetro Digital */}
            <div className="entrenamiento-cronometro-card">
                <span className={`cronometro-status-badge ${estadoCrono}`}>
                    <span className="cronometro-dot" />
                    {estadoCrono === 'corriendo' ? 'Sesión en Curso' : (estadoCrono === 'en-pausa' ? 'En Pausa' : 'Listo para Iniciar')}
                </span>

                <div className="cronometro-display">
                    {formatTiempo(tiempoSegundos)}
                </div>

                <div className="cronometro-controls">
                    {estadoCrono !== 'corriendo' ? (
                        <button
                            type="button"
                            className="btn-crono btn-crono-play"
                            onClick={handleIniciarCrono}
                        >
                            <Play size={16} fill="currentColor" />
                            {estadoCrono === 'en-pausa' ? 'Reanudar' : 'Iniciar'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn-crono btn-crono-pause"
                            onClick={handlePausarCrono}
                        >
                            <Pause size={16} fill="currentColor" />
                            Pausar
                        </button>
                    )}

                    <button
                        type="button"
                        className="btn-crono btn-crono-reset"
                        onClick={handleReiniciarCrono}
                        disabled={tiempoSegundos === 0}
                        title="Reiniciar cronómetro"
                    >
                        <RotateCcw size={16} />
                        Reiniciar
                    </button>
                </div>
            </div>

            {/* 3. Lista de Ejercicios con Inputs Inline */}
            <div className="entrenamiento-ejercicios-section">
                <div className="entrenamiento-section-title">
                    <span>Ejercicios de la Rutina ({ejerciciosSesion.length})</span>
                    <span style={{ fontSize: '12px', color: 'var(--entr-cyan)', fontWeight: '600' }}>
                        Registra tus kilos levantados
                    </span>
                </div>

                {ejerciciosSesion.length > 0 ? (
                    ejerciciosSesion.map((ej, index) => (
                        <div
                            key={index}
                            className={`entrenamiento-ejercicio-card ${ej.completado ? 'completado' : ''}`}
                        >
                            <div className="entrenamiento-ejercicio-left">
                                <div className="entrenamiento-ejercicio-thumb">
                                    {ej.gif ? (
                                        <img src={ej.gif} alt={ej.nombre} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                        <Dumbbell size={18} color="#a78bfa" />
                                    )}
                                </div>
                                <div className="entrenamiento-ejercicio-info">
                                    <span className="entrenamiento-ejercicio-nombre">{ej.nombre}</span>
                                    <span className="entrenamiento-ejercicio-grupo">{ej.grupo_muscular || 'General'}</span>
                                </div>
                            </div>

                            {/* Inputs Inline: Series, Reps, Kilos */}
                            <div className="entrenamiento-inputs-inline">
                                <div className="entrenamiento-input-box">
                                    <label>Series</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        className="entrenamiento-input-num"
                                        value={ej.series}
                                        onChange={e => handleUpdateEjercicioField(index, 'series', e.target.value)}
                                    />
                                </div>
                                <div className="entrenamiento-input-box">
                                    <label>Reps</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="999"
                                        className="entrenamiento-input-num"
                                        value={ej.repeticiones}
                                        onChange={e => handleUpdateEjercicioField(index, 'repeticiones', e.target.value)}
                                    />
                                </div>
                                <div className="entrenamiento-input-box">
                                    <label>Kilos (kg)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="entrenamiento-input-num"
                                        value={ej.peso}
                                        onChange={e => handleUpdateEjercicioField(index, 'peso', e.target.value)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={`btn-check-completado ${ej.completado ? 'completado' : ''}`}
                                    onClick={() => handleToggleCompletado(index)}
                                    title={ej.completado ? 'Completado' : 'Marcar como completado'}
                                >
                                    <Check size={16} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: 'var(--entr-text-muted)', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', margin: '20px 0' }}>
                        Esta rutina no tiene ejercicios configurados.
                    </p>
                )}
            </div>

            {/* 4. Resumen de Métricas en Vivo */}
            <div className="entrenamiento-live-metrics-bar">
                <div className="live-metric-item">
                    <span className="live-metric-label">Tiempo</span>
                    <span className="live-metric-val">{formatTiempo(tiempoSegundos)}</span>
                </div>
                <div className="live-metric-item">
                    <span className="live-metric-label">Peso Máximo</span>
                    <span className="live-metric-val">{pesoMaximo} kg</span>
                </div>
                <div className="live-metric-item">
                    <span className="live-metric-label">Volumen Total</span>
                    <span className="live-metric-val">{kilosTotales} kg</span>
                </div>
            </div>

            {/* 5. Botón Finalizar Entrenamiento */}
            <button
                type="button"
                className="btn-finalizar-entrenamiento"
                onClick={handleFinalizarEntrenamiento}
                disabled={guardando}
            >
                <Check size={18} />
                {guardando ? 'Guardando sesión en MySQL...' : 'Finalizar Entrenamiento'}
            </button>

            {/* Modal de Felicitación / Resumen al Finalizar */}
            {resumenModal && (
                <div className="entrenamiento-modal-overlay">
                    <div className="entrenamiento-modal-content">
                        <div className="modal-trophy-icon">
                            <Trophy size={32} />
                        </div>

                        <h2 style={{ margin: '6px 0 0 0', fontSize: '20px', color: '#ffffff' }}>
                            ¡Entrenamiento Completado!
                        </h2>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--entr-text-muted)' }}>
                            Tu sesión de {resumenModal.nombre_rutina} ha sido registrada con éxito en tu historial.
                        </p>

                        <div className="modal-resumen-grid">
                            <div className="modal-resumen-item">
                                <span style={{ fontSize: '10.5px', color: 'var(--entr-text-muted)', textTransform: 'uppercase' }}>Tiempo</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>
                                    {formatTiempo(resumenModal.duracion_segundos)}
                                </span>
                            </div>
                            <div className="modal-resumen-item">
                                <span style={{ fontSize: '10.5px', color: 'var(--entr-text-muted)', textTransform: 'uppercase' }}>Peso Récord</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--entr-cyan)' }}>
                                    {resumenModal.peso_maximo} kg
                                </span>
                            </div>
                            <div className="modal-resumen-item">
                                <span style={{ fontSize: '10.5px', color: 'var(--entr-text-muted)', textTransform: 'uppercase' }}>Volumen</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--entr-green)' }}>
                                    {resumenModal.kilos_totales} kg
                                </span>
                            </div>
                        </div>

                        <div className="modal-actions-flex">
                            <button
                                type="button"
                                className="btn-finalizar-entrenamiento"
                                style={{ flex: 1, padding: '12px' }}
                                onClick={() => navigate('/progreso')}
                            >
                                <Flame size={16} />
                                Ver Mi Progreso
                            </button>
                            <button
                                type="button"
                                className="btn-crono btn-crono-reset"
                                style={{ flex: 1 }}
                                onClick={() => navigate('/home')}
                            >
                                Volver al Home
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EntrenamientoView;
