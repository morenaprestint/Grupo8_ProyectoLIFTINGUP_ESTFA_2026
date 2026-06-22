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
            <th>Edad</th>
            <th>Objetivo</th>
            <th>Nivel</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td>{u.apellido}</td>
              <td>{u.email}</td>
              <td>{u.edad || '—'}</td>
              <td>{u.objetivo || '—'}</td>
              <td>{u.nivel_entrenamiento || u.experiencia || '—'}</td>
              <td>
                <span className={`badge-estado ${u.estado === 'Inactivo' ? 'inactivo' : 'activo'}`}>
                  {u.estado || 'Activo'}
                </span>
              </td>
              <td>
                <button className="btn-ver" onClick={() => onVer(u)}>Ver</button>
                <button className="btn-editar" onClick={() => onEdit(u)}>Editar</button>
                <button className="btn-eliminar" onClick={() => onDelete(u)}>Eliminar</button>
              </td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan="9" className="tabla-vacio">No se encontraron usuarios</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsuariosTable;
