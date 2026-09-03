import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AtletaNavbar from '../components/AtletaNavbar';
import { logout } from '../features/authService';
import '../styles/attendance.css';

const Attendance = () => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  // For the monthly calendar (31 days)
  const [monthlyDays, setMonthlyDays] = useState(
    Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      status: 'pending' // 'pending', 'yes', 'no'
    }))
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  // Mock data for weekly attendance
  const weeklyData = [
    { day: 'lun', status: 'yes' },
    { day: 'mar', status: 'yes' },
    { day: 'mier', status: 'yes' },
    { day: 'jue', status: 'no' },
    { day: 'vie', status: 'yes' },
    { day: 'sab', status: 'yes' },
    { day: 'dom', status: 'no' },
  ];

  const currentMonth = 'Agosto';
  const attendedDaysCount = monthlyDays.filter(d => d.status === 'yes').length;

  const handleAttendance = (didAttend) => {
    // Backend logic here
    setAttendanceMarked(true);
    setShowConfirm(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openDayModal = (index) => {
    setSelectedDayIndex(index);
  };

  const markSpecificDay = (status) => {
    if (selectedDayIndex === null) return;
    const newDays = [...monthlyDays];
    newDays[selectedDayIndex].status = status;
    setMonthlyDays(newDays);
    setSelectedDayIndex(null);
  };

  const navItems = [
    { name: 'Home', path: '/home', icon: 'home.png' },
    { name: 'Progreso', path: '/progreso', icon: 'progreso.png' },
    { name: 'Nutrición', path: '/nutricion', icon: 'nutricion.png' },
    { name: 'Rutina', path: '/rutina', icon: 'rutina.png' },
    { name: 'Calendario', path: '/calendario', icon: 'calendario.png' },
    { name: 'Asistencia', path: '/asistencia', icon: 'asistencia.png' }
  ];

  return (
    <div className="attendance-page">
      <div className="admin-layout">
        {/* Unified Navbar */}
        <AtletaNavbar onLogout={handleLogout} />

        {/* Main Content Area */}
        <div className="admin-main attendance-main">
          
          <div className="attendance-content-centered">
            <img src="/logo.png" alt="LIFTING UP" className="attendance-main-logo" />
            <h1 className="page-title">PROGRESO DEL ATLETA</h1>

            {/* Weekly Section */}
            <section className="attendance-card weekly-card">
              <h2 className="card-title">REGISTRO SEMANAL</h2>

              <div className="weekly-days">
                {weeklyData.map((item, index) => (
                  <div key={index} className="day-col">
                    <span className="day-name">{item.day}</span>
                    <div className="status-icon">
                      {item.status === 'yes' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#8C58D3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="weekly-subtext">Asistencia Semanal: {weeklyData.filter(d => d.status === 'yes').length} días</p>

              {/* Action Button or Confirmation Modal */}
              {!showConfirm ? (
                <button
                  className="btn-mark-attendance"
                  onClick={() => setShowConfirm(true)}
                  disabled={attendanceMarked}
                >
                  {attendanceMarked ? "ASISTENCIA MARCADA" : "MARCAR ASISTENCIA HOY"}
                </button>
              ) : (
                <div className="confirmation-box">
                  <h3>¿Asististe hoy?</h3>
                  <div className="confirm-buttons">
                    <button className="btn-confirm yes" onClick={() => handleAttendance(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Sí, asistí
                    </button>
                    <button className="btn-confirm no" onClick={() => handleAttendance(false)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      No, no fui
                    </button>
                  </div>
                  <p className="help-text">Selecciona una opción para registrar tu asistencia hoy.</p>
                </div>
              )}
            </section>

            {/* Monthly Section */}
            <section className="attendance-card monthly-card">
              <h2 className="card-title">RESUMEN MENSUAL</h2>
              <div className="monthly-stats">
                <span>Mes actual ({currentMonth})</span>
                <span>Días asistidos: {attendedDaysCount}</span>
              </div>
              <div className="monthly-grid">
                {monthlyDays.map((dayObj, index) => (
                  <div
                    key={index}
                    className={`grid-day ${dayObj.status}`}
                    onClick={() => openDayModal(index)}
                  ></div>
                ))}
              </div>

              {/* Mini Modal for Monthly Grid Selection */}
              {selectedDayIndex !== null && (
                <div className="monthly-day-modal">
                  <h3>Día {selectedDayIndex + 1} - ¿Asististe?</h3>
                  <div className="confirm-buttons">
                    <button className="btn-confirm yes" onClick={() => markSpecificDay('yes')}>
                      Sí, fui
                    </button>
                    <button className="btn-confirm no" onClick={() => markSpecificDay('no')}>
                      No, no fui
                    </button>
                    <button className="btn-confirm cancel" onClick={() => setSelectedDayIndex(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
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
