import React from 'react';

const AdminForm = ({ form, handleChange }) => {
    const hoy = new Date();
    const maxFechaNac = new Date(hoy.getFullYear() - 14, hoy.getMonth(), hoy.getDate()).toISOString().slice(0, 10);
    const minFechaNac = new Date(hoy.getFullYear() - 100, hoy.getMonth(), hoy.getDate()).toISOString().slice(0, 10);

    return (
        <div className="modal-grid">
            <div className="form-field-group">
                <label className="input-label-field" htmlFor="admin-nombre">Nombre *</label>
                <input
                    id="admin-nombre"
                    name="nombre"
                    type="text"
                    placeholder="Ej. Martín"
                    value={form.nombre || ''}
                    onChange={handleChange}
                    className="input-modal"
                    required
                />
            </div>

            <div className="form-field-group">
                <label className="input-label-field" htmlFor="admin-apellido">Apellido *</label>
                <input
                    id="admin-apellido"
                    name="apellido"
                    type="text"
                    placeholder="Ej. González"
                    value={form.apellido || ''}
                    onChange={handleChange}
                    className="input-modal"
                    required
                />
            </div>

            <div className="form-field-group">
                <label className="input-label-field" htmlFor="admin-email">Correo Electrónico *</label>
                <input
                    id="admin-email"
                    name="email"
                    type="email"
                    placeholder="admin@liftingup.com"
                    value={form.email || ''}
                    onChange={handleChange}
                    className="input-modal"
                    pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                    title="Ingrese un correo electrónico válido con dominio completo (ej. admin@liftingup.com)"
                    required
                />
            </div>

            <div className="form-field-group">
                <label className="input-label-field" htmlFor="admin-fecha-nac">Fecha de Nacimiento </label>
                <input
                    id="admin-fecha-nac"
                    name="fecha_nacimiento"
                    type="date"
                    min={minFechaNac}
                    max={maxFechaNac}
                    value={form.fecha_nacimiento || ''}
                    onChange={handleChange}
                    className="input-modal"
                />
            </div>

            <div className="form-field-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label-field" htmlFor="admin-password">Contraseña *</label>
                <input
                    id="admin-password"
                    name="password"
                    type="text"
                    placeholder="Mín. 8 caracteres (1 mayúscula, 1 minúscula, 1 número)"
                    value={form.password || ''}
                    onChange={handleChange}
                    className="input-modal"
                    required
                />
                <span className="field-hint" style={{ fontSize: '12px', color: '#8fb8d6', marginTop: '4px', display: 'block' }}>
                    Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
                </span>
            </div>
        </div>
    );
};

export default AdminForm;