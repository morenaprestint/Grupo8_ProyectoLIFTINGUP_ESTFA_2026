import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../../features/authService';
import { getAsistencias, createAsistencia, deleteAsistencia } from '../../services/api';
import { useCalendarGrid, parseLocalDate } from '../../hooks/useCalendarGrid';
import '../../styles/attendance.css';

function AsistenciaView() {
    const user = getCurrentUser();
    const [showConfirm, setShowConfirm] = useState(false);
    const [diaSeleccionadoConfirm, setDiaSeleccionadoConfirm] = useState(null);
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState({ msg: '', tipo: 'success' });
    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3000);
    };

    // Usar hook compartido sincronizado (Lunes a Domingo para el resumen semanal y mensual)
    const {
        monthTitle,
        days,
        paddingDays,
        todayStr,
        getWeeklyDays,
        irMesAnterior,
        irMesSiguiente,
        canPrevMonth,
        canNextMonth
    } = useCalendarGrid({ startOnMonday: true });

    const cargarAsistencias = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await getAsistencias(user.id);
            if (res?.success && Array.isArray(res.data)) {
                setAsistencias(res.data);
            }
        } catch (error) {
            console.error('Error al cargar asistencias:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        cargarAsistencias();
    }, [cargarAsistencias]);

    // ─── VERIFICACIÓN ROBUSTA DE ASISTENCIAS (Sin desfases) ───
    const asistenciasFechasSet = new Set(
        asistencias.map(a => {
            const rawFecha = a.fecha || a.fecha_formateada || '';
            return String(rawFecha).slice(0, 10);
        })
    );

    const verificarAsistenciaLocal = (dateStr) => {
        return asistenciasFechasSet.has(dateStr);
    };

    const attendanceMarkedToday = verificarAsistenciaLocal(todayStr);

    const handleAttendance = async (didAttend, targetDateStr = todayStr) => {
        if (!didAttend) {
            setShowConfirm(false);
            setDiaSeleccionadoConfirm(null);
            return;
        }

        try {
            const res = await createAsistencia({ id_usuario: user.id, fecha: targetDateStr });
            if (res?.success) {
                setShowConfirm(false);
                setDiaSeleccionadoConfirm(null);
                const fechaObj = parseLocalDate(targetDateStr);
                const nombreDia = fechaObj ? new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric' }).format(fechaObj) : targetDateStr;
                mostrarToast(`¡Asistencia registrada para el ${nombreDia}!`, 'success');
                // Actualización inmediata del estado local para recalcular métricas semanal y mensual
                const nuevaAsistencia = res.data || {
                    id_asistencia: Date.now(),
                    id_usuario: user.id,
                    fecha: targetDateStr,
                    fecha_formateada: targetDateStr
                };
                setAsistencias(prev => [nuevaAsistencia, ...prev]);
                cargarAsistencias();
            }
        } catch (error) {
            mostrarToast(error.message || 'Error al registrar asistencia', 'error');
        }
    };

    const handleRemoveAttendance = async (targetDateStr) => {
        if (!user) return;

        // Guardar copia del estado previo para revertir si la API falla
        const prevAsistencias = [...asistencias];

        // Buscar registro para obtener id_asistencia si existe
        const registro = asistencias.find(a => {
            const rawFecha = a.fecha || a.fecha_formateada || '';
            return String(rawFecha).slice(0, 10) === targetDateStr;
        });

        // 1. Actualización inmediata y reactiva del estado local:
        // Descuenta el día de asistencias y recalcula automáticamente semana y mes
        setAsistencias(prev => prev.filter(a => {
            const rawFecha = a.fecha || a.fecha_formateada || '';
            return String(rawFecha).slice(0, 10) !== targetDateStr;
        }));

        try {
            const res = await deleteAsistencia({
                id_asistencia: registro?.id_asistencia,
                id_usuario: user.id,
                fecha: targetDateStr
            });

            if (res?.success) {
                const fechaObj = parseLocalDate(targetDateStr);
                const nombreDia = fechaObj ? new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric' }).format(fechaObj) : targetDateStr;
                mostrarToast(`Asistencia desmarcada para el ${nombreDia}`, 'info');
                cargarAsistencias();
            } else {
                throw new Error(res?.message || 'No se pudo eliminar la asistencia');
            }
        } catch (error) {
            console.error('Error al desmarcar asistencia:', error);
            mostrarToast(error.message || 'Error al desmarcar asistencia', 'error');
            // Revertir el estado local en caso de error
            setAsistencias(prevAsistencias);
        }
    };

    const weeklyData = getWeeklyDays(asistencias);
    const attendedDaysCount = weeklyData.filter(d => verificarAsistenciaLocal(d.dateStr)).length;
    const currentMonthAttended = days.filter(d => verificarAsistenciaLocal(d.dateStr)).length;

    return (
        <div style={{ width: '100%', padding: '20px', maxWidth: '650px', margin: '0 auto' }}>
            <h1 className="admin-titulo" style={{ textAlign: 'center', marginBottom: '20px' }}>REGISTRO DE ASISTENCIA</h1>
            {toast.msg && <div className={`toast ${toast.tipo}`}>{toast.msg}</div>}

            {/* REGISTRO SEMANAL (LUNES A DOMINGO) */}
            <div style={{ background: 'var(--admin-card-soft)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(140, 88, 211, 0.78)', marginBottom: '20px' }}>
                <h2 style={{ color: 'white', textAlign: 'center', fontSize: '16px', fontWeight: '600', margin: '0 0 15px 0' }}>
                    REGISTRO SEMANAL
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    {weeklyData.map((item, index) => {
                        const hasAttendedWeek = verificarAsistenciaLocal(item.dateStr);
                        return (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', color: item.dateStr === todayStr ? '#00d2ff' : 'var(--admin-muted)', fontWeight: item.dateStr === todayStr ? 'bold' : 'normal' }}>
                                    {item.dayName}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>{item.dayNumber}</span>
                                {hasAttendedWeek ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#8C58D3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : item.dateStr < todayStr ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                ) : (
                                    <span style={{ color: 'var(--admin-muted)', fontSize: '18px', lineHeight: '22px' }}>•</span>
                                )}
                            </div>
                        );
                    })}
                </div>
                <p style={{ textAlign: 'center', color: 'var(--admin-muted)', fontSize: '13px', margin: '0 0 15px 0' }}>
                    Asistencia Semanal: <b style={{ color: '#00d2ff' }}>{attendedDaysCount}</b> de 7 días
                </p>
                <button
                    type="button"
                    className="btn-guardar"
                    onClick={() => {
                        if (attendanceMarkedToday) {
                            handleRemoveAttendance(todayStr);
                        } else {
                            setDiaSeleccionadoConfirm(null);
                            setShowConfirm(true);
                        }
                    }}
                    style={{
                        width: '100%',
                        height: '42px',
                        background: attendanceMarkedToday ? 'rgba(231, 76, 60, 0.15)' : 'var(--admin-violet)',
                        border: attendanceMarkedToday ? '1px solid #E74C3C' : 'none',
                        color: attendanceMarkedToday ? '#E74C3C' : 'white',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    {attendanceMarkedToday ? 'DESMARCAR ASISTENCIA HOY ✕' : 'MARCAR ASISTENCIA HOY'}
                </button>
            </div>

            {/* RESUMEN MENSUAL DINÁMICO */}
            <div style={{ background: 'var(--admin-card-soft)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(140, 88, 211, 0.78)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <button
                        type="button"
                        onClick={irMesAnterior}
                        disabled={!canPrevMonth}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: canPrevMonth ? 'var(--admin-text)' : 'rgba(255,255,255,0.2)',
                            fontSize: '20px',
                            cursor: canPrevMonth ? 'pointer' : 'not-allowed',
                            padding: '0 8px',
                            opacity: canPrevMonth ? 1 : 0.3
                        }}
                    >
                        ❮
                    </button>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        {monthTitle}
                    </h2>
                    <button
                        type="button"
                        onClick={irMesSiguiente}
                        disabled={!canNextMonth}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: canNextMonth ? 'var(--admin-text)' : 'rgba(255,255,255,0.2)',
                            fontSize: '20px',
                            cursor: canNextMonth ? 'pointer' : 'not-allowed',
                            padding: '0 8px',
                            opacity: canNextMonth ? 1 : 0.3
                        }}
                    >
                        ❯
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', color: 'var(--admin-muted)', fontSize: '12px' }}>
                    <span>Días asistidos en el mes: <b style={{ color: '#00d2ff' }}>{currentMonthAttended}</b></span>
                    <span>Total días: {days.length}</span>
                </div>

                {/* CUADRÍCULA DEL MES */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', justifyItems: 'center', marginBottom: '8px' }}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                        <div key={i} style={{ color: 'var(--admin-muted)', fontSize: '11px', fontWeight: 'bold' }}>{d}</div>
                    ))}
                    {Array.from({ length: paddingDays }).map((_, i) => (
                        <div key={`pad-${i}`} style={{ width: '32px', height: '32px' }} />
                    ))}
                    {days.map((d) => {
                        const hasAttended = verificarAsistenciaLocal(d.dateStr);
                        return (
                            <div
                                key={d.dateStr}
                                onClick={() => {
                                    if (d.dateStr <= todayStr) {
                                        if (!hasAttended) {
                                            setDiaSeleccionadoConfirm(d);
                                            setShowConfirm(true);
                                        } else {
                                            handleRemoveAttendance(d.dateStr);
                                        }
                                    }
                                }}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: hasAttended ? 'var(--admin-violet)' : (d.isToday ? 'rgba(0, 210, 255, 0.15)' : 'transparent'),
                                    border: hasAttended
                                        ? '1px solid #C307CD'
                                        : (d.isToday ? '1px solid #00d2ff' : '1px solid var(--admin-card)'),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: d.dateStr <= todayStr ? 'pointer' : 'default',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: hasAttended ? 'white' : (d.isToday ? '#00d2ff' : 'var(--admin-muted)')
                                }}
                                title={`${d.dayName} ${d.day} de ${monthTitle}${hasAttended ? ' (Asistencia registrada - Haz clic para desmarcar)' : ''}`}
                            >
                                {hasAttended ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    d.day
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            {showConfirm && (
                <div className="overlay">
                    <div className="modal modal-sm" style={{ padding: '30px 20px', textAlign: 'center' }}>
                        <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 10px 0' }}>
                            {diaSeleccionadoConfirm
                                ? `¿Asististe el ${diaSeleccionadoConfirm.dayName} ${diaSeleccionadoConfirm.day}?`
                                : '¿Asististe al gimnasio hoy?'}
                        </h3>
                        <p style={{ color: 'var(--admin-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>
                            {diaSeleccionadoConfirm
                                ? `Fecha seleccionada: ${diaSeleccionadoConfirm.dateStr}`
                                : `Fecha actual: ${todayStr}`}
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={() => handleAttendance(true, diaSeleccionadoConfirm?.dateStr || todayStr)}
                                style={{ flex: 1, background: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ECC71', color: '#2ECC71', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}
                            >
                                Sí, asistí
                            </button>
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() => handleAttendance(false)}
                                style={{ flex: 1, background: 'rgba(231, 76, 60, 0.15)', border: '1px solid #E74C3C', color: '#E74C3C', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}
                            >
                                No, cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AsistenciaView;