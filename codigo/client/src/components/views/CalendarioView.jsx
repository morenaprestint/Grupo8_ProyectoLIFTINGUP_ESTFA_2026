import { useState, useEffect } from 'react';
import { getRutinas, updateRutina, getAsistencias } from '../../services/api';
import { getCurrentUser } from '../../features/authService';
import { useCalendarGrid } from '../../hooks/useCalendarGrid';
import ModalAlerta from '../ModalAlerta';
import '../../styles/adminDashboard.css';

function CalendarioView() {
    const user = getCurrentUser();
    const [rutinas, setRutinas] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [rutinaSeleccionada, setRutinaSeleccionada] = useState('');
    const [diaSeleccionadoModal, setDiaSeleccionadoModal] = useState(null);

    const [toast, setToast] = useState({ msg: '', tipo: 'success' });
    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3000);
    };

    // Modal Popup de validación y errores con estilo neón oscuro
    const [alertaModal, setAlertaModal] = useState({ isOpen: false, titulo: '', mensaje: '' });
    const mostrarModalError = (mensaje, titulo = 'Acción no permitida') => {
        setAlertaModal({ isOpen: true, titulo, mensaje });
    };

    const {
        monthTitle,
        paddingDays,
        days,
        irMesSiguiente,
        irMesAnterior,
        verificarAsistencia,
        canPrevMonth,
        canNextMonth
    } = useCalendarGrid({ startOnMonday: false });

    // Array fijo con los nombres completos para evitar abreviaturas (Martes, Miércoles, etc.)
    const diasCompletosNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resRutinas, resAsistencias] = await Promise.all([
                getRutinas(user?.id),
                getAsistencias(user?.id)
            ]);
            if (resRutinas?.success) setRutinas(resRutinas.data);
            if (resAsistencias?.success) setAsistencias(resAsistencias.data);
        } catch (error) {
            console.error('Error al cargar datos en calendario:', error);
        }
    };

    // Asignar rutina acumulando el día sin pisar los anteriores (soporta toda la semana / más de 5 días)
    const asignarDia = async () => {
        if (!rutinaSeleccionada || !diaSeleccionadoModal) {
            return mostrarModalError('Acción no permitida: selecciona una rutina para asignar a este día.', 'Selección requerida');
        }

        const rutinaObj = rutinas.find(r => r.id_rutina == rutinaSeleccionada);
        if (!rutinaObj) return;

        let diasActuales = rutinaObj.dia_asignado
            ? rutinaObj.dia_asignado.split(',').map(d => d.trim()).filter(Boolean)
            : [];

        const diaNuevo = diaSeleccionadoModal.dayName;

        if (diasActuales.includes(diaNuevo)) {
            return mostrarModalError(`Esta rutina ya se encuentra asignada al día ${diaNuevo}.`, 'Día ya asignado');
        }

        // Permitir asignar hasta los 7 días de la semana (mínimo 5 permitidos)
        if (diasActuales.length >= 7) {
            return mostrarModalError('Acción no permitida: la rutina ya tiene asignados todos los días posibles de la semana (7 días).', 'Límite alcanzado');
        }

        diasActuales.push(diaNuevo);
        const nuevoDiaAsignadoStr = diasActuales.join(',');

        try {
            const res = await updateRutina(rutinaSeleccionada, { dia_asignado: nuevoDiaAsignadoStr });
            if (res?.success) {
                mostrarToast(`Rutina asignada correctamente al ${diaNuevo}`, 'success');
                setDiaSeleccionadoModal(null);
                setRutinaSeleccionada('');
                cargarDatos();
            } else {
                mostrarModalError(res?.message || res?.error || 'No se pudo asignar la rutina al día seleccionado.');
            }
        } catch (error) {
            mostrarModalError(error?.response?.data?.message || error?.response?.data?.error || error.message || 'Error al asignar la rutina');
        }
    };

    // Quitar un día asignado a una rutina desde el modal
    const removerDiaRutina = async (idRutina, diaARemover) => {
        const rutinaObj = rutinas.find(r => r.id_rutina == idRutina);
        if (!rutinaObj) return;

        let diasActuales = rutinaObj.dia_asignado
            ? rutinaObj.dia_asignado.split(',').map(d => d.trim()).filter(Boolean)
            : [];

        diasActuales = diasActuales.filter(d => d !== diaARemover);
        const nuevoDiaAsignadoStr = diasActuales.length > 0 ? diasActuales.join(',') : null;

        try {
            const res = await updateRutina(idRutina, { dia_asignado: nuevoDiaAsignadoStr });
            if (res?.success) {
                mostrarToast(`Se quitó el ${diaARemover} de la rutina`, 'success');
                cargarDatos();
                setDiaSeleccionadoModal(prev => ({
                    ...prev,
                    rutinas: prev.rutinas.filter(r => r.id_rutina !== idRutina)
                }));
            }
        } catch (error) {
            mostrarToast('Error al actualizar la rutina', 'error');
        }
    };

    return (
        <div style={{ width: '100%', padding: '20px' }}>
            <h1 className="admin-titulo" style={{ textAlign: 'center', marginBottom: '20px' }}>MI CALENDARIO</h1>
            {toast.msg && <div className={`toast ${toast.tipo}`}>{toast.msg}</div>}

            <div style={{ background: 'var(--admin-card-soft)', padding: '20px', borderRadius: '13px', border: '1px solid rgba(140, 88, 211, 0.78)', maxWidth: '650px', margin: '0 auto' }}>
                {/* NAVEGACIÓN DINÁMICA DEL MES */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <button
                        type="button"
                        onClick={irMesAnterior}
                        disabled={!canPrevMonth}
                        style={{ background: 'transparent', border: 'none', color: canPrevMonth ? 'var(--admin-text)' : 'rgba(255,255,255,0.2)', fontSize: '22px', cursor: canPrevMonth ? 'pointer' : 'not-allowed', padding: '4px 12px' }}
                    >
                        ❮
                    </button>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '600' }}>
                        {monthTitle}
                    </h2>
                    <button
                        type="button"
                        onClick={irMesSiguiente}
                        disabled={!canNextMonth}
                        style={{ background: 'transparent', border: 'none', color: canNextMonth ? 'var(--admin-text)' : 'rgba(255,255,255,0.2)', fontSize: '22px', cursor: canNextMonth ? 'pointer' : 'not-allowed', padding: '4px 12px' }}
                    >
                        ❯
                    </button>
                </div>

                {/* CUADRÍCULA DINÁMICA DE 7 DÍAS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', justifyItems: 'center', marginBottom: '10px' }}>
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                        <div key={i} style={{ color: 'var(--admin-muted)', fontSize: '12px', fontWeight: 'bold', height: '24px', display: 'flex', alignItems: 'center' }}>
                            {d}
                        </div>
                    ))}

                    {Array.from({ length: paddingDays }).map((_, i) => (
                        <div key={`pad-${i}`} style={{ width: '38px', height: '38px' }} />
                    ))}

                    {days.map((d) => {
                        const hasAttended = verificarAsistencia(d.dateStr, asistencias);

                        // Obtener nombre completo seguro para el día
                        const fechaObj = new Date(d.dateStr + 'T00:00:00');
                        const nombreDiaCompleto = diasCompletosNombres[fechaObj.getDay()];

                        const rutinasDelDia = rutinas.filter(r => {
                            if (!r.dia_asignado) return false;
                            const diasList = r.dia_asignado.split(',').map(x => x.trim());
                            return diasList.includes(nombreDiaCompleto);
                        });

                        return (
                            <div
                                key={d.dateStr}
                                onClick={() => setDiaSeleccionadoModal({
                                    dateStr: d.dateStr,
                                    dayName: nombreDiaCompleto,
                                    dayNumber: d.day,
                                    rutinas: rutinasDelDia
                                })}
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    background: hasAttended ? 'var(--admin-violet)' : (d.isToday ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255,255,255,0.05)'),
                                    border: hasAttended ? '1px solid #C307CD' : (d.isToday ? '1px solid #00d2ff' : '1px solid var(--admin-card)'),
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                title={`${nombreDiaCompleto} ${d.day} de ${monthTitle}`}
                            >
                                <span style={{ color: hasAttended ? 'white' : (d.isToday ? '#00d2ff' : 'var(--admin-text)'), fontSize: '13px', fontWeight: '600' }}>
                                    {d.day}
                                </span>
                                {rutinasDelDia.length > 0 && !hasAttended && (
                                    <div style={{ width: '5px', height: '5px', background: 'var(--admin-celeste)', borderRadius: '50%', marginTop: '2px' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DETALLES DEL DÍA SELECCIONADO */}
            {diaSeleccionadoModal && (
                <div className="overlay">
                    <div className="modal modal-sm" style={{ padding: '25px 20px' }}>
                        <h3 style={{ color: 'white', fontSize: '16px', margin: '0 0 5px 0', borderBottom: '1px solid var(--admin-card)', paddingBottom: '10px' }}>
                            DETALLES DEL DÍA - {diaSeleccionadoModal.dayName} {diaSeleccionadoModal.dayNumber}
                        </h3>

                        <div style={{ marginTop: '15px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--admin-muted)', display: 'block', marginBottom: '5px' }}>
                                RUTINAS ASIGNADAS PARA LOS {diaSeleccionadoModal.dayName.toUpperCase()}S:
                            </label>
                            {diaSeleccionadoModal.rutinas && diaSeleccionadoModal.rutinas.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                                    {diaSeleccionadoModal.rutinas.map(r => (
                                        <div key={r.id_rutina} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px' }}>
                                            <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{r.nombre}</span>
                                            <button
                                                type="button"
                                                onClick={() => removerDiaRutina(r.id_rutina, diaSeleccionadoModal.dayName)}
                                                style={{ background: 'transparent', border: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: '12px' }}
                                                title="Quitar este día de la rutina"
                                            >
                                                ✕ Quitar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--admin-muted)', fontSize: '13px', margin: '0 0 15px 0' }}>
                                    No hay rutinas asignadas a este día.
                                </p>
                            )}
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--admin-muted)', marginBottom: '20px' }}>
                            <h4 style={{ color: 'white', fontSize: '13px', margin: '0 0 10px 0' }}>Asignar otra rutina a los {diaSeleccionadoModal.dayName}s</h4>
                            <select
                                className="input-modal"
                                value={rutinaSeleccionada}
                                onChange={e => setRutinaSeleccionada(e.target.value)}
                                style={{ marginBottom: '10px' }}
                            >
                                <option value="">Selecciona una de tus rutinas...</option>
                                {rutinas.map(r => (
                                    <option key={r.id_rutina} value={r.id_rutina}>{r.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn-ver"
                                onClick={() => setDiaSeleccionadoModal(null)}
                                style={{ flex: 1, background: 'transparent', border: '1px solid var(--admin-muted)', color: 'white', borderRadius: '8px', height: '40px', cursor: 'pointer' }}
                            >
                                Salir
                            </button>
                            <button
                                className="btn-editar"
                                onClick={asignarDia}
                                style={{ flex: 1, background: 'var(--admin-violet)', border: 'none', color: 'white', borderRadius: '8px', height: '40px', cursor: 'pointer' }}
                            >
                                Guardar
                            </button>
                        </div>
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

export default CalendarioView;