import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AtletaNavbar from '../components/AtletaNavbar';
import { getCurrentUser, logout } from '../features/authService';
import { getAsistencias, createAsistencia, deleteAsistencia } from '../services/api';
import { useCalendarGrid, parseLocalDate } from '../hooks/useCalendarGrid';
import '../styles/attendance.css';

const Attendance = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // ─── VERIFICACIÓN ROBUSTA DE ASISTENCIAS (Solución a desfases) ───
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

  const handleAttendance = async (didAttend, dateStr = todayStr) => {
    if (!didAttend) {
      setShowConfirm(false);
      setSelectedDay(null);
      return;
    }

    try {
      const res = await createAsistencia({ id_usuario: user?.id, fecha: dateStr });
      if (res?.success) {
        setShowConfirm(false);
        setSelectedDay(null);
        const nuevaAsistencia = res.data || {
          id_asistencia: Date.now(),
          id_usuario: user?.id,
          fecha: dateStr,
          fecha_formateada: dateStr
        };
        setAsistencias(prev => [nuevaAsistencia, ...prev]);
        cargarAsistencias();
      }
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
    }
  };

  const handleRemoveAttendance = async (dateStr) => {
    if (!user) return;
    const prevAsistencias = [...asistencias];
    const registro = asistencias.find(a => {
      const rawFecha = a.fecha || a.fecha_formateada || '';
      return String(rawFecha).slice(0, 10) === dateStr;
    });

    setAsistencias(prev => prev.filter(a => {
      const rawFecha = a.fecha || a.fecha_formateada || '';
      return String(rawFecha).slice(0, 10) !== dateStr;
    }));

    try {
      const res = await deleteAsistencia({
        id_asistencia: registro?.id_asistencia,
        id_usuario: user?.id,
        fecha: dateStr
      });
      if (res?.success) {
        cargarAsistencias();
      } else {
        throw new Error(res?.message || 'Error al eliminar la asistencia');
      }
    } catch (error) {
      console.error('Error al desmarcar asistencia:', error);
      setAsistencias(prevAsistencias);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const weeklyData = getWeeklyDays(asistencias);
  const attendedDaysCount = days.filter(d => verificarAsistenciaLocal(d.dateStr)).length;
  const attendedWeeklyCount = weeklyData.filter(d => verificarAsistenciaLocal(d.dateStr)).length;

  return (
    <div className="attendance-page">
      <div className="admin-layout">
        {/* Unified Navbar */}
        <AtletaNavbar onLogout={handleLogout} />

        {/* Main Content Area */}
        <div className="admin-main attendance-main atleta-main main-content">
          <div className="attendance-content-centered">
            <h1 className="page-title">REGISTRO DE ASISTENCIA</h1>

            {/* Weekly Section */}
            <section className="attendance-card weekly-card">
              <h2 className="card-title">REGISTRO SEMANAL</h2>

              <div className="weekly-days">
                {weeklyData.map((item, index) => {
                  const hasAttendedWeek = verificarAsistenciaLocal(item.dateStr);
                  return (
                    <div key={index} className="day-col">
                      <span className="day-name">{item.dayName}</span>
                      <div className="status-icon">
                        {hasAttendedWeek ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#8C58D3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : item.dateStr < todayStr ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        ) : (
                          <span style={{ color: 'var(--text-muted, #7f7f7f)' }}>•</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="weekly-subtext">Asistencia Semanal: <b style={{ color: '#00d2ff' }}>{attendedWeeklyCount}</b> de 7 días</p>

              {/* Action Button */}
              <button
                type="button"
                className="btn-mark-attendance"
                onClick={() => {
                  if (attendanceMarkedToday) {
                    handleRemoveAttendance(todayStr);
                  } else {
                    setSelectedDay(null);
                    setShowConfirm(true);
                  }
                }}
                style={{
                  background: attendanceMarkedToday ? 'rgba(231, 76, 60, 0.15)' : 'var(--admin-violet, #8C58D3)',
                  border: attendanceMarkedToday ? '1px solid #E74C3C' : 'none',
                  color: attendanceMarkedToday ? '#E74C3C' : 'white',
                  cursor: 'pointer',
                  opacity: 1
                }}
              >
                {attendanceMarkedToday ? "DESMARCAR ASISTENCIA HOY ✕" : "MARCAR ASISTENCIA HOY"}
              </button>
            </section>

            {/* Monthly Section */}
            <section className="attendance-card monthly-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={irMesAnterior}
                  disabled={!canPrevMonth}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: canPrevMonth ? 'white' : '#555',
                    fontSize: '18px',
                    cursor: canPrevMonth ? 'pointer' : 'not-allowed',
                    opacity: canPrevMonth ? 1 : 0.3
                  }}
                  title={canPrevMonth ? "Mes anterior" : "Límite: Enero 2025"}
                >
                  ❮
                </button>
                <h2 className="card-title" style={{ margin: 0 }}>{monthTitle}</h2>
                <button
                  type="button"
                  onClick={irMesSiguiente}
                  disabled={!canNextMonth}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: canNextMonth ? 'white' : '#555',
                    fontSize: '18px',
                    cursor: canNextMonth ? 'pointer' : 'not-allowed',
                    opacity: canNextMonth ? 1 : 0.3
                  }}
                  title={canNextMonth ? "Mes siguiente" : "Límite: Diciembre 2027"}
                >
                  ❯
                </button>
              </div>

              <div className="monthly-stats">
                <span>Mes actual</span>
                <span>Días asistidos: <b style={{ color: '#00d2ff' }}>{attendedDaysCount}</b></span>
              </div>

              <div className="monthly-grid">
                {Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`pad-${i}`} style={{ width: '26px', height: '26px' }} />
                ))}
                {days.map((dayObj) => {
                  const hasAttended = verificarAsistenciaLocal(dayObj.dateStr);
                  return (
                    <div
                      key={dayObj.dateStr}
                      className={`grid-day ${hasAttended ? 'yes' : (dayObj.dateStr > todayStr ? 'pending' : 'no')}`}
                      onClick={() => {
                        if (dayObj.dateStr <= todayStr) {
                          if (!hasAttended) {
                            setSelectedDay(dayObj);
                            setShowConfirm(true);
                          } else {
                            handleRemoveAttendance(dayObj.dateStr);
                          }
                        }
                      }}
                      style={{
                        cursor: dayObj.dateStr <= todayStr ? 'pointer' : 'default'
                      }}
                      title={`${dayObj.dayName} ${dayObj.day}${hasAttended ? ' (Asistencia registrada - Haz clic para desmarcar)' : ''}`}
                    />
                  );
                })}
              </div>
            </section>

            {/* MODAL DE CONFIRMACIÓN */}
            {showConfirm && (
              <div className="overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div className="confirmation-box modal" style={{ background: 'var(--admin-card-soft, #1e1e2f)', padding: '25px', borderRadius: '14px', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(140,88,211,0.5)' }}>
                  <h3 style={{ color: 'white', marginBottom: '15px' }}>
                    {selectedDay ? `¿Asististe el ${selectedDay.dayName} ${selectedDay.day}?` : '¿Asististe al gimnasio hoy?'}
                  </h3>
                  <p style={{ color: 'var(--admin-muted, #aaa)', fontSize: '12px', marginBottom: '20px' }}>
                    {selectedDay ? `Fecha seleccionada: ${selectedDay.dateStr}` : `Fecha actual: ${todayStr}`}
                  </p>
                  <div className="confirm-buttons" style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-confirm yes"
                      onClick={() => handleAttendance(true, selectedDay?.dateStr || todayStr)}
                      style={{ flex: 1, background: 'rgba(46,204,113,0.2)', border: '1px solid #2ECC71', color: '#2ECC71', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Sí, asistí
                    </button>
                    <button
                      type="button"
                      className="btn-confirm no"
                      onClick={() => handleAttendance(false)}
                      style={{ flex: 1, background: 'rgba(231,76,60,0.2)', border: '1px solid #E74C3C', color: '#E74C3C', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      No, cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Spacer to allow scrolling above navbar on mobile */}
            <div className="navbar-spacer-mobile"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;