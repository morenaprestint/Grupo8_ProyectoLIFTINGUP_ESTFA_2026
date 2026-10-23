import React from 'react';

const UsuarioForm = ({ form, handleChange, generarPassword, isEdit, esMismoAdmin }) => {
  const hoy = new Date();
  const maxFechaNac = new Date(hoy.getFullYear() - 14, hoy.getMonth(), hoy.getDate()).toISOString().slice(0, 10);
  const minFechaNac = new Date(hoy.getFullYear() - 100, hoy.getMonth(), hoy.getDate()).toISOString().slice(0, 10);
  const esAtleta = form.es_atleta === 1 || form.es_atleta === true || form.es_atleta === '1';

  return (
    <div className="usuario-form-container">
      <div className="modal-grid">
        {/* Nombre y Apellido */}
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

        {/* Email y Fecha de Nacimiento */}
        <div className="form-field-group">
          <label className="input-label-field" htmlFor="usuario-email">Correo Electrónico *</label>
          <input
            id="usuario-email"
            name="email"
            type="email"
            placeholder="usuario@gmail.com"
            value={form.email || ''}
            onChange={handleChange}
            className="input-modal"
            pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
            title="Ingrese un correo electrónico válido con dominio completo (ej. usuario@gmail.com)"
            required
          />
        </div>

        <div className="form-field-group">
          <label className="input-label-field" htmlFor="usuario-fecha-nac">
            Fecha de Nacimiento (Mín. 14 años)
          </label>
          <input
            id="usuario-fecha-nac"
            name="fecha_nacimiento"
            type="date"
            min={minFechaNac}
            max={maxFechaNac}
            value={form.fecha_nacimiento || ''}
            onChange={handleChange}
            className="input-modal"
          />
        </div>

        {/* Contraseña */}
        <div className="form-field-group full-width" style={{ gridColumn: 'span 2' }}>
          <label className="input-label-field" htmlFor="usuario-password">
            {isEdit ? 'Contraseña (opcional, dejar en blanco para conservar)' : 'Contraseña *'}
          </label>
          <input
            id="usuario-password"
            name="password"
            type="text"
            placeholder={isEdit ? "Dejar en blanco para no modificar" : "Mín. 8 caracteres (1 mayúscula, 1 minúscula, 1 número)"}
            value={form.password || ''}
            onChange={handleChange}
            className="input-modal"
            required={!isEdit}
          />
          <span className="field-hint">
            {isEdit
              ? 'Opcional. Si se modifica debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.'
              : 'Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.'}
          </span>
        </div>

        {/* Rol y Permisos (diferenciado: solo en edición) */}
        {isEdit && (
          <div className="form-field-group full-width" style={{ gridColumn: 'span 2' }}>
            <label className="input-label-field">Permisos y Rol del Usuario</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '6px', padding: '6px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#d8ecf8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="es_atleta"
                  checked={esAtleta}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (!checked && !(form.es_admin === 1 || form.es_admin === true || form.es_admin === '1')) {
                      handleChange({ target: { name: 'es_admin', value: 1 } });
                    }
                    handleChange({ target: { name: 'es_atleta', value: checked ? 1 : 0 } });
                  }}
                />
                Atleta
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  color: esMismoAdmin ? '#8fb8d6' : '#d8ecf8',
                  cursor: esMismoAdmin ? 'not-allowed' : 'pointer'
                }}
                title={esMismoAdmin ? "No puedes revocar tu propio rol de administrador" : undefined}
              >
                <input
                  type="checkbox"
                  name="es_admin"
                  disabled={Boolean(esMismoAdmin)}
                  checked={form.es_admin === 1 || form.es_admin === true || form.es_admin === '1'}
                  onChange={(e) => {
                    if (esMismoAdmin) return;
                    const checked = e.target.checked;
                    if (!checked && !esAtleta) {
                      handleChange({ target: { name: 'es_atleta', value: 1 } });
                    }
                    handleChange({ target: { name: 'es_admin', value: checked ? 1 : 0 } });
                  }}
                />
                Administrador {esMismoAdmin && <span style={{ fontSize: '11px', color: '#00b4d8', marginLeft: '4px' }}>(Tu cuenta - Protegido)</span>}
              </label>
            </div>
          </div>
        )}

        {/* Notificación informativa del estado de atleta */}
        <div style={{ gridColumn: 'span 2', padding: '10px 14px', background: esAtleta ? 'rgba(0, 180, 216, 0.08)' : 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: esAtleta ? '1px solid rgba(0, 180, 216, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)', color: esAtleta ? '#8fb8d6' : '#7f8c9b', fontSize: '13px' }}>
          {esAtleta 
            ? (isEdit 
                ? '💪 Perfil de Atleta activo: peso corporal (40 a 200 kg), altura, nivel y objetivo son campos obligatorios.' 
                : '🏋️ Alta Rápida de Atleta: todos los datos personales y campos físicos son estrictamente requeridos.')
            : 'ℹ️ Rol Administrador puro: las métricas físicas de atleta quedan desactivadas y se guardarán como NULL en la base de datos para evitar datos zombis.'}
        </div>

        {/* Peso Corporal (kg) con min="40" y max="200" decimales libres */}
        <div className="form-field-group" style={{ opacity: esAtleta ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
          <label className="input-label-field" htmlFor="usuario-peso">
            Peso Corporal (kg) {esAtleta ? '*' : ''} [40 a 200 kg] {!esAtleta && '(Desactivado)'}
          </label>
          <input
            id="usuario-peso"
            name="peso"
            type="text"
            inputMode="decimal"
            disabled={!esAtleta}
            required={esAtleta}
            placeholder={esAtleta ? "Ej. 89.6 (40 - 200 kg)" : "No aplica (No es atleta)"}
            value={esAtleta ? (form.peso ?? '') : ''}
            onChange={(e) => {
              const val = e.target.value.replace(',', '.');
              if (val === '' || /^\d*(\.\d*)?$/.test(val)) {
                handleChange({ target: { name: 'peso', value: val } });
              }
            }}
            className="input-modal"
          />
        </div>

        {/* Altura en metros (1.00 a 2.50) */}
        <div className="form-field-group" style={{ opacity: esAtleta ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
          <label className="input-label-field" htmlFor="usuario-altura">
            Altura (m) {esAtleta ? '*' : ''} [1.00 a 2.50 m] {!esAtleta && '(Desactivado)'}
          </label>
          <input
            id="usuario-altura"
            name="altura"
            type="number"
            step="0.01"
            min="1.00"
            max="2.50"
            disabled={!esAtleta}
            required={esAtleta}
            placeholder={esAtleta ? "Ej. 1.75" : "No aplica (No es atleta)"}
            value={esAtleta ? (form.altura ?? '') : ''}
            onChange={handleChange}
            className="input-modal"
          />
        </div>

        {/* Nivel y Objetivo lado a lado en 2 columnas */}
        <div className="form-field-group" style={{ opacity: esAtleta ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
          <label className="input-label-field" htmlFor="usuario-nivel">
            Nivel de Entrenamiento {esAtleta ? '*' : ''} {!esAtleta && '(Desactivado)'}
          </label>
          <select
            id="usuario-nivel"
            name="nivel_entrenamiento"
            disabled={!esAtleta}
            required={esAtleta}
            value={esAtleta ? (form.nivel_entrenamiento || '') : ''}
            onChange={handleChange}
            className="input-modal"
          >
            {esAtleta ? (
              <>
                <option value="">Selecciona nivel...</option>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </>
            ) : (
              <option value="">No aplica</option>
            )}
          </select>
        </div>

        <div className="form-field-group" style={{ opacity: esAtleta ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
          <label className="input-label-field" htmlFor="usuario-objetivo">
            Objetivo {esAtleta ? '*' : ''} {!esAtleta && '(Desactivado)'}
          </label>
          <select
            id="usuario-objetivo"
            name="objetivo"
            disabled={!esAtleta}
            required={esAtleta}
            value={esAtleta ? (form.objetivo || '') : ''}
            onChange={handleChange}
            className="input-modal"
          >
            {esAtleta ? (
              <>
                <option value="">Selecciona objetivo...</option>
                <option value="Ganar masa muscular">Ganar masa muscular</option>
                <option value="Perder peso">Perder peso</option>
                <option value="Mejorar rendimiento">Mejorar rendimiento</option>
                <option value="Mantener condición física">Mantener condición física</option>
              </>
            ) : (
              <option value="">No aplica</option>
            )}
          </select>
        </div>
      </div>

      {!isEdit && form.nombre && form.apellido && !form.password && (
        <p className="password-preview" style={{ marginTop: '14px' }}>
          Contraseña sugerida: <b>{generarPassword(form.nombre, form.apellido)}</b>
        </p>
      )}
    </div>
  );
};

export default UsuarioForm;
