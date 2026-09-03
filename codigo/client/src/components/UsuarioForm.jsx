import React from 'react';

const UsuarioForm = ({ form, handleChange, generarPassword, isEdit }) => {
  return (
    <>
      <div className="modal-grid">
        <input
          name="nombre"
          type="text"
          placeholder="Nombre"
          value={form.nombre || ''}
          onChange={handleChange}
          className="input-modal"
          required
        />
        <input
          name="apellido"
          type="text"
          placeholder="Apellido"
          value={form.apellido || ''}
          onChange={handleChange}
          className="input-modal"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email || ''}
          onChange={handleChange}
          className="input-modal"
          required
        />
        <input
          name="peso"
          type="number"
          placeholder="Peso (kg)"
          value={form.peso || ''}
          onChange={handleChange}
          className="input-modal"
        />
        <input
          name="altura"
          type="number"
          placeholder="Altura (cm)"
          value={form.altura || ''}
          onChange={handleChange}
          className="input-modal"
        />
        <input
          name="password"
          type="text"
          placeholder="Contraseña"
          value={form.password || ''}
          onChange={handleChange}
          className="input-modal"
        />
      </div>

      <select
        name="nivel_entrenamiento"
        value={form.nivel_entrenamiento || 'Principiante'}
        onChange={handleChange}
        className="input-modal"
      >
        <option value="Principiante">Principiante</option>
        <option value="Intermedio">Intermedio</option>
        <option value="Avanzado">Avanzado</option>
      </select>

      <select
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

      {!isEdit && form.nombre && form.apellido && !form.password && (
        <p className="password-preview">
          Contraseña sugerida: <b>{generarPassword(form.nombre, form.apellido)}</b>
        </p>
      )}
    </>
  );
};

export default UsuarioForm;
