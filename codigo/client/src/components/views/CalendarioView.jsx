import { useState, useEffect } from 'react';
import { getRutinas, updateRutina, getAsistencias } from '../../services/api';
import { getCurrentUser } from '../../features/authService';

function CalendarioView() {
    const user = getCurrentUser();
    const [rutinas, setRutinas] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [rutinaSeleccionada, setRutinaSeleccionada] = useState('');
    const [diaSeleccionadoModal, setDiaSeleccionadoModal] = useState(null); // Obj: { date: Date, dayName: str }

    const [toast, setToast] = useState({ msg: '', tipo: 'success' });
    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3000);
    };

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
            console.error(error);
        }
    };

    const asignarDia = async () => {
        if (!rutinaSeleccionada || !diaSeleccionadoModal) {
            return mostrarToast('Selecciona una rutina', 'error');
        }
        try {
            // Se asigna al día de la semana (ej. 'Lunes')
            const res = await updateRutina(rutinaSeleccionada, { dia_asignado: diaSeleccionadoModal.dayName });
            if (res?.success) {
                mostrarToast('Rutina asignada correctamente al ' + diaSeleccionadoModal.dayName, 'success');
                setDiaSeleccionadoModal(null);
                setRutinaSeleccionada('');
                cargarDatos();
            }
        } catch (error) {
            mostrarToast('Error al asignar rutina', 'error');
        }
    };

    const getMonthlyData = () => {
        const hoy = new Date();
        const daysInMonth = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
        const data = [];
        const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(hoy.getFullYear(), hoy.getMonth(), i);
            const dateStr = d.toISOString().split('T')[0];
            const hasAttended = asistencias.some(a => a.fecha.split('T')[0] === dateStr);
            const dayName = nombresDias[d.getDay()];
            const rutinasDelDia = rutinas.filter(r => r.dia_asignado === dayName);

            data.push({
                day: i,
                dateStr,
                dayName,
                dateObj: d,
                hasAttended,
                rutinas: rutinasDelDia
            });
        }
        return data;
    };

    const monthlyData = getMonthlyData();
    const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date());

    return (
        <div style={{ width: '100%', padding: '20px' }}>
            <h1 className="admin-titulo" style={{ textAlign: 'center', marginBottom: '20px' }}>MI CALENDARIO</h1>
            {toast.msg && <div className={`toast ${toast.tipo}`}>{toast.msg}</div>}

            <div style={{ background: 'var(--admin-card-soft)', padding: '20px', borderRadius: '13px', border: '1px solid rgba(140, 88, 211, 0.78)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--admin-text)', fontSize: '18px', cursor: 'pointer' }}>{'<'}</button>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        {nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}
                    </h2>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--admin-text)', fontSize: '18px', cursor: 'pointer' }}>{'>'}</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', justifyItems: 'center', marginBottom: '10px' }}>
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                        <div key={i} style={{ color: 'var(--admin-muted)', fontSize: '12px', fontWeight: 'bold' }}>{d}</div>
                    ))}
                    {monthlyData.map((d, i) => (
                        <div 
                            key={i} 
                            onClick={() => setDiaSeleccionadoModal({ date: d.dateObj, dayName: d.dayName, num: d.day })}
                            style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                background: d.hasAttended ? 'var(--admin-violet)' : 'rgba(255,255,255,0.05)',
                                border: d.hasAttended ? '1px solid #C307CD' : '1px solid var(--admin-card)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', position: 'relative'
                            }}
                        >
                            <span style={{ color: d.hasAttended ? 'white' : 'var(--admin-text)', fontSize: '14px', fontWeight: '600' }}>{d.day}</span>
                            {d.rutinas.length > 0 && !d.hasAttended && (
                                <div style={{ width: '4px', height: '4px', background: 'var(--admin-celeste)', borderRadius: '50%', marginTop: '2px' }}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {diaSeleccionadoModal && (
                <div className="overlay">
                    <div className="modal modal-sm" style={{ padding: '25px 20px' }}>
                        <h3 style={{ color: 'white', fontSize: '16px', margin: '0 0 5px 0', borderBottom: '1px solid var(--admin-card)', paddingBottom: '10px' }}>
                            DETALLES DEL DÍA - {diaSeleccionadoModal.dayName} {diaSeleccionadoModal.num}
                        </h3>
                        
                        <div style={{ marginTop: '15px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--admin-muted)', display: 'block', marginBottom: '5px' }}>RUTINA ASIGNADA:</label>
                            {rutinas.filter(r => r.dia_asignado === diaSeleccionadoModal.dayName).length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                                    {rutinas.filter(r => r.dia_asignado === diaSeleccionadoModal.dayName).map(r => (
                                        <span key={r.id_rutina} className="badge-estado activo" style={{ fontSize: '12px', padding: '6px 10px' }}>
                                            {r.nombre}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--admin-muted)', fontSize: '13px', margin: '0 0 15px 0' }}>No hay rutina asignada</p>
                            )}
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--admin-muted)', marginBottom: '20px' }}>
                            <h4 style={{ color: 'white', fontSize: '13px', margin: '0 0 10px 0' }}>Asignar nueva rutina</h4>
                            <select className="input-modal" value={rutinaSeleccionada} onChange={e => setRutinaSeleccionada(e.target.value)} style={{ marginBottom: '10px' }}>
                                <option value="">Selecciona una rutina...</option>
                                {rutinas.map(r => (
                                    <option key={r.id_rutina} value={r.id_rutina}>{r.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-ver" onClick={() => setDiaSeleccionadoModal(null)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--admin-muted)', color: 'white', borderRadius: '8px', height: '40px' }}>Salir</button>
                            <button className="btn-editar" onClick={asignarDia} style={{ flex: 1, background: 'var(--admin-violet)', border: 'none', color: 'white', borderRadius: '8px', height: '40px' }}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalendarioView;
