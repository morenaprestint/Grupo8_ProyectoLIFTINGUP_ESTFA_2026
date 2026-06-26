import React from 'react';

const UsuariosTable = ({ usuarios, onVer, onEdit, onDelete }) => {
  return (
    <div className="tabla-wrapper">
      <table className="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>Objetivo</th>
            <th>Nivel</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id ?? u.id_usuario}>
              <td>{u.id ?? u.id_usuario}</td>
              <td>{u.nombre}</td>
              <td>{u.apellido}</td>
              <td>{u.email}</td>
              <td>{u.objetivo ?? '—'}</td>
              <td>{u.nivel_entrenamiento ?? '—'}</td>
              <td>
                <span className={`badge-estado ${u.estado === 'Inactivo' ? 'inactivo' : 'activo'}`}>
                  {u.estado ?? 'Activo'}
                </span>
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button
                  id={`btn-ver-${u.id ?? u.id_usuario}`}
                  className="btn-ver"
                  onClick={() => onVer(u)}
                  title="Ver detalle"
                >
                  Ver
                </button>
                <button
                  id={`btn-editar-${u.id ?? u.id_usuario}`}
                  className="btn-editar"
                  onClick={() => onEdit(u)}
                  title="Editar usuario"
                >
                  Editar
                </button>
                <button
                  id={`btn-eliminar-${u.id ?? u.id_usuario}`}
                  className="btn-eliminar"
                  onClick={() => onDelete(u)}
                  title="Eliminar usuario"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan="8" className="tabla-vacio">No se encontraron usuarios</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsuariosTable;
