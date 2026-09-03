import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  getCurrentUser,
  logout
} from '../features/authService.js'

import {
  getUsuarios,
  createUsuario,
  createAdmin,
  updateUsuario,
  deleteUsuario,
  getAdmins
} from '../services/api.js'

import UsuariosTable from '../components/UsuariosTable.jsx'
import UsuarioForm from '../components/UsuarioForm.jsx'
import AdminForm from '../components/AdminForm.jsx'
import UsuarioModal from '../components/UsuarioModal.jsx'

import '../styles/adminDashboard.css'

const FORM_USUARIO_INICIAL = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  peso: '',
  altura: '',
  nivel_entrenamiento: 'Principiante',
  objetivo: 'Ganar masa muscular'
}

const FORM_ADMIN_INICIAL = {
  nombre: '',
  apellido: '',
  email: '',
  password: ''
}

function Toast({ msg, tipo }) {
  if (!msg) return null

  return (
    <div className={`toast ${tipo}`}>
      {msg}
    </div>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const admin = getCurrentUser()

  const [vista, setVista] = useState('home')
  const [tipoAlta, setTipoAlta] = useState('usuario')

  const [usuarios, setUsuarios] = useState([])
  const [adminsList, setAdminsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalVer, setModalVer] = useState(null)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const [formUsuario, setFormUsuario] = useState(FORM_USUARIO_INICIAL)
  const [formAdmin, setFormAdmin] = useState(FORM_ADMIN_INICIAL)

  const [toast, setToast] = useState({
    msg: '',
    tipo: 'success'
  })

  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo })

    setTimeout(() => {
      setToast({
        msg: '',
        tipo: 'success'
      })
    }, 3500)
  }

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)

    try {
      const [responseUsuarios, responseAdmins] = await Promise.all([
        getUsuarios(),
        getAdmins()
      ])

      if (responseUsuarios?.success && Array.isArray(responseUsuarios.data)) {
        setUsuarios(responseUsuarios.data)
      } else if (Array.isArray(responseUsuarios)) {
        setUsuarios(responseUsuarios)
      } else {
        setUsuarios([])
      }

      if (responseAdmins?.success && Array.isArray(responseAdmins.data)) {
        setAdminsList(responseAdmins.data)
      } else if (Array.isArray(responseAdmins)) {
        setAdminsList(responseAdmins)
      } else {
        setAdminsList([])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      mostrarToast('No se pudieron cargar los datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  const handleChangeUsuario = (e) => {
    const { name, value } = e.target

    setFormUsuario(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleChangeAdmin = (e) => {
    const { name, value } = e.target

    setFormAdmin(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generarPassword = (nombre, apellido) => {
    if (!nombre || !apellido) return ''

    return (
      nombre.toLowerCase() +
      apellido.toLowerCase().charAt(0) +
      '123'
    ).replace(/\s/g, '')
  }

  const abrirCrear = () => {
    setTipoAlta('usuario')
    setFormUsuario(FORM_USUARIO_INICIAL)
    setFormAdmin(FORM_ADMIN_INICIAL)
    setVista('crear')
  }

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario)

    setFormUsuario({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      password: '',
      peso: usuario.peso || '',
      altura: usuario.altura || '',
      nivel_entrenamiento:
        usuario.nivel_entrenamiento || 'Principiante',
      objetivo:
        usuario.objetivo || 'Ganar masa muscular'
    })

    setModalEditarAbierto(true)
  }

  const guardarNuevoRegistro = async () => {
    setGuardando(true)

    try {
      if (tipoAlta === 'admin') {
        if (
          !formAdmin.nombre ||
          !formAdmin.apellido ||
          !formAdmin.email ||
          !formAdmin.password
        ) {
          mostrarToast(
            'Completá todos los datos del administrador',
            'error'
          )
        }

        const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!pwdRegex.test(formAdmin.password)) {
          mostrarToast('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.', 'error');
          return;
        }

        const res = await createAdmin(formAdmin)

        if (res?.success) {
          mostrarToast(
            'Administrador creado correctamente',
            'success'
          )

          setFormAdmin(FORM_ADMIN_INICIAL)
          setVista('usuarios')
        }

        return
      }

      if (
        !formUsuario.nombre ||
        !formUsuario.apellido ||
        !formUsuario.email
      ) {
        mostrarToast(
          'Completá Nombre, Apellido y Email',
          'error'
        )
        return
      }

      const dataToSave = {
        ...formUsuario
      }

      if (!dataToSave.password) {
        dataToSave.password = generarPassword(
          formUsuario.nombre,
          formUsuario.apellido
        )
      } else {
        const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!pwdRegex.test(dataToSave.password)) {
          mostrarToast('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.', 'error');
          return;
        }
      }

      const res = await createUsuario(dataToSave)

      if (res?.success) {
        if (res.data) {
          setUsuarios(prev => [
            ...prev,
            res.data
          ])
        } else {
          await cargarUsuarios()
        }

        mostrarToast(
          'Usuario atleta creado correctamente',
          'success'
        )

        setFormUsuario(FORM_USUARIO_INICIAL)
        setVista('usuarios')
      }
    } catch (error) {
      console.error('Error al crear registro:', error)

      mostrarToast(
        error.message || 'Error al crear el registro',
        'error'
      )
    } finally {
      setGuardando(false)
    }
  }

  const guardarEdicionUsuario = async () => {
    if (!usuarioEditando) return

    if (
      !formUsuario.nombre ||
      !formUsuario.apellido ||
      !formUsuario.email
    ) {
      mostrarToast(
        'Completá Nombre, Apellido y Email',
        'error'
      )
      return
    }

    setGuardando(true)

    try {
      const dataToSave = {
        ...formUsuario
      }

      if (!dataToSave.password) {
        delete dataToSave.password
      }

      const id =
        usuarioEditando.id ??
        usuarioEditando.id_usuario

      const res = await updateUsuario(
        id,
        dataToSave
      )

      if (res?.success) {
        const updated =
          res.data || {
            ...usuarioEditando,
            ...dataToSave
          }

        setUsuarios(prev =>
          prev.map(usuario => {
            const usuarioId =
              usuario.id ??
              usuario.id_usuario

            return usuarioId === id
              ? updated
              : usuario
          })
        )

        mostrarToast(
          'Usuario actualizado correctamente',
          'success'
        )

        setModalEditarAbierto(false)
        setUsuarioEditando(null)
      }
    } catch (error) {
      console.error(
        'Error al actualizar usuario:',
        error
      )

      mostrarToast(
        error.message ||
        'Error al actualizar el usuario',
        'error'
      )
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarUsuario = async () => {
    if (!confirmEliminar) return

    setEliminando(true)

    try {
      const id =
        confirmEliminar.id ??
        confirmEliminar.id_usuario

      const res = await deleteUsuario(id)

      if (res?.success) {
        setUsuarios(prev =>
          prev.filter(usuario => {
            const usuarioId =
              usuario.id ??
              usuario.id_usuario

            return usuarioId !== id
          })
        )

        mostrarToast(
          `${confirmEliminar.nombre} ${confirmEliminar.apellido} fue eliminado`,
          'success'
        )
      }
    } catch (error) {
      console.error(
        'Error al eliminar usuario:',
        error
      )

      mostrarToast(
        error.message ||
        'Error al eliminar el usuario',
        'error'
      )
    } finally {
      setEliminando(false)
      setConfirmEliminar(null)
    }
  }

  const usuariosFiltrados = usuarios.filter(usuario => {
    const texto = busqueda
      .trim()
      .toLowerCase()

    return (
      usuario.nombre
        ?.toLowerCase()
        .includes(texto) ||
      usuario.apellido
        ?.toLowerCase()
        .includes(texto) ||
      usuario.email
        ?.toLowerCase()
        .includes(texto) ||
      usuario.objetivo
        ?.toLowerCase()
        .includes(texto) ||
      usuario.nivel_entrenamiento
        ?.toLowerCase()
        .includes(texto)
    )
  })

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const moduloPendiente = (nombre) => {
    mostrarToast(
      `${nombre}: módulo en desarrollo`,
      'error'
    )
  }

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista)
    setBusqueda('')
  }

  return (
    <div className="admin-page">
      <div className="admin-layout">

        <nav className="admin-sidebar">

          <div className="sidebar-logo-container">
            <img
              src="/logo.png"
              alt="Lifting Up"
              className="admin-logo"
            />
          </div>

          <div className="sidebar-menu">

            <button
              type="button"
              className={`sidebar-item ${vista === 'home'
                ? 'activo'
                : ''
                }`}
              onClick={() =>
                cambiarVista('home')
              }
            >
              <img
                src="/icons/admin/home.png"
                alt=""
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">
                Home
              </span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${vista === 'usuarios' ||
                vista === 'crear'
                ? 'activo'
                : ''
                }`}
              onClick={() =>
                cambiarVista('usuarios')
              }
            >
              <img
                src="/icons/admin/usuarios.png"
                alt=""
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">
                Usuarios
              </span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() =>
                moduloPendiente('Estadísticas')
              }
            >
              <img
                src="/icons/admin/estadisticas-navbar.png"
                alt=""
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">
                Estadísticas
              </span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() =>
                moduloPendiente('Equipamiento')
              }
            >
              <img
                src="/icons/admin/mancuerna.png"
                alt=""
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">
                Equipamiento
              </span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() =>
                moduloPendiente('Asistencia')
              }
            >
              <img
                src="/icons/admin/asistencia.png"
                alt=""
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">
                Asistencia
              </span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() =>
                moduloPendiente('Ejercicios')
              }
            >
              <img
                src="/icons/admin/ejercicios.png"
                alt=""
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">
                Ejercicios
              </span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() =>
                moduloPendiente('Rutina')
              }
            >
              <img
                src="/icons/admin/rutina.png"
                alt=""
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">
                Rutina
              </span>
            </button>

          </div>

          <div className="sidebar-footer">
            <button
              type="button"
              className="sidebar-item logout-btn"
              onClick={handleLogout}
            >
              <img
                src="/icons/admin/cerrar-sesion.png"
                alt=""
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">
                Cerrar sesión
              </span>
            </button>
          </div>

        </nav>

        <div className="admin-main">

          <header className="admin-topbar">
            {/* IZQUIERDA */}
            <div className="topbar-left">
              {vista === 'usuarios' && (
                <button
                  type="button"
                  className="topbar-action mobile-logout"
                  onClick={handleLogout}
                >
                  <img
                    src="/icons/admin/cerrar-sesion.png"
                    alt=""
                    className="topbar-icon-img"
                  />
                </button>
              )}
              {vista === 'crear' && (
                <button
                  type="button"
                  className="topbar-action btn-volver-topbar"
                  onClick={() => cambiarVista('usuarios')}
                >
                  <img
                    src="/icons/admin/volver.png"
                    alt=""
                    className="topbar-icon-img"
                    style={{ width: '18px', height: '18px', marginRight: '4px' }}
                  /> Atrás
                </button>
              )}
            </div>

            {/* CENTRO */}
            <img
              src="/logo.png"
              alt="Lifting Up"
              className="admin-logo-mobile"
            />

            {/* DERECHA */}
            <div className="topbar-right">
              {vista === 'home' && (
                <button
                  type="button"
                  className="topbar-action perfil-admin-topbar"
                  onClick={() => moduloPendiente('Perfil')}
                >
                  <img
                    src="/icons/admin/perfil.png"
                    alt="Perfil"
                    className="perfil-icon-img"
                    style={{ width: '25px', height: '25px' }}
                  />
                  <span>Perfil</span>
                </button>
              )}
              {vista === 'usuarios' && (
                <button
                  type="button"
                  className="topbar-action btn-add-user"
                  onClick={abrirCrear}
                >
                  <img
                    src="/icons/admin/agregar-usuario.png"
                    alt=""
                    className="topbar-icon-img"
                  />
                  <span className="topbar-text">
                    Agregar usuario
                  </span>
                </button>
              )}
            </div>
          </header>

          {vista === 'home' && (
            <main className="admin-content admin-home">

              <section className="home-welcome">

                <img
                  src="/logo.png"
                  alt="Lifting Up"
                  className="home-logo"
                />

                <h1>
                  “Hola, {admin?.nombre || 'Administrador'}”
                </h1>

              </section>

              <section className="home-cards">

                <div className="home-card">
                  <img
                    src="/icons/admin/flecha-derecha.png"
                    alt=""
                    className="summary-arrow-img"
                  />

                  <h2>
                    Usuarios Activos:
                  </h2>

                  <p>
                    {usuarios.filter(
                      usuario =>
                        usuario.activo === 1 ||
                        usuario.estado === 'Activo'
                    ).length + adminsList.length}{' '}
                    usuarios activos
                  </p>
                </div>

                <div className="home-card">
                  <img
                    src="/icons/admin/flecha-derecha.png"
                    alt=""
                    className="summary-arrow-img"
                  />

                  <h2>
                    Asistencias hoy:
                  </h2>

                  <div className="home-card-icons">
                    <img
                      src="/icons/admin/estadisticas.png"
                      alt=""
                      className="summary-icon-img"
                    />
                    <img
                      src="/icons/admin/asistencias-tendencia.png"
                      alt=""
                      className="summary-icon-img"
                    />
                  </div>
                </div>

                <div className="home-card">
                  <img
                    src="/icons/admin/flecha-derecha.png"
                    alt=""
                    className="summary-arrow-img"
                  />

                  <h2>
                    Equipos en mantenimiento:
                  </h2>

                  <div className="home-card-icons">
                    <img
                      src="/icons/admin/mancuerna.png"
                      alt=""
                      className="summary-icon-img"
                    />
                    <img
                      src="/icons/admin/pesa-rusa.png"
                      alt=""
                      className="summary-icon-img"
                    />
                    <img
                      src="/icons/admin/pesas.png"
                      alt=""
                      className="summary-icon-img"
                    />
                  </div>
                </div>

              </section>

            </main>
          )}

          {vista === 'usuarios' && (
            <main className="admin-content">

              <section className="admin-title-section">
                <h1 className="admin-titulo">
                  Gestión de Usuarios
                </h1>

                <p className="admin-subtitulo">
                  Bienvenido,{' '}
                  {admin?.nombre ||
                    'Administrador'}
                </p>
              </section>

              <section className="admin-search-section">
                <input
                  type="search"
                  placeholder="Buscar por nombre, email, objetivo..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(e.target.value)
                  }
                  className="buscador"
                />
              </section>

              <section className="admin-users-section">

                {loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Cargando usuarios...</p>
                  </div>
                ) : (
                  <UsuariosTable
                    usuarios={usuariosFiltrados}
                    onVer={setModalVer}
                    onEdit={abrirModalEditar}
                    onDelete={setConfirmEliminar}
                  />
                )}

              </section>

            </main>
          )}

          {vista === 'crear' && (
            <main className="admin-content crear-page">

              <section className="admin-title-section">
                <h1 className="admin-titulo">
                  Agregar Nuevo Usuario
                </h1>

                <p className="admin-subtitulo">
                  Bienvenido,{' '}
                  {admin?.nombre ||
                    'Administrador'}
                </p>
              </section>

              <div className="tipo-usuario-tabs">

                <button
                  type="button"
                  className={`tipo-usuario-btn ${tipoAlta === 'admin'
                    ? 'seleccionado'
                    : ''
                    }`}
                  onClick={() =>
                    setTipoAlta('admin')
                  }
                >
                  Usuario Admin
                </button>

                <button
                  type="button"
                  className={`tipo-usuario-btn ${tipoAlta === 'usuario'
                    ? 'seleccionado'
                    : ''
                    }`}
                  onClick={() =>
                    setTipoAlta('usuario')
                  }
                >
                  Usuario Atleta
                </button>

              </div>

              <section className="crear-form-card">

                <div className="tipo-seleccionado">
                  {tipoAlta === 'admin'
                    ? 'Usuario Admin'
                    : 'Usuario Atleta'}
                </div>

                {tipoAlta === 'admin' ? (
                  <AdminForm
                    form={formAdmin}
                    handleChange={handleChangeAdmin}
                  />
                ) : (
                  <UsuarioForm
                    form={formUsuario}
                    handleChange={handleChangeUsuario}
                    generarPassword={generarPassword}
                    isEdit={false}
                  />
                )}

                <button
                  type="button"
                  className="btn-crear-registro"
                  onClick={guardarNuevoRegistro}
                  disabled={guardando}
                >
                  {guardando
                    ? 'Creando...'
                    : tipoAlta === 'admin'
                      ? 'Crear Administrador'
                      : 'Crear Usuario'}
                </button>

              </section>

            </main>
          )}

        </div>

        <UsuarioModal
          isOpen={modalEditarAbierto}
          title="Editar Usuario"
          onClose={() => {
            setModalEditarAbierto(false)
            setUsuarioEditando(null)
          }}
          onSave={guardarEdicionUsuario}
          saveText={
            guardando
              ? 'Guardando...'
              : 'Guardar'
          }
          disabled={guardando}
        >
          <UsuarioForm
            form={formUsuario}
            handleChange={handleChangeUsuario}
            generarPassword={generarPassword}
            isEdit
          />
        </UsuarioModal>

        <UsuarioModal
          isOpen={Boolean(modalVer)}
          title="Detalle del Usuario"
          onClose={() => setModalVer(null)}
          saveText="Cerrar"
          onSave={() => setModalVer(null)}
          cancelText={null}
        >
          {modalVer && (
            <div className="detalle-container">
              {[
                [
                  'ID',
                  modalVer.id ??
                  modalVer.id_usuario
                ],
                [
                  'Nombre completo',
                  `${modalVer.nombre} ${modalVer.apellido}`
                ],
                ['Email', modalVer.email],
                [
                  'Contraseña',
                  modalVer.password
                    ? '••••••'
                    : '—'
                ],
                [
                  'Peso',
                  modalVer.peso
                    ? `${modalVer.peso} kg`
                    : '—'
                ],
                [
                  'Altura',
                  modalVer.altura
                    ? `${modalVer.altura} m`
                    : '—'
                ],
                [
                  'Nivel',
                  modalVer.nivel_entrenamiento ||
                  '—'
                ],
                [
                  'Objetivo',
                  modalVer.objetivo || '—'
                ],
                [
                  'Estado',
                  modalVer.estado || 'Activo'
                ],
                modalVer.rol !== 'admin' ? [
                  'Estado Email',
                  modalVer.email_verificado === 1 ? 'Verificado' : 'Pendiente'
                ] : null
              ].filter(Boolean).map(([label, valor]) => (
                <div
                  key={label}
                  className="detalle-row"
                >
                  <span className="detalle-label">
                    {label}:
                  </span>

                  <span className="detalle-valor">
                    {valor}
                  </span>
                </div>
              ))}
            </div>
          )}
        </UsuarioModal>

        <UsuarioModal
          isOpen={Boolean(confirmEliminar)}
          title="¿Eliminar usuario?"
          onClose={() =>
            setConfirmEliminar(null)
          }
          onSave={handleEliminarUsuario}
          saveText={
            eliminando
              ? 'Eliminando...'
              : 'Sí, eliminar'
          }
          disabled={eliminando}
          isSmall
        >
          {confirmEliminar && (
            <p className="confirm-texto">
              Vas a eliminar a{' '}
              <b>
                {confirmEliminar.nombre}{' '}
                {confirmEliminar.apellido}
              </b>.
              Esta acción no se puede deshacer.
            </p>
          )}
        </UsuarioModal>

        <Toast
          msg={toast.msg}
          tipo={toast.tipo}
        />

      </div>
    </div>
  )
}

export default AdminDashboard