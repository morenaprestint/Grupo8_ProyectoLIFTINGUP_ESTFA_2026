import React from 'react';
import { ShieldCheck, Dumbbell, ArrowRight, X } from 'lucide-react';

export default function DualRoleModal({ isOpen, onClose, onSelectRole, userName }) {
  if (!isOpen) return null;

  return (
    <div
      className="dual-role-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dual-role-title"
    >
      <div className="dual-role-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="dual-role-close-btn"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="dual-role-header">
          <span className="dual-role-badge">Doble Permiso Asignado</span>
          <h2 id="dual-role-title" className="dual-role-title">
            ¡Hola, {userName || 'Usuario'}!
          </h2>
          <p className="dual-role-subtitle">
            Tu cuenta posee acceso tanto de <strong>Administrador</strong> como de <strong>Atleta</strong>.
            Seleccioná con qué rol deseás operar en esta sesión:
          </p>
        </div>

        <div className="dual-role-options">
          {/* Opción 1: Panel Administrador */}
          <button
            type="button"
            className="dual-role-btn-option admin"
            onClick={() => onSelectRole('admin')}
          >
            <div className="dual-role-icon-box admin">
              <ShieldCheck size={28} />
            </div>
            <div className="dual-role-info">
              <div className="dual-role-name-row">
                <span className="dual-role-name">Panel de Administrador</span>
                <ArrowRight size={16} className="dual-role-arrow" />
              </div>
              <p className="dual-role-desc">
                Gestión de atletas, inventario de equipamiento, catálogo de ejercicios y métricas del gimnasio.
              </p>
              <span className="dual-role-tag admin">Ruta: /admin-dashboard</span>
            </div>
          </button>

          {/* Opción 2: Portal de Atleta */}
          <button
            type="button"
            className="dual-role-btn-option atleta"
            onClick={() => onSelectRole('atleta')}
          >
            <div className="dual-role-icon-box atleta">
              <Dumbbell size={28} />
            </div>
            <div className="dual-role-info">
              <div className="dual-role-name-row">
                <span className="dual-role-name">Portal de Atleta</span>
                <ArrowRight size={16} className="dual-role-arrow" />
              </div>
              <p className="dual-role-desc">
                Tus entrenamientos activos, registro de asistencias, rutinas personalizadas y progreso físico.
              </p>
              <span className="dual-role-tag atleta">Ruta: /atleta-home</span>
            </div>
          </button>
        </div>

        <div className="dual-role-footer">
          <button type="button" className="dual-role-cancel-btn" onClick={onClose}>
            Cancelar y volver al login
          </button>
        </div>
      </div>
    </div>
  );
}
