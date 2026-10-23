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
    Zap,
    X,
    AlertCircle
} from 'lucide-react';
import { getRutinas, createHistorial } from '../../services/api';
import { getCurrentUser } from '../../features/authService';
import ModalAlerta from '../ModalAlerta';
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

const formatearGrupoMuscular = (grupo) => {
    if (!grupo) return 'General';
    const g = String(grupo).trim();
    if (['pierna', 'piernas'].includes(g.toLowerCase())) {
        return 'Pierna / Glúteo';
    }
    return g;
};

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
    const [isStarted, setIsStarted] = useState(false);
    const timerRef = useRef(null);

    // Estado para finalizar, confirmar y guardar
    const [guardando, setGuardando] = useState(false);
    const [mostrarConfirmacionFin, setMostrarConfirmacionFin] = useState(false); // Popup estilizado de confirmación
    const [resumenModal, setResumenModal] = useState(null); // Datos de resumen al finalizar
    const [toast, setToast] = useState({ show: false, msg: '', tipo: 'error' });

    // Modal Popup de validación y errores con estilo neón oscuro
    const [alertaModal, setAlertaModal] = useState({ isOpen: false, titulo: '', mensaje: '', tipo: 'warning' });
    const mostrarModalError = (mensaje, titulo = 'Acción no permitida', tipo = 'warning') => {
        setAlertaModal({ isOpen: true, titulo, mensaje, tipo });
    };

    const mostrarToast = (msg, tipo = 'error') => {
        setToast({ show: true, msg, tipo });
        setTimeout(() => setToast({ show: false, msg: '', tipo: 'error' }), 3500);
    };

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
            rutina.ejercicios.map((e) => ({
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

    const handleIniciarCrono = () => {
        const tieneInvalido = ejerciciosSesion.some(e => {
            const p = Number(e.peso);
            const s = Number(e.series);
            const r = Number(e.repeticiones);
            return isNaN(p) || p < 0 || p > 350 ||
                isNaN(s) || s < 1 || s > 5 ||
                isNaN(r) || r < 1 || r > 15;
        });

        if (tieneInvalido) {
            mostrarModalError('Acción no permitida: el valor ingresado es inválido. Verifique los valores permitidos: Series (1-5), Repeticiones (1-15) y Peso (0-350 kg).');
            return;
        }
        setIsStarted(true);
        setEstadoCrono('corriendo');
    };

    const handlePausarCrono = () => setEstadoCrono('en-pausa');
    const handleReiniciarCrono = () => {
        setEstadoCrono('detenido');
        setTiempoSegundos(0);
        setIsStarted(false);
    };

    // Actualizar inputs inline de ejercicio con validación estricta
    const handleUpdateEjercicioField = (index, field, value) => {
        if (value === '') {
            setEjerciciosSesion(prev => {
                const copia = [...prev];
                copia[index][field] = '';
                return copia;
            });
            return;
        }

        const numVal = Number(value);

        if (isNaN(numVal) || numVal < 0) {
            mostrarModalError('Acción no permitida: el valor ingresado es inválido. Ingrese un valor numérico mayor o igual a 0.');
            return;
        }

        if (field === 'series') {
            if (numVal < 1 || numVal > 5) {
                mostrarModalError('Acción no permitida: el valor ingresado es inválido. Las series deben estar estrictamente entre 1 y 5.');
                return;
            }
        }

        if (field === 'repeticiones') {
            if (numVal < 1 || numVal > 15) {
                mostrarModalError('Acción no permitida: el valor ingresado es inválido. Las repeticiones deben estar estrictamente entre 1 y 15.');
                return;
            }
        }

        if (field === 'peso' && numVal > 350) {
            mostrarModalError('Acción no permitida: el valor ingresado es inválido. El peso máximo permitido es de 350 kg.');
            return;
        }

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
            return acc + (s * r * p);
        }, 0);
    }, [ejerciciosSesion]);

    // Validar antes de abrir el popup de confirmación
    const solicitarFinalizacion = () => {
        // Evaluar si la sesión está iniciada/activa
        const sesionIniciada = isStarted || estadoCrono === 'corriendo' || estadoCrono === 'en-pausa' || tiempoSegundos > 0;

        if (!sesionIniciada) {
            mostrarModalError('Tenés que haber arrancado el entrenamiento para finalizar', 'Atención');
            return;
        }

        const tieneInvalido = ejerciciosSesion.some(e => {
            const p = Number(e.peso);
            const s = Number(e.series);
            const r = Number(e.repeticiones);
            return isNaN(p) || p < 0 || p > 350 ||
                isNaN(s) || s < 1 || s > 5 ||
                isNaN(r) || r < 1 || r > 15;
        });

        if (tieneInvalido || pesoMaximo < 0 || kilosTotales < 0) {
            mostrarModalError('Acción no permitida: el valor ingresado es inválido. Verifique que los valores cumplan: Series (1-5), Repeticiones (1-15) y Peso (0-350 kg) antes de finalizar.');
            return;
        }

        // Abre nuestro popup estilizado propio en lugar del alert del navegador
        setMostrarConfirmacionFin(true);
    };

    // Ejecutar la persistencia real tras confirmar en el popup
    const confirmarFinalizarEntrenamiento = async () => {
        setMostrarConfirmacionFin(false);
        setEstadoCrono('detenido');
        setIsStarted(false);
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
                mostrarModalError(res?.message || 'No se pudo guardar la sesión de entrenamiento');
            }
        } catch (err) {
            console.error('Error al guardar sesión:', err);
            mostrarModalError(err?.message || 'Error al conectar con el servidor para guardar la sesión');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="entrenamiento-container">
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 99999,
                    background: '#e74c3c',
                    color: '#ffffff',
                    padding: '14px 22px',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    ⚠️ {toast.msg}
                </div>
            )}

            <div className="entrenamiento-header">
                <h1 className="entrenamiento-title">
                    <Zap size={22} color="var(--entr-cyan)" />
                    Modo Entrenar Hoy
                </h1>
                <p className="entrenamiento-subtitle">
                    Controla tu sesión en tiempo real, registra los kilos levantados y guarda tu progreso.
                </p>
            </div>

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
                                    <span className="entrenamiento-ejercicio-grupo">{formatearGrupoMuscular(ej.grupo_muscular)}</span>
                                </div>
                            </div>

                            <div className="entrenamiento-inputs-inline">
                                <div className="entrenamiento-input-box">
                                    <label>Series</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        className="entrenamiento-input-num"
                                        value={ej.series}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        onChange={e => handleUpdateEjercicioField(index, 'series', e.target.value)}
                                    />
                                </div>
                                <div className="entrenamiento-input-box">
                                    <label>Reps</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="15"
                                        className="entrenamiento-input-num"
                                        value={ej.repeticiones}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        onChange={e => handleUpdateEjercicioField(index, 'repeticiones', e.target.value)}
                                    />
                                </div>
                                <div className="entrenamiento-input-box">
                                    <label>Kilos (kg)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="350"
                                        step="0.5"
                                        className="entrenamiento-input-num"
                                        value={ej.peso}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
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

            <button
                type="button"
                className="btn-finalizar-entrenamiento"
                onClick={solicitarFinalizacion}
                disabled={guardando}
            >
                <Check size={18} />
                {guardando ? 'Guardando sesión en MySQL...' : 'Finalizar Entrenamiento'}
            </button>

            {/* POPUP ESTILIZADO DE CONFIRMACIÓN (Reutilizando el diseño de modales de la app) */}
            {mostrarConfirmacionFin && (
                <div className="entrenamiento-modal-overlay">
                    <div className="entrenamiento-modal-content" style={{ textAlign: 'center', padding: '30px 20px' }}>
                        <div className="modal-trophy-icon" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--entr-cyan)' }}>
                            <AlertCircle size={32} />
                        </div>

                        <h2 style={{ margin: '12px 0 6px 0', fontSize: '18px', color: '#ffffff' }}>
                            ¿Finalizar Entrenamiento?
                        </h2>
                        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--entr-text-muted)', lineHeight: '1.4' }}>
                            Estás a punto de concluir tu sesión actual y guardar los registros en tu historial. ¿Deseas continuar?
                        </p>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                className="btn-crono btn-crono-reset"
                                style={{ flex: 1, height: '42px', borderRadius: '8px', justifyContent: 'center' }}
                                onClick={() => setMostrarConfirmacionFin(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-finalizar-entrenamiento"
                                style={{ flex: 1, margin: 0, height: '42px', borderRadius: '8px' }}
                                onClick={confirmarFinalizarEntrenamiento}
                            >
                                <Check size={16} />
                                Sí, Finalizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Modal Popup para validaciones preventivas */}
            <ModalAlerta
                isOpen={alertaModal.isOpen}
                titulo={alertaModal.titulo}
                mensaje={alertaModal.mensaje}
                tipo={alertaModal.tipo || 'warning'}
                onClose={() => setAlertaModal({ isOpen: false, titulo: '', mensaje: '', tipo: 'warning' })}
            />
        </div>
    );
}

export default EntrenamientoView;