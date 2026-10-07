import React from 'react';

const UsuarioForm = ({ form, handleChange, generarPassword, isEdit }) => {
  return (
    <div className="usuario-form-container">
      <div className="modal-grid">
        <div className="form-field-group">
          <label className="input-label-field" htmlFor="usuario-nombre">Nombre *</label>
          <input
            id="usuario-nombre"
            name="nombre"
            type="text"
            placeholder="Ej. Juan"
            value={form.nombre || ''}
            onChange={handleChange}
            className="input-modal"
            required
          />
        </div>

        <div className="form-field-group">
          <label className="input-label-field" htmlFor="usuario-apellido">Apellido *</label>
          <input
            id="usuario-apellido"
            name="apellido"
            type="text"
            placeholder="Ej. Pérez"
            value={form.apellido || ''}
            onChange={handleChange}
            className="input-modal"
            required
          />
        </div>

        <div className="form-field-group">
          <label className="input-label-field" htmlFor="usuario-email">Correo Electrónico *</label>
          <input
            id="usuario-email"
            name="email"
            type="email"
            placeholder="ejemplo@correo.com"
            value={form.email || ''}
            onChange={handleChange}
            className="input-modal"
            required
          />
        </div>

        <div className="form-field-group">
          <label className="input-label-field" htmlFor="usuario-peso">Peso (kg)</label>
          <input
            id="usuario-peso"
            name="peso"
            type="number"
            placeholder="Ej. 75"
            value={form.peso || ''}
            onChange={handleChange}
            className="input-modal"
          />
        </div>

        <div className="form-field-group">
          <label className="input-label-field" htmlFor="usuario-altura">Altura (cm)</label>
          <input
            id="usuario-altura"
            name="altura"
            type="number"
            placeholder="Ej. 175"
            value={form.altura || ''}
            onChange={handleChange}
            className="input-modal"
          />
        </div>

        <div className="form-field-group">
          <label className="input-label-field" htmlFor="usuario-password">
            {isEdit ? 'Contraseña *' : 'Contraseña *'}
          </label>
          <input
            id="usuario-password"
            name="password"
            type="text"
            placeholder="Mín. 8 caracteres (1 mayúscula, 1 minúscula, 1 número)"
            value={form.password || ''}
            onChange={handleChange}
            className="input-modal"
          />
          <span className="field-hint">
            Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.
          </span>
        </div>
      </div>

      <div className="form-field-group" style={{ marginTop: '8px' }}>
        <label className="input-label-field" htmlFor="usuario-nivel">Nivel de Entrenamiento</label>
        <select
          id="usuario-nivel"
          name="nivel_entrenamiento"
          value={form.nivel_entrenamiento || 'Principiante'}
          onChange={handleChange}
          className="input-modal"
        >
          <option value="Principiante">Principiante</option>
          <option value="Intermedio">Intermedio</option>
          <option value="Avanzado">Avanzado</option>
        </select>
      </div>

      <div className="form-field-group" style={{ marginTop: '8px' }}>
        <label className="input-label-field" htmlFor="usuario-objetivo">Objetivo</label>
        <select
          id="usuario-objetivo"
          name="objetivo"
          value={form.objetivo || 'Ganar masa muscular'}
          onChange={handleChange}
          className="input-modal"
        >
          <option value="Ganar masa muscular">Ganar masa muscular</option>
          <option value="Perder peso">Perder peso</option>
          <option value="Mejorar rendimiento">Mejorar rendimiento</option>
          <option value="Mantener condición física">Mantener condición física</option>
        </select>
      </div>

      {!isEdit && form.nombre && form.apellido && !form.password && (
        <p className="password-preview">
          Contraseña sugerida: <b>{generarPassword(form.nombre, form.apellido)}</b>
        </p>
      )}
    </div>
  );
};

export default UsuarioForm;
