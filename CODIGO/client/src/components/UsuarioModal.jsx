import React from 'react';

const UsuarioModal = ({ 
  isOpen, 
  title, 
  onClose, 
  onSave, 
  children, 
  saveText = 'Guardar', 
  cancelText = 'Cancelar',
  isSmall = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div className={`modal ${isSmall ? 'modal-sm' : ''}`}>
        <h2 className="modal-titulo">{title}</h2>
        
        <div className="modal-content-body">
          {children}
        </div>

        <div className="modal-btns">
          {cancelText && (
            <button className="btn-cancelar" onClick={onClose}>
              {cancelText}
            </button>
          )}
          {onSave && (
            <button className={title.includes('Eliminar') ? 'btn-eliminar-confirm' : 'btn-guardar'} onClick={onSave}>
              {saveText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsuarioModal;
