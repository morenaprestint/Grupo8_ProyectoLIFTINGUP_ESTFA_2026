import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../features/authService';
import { getAsistencias, createAsistencia } from '../../services/api';
import '../../styles/attendance.css';

function AsistenciaView() {
    const user = getCurrentUser();
    const [showConfirm, setShowConfirm] = useState(false);
    const [attendanceMarked, setAttendanceMarked] = useState(false);
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState({ msg: '', tipo: 'success' });
    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3000);
    };

    useEffect(() => {
        cargarAsistencias();
    }, []);

    const cargarAsistencias = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await getAsistencias(user.id);
            if (res?.success) {
                setAsistencias(res.data);
                const hoy = new Date().toISOString().split('T')[0];
                const yaAsistio = res.data.some(a => a.fecha.split('T')[0] === hoy);
                setAttendanceMarked(yaAsistio);
            }
        } catch (error) {
            console.error('Error al cargar asistencias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttendance = async (didAttend) => {
        if (!didAttend) {
            setShowConfirm(false);
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];
        try {
            const res = await createAsistencia({ id_usuario: user.id, fecha: hoy });
            if (res?.success) {
                setAttendanceMarked(true);
                setShowConfirm(false);
                mostrarToast('Asistencia marcada correctamente', 'success');
                cargarAsistencias();
            }
        } catch (error) {
            mostrarToast('Error al marcar asistencia', 'error');
        }
    };

    const getWeeklyData = () => {
        const data = [];
        const hoy = new Date();
        const startOfWeek = new Date(hoy);
        startOfWeek.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const hasAttended = asistencias.some(a => a.fecha.split('T')[0] === dateStr);
            const isFuture = d > hoy;

            data.push({
                dayName: ['Dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][d.getDay()],
                dateStr,
                status: hasAttended ? 'yes' : (isFuture ? 'pending' : 'no')
            });
        }
        return data.slice(1).concat(data.slice(0, 1)); // Lunes a Domingo
    };

    const getMonthlyData = () => {
        const hoy = new Date();
        const daysInMonth = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
        const data = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(hoy.getFullYear(), hoy.getMonth(), i);
            const dateStr = d.toISOString().split('T')[0];
            const hasAttended = asistencias.some(a => a.fecha.split('T')[0] === dateStr);
            data.push({
                day: i,
                dateStr,
                status: hasAttended ? 'yes' : 'no'
            });
        }
        return data;
    };

    const weeklyData = getWeeklyData();
    const monthlyData = getMonthlyData();
    
    const attendedDaysCount = weeklyData.filter(d => d.status === 'yes').length;
    const currentMonthCount = asistencias.filter(a => {
        const aDate = new Date(a.fecha);
        const hoy = new Date();
        return aDate.getMonth() === hoy.getMonth() && aDate.getFullYear() === hoy.getFullYear();
    }).length;

    const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date());

    return (
        <div style={{ width: '100%', padding: '20px' }}>
            <h1 className="admin-titulo" style={{ textAlign: 'center', marginBottom: '20px' }}>PROGRESO DEL ATLETA</h1>
            {toast.msg && <div className={`toast ${toast.tipo}`}>{toast.msg}</div>}

            <div style={{ background: 'var(--admin-card-soft)', padding: '20px', borderRadius: '13px', border: '1px solid rgba(140, 88, 211, 0.78)', marginBottom: '20px' }}>
                <h2 style={{ color: 'white', textAlign: 'center', fontSize: '16px', fontWeight: '600', margin: '0 0 15px 0' }}>REGISTRO SEMANAL</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    {weeklyData.map((item, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--admin-muted)' }}>{item.dayName}</span>
                            {item.status === 'yes' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="#8C58D3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : item.status === 'no' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            ) : (
                                <span style={{ color: 'var(--admin-muted)' }}>-</span>
                            )}
                        </div>
                    ))}
                </div>
                <p style={{ textAlign: 'center', color: 'var(--admin-muted)', fontSize: '13px', margin: '0 0 15px 0' }}>Asistencia Semanal: {attendedDaysCount} días</p>
                <button
                    className="btn-guardar"
                    onClick={() => setShowConfirm(true)}
                    disabled={attendanceMarked}
                    style={{ width: '100%', height: '40px', background: attendanceMarked ? 'transparent' : 'transparent', border: attendanceMarked ? '1px solid var(--admin-muted)' : '1px solid var(--admin-violet)', color: attendanceMarked ? 'var(--admin-muted)' : 'var(--admin-violet)', borderRadius: '20px', fontWeight: 'bold' }}
                >
                    {attendanceMarked ? "ASISTENCIA MARCADA" : "MARCAR ASISTENCIA HOY"}
                </button>
            </div>

            <div style={{ background: 'var(--admin-card-soft)', padding: '20px', borderRadius: '13px', border: '1px solid rgba(140, 88, 211, 0.78)' }}>
                <h2 style={{ color: 'white', textAlign: 'center', fontSize: '16px', fontWeight: '600', margin: '0 0 15px 0' }}>RESUMEN MENSUAL</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: 'var(--admin-muted)', fontSize: '12px' }}>
                    <span>Mes actual ({nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)})</span>
                    <span>Días asistidos: {currentMonthCount}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', justifyItems: 'center' }}>
                    {monthlyData.map((d, i) => (
                        <div key={i} style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: d.status === 'yes' ? 'var(--admin-violet)' : 'transparent',
                            border: d.status === 'yes' ? '1px solid #C307CD' : '1px solid var(--admin-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {d.status === 'yes' && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                    ))}
                </div>
            </div>

            {showConfirm && (
                <div className="overlay">
                    <div className="modal modal-sm" style={{ padding: '30px 20px', textAlign: 'center' }}>
                        <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 10px 0' }}>¿Asististe hoy?</h3>
                        <p style={{ color: 'var(--admin-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>
                            ({new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date())})
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="btn-guardar" onClick={() => handleAttendance(true)} style={{ flex: 1, background: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ECC71', color: '#2ECC71', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Sí, asistí
                            </button>
                            <button className="btn-cancelar" onClick={() => handleAttendance(false)} style={{ flex: 1, background: 'rgba(231, 76, 60, 0.15)', border: '1px solid #E74C3C', color: '#E74C3C', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                No, no fui
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AsistenciaView;
