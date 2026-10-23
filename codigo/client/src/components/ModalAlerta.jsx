import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * ModalAlerta - Modal popup reutilizable con estética oscura y neón de Lifting Up
 * Cumple con la regla de validación preventiva sin usar alerts nativos ni toasts flotantes.
 */
export default function ModalAlerta({
  isOpen,
  titulo = 'Acción no permitida',
  mensaje = 'El valor ingresado es inválido.',
  tipo = 'error', // 'error' | 'warning' | 'info'
  onClose,
  botonTexto = 'Entendido'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const colorIcono = tipo === 'warning' ? '#f59e0b' : tipo === 'info' ? '#00d2ff' : '#ff4b72';
  const colorBorde = tipo === 'warning' ? 'rgba(245, 158, 11, 0.6)' : tipo === 'info' ? 'rgba(0, 210, 255, 0.6)' : 'rgba(195, 7, 205, 0.65)';
  const shadowNeon = tipo === 'warning'
    ? '0 0 25px rgba(245, 158, 11, 0.3), 0 20px 50px rgba(0, 0, 0, 0.85)'
    : tipo === 'info'
    ? '0 0 25px rgba(0, 210, 255, 0.3), 0 20px 50px rgba(0, 0, 0, 0.85)'
    : '0 0 30px rgba(195, 7, 205, 0.35), 0 20px 50px rgba(0, 0, 0, 0.85)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(3, 1, 16, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeInModalOverlay 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          background: 'linear-gradient(145deg, rgba(16, 10, 36, 0.98), rgba(9, 4, 24, 0.99))',
          borderRadius: '16px',
          border: `1px solid ${colorBorde}`,
          boxShadow: shadowNeon,
          padding: '24px 22px 20px 22px',
          color: '#ffffff',
          textAlign: 'center',
          animation: 'scaleUpModal 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        {/* Botón cerrar esquina */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
          >
            <X size={18} />
          </button>
        )}

        {/* Icono central de advertencia / error */}
        <div
          style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 16px auto',
            borderRadius: '50%',
            background: 'rgba(255, 75, 114, 0.12)',
            border: `1px solid ${colorIcono}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 16px ${colorIcono}44`
          }}
        >
          <AlertCircle size={28} color={colorIcono} />
        </div>

        {/* Título */}
        <h3
          style={{
            margin: '0 0 10px 0',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '0.3px',
            color: '#ffffff',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
          }}
        >
          {titulo}
        </h3>

        {/* Mensaje descriptivo */}
        <p
          style={{
            margin: '0 0 22px 0',
            fontSize: '14px',
            lineHeight: '1.55',
            color: '#d4cae8',
            wordBreak: 'break-word',
            whiteSpace: 'pre-line'
          }}
        >
          {mensaje}
        </p>

        {/* Botón de acción */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '11px 20px',
            background: 'linear-gradient(135deg, #C307CD 0%, #7B1FA2 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(195, 7, 205, 0.45)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(195, 7, 205, 0.65)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(195, 7, 205, 0.45)';
          }}
        >
          {botonTexto}
        </button>
      </div>
    </div>
  );
}
