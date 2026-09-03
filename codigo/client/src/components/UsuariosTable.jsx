import React from 'react'

const UsuariosTable = ({
  usuarios,
  onVer,
  onEdit,
  onDelete
}) => {
  if (!usuarios || usuarios.length === 0) {
    return (
      <div className="usuarios-vacio">
        <span className="usuarios-vacio-icon">
          ♙
        </span>

        <p>
          No se encontraron usuarios
        </p>
      </div>
    )
  }

  return (
    <div className="usuarios-lista">

      {usuarios.map((usuario) => {
        const id =
          usuario.id ??
          usuario.id_usuario

        const nombreCompleto =
          `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()

        const estado =
          usuario.estado || 'Activo'

        return (
          <article
            className="usuario-card"
            key={id}
          >
            <div className="usuario-card-header">

              <div>
                <h2 className="usuario-card-nombre">
                  {nombreCompleto || 'Sin nombre'}
                </h2>

                <span className="usuario-card-id">
                  ID: {id}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span
                  className={`badge-estado ${estado === 'Inactivo'
                      ? 'inactivo'
                      : 'activo'
                    }`}
                >
                  {estado}
                </span>

                {usuario.rol !== 'admin' && (
                  <span
                    className={`badge-estado ${usuario.email_verificado === 1
                        ? 'activo'
                        : 'inactivo'
                      }`}
                  >
                    {usuario.email_verificado === 1 ? 'Email verificado' : 'Email pendiente'}
                  </span>
                )}
              </div>

            </div>

            <div className="usuario-card-datos">

              <div className="usuario-dato">
                <span className="usuario-dato-label">
                  Email:
                </span>

                <span className="usuario-dato-value">
                  {usuario.email || '—'}
                </span>
              </div>

              <div className="usuario-dato">
                <span className="usuario-dato-label">
                  Contraseña:
                </span>

                <span className="usuario-dato-value usuario-password">
                  ••••••
                </span>
              </div>

              <div className="usuario-dato">
                <span className="usuario-dato-label">
                  Experiencia:
                </span>

                <span className="usuario-dato-value">
                  {usuario.nivel_entrenamiento ||
                    '—'}
                </span>
              </div>

              <div className="usuario-dato">
                <span className="usuario-dato-label">
                  Objetivo:
                </span>

                <span className="usuario-dato-value">
                  {usuario.objetivo || '—'}
                </span>
              </div>

              <div className="usuario-dato">
                <span className="usuario-dato-label">
                  Altura:
                </span>

                <span className="usuario-dato-value">
                  {usuario.altura
                    ? `${usuario.altura} m`
                    : '—'}
                </span>
              </div>

              <div className="usuario-dato">
                <span className="usuario-dato-label">
                  Peso corporal:
                </span>

                <span className="usuario-dato-value">
                  {usuario.peso
                    ? `${usuario.peso} kg`
                    : '—'}
                </span>
              </div>

              <div className="usuario-dato">
                <span className="usuario-dato-label">
                  Rol:
                </span>

                <span className="usuario-dato-value">
                  {usuario.rol === 'admin'
                    ? 'Administrador'
                    : 'Atleta'}
                </span>
              </div>

            </div>

            <div className="usuario-card-acciones">

              <button
                id={`btn-ver-${id}`}
                type="button"
                className="btn-ver"
                onClick={() => onVer(usuario)}
                title="Ver detalle"
              >
                Ver
              </button>

              <button
                id={`btn-editar-${id}`}
                type="button"
                className="btn-editar"
                onClick={() => onEdit(usuario)}
                title="Editar usuario"
              >
                Editar
              </button>

              <button
                id={`btn-eliminar-${id}`}
                type="button"
                className="btn-eliminar"
                onClick={() => onDelete(usuario)}
                title="Eliminar usuario"
              >
                Eliminar
              </button>

            </div>
          </article>
        )
      })}

    </div>
  )
}

export default UsuariosTable