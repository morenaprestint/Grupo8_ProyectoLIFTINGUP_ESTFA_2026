import React from 'react';

const UsuarioModal = ({
  isOpen,
  title,
  onClose,
  onSave,
  children,
  saveText    = 'Guardar',
  cancelText  = 'Cancelar',
  isSmall     = false,
  disabled    = false
}) => {
  if (!isOpen) return null;

  const isDelete = title?.toLowerCase().includes('eliminar');

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal ${isSmall ? 'modal-sm' : ''}`} role="dialog" aria-modal="true">
        <h2 className="modal-titulo">{title}</h2>

        <div className="modal-content-body">
          {children}
        </div>

        <div className="modal-btns">
          {cancelText && (
            <button className="btn-cancelar" onClick={onClose} disabled={disabled}>
              {cancelText}
            </button>
          )}
          {onSave && (
            <button
              className={isDelete ? 'btn-eliminar-confirm' : 'btn-guardar'}
              onClick={onSave}
              disabled={disabled}
              style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              {saveText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsuarioModal;
