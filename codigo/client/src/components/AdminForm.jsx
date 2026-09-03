import React from 'react'

const AdminForm = ({ form, handleChange }) => {
    return (
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
                placeholder="Correo electrónico"
                value={form.email || ''}
                onChange={handleChange}
                className="input-modal"
                required
            />

            <input
                name="password"
                type="text"
                placeholder="Contraseña"
                value={form.password || ''}
                onChange={handleChange}
                className="input-modal"
                required
            />
        </div>
    )
}

export default AdminForm