import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AtletaNavbar from '../components/AtletaNavbar';
import { getCurrentUser, logout } from '../features/authService';
import { getAsistencias, createAsistencia } from '../services/api';
import { useCalendarGrid } from '../hooks/useCalendarGrid';
import '../styles/attendance.css';

const Attendance = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [asistencias, setAsistencias] = useState([]);

  const {
    monthTitle,
    days,
    paddingDays,
    todayStr,
    getWeeklyDays,
    verificarAsistencia,
    irMesAnterior,
    irMesSiguiente
  } = useCalendarGrid({ startOnMonday: true });

  const cargarAsistencias = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getAsistencias(user.id);
      if (res?.success && Array.isArray(res.data)) {
        setAsistencias(res.data);
      }
    } catch (error) {
      console.error('Error al cargar asistencias:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    cargarAsistencias();
  }, [cargarAsistencias]);

  const attendanceMarkedToday = verificarAsistencia(todayStr, asistencias);

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
        cargarAsistencias();
      }
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const weeklyData = getWeeklyDays(asistencias);
  const attendedDaysCount = days.filter(d => verificarAsistencia(d.dateStr, asistencias)).length;

  return (
    <div className="attendance-page">
      <div className="admin-layout">
        {/* Unified Navbar */}
        <AtletaNavbar onLogout={handleLogout} />

        {/* Main Content Area */}
        <div className="admin-main attendance-main atleta-main main-content">
          <div className="attendance-content-centered">
            <h1 className="page-title">PROGRESO DEL ATLETA</h1>

            {/* Weekly Section */}
            <section className="attendance-card weekly-card">
              <h2 className="card-title">REGISTRO SEMANAL</h2>

              <div className="weekly-days">
                {weeklyData.map((item, index) => (
                  <div key={index} className="day-col">
                    <span className="day-name">{item.dayName}</span>
                    <div className="status-icon">
                      {item.status === 'yes' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#8C58D3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : item.status === 'no' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      ) : (
                        <span style={{ color: 'var(--text-muted, #7f7f7f)' }}>•</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="weekly-subtext">Asistencia Semanal: {weeklyData.filter(d => d.status === 'yes').length} días</p>

              {/* Action Button or Confirmation Modal */}
              {!showConfirm ? (
                <button
                  type="button"
                  className="btn-mark-attendance"
                  onClick={() => {
                    setSelectedDay(null);
                    setShowConfirm(true);
                  }}
                  disabled={attendanceMarkedToday}
                >
                  {attendanceMarkedToday ? "ASISTENCIA MARCADA HOY" : "MARCAR ASISTENCIA HOY"}
                </button>
              ) : (
                <div className="confirmation-box">
                  <h3>{selectedDay ? `¿Asististe el ${selectedDay.dayName} ${selectedDay.day}?` : '¿Asististe hoy?'}</h3>
                  <div className="confirm-buttons">
                    <button type="button" className="btn-confirm yes" onClick={() => handleAttendance(true, selectedDay?.dateStr || todayStr)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Sí, asistí
                    </button>
                    <button type="button" className="btn-confirm no" onClick={() => handleAttendance(false)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      No, cancelar
                    </button>
                  </div>
                  <p className="help-text">Confirma tu asistencia para registrarla en el sistema.</p>
                </div>
              )}
            </section>

            {/* Monthly Section */}
            <section className="attendance-card monthly-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <button type="button" onClick={irMesAnterior} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>❮</button>
                <h2 className="card-title" style={{ margin: 0 }}>{monthTitle}</h2>
                <button type="button" onClick={irMesSiguiente} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>❯</button>
              </div>

              <div className="monthly-stats">
                <span>Mes actual</span>
                <span>Días asistidos: {attendedDaysCount}</span>
              </div>

              <div className="monthly-grid">
                {Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`pad-${i}`} style={{ width: '26px', height: '26px' }} />
                ))}
                {days.map((dayObj) => {
                  const hasAttended = verificarAsistencia(dayObj.dateStr, asistencias);
                  return (
                    <div
                      key={dayObj.dateStr}
                      className={`grid-day ${hasAttended ? 'yes' : (dayObj.dateStr > todayStr ? 'pending' : 'no')}`}
                      onClick={() => {
                        if (dayObj.dateStr <= todayStr && !hasAttended) {
                          setSelectedDay(dayObj);
                          setShowConfirm(true);
                        }
                      }}
                      title={`${dayObj.dayName} ${dayObj.day}`}
                    />
                  );
                })}
              </div>
            </section>

            {/* Spacer to allow scrolling above navbar on mobile */}
            <div className="navbar-spacer-mobile"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
