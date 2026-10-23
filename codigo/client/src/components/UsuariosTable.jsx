import React from 'react'

const UsuariosTable = ({
  usuarios,
  onVer,
  onEdit,
  onDelete,
  currentUserId,
  currentUserEmail
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

        const esMismoAdmin = Boolean(
          (currentUserId && String(id) === String(currentUserId)) ||
          (currentUserEmail && usuario.email && currentUserEmail.toLowerCase() === usuario.email.toLowerCase())
        )

        return (
          <article
            className="usuario-card"
            key={id}
          >
            <div className="usuario-card-header">

              <div>
                <h2 className="usuario-card-nombre">
                  {nombreCompleto || 'Sin nombre'}
                  {esMismoAdmin && (
                    <span style={{ fontSize: '11px', marginLeft: '8px', color: '#00d2ff', fontWeight: 'normal' }}>
                      (Tu cuenta)
                    </span>
                  )}
                </h2>

                <span className="usuario-card-id">
                  ID: {id}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  className={`badge-estado ${estado === 'Inactivo'
                      ? 'inactivo'
                      : 'activo'
                    }`}
                >
                  {estado}
                </span>

                <span
                  className={`badge-estado ${Number(usuario.email_verificado) === 1 && !usuario.email_pendiente
                      ? 'activo'
                      : 'inactivo'
                    }`}
                >
                  {Number(usuario.email_verificado) === 1 && !usuario.email_pendiente ? 'Email verificado' : 'Email pendiente'}
                </span>

                {usuario.email_pendiente && (
                  <span
                    className="badge-estado inactivo"
                    style={{ background: 'rgba(243, 156, 18, 0.15)', color: '#f39c12', borderColor: 'rgba(243, 156, 18, 0.4)' }}
                    title={`Pendiente de verificar: ${usuario.email_pendiente}`}
                  >
                    Cambio pendiente
                  </span>
                )}
              </div>

            </div>

            <div className="usuario-card-datos">
              {(() => {
                const esAdminPuro = (Number(usuario.es_admin) === 1 || usuario.rol === 'admin') && !(Number(usuario.es_atleta) === 1);
                const rolNombre = esAdminPuro
                  ? 'Administrador'
                  : (Number(usuario.es_admin) === 1 && Number(usuario.es_atleta) === 1 ? 'Admin / Atleta' : 'Atleta');

                return (
                  <>
                    <div className="usuario-dato">
                      <span className="usuario-dato-label">Email:</span>
                      <span className="usuario-dato-value">
                        {usuario.email || 'No especificado'}
                        {usuario.email_pendiente && (
                          <small style={{ display: 'block', color: '#f39c12', fontSize: '11px' }}>
                            (Pendiente: {usuario.email_pendiente})
                          </small>
                        )}
                      </span>
                    </div>

                    <div className="usuario-dato">
                      <span className="usuario-dato-label">Rol:</span>
                      <span className="usuario-dato-value">{rolNombre}</span>
                    </div>

                    <div className="usuario-dato">
                      <span className="usuario-dato-label">Experiencia:</span>
                      <span className="usuario-dato-value">{usuario.nivel_entrenamiento || 'No especificado'}</span>
                    </div>

                    <div className="usuario-dato">
                      <span className="usuario-dato-label">Objetivo:</span>
                      <span className="usuario-dato-value">{usuario.objetivo || 'No especificado'}</span>
                    </div>

                    <div className="usuario-dato">
                      <span className="usuario-dato-label">Altura:</span>
                      <span className="usuario-dato-value">
                        {usuario.altura ? `${usuario.altura} m` : 'No especificado'}
                      </span>
                    </div>

                    <div className="usuario-dato">
                      <span className="usuario-dato-label">Peso corporal:</span>
                      <span className="usuario-dato-value">
                        {usuario.peso ? `${usuario.peso} kg` : 'No especificado'}
                      </span>
                    </div>
                  </>
                );
              })()}
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
                title={esMismoAdmin ? "Editar tu propia cuenta" : "Editar usuario"}
              >
                Editar
              </button>

              <button
                id={`btn-eliminar-${id}`}
                type="button"
                className="btn-eliminar"
                disabled={esMismoAdmin}
                onClick={() => {
                  if (esMismoAdmin) {
                    alert('Acción bloqueada: No puedes eliminar tu propia cuenta de administrador. Debe ser eliminada por otro administrador diferente.');
                    return;
                  }
                  onDelete(usuario);
                }}
                style={esMismoAdmin ? { opacity: 0.35, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
                title={esMismoAdmin ? 'No puedes eliminar tu propia cuenta de administrador' : 'Eliminar usuario'}
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