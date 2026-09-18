import { useState, useEffect } from 'react';
import { getRutinas, updateRutina, getAsistencias } from '../../services/api';
import { getCurrentUser } from '../../features/authService';
import { useCalendarGrid } from '../../hooks/useCalendarGrid';
import '../../styles/adminDashboard.css';

function CalendarioView() {
    const user = getCurrentUser();
    const [rutinas, setRutinas] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [rutinaSeleccionada, setRutinaSeleccionada] = useState('');
    const [diaSeleccionadoModal, setDiaSeleccionadoModal] = useState(null); // { dateStr, dayName, dayNumber }

    const [toast, setToast] = useState({ msg: '', tipo: 'success' });
    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3000);
    };

    // Usar hook dinámico de calendario (inicia en Domingo: D, L, M, M, J, V, S)
    const {
        monthTitle,
        paddingDays,
        days,
        irMesSiguiente,
        irMesAnterior,
        verificarAsistencia,
        headers
    } = useCalendarGrid({ startOnMonday: false });

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

    const asignarDia = async () => {
        if (!rutinaSeleccionada || !diaSeleccionadoModal) {
            return mostrarToast('Selecciona una rutina para asignar', 'error');
        }
        try {
            // Se asigna al nombre del día de la semana correspondiente (ej. 'Lunes')
            const res = await updateRutina(rutinaSeleccionada, { dia_asignado: diaSeleccionadoModal.dayName });
            if (res?.success) {
                mostrarToast(`Rutina asignada correctamente al ${diaSeleccionadoModal.dayName} (${diaSeleccionadoModal.dayNumber})`, 'success');
                setDiaSeleccionadoModal(null);
                setRutinaSeleccionada('');
                cargarDatos();
            }
        } catch (error) {
            mostrarToast('Error al asignar rutina', 'error');
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
                        style={{ background: 'transparent', border: 'none', color: 'var(--admin-text)', fontSize: '22px', cursor: 'pointer', padding: '4px 12px' }}
                        title="Mes anterior"
                    >
                        ❮
                    </button>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '600' }}>
                        {monthTitle}
                    </h2>
                    <button
                        type="button"
                        onClick={irMesSiguiente}
                        style={{ background: 'transparent', border: 'none', color: 'var(--admin-text)', fontSize: '22px', cursor: 'pointer', padding: '4px 12px' }}
                        title="Mes siguiente"
                    >
                        ❯
                    </button>
                </div>

                {/* CUADRÍCULA DINÁMICA DE 7 DÍAS CON ALINEACIÓN CORRECTA */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', justifyItems: 'center', marginBottom: '10px' }}>
                    {/* Encabezados de días: D, L, M, M, J, V, S */}
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                        <div key={i} style={{ color: 'var(--admin-muted)', fontSize: '12px', fontWeight: 'bold', height: '24px', display: 'flex', alignItems: 'center' }}>
                            {d}
                        </div>
                    ))}

                    {/* Celdas vacías de padding para alinear el primer día del mes */}
                    {Array.from({ length: paddingDays }).map((_, i) => (
                        <div key={`pad-${i}`} style={{ width: '38px', height: '38px' }} />
                    ))}

                    {/* Días reales del mes */}
                    {days.map((d) => {
                        const hasAttended = verificarAsistencia(d.dateStr, asistencias);
                        const rutinasDelDia = rutinas.filter(r => r.dia_asignado === d.dayName);

                        return (
                            <div
                                key={d.dateStr}
                                onClick={() => setDiaSeleccionadoModal({ dateStr: d.dateStr, dayName: d.dayName, dayNumber: d.day, rutinas: rutinasDelDia })}
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    background: hasAttended ? 'var(--admin-violet)' : (d.isToday ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255,255,255,0.05)'),
                                    border: hasAttended
                                        ? '1px solid #C307CD'
                                        : (d.isToday ? '1px solid #00d2ff' : '1px solid var(--admin-card)'),
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.15s'
                                }}
                                title={`${d.dayName} ${d.day} de ${monthTitle}${hasAttended ? ' - Asistencia registrada' : ''}`}
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
                                RUTINA ASIGNADA PARA LOS DÍAS {diaSeleccionadoModal.dayName.toUpperCase()}:
                            </label>
                            {diaSeleccionadoModal.rutinas && diaSeleccionadoModal.rutinas.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
                                    {diaSeleccionadoModal.rutinas.map(r => (
                                        <span key={r.id_rutina} className="badge-estado activo" style={{ fontSize: '12px', padding: '6px 10px' }}>
                                            {r.nombre}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--admin-muted)', fontSize: '13px', margin: '0 0 15px 0' }}>
                                    No hay rutina asignada a este día.
                                </p>
                            )}
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--admin-muted)', marginBottom: '20px' }}>
                            <h4 style={{ color: 'white', fontSize: '13px', margin: '0 0 10px 0' }}>Asignar rutina a los {diaSeleccionadoModal.dayName}s</h4>
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
        </div>
    );
}

export default CalendarioView;
