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
  getAdmins,
  getEjercicios,
  createEjercicio,
  updateEjercicio,
  deleteEjercicio,
  getRutinas,
  createRutina,
  updateRutina,
  deleteRutina,
  getAsistencias
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

const FORM_EJERCICIO_INICIAL = {
  nombre: '',
  grupo_muscular: 'Pecho',
  descripcion: '',
  gif: ''
}

const FORM_RUTINA_INICIAL = {
  nombre: '',
  descripcion: '',
  dia_asignado: ''
}

const GRUPOS_MUSCULARES = [
  'Pecho',
  'Espalda',
  'Pierna',
  'Hombro',
  'Bíceps',
  'Tríceps',
  'Abdomen',
  'Glúteos',
  'Cardio',
  'Cuerpo Completo'
]

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

  // Usuarios & Admins
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

  // Asistencia
  const [asistenciasList, setAsistenciasList] = useState([])
  const [loadingAsistencia, setLoadingAsistencia] = useState(false)
  const [filtroFechaAsistencia, setFiltroFechaAsistencia] = useState('')
  const [busquedaAsistencia, setBusquedaAsistencia] = useState('')

  // Ejercicios
  const [ejerciciosList, setEjerciciosList] = useState([])
  const [loadingEjercicios, setLoadingEjercicios] = useState(false)
  const [busquedaEjercicio, setBusquedaEjercicio] = useState('')
  const [filtroGrupoEjercicio, setFiltroGrupoEjercicio] = useState('')
  const [modalCrearEjercicio, setModalCrearEjercicio] = useState(false)
  const [ejercicioEditando, setEjercicioEditando] = useState(null)
  const [formEjercicio, setFormEjercicio] = useState(FORM_EJERCICIO_INICIAL)
  const [confirmEliminarEjercicio, setConfirmEliminarEjercicio] = useState(null)

  // Rutinas Prearmadas
  const [rutinasList, setRutinasList] = useState([])
  const [loadingRutinas, setLoadingRutinas] = useState(false)
  const [busquedaRutina, setBusquedaRutina] = useState('')
  const [modalCrearRutina, setModalCrearRutina] = useState(false)
  const [rutinaEditando, setRutinaEditando] = useState(null)
  const [formRutina, setFormRutina] = useState(FORM_RUTINA_INICIAL)
  const [rutinaEjercicios, setRutinaEjercicios] = useState([])
  const [ejercicioSeleccionadoId, setEjercicioSeleccionadoId] = useState('')
  const [confirmEliminarRutina, setConfirmEliminarRutina] = useState(null)

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

  // Cargar Usuarios
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

  // Cargar Asistencias
  const cargarAsistencias = useCallback(async (fecha = '') => {
    setLoadingAsistencia(true)
    try {
      const res = await getAsistencias(fecha ? { fecha } : '')
      if (res?.success && Array.isArray(res.data)) {
        setAsistenciasList(res.data)
      } else {
        setAsistenciasList([])
      }
    } catch (error) {
      console.error('Error al cargar asistencias:', error)
      mostrarToast('Error al cargar asistencias', 'error')
    } finally {
      setLoadingAsistencia(false)
    }
  }, [])

  // Cargar Ejercicios
  const cargarEjercicios = useCallback(async () => {
    setLoadingEjercicios(true)
    try {
      const res = await getEjercicios()
      if (res?.success && Array.isArray(res.data)) {
        setEjerciciosList(res.data)
      } else {
        setEjerciciosList([])
      }
    } catch (error) {
      console.error('Error al cargar ejercicios:', error)
      mostrarToast('Error al cargar catálogo de ejercicios', 'error')
    } finally {
      setLoadingEjercicios(false)
    }
  }, [])

  // Cargar Rutinas Prearmadas
  const cargarRutinas = useCallback(async () => {
    setLoadingRutinas(true)
    try {
      const res = await getRutinas('', true)
      if (res?.success && Array.isArray(res.data)) {
        setRutinasList(res.data)
      } else {
        setRutinasList([])
      }
    } catch (error) {
      console.error('Error al cargar rutinas:', error)
      mostrarToast('Error al cargar rutinas prearmadas', 'error')
    } finally {
      setLoadingRutinas(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  // Cargar vistas al cambiar de pestaña
  useEffect(() => {
    if (vista === 'asistencia') {
      cargarAsistencias(filtroFechaAsistencia)
    } else if (vista === 'ejercicios') {
      cargarEjercicios()
    } else if (vista === 'rutinas') {
      cargarRutinas()
      cargarEjercicios() // Para tener el catálogo listo en el selector
    }
  }, [vista, filtroFechaAsistencia, cargarAsistencias, cargarEjercicios, cargarRutinas])

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
    const nomClean = nombre.trim()
    const apeClean = apellido.trim().toLowerCase()
    const nomCapitalized = nomClean.charAt(0).toUpperCase() + nomClean.slice(1).toLowerCase()
    return (
      nomCapitalized +
      '.' +
      apeClean +
      Math.floor(100 + Math.random() * 900)
    )
  }

  const abrirCrear = () => {
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
      password: usuario.password || '',
      peso: usuario.peso || '',
      altura: usuario.altura || '',
      nivel_entrenamiento:
        usuario.nivel_entrenamiento ||
        'Principiante',
      objetivo:
        usuario.objetivo ||
        'Ganar masa muscular'
    })
    setModalEditarAbierto(true)
  }

  const guardarNuevoRegistro = async () => {
    setGuardando(true)
    try {
      if (tipoAlta === 'admin') {
        if (!formAdmin.nombre || !formAdmin.apellido || !formAdmin.email || !formAdmin.password) {
          mostrarToast('Por favor completa todos los campos del Administrador', 'error')
          return
        }
        await createAdmin(formAdmin)
        mostrarToast('Administrador creado con éxito', 'success')
      } else {
        if (!formUsuario.nombre || !formUsuario.apellido || !formUsuario.email) {
          mostrarToast('Nombre, apellido y email son requeridos', 'error')
          return
        }
        const payload = {
          ...formUsuario,
          password: formUsuario.password || generarPassword(formUsuario.nombre, formUsuario.apellido),
          id_admin: admin?.id || null
        }
        await createUsuario(payload)
        mostrarToast('Usuario Atleta creado con éxito', 'success')
      }
      setFormUsuario(FORM_USUARIO_INICIAL)
      setFormAdmin(FORM_ADMIN_INICIAL)
      cambiarVista('usuarios')
      cargarUsuarios()
    } catch (error) {
      console.error('Error al crear registro:', error)
      mostrarToast(error.message || 'Error al crear el registro', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const guardarEdicionUsuario = async () => {
    if (!usuarioEditando) return
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (formUsuario.password && formUsuario.password.trim()) {
      if (!PASSWORD_REGEX.test(formUsuario.password)) {
        mostrarToast('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número', 'error')
        return
      }
    } else {
      mostrarToast('La contraseña es obligatoria al editar el usuario', 'error')
      return
    }
    setGuardando(true)
    try {
      const idUsuario = usuarioEditando.id ?? usuarioEditando.id_usuario
      await updateUsuario(idUsuario, formUsuario)
      mostrarToast('Usuario actualizado correctamente', 'success')
      setModalEditarAbierto(false)
      setUsuarioEditando(null)
      cargarUsuarios()
    } catch (error) {
      console.error('Error al editar usuario:', error)
      mostrarToast(error.message || 'Error al actualizar usuario', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarUsuario = async () => {
    if (!confirmEliminar) return
    setEliminando(true)
    try {
      const idUsuario = confirmEliminar.id ?? confirmEliminar.id_usuario
      await deleteUsuario(idUsuario)
      setUsuarios(prev => prev.filter(u => (u.id ?? u.id_usuario) !== idUsuario))
      mostrarToast(`${confirmEliminar.nombre} ${confirmEliminar.apellido} fue eliminado`, 'success')
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      mostrarToast(error.message || 'Error al eliminar el usuario', 'error')
    } finally {
      setEliminando(false)
      setConfirmEliminar(null)
    }
  }

  // ─── ACCIONES DE EJERCICIOS (ADMIN) ───────────────────────────────────────
  const abrirEditarEjercicio = (ej) => {
    setEjercicioEditando(ej)
    setFormEjercicio({
      nombre: ej.nombre || '',
      grupo_muscular: ej.grupo_muscular || 'Pecho',
      descripcion: ej.descripcion || '',
      gif: ej.gif || ''
    })
    setModalCrearEjercicio(true)
  }

  const handleGuardarEjercicio = async () => {
    if (!formEjercicio.nombre.trim()) {
      return mostrarToast('El nombre del ejercicio es obligatorio', 'error')
    }
    setGuardando(true)
    try {
      if (ejercicioEditando) {
        const res = await updateEjercicio(ejercicioEditando.id_ejercicio, formEjercicio)
        if (res?.success) {
          mostrarToast('Ejercicio actualizado correctamente', 'success')
        }
      } else {
        const res = await createEjercicio(formEjercicio)
        if (res?.success) {
          mostrarToast('Ejercicio agregado al catálogo oficial', 'success')
        }
      }
      setModalCrearEjercicio(false)
      setEjercicioEditando(null)
      setFormEjercicio(FORM_EJERCICIO_INICIAL)
      cargarEjercicios()
    } catch (error) {
      mostrarToast(error.message || 'Error al guardar ejercicio', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarEjercicio = async () => {
    if (!confirmEliminarEjercicio) return
    setEliminando(true)
    try {
      await deleteEjercicio(confirmEliminarEjercicio.id_ejercicio)
      mostrarToast('Ejercicio eliminado del catálogo', 'success')
      setConfirmEliminarEjercicio(null)
      cargarEjercicios()
    } catch (error) {
      mostrarToast(error.message || 'Error al eliminar ejercicio', 'error')
    } finally {
      setEliminando(false)
    }
  }

  // ─── ACCIONES DE RUTINAS PREARMADAS (ADMIN) ──────────────────────────────
  const abrirEditarRutina = (r) => {
    setRutinaEditando(r)
    setFormRutina({
      nombre: r.nombre || '',
      descripcion: r.descripcion || '',
      dia_asignado: r.dia_asignado || ''
    })
    setRutinaEjercicios(
      r.ejercicios && r.ejercicios.length > 0
        ? r.ejercicios.map(e => ({
            id_ejercicio: e.id_ejercicio,
            nombre: e.nombre,
            grupo_muscular: e.grupo_muscular,
            gif: e.gif,
            series: e.series || 3,
            repeticiones: e.repeticiones || 12,
            peso: e.peso || 0
          }))
        : []
    )
    setModalCrearRutina(true)
  }

  const agregarEjercicioARutinaDraft = () => {
    if (!ejercicioSeleccionadoId) return
    const ej = ejerciciosList.find(e => e.id_ejercicio === parseInt(ejercicioSeleccionadoId, 10))
    if (!ej) return
    setRutinaEjercicios(prev => [
      ...prev,
      {
        id_ejercicio: ej.id_ejercicio,
        nombre: ej.nombre,
        grupo_muscular: ej.grupo_muscular,
        gif: ej.gif,
        series: 3,
        repeticiones: 12,
        peso: 0
      }
    ])
    setEjercicioSeleccionadoId('')
  }

  const actualizarMetricaRutinaDraft = (index, field, value) => {
    setRutinaEjercicios(prev => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const quitarEjercicioRutinaDraft = (index) => {
    setRutinaEjercicios(prev => prev.filter((_, i) => i !== index))
  }

  const handleGuardarRutinaPrearmada = async () => {
    if (!formRutina.nombre.trim()) {
      return mostrarToast('El nombre de la rutina es obligatorio', 'error')
    }
    if (rutinaEjercicios.length === 0) {
      return mostrarToast('Agrega al menos un ejercicio a la rutina', 'error')
    }

    setGuardando(true)
    try {
      const payload = {
        nombre: formRutina.nombre.trim(),
        descripcion: formRutina.descripcion.trim(),
        dia_asignado: formRutina.dia_asignado || null,
        id_usuario: null, // Rutina prearmada global
        prearmada: 1,
        es_favorita: 0,
        ejercicios: rutinaEjercicios.map(e => ({
          id_ejercicio: e.id_ejercicio,
          series: parseInt(e.series, 10) || 3,
          repeticiones: parseInt(e.repeticiones, 10) || 12,
          peso: parseFloat(e.peso) || 0
        }))
      }
      if (rutinaEditando) {
        const res = await updateRutina(rutinaEditando.id_rutina, payload)
        if (res?.success) {
          mostrarToast('Rutina prearmada actualizada correctamente', 'success')
        }
      } else {
        const res = await createRutina(payload)
        if (res?.success) {
          mostrarToast('Rutina prearmada creada correctamente', 'success')
        }
      }
      setModalCrearRutina(false)
      setRutinaEditando(null)
      setFormRutina(FORM_RUTINA_INICIAL)
      setRutinaEjercicios([])
      cargarRutinas()
    } catch (error) {
      mostrarToast(error.message || 'Error al procesar rutina prearmada', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarRutina = async () => {
    if (!confirmEliminarRutina) return
    setEliminando(true)
    try {
      await deleteRutina(confirmEliminarRutina.id_rutina)
      mostrarToast('Rutina prearmada eliminada', 'success')
      setConfirmEliminarRutina(null)
      cargarRutinas()
    } catch (error) {
      mostrarToast(error.message || 'Error al eliminar rutina', 'error')
    } finally {
      setEliminando(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const moduloPendiente = (nombre) => {
    mostrarToast(`${nombre}: Sección en desarrollo`, 'error')
  }

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista)
    setBusqueda('')
  }

  // Filtros
  const usuariosFiltrados = usuarios.filter(u => {
    const texto = busqueda.trim().toLowerCase()
    return (
      u.nombre?.toLowerCase().includes(texto) ||
      u.apellido?.toLowerCase().includes(texto) ||
      u.email?.toLowerCase().includes(texto) ||
      u.objetivo?.toLowerCase().includes(texto) ||
      u.nivel_entrenamiento?.toLowerCase().includes(texto)
    )
  })

  const asistenciasFiltradas = asistenciasList.filter(a => {
    const texto = busquedaAsistencia.trim().toLowerCase()
    if (!texto) return true
    const nombreCompleto = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase()
    return nombreCompleto.includes(texto) || a.email?.toLowerCase().includes(texto)
  })

  const ejerciciosFiltrados = ejerciciosList.filter(e => {
    const texto = busquedaEjercicio.trim().toLowerCase()
    const coincideTexto = !texto || e.nombre?.toLowerCase().includes(texto) || e.descripcion?.toLowerCase().includes(texto)
    const coincideGrupo = !filtroGrupoEjercicio || e.grupo_muscular === filtroGrupoEjercicio
    return coincideTexto && coincideGrupo
  })

  const rutinasFiltradas = rutinasList.filter(r => {
    const texto = busquedaRutina.trim().toLowerCase()
    if (!texto) return true
    return r.nombre?.toLowerCase().includes(texto) || r.descripcion?.toLowerCase().includes(texto) || r.dia_asignado?.toLowerCase().includes(texto)
  })

  // Formateador de Fecha y Hora
  const formatearFechaHora = (fechaIso) => {
    if (!fechaIso) return { fecha: '-', hora: '-' }
    const d = new Date(fechaIso)
    if (isNaN(d.getTime())) return { fecha: fechaIso, hora: '-' }
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const anio = d.getFullYear()
    const horas = String(d.getHours()).padStart(2, '0')
    const minutos = String(d.getMinutes()).padStart(2, '0')
    const tieneHora = !(horas === '00' && minutos === '00' && d.getSeconds() === 0)
    return {
      fecha: `${dia}/${mes}/${anio}`,
      hora: tieneHora ? `${horas}:${minutos} hs` : 'Registrada'
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-layout">

        {/* SIDEBAR ADMIN (6 ELEMENTOS) */}
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
              className={`sidebar-item ${vista === 'home' ? 'activo' : ''}`}
              onClick={() => cambiarVista('home')}
            >
              <img
                src="/icons/admin/home.png"
                alt="Home"
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">Home</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${vista === 'usuarios' || vista === 'crear' ? 'activo' : ''}`}
              onClick={() => cambiarVista('usuarios')}
            >
              <img
                src="/icons/admin/usuarios.png"
                alt="Usuarios"
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">Usuarios</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${vista === 'asistencia' ? 'activo' : ''}`}
              onClick={() => cambiarVista('asistencia')}
            >
              <img
                src="/icons/admin/asistencia.png"
                alt="Asistencia"
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">Asistencia</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${vista === 'ejercicios' ? 'activo' : ''}`}
              onClick={() => cambiarVista('ejercicios')}
            >
              <img
                src="/icons/admin/ejercicios.png"
                alt="Ejercicios"
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">Ejercicios</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${vista === 'rutinas' ? 'activo' : ''}`}
              onClick={() => cambiarVista('rutinas')}
            >
              <img
                src="/icons/admin/rutina.png"
                alt="Rutina"
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">Rutina</span>
            </button>

            <button
              type="button"
              className="sidebar-item"
              onClick={() => moduloPendiente('Equipamiento')}
            >
              <img
                src="/icons/admin/mancuerna.png"
                alt="Equipamiento"
                className="sidebar-icon-img"
              />
              <span className="sidebar-text">Equipamiento</span>
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
              <span className="sidebar-text">Cerrar sesión</span>
            </button>
          </div>

        </nav>

        <div className="admin-main main-content">

          {/* TOPBAR */}
          <header className="admin-topbar">
            {/* IZQUIERDA */}
            <div className="topbar-left">
              {(vista === 'usuarios' || vista === 'asistencia' || vista === 'ejercicios' || vista === 'rutinas') && (
                <button
                  type="button"
                  className="topbar-action mobile-logout"
                  onClick={handleLogout}
                >
                  <img
                    src="/icons/admin/cerrar-sesion.png"
                    alt="Cerrar sesión"
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
                  className="btn-neon-grad"
                  onClick={abrirCrear}
                >
                  <span>+ Agregar Usuario</span>
                </button>
              )}
              {vista === 'ejercicios' && (
                <button
                  type="button"
                  className="btn-neon-grad"
                  onClick={() => {
                    setEjercicioEditando(null)
                    setFormEjercicio(FORM_EJERCICIO_INICIAL)
                    setModalCrearEjercicio(true)
                  }}
                >
                  <span>+ Nuevo Ejercicio</span>
                </button>
              )}
              {vista === 'rutinas' && (
                <button
                  type="button"
                  className="btn-neon-grad"
                  onClick={() => {
                    setRutinaEditando(null)
                    setFormRutina(FORM_RUTINA_INICIAL)
                    setRutinaEjercicios([])
                    setModalCrearRutina(true)
                  }}
                >
                  <span>+ Nueva Rutina</span>
                </button>
              )}
              {vista === 'asistencia' && (
                <button
                  type="button"
                  className="btn-neon-grad"
                  onClick={() => cargarAsistencias(filtroFechaAsistencia)}
                >
                  <span>Actualizar</span>
                </button>
              )}
            </div>
          </header>

          {/* VISTA HOME */}
          {vista === 'home' && (
            <main className="admin-content admin-home">
              <section className="home-welcome">
                <h1>“Hola, {admin?.nombre || 'Administrador'}”</h1>
              </section>

              <section className="home-cards">
                <div className="home-card" onClick={() => cambiarVista('usuarios')} style={{ cursor: 'pointer' }}>
                  <img
                    src="/icons/admin/flecha-derecha.png"
                    alt=""
                    className="summary-arrow-img"
                  />
                  <h2>Usuarios Registrados:</h2>
                  <p>
                    {usuarios.length + adminsList.length} usuarios totales ({usuarios.filter(u => u.activo === 1 || u.estado === 'Activo').length} atletas activos)
                  </p>
                </div>

                <div className="home-card" onClick={() => cambiarVista('asistencia')} style={{ cursor: 'pointer' }}>
                  <img
                    src="/icons/admin/flecha-derecha.png"
                    alt=""
                    className="summary-arrow-img"
                  />
                  <h2>Control de Asistencia:</h2>
                  <p>Consultar registro diario y mensual de atletas</p>
                  <div className="home-card-icons">
                    <img
                      src="/icons/admin/asistencia.png"
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

                <div className="home-card" onClick={() => cambiarVista('rutinas')} style={{ cursor: 'pointer' }}>
                  <img
                    src="/icons/admin/flecha-derecha.png"
                    alt=""
                    className="summary-arrow-img"
                  />
                  <h2>Rutinas y Ejercicios:</h2>
                  <p>Configurar catálogo y rutinas prearmadas oficiales</p>
                  <div className="home-card-icons">
                    <img
                      src="/icons/admin/ejercicios.png"
                      alt=""
                      className="summary-icon-img"
                    />
                    <img
                      src="/icons/admin/rutina.png"
                      alt=""
                      className="summary-icon-img"
                    />
                  </div>
                </div>
              </section>
            </main>
          )}

          {/* VISTA USUARIOS */}
          {vista === 'usuarios' && (
            <main className="admin-content">
              <section className="admin-title-section">
                <h1 className="admin-titulo">Gestión de Usuarios</h1>
                <p className="admin-subtitulo">
                  Bienvenido, {admin?.nombre || 'Administrador'}
                </p>
              </section>

              <section className="admin-search-section">
                <input
                  type="search"
                  placeholder="Buscar por nombre, email, objetivo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
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

          {/* VISTA ASISTENCIA (ADMIN) */}
          {vista === 'asistencia' && (
            <main className="admin-content">
              <section className="admin-title-section">
                <h1 className="admin-titulo">Registro de Asistencia</h1>
                <p className="admin-subtitulo">
                  Historial de asistencias de atletas con fecha y hora de ingreso
                </p>
              </section>

              {/* BARRA DE FILTROS */}
              <div className="panel-filtro-bar">
                <input
                  type="search"
                  placeholder="Buscar por alumno o email..."
                  value={busquedaAsistencia}
                  onChange={(e) => setBusquedaAsistencia(e.target.value)}
                  className="buscador"
                  style={{ flex: 1, minWidth: '220px', height: '46px' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={filtroFechaAsistencia}
                    onChange={(e) => setFiltroFechaAsistencia(e.target.value)}
                    className="input-filtro-fecha"
                    title="Filtrar por fecha específica"
                  />
                  {filtroFechaAsistencia && (
                    <button
                      type="button"
                      className="btn-cancelar"
                      onClick={() => setFiltroFechaAsistencia('')}
                      style={{ padding: '8px 12px', minHeight: 'unset', fontSize: '12px' }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {loadingAsistencia ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <p>Cargando asistencias...</p>
                </div>
              ) : asistenciasFiltradas.length > 0 ? (
                <div className="asistencia-grid">
                  {asistenciasFiltradas.map((a) => {
                    const dt = formatearFechaHora(a.fecha)
                    return (
                      <div key={a.id_asistencia} className="asistencia-card">
                        <div className="asistencia-header">
                          <div>
                            <h3 className="asistencia-alumno-nombre">
                              {a.nombre} {a.apellido}
                            </h3>
                            <p className="asistencia-alumno-email">{a.email}</p>
                          </div>
                          <span className="badge-estado activo">Presente</span>
                        </div>

                        <div className="asistencia-datetime-container">
                          <span className="asistencia-badge-fecha">
                            📅 {dt.fecha}
                          </span>
                          <span className="asistencia-badge-hora">
                            ⏰ {dt.hora}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="usuarios-vacio">
                  <div className="usuarios-vacio-icon">📅</div>
                  <p>No se encontraron registros de asistencia para los filtros seleccionados.</p>
                </div>
              )}
            </main>
          )}

          {/* VISTA EJERCICIOS (ADMIN) */}
          {vista === 'ejercicios' && (
            <main className="admin-content">
              <section className="admin-title-section">
                <h1 className="admin-titulo">Catálogo Oficial de Ejercicios</h1>
                <p className="admin-subtitulo">
                  Crea y administra los ejercicios oficiales que los atletas podrán seleccionar
                </p>
              </section>

              <div className="panel-filtro-bar">
                <input
                  type="search"
                  placeholder="Buscar ejercicio por nombre o descripción..."
                  value={busquedaEjercicio}
                  onChange={(e) => setBusquedaEjercicio(e.target.value)}
                  className="buscador"
                  style={{ flex: 1, minWidth: '220px', height: '46px' }}
                />

                <select
                  value={filtroGrupoEjercicio}
                  onChange={(e) => setFiltroGrupoEjercicio(e.target.value)}
                  className="input-filtro-fecha"
                  style={{ minWidth: '160px' }}
                >
                  <option value="">Todos los grupos</option>
                  {GRUPOS_MUSCULARES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {loadingEjercicios ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <p>Cargando ejercicios...</p>
                </div>
              ) : ejerciciosFiltrados.length > 0 ? (
                <div className="ejercicios-admin-grid">
                  {ejerciciosFiltrados.map((ej) => (
                    <div key={ej.id_ejercicio} className="ejercicio-card-admin">
                      {ej.gif ? (
                        <img
                          src={ej.gif}
                          alt={ej.nombre}
                          className="ejercicio-gif-thumb"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="ejercicio-gif-placeholder">
                          Sin GIF
                        </div>
                      )}

                      <div className="ejercicio-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 className="ejercicio-nombre">{ej.nombre}</h3>
                          <div className="card-action-btns">
                            <button
                              type="button"
                              className="btn-card-icon edit"
                              onClick={() => abrirEditarEjercicio(ej)}
                              title="Editar ejercicio"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn-card-icon delete"
                              onClick={() => setConfirmEliminarEjercicio(ej)}
                              title="Eliminar ejercicio"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        {ej.grupo_muscular && (
                          <span className="ejercicio-grupo">{ej.grupo_muscular}</span>
                        )}
                        <p className="ejercicio-descripcion">
                          {ej.descripcion || 'Sin descripción detallada.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="usuarios-vacio">
                  <div className="usuarios-vacio-icon">🏋️</div>
                  <p>No hay ejercicios cargados en este grupo muscular.</p>
                  <button
                    type="button"
                    className="btn-neon-grad"
                    onClick={() => {
                      setEjercicioEditando(null)
                      setFormEjercicio(FORM_EJERCICIO_INICIAL)
                      setModalCrearEjercicio(true)
                    }}
                    style={{ marginTop: '16px' }}
                  >
                    + Crear Primer Ejercicio
                  </button>
                </div>
              )}
            </main>
          )}

          {/* VISTA RUTINAS PREARMADAS (ADMIN) */}
          {vista === 'rutinas' && (
            <main className="admin-content">
              <section className="admin-title-section">
                <h1 className="admin-titulo">Rutinas Prearmadas</h1>
                <p className="admin-subtitulo">
                  Plantillas oficiales globales para que los atletas las consulten o usen de base
                </p>
              </section>

              <section className="admin-search-section">
                <input
                  type="search"
                  placeholder="Buscar rutinas prearmadas..."
                  value={busquedaRutina}
                  onChange={(e) => setBusquedaRutina(e.target.value)}
                  className="buscador"
                />
              </section>

              {loadingRutinas ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <p>Cargando rutinas prearmadas...</p>
                </div>
              ) : rutinasFiltradas.length > 0 ? (
                <div className="rutinas-admin-grid">
                  {rutinasFiltradas.map((r) => (
                    <div key={r.id_rutina} className="rutina-admin-card">
                      <div className="rutina-header">
                        <div>
                          <h3 className="rutina-titulo">{r.nombre}</h3>
                          {r.dia_asignado && (
                            <span className="badge-estado activo" style={{ marginTop: '4px', fontSize: '11px' }}>
                              Día: {r.dia_asignado}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge-prearmada">Oficial</span>
                          <div className="card-action-btns">
                            <button
                              type="button"
                              className="btn-card-icon edit"
                              onClick={() => abrirEditarRutina(r)}
                              title="Editar rutina"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn-card-icon delete"
                              onClick={() => setConfirmEliminarRutina(r)}
                              title="Eliminar rutina"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>

                      {r.descripcion && (
                        <p className="rutina-descripcion">{r.descripcion}</p>
                      )}

                      <div className="rutina-ejercicios-detalle">
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--admin-muted)', marginBottom: '4px' }}>
                          Ejercicios ({r.ejercicios?.length || 0}):
                        </div>
                        {r.ejercicios && r.ejercicios.length > 0 ? (
                          r.ejercicios.map((ej, idx) => (
                            <div key={idx} className="rutina-ejercicio-row">
                              <span>• {ej.nombre}</span>
                              <span className="ejercicio-row-metricas">
                                {ej.series} series × {ej.repeticiones} reps {Number(ej.peso) > 0 ? `(${ej.peso} kg)` : ''}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: '#7f7f7f' }}>Sin ejercicios detallados</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="usuarios-vacio">
                  <div className="usuarios-vacio-icon">📋</div>
                  <p>No hay rutinas prearmadas registradas.</p>
                  <button
                    type="button"
                    className="btn-neon-grad"
                    onClick={() => {
                      setRutinaEditando(null)
                      setFormRutina(FORM_RUTINA_INICIAL)
                      setRutinaEjercicios([])
                      setModalCrearRutina(true)
                    }}
                    style={{ marginTop: '16px' }}
                  >
                    + Crear Primera Rutina Prearmada
                  </button>
                </div>
              )}
            </main>
          )}

          {/* VISTA CREAR USUARIO / ADMIN */}
          {vista === 'crear' && (
            <main className="admin-content crear-page">
              <section className="admin-title-section">
                <h1 className="admin-titulo">Agregar Nuevo Registro</h1>
                <p className="admin-subtitulo">
                  Bienvenido, {admin?.nombre || 'Administrador'}
                </p>
              </section>

              <div className="tipo-usuario-tabs">
                <button
                  type="button"
                  className={`tipo-usuario-btn ${tipoAlta === 'admin' ? 'seleccionado' : ''}`}
                  onClick={() => setTipoAlta('admin')}
                >
                  Usuario Admin
                </button>
                <button
                  type="button"
                  className={`tipo-usuario-btn ${tipoAlta === 'usuario' ? 'seleccionado' : ''}`}
                  onClick={() => setTipoAlta('usuario')}
                >
                  Usuario Atleta
                </button>
              </div>

              <section className="crear-form-card">
                <div className="tipo-seleccionado">
                  {tipoAlta === 'admin' ? 'Usuario Admin' : 'Usuario Atleta'}
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

        {/* MODAL EDITAR USUARIO */}
        <UsuarioModal
          isOpen={modalEditarAbierto}
          title="Editar Usuario"
          onClose={() => {
            setModalEditarAbierto(false)
            setUsuarioEditando(null)
          }}
          onSave={guardarEdicionUsuario}
          saveText={guardando ? 'Guardando...' : 'Guardar'}
          disabled={guardando}
        >
          <UsuarioForm
            form={formUsuario}
            handleChange={handleChangeUsuario}
            generarPassword={generarPassword}
            isEdit
          />
        </UsuarioModal>

        {/* MODAL VER DETALLE USUARIO */}
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
                ['ID', modalVer.id ?? modalVer.id_usuario],
                ['Nombre completo', `${modalVer.nombre} ${modalVer.apellido}`],
                ['Email', modalVer.email],
                ['Contraseña', modalVer.password ? '••••••' : '—'],
                ['Peso', modalVer.peso ? `${modalVer.peso} kg` : '—'],
                ['Altura', modalVer.altura ? `${modalVer.altura} m` : '—'],
                ['Nivel', modalVer.nivel_entrenamiento || '—'],
                ['Objetivo', modalVer.objetivo || '—'],
                ['Estado', modalVer.estado || 'Activo'],
                modalVer.rol !== 'admin'
                  ? ['Estado Email', modalVer.email_verificado === 1 ? 'Verificado' : 'Pendiente']
                  : null
              ].filter(Boolean).map(([label, valor]) => (
                <div key={label} className="detalle-row">
                  <span className="detalle-label">{label}:</span>
                  <span className="detalle-valor">{valor}</span>
                </div>
              ))}
            </div>
          )}
        </UsuarioModal>

        {/* MODAL CONFIRMAR ELIMINAR USUARIO */}
        <UsuarioModal
          isOpen={Boolean(confirmEliminar)}
          title="¿Eliminar usuario?"
          onClose={() => setConfirmEliminar(null)}
          onSave={handleEliminarUsuario}
          saveText={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          disabled={eliminando}
          isSmall
        >
          {confirmEliminar && (
            <p className="confirm-texto">
              Vas a eliminar a <b>{confirmEliminar.nombre} {confirmEliminar.apellido}</b>. Esta acción no se puede deshacer.
            </p>
          )}
        </UsuarioModal>

        {/* MODAL CREAR O EDITAR EJERCICIO (ADMIN) */}
        {modalCrearEjercicio && (
          <div className="overlay">
            <div className="modal">
              <h2 className="modal-titulo">
                {ejercicioEditando ? 'Editar Ejercicio del Catálogo' : 'Nuevo Ejercicio en Catálogo'}
              </h2>
              <div className="modal-grid">
                <div className="form-field-group">
                  <label className="input-label-field">Nombre del Ejercicio *</label>
                  <input
                    className="input-modal"
                    placeholder="Nombre del Ejercicio (ej. Press de Banca)"
                    value={formEjercicio.nombre}
                    onChange={(e) => setFormEjercicio({ ...formEjercicio, nombre: e.target.value })}
                  />
                </div>
                <div className="form-field-group">
                  <label className="input-label-field">Grupo Muscular *</label>
                  <select
                    className="input-modal"
                    value={formEjercicio.grupo_muscular}
                    onChange={(e) => setFormEjercicio({ ...formEjercicio, grupo_muscular: e.target.value })}
                  >
                    {GRUPOS_MUSCULARES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field-group">
                  <label className="input-label-field">Descripción o Técnica (opcional)</label>
                  <textarea
                    className="input-modal"
                    placeholder="Descripción o técnica de ejecución"
                    value={formEjercicio.descripcion}
                    onChange={(e) => setFormEjercicio({ ...formEjercicio, descripcion: e.target.value })}
                    style={{ minHeight: '70px' }}
                  />
                </div>
                <div className="form-field-group">
                  <label className="input-label-field">URL GIF Demostrativo (opcional)</label>
                  <input
                    className="input-modal"
                    placeholder="URL del GIF explicativo (https://...)"
                    value={formEjercicio.gif}
                    onChange={(e) => setFormEjercicio({ ...formEjercicio, gif: e.target.value })}
                  />
                </div>
                {formEjercicio.gif && (
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--admin-muted)', display: 'block', marginBottom: '4px' }}>Vista previa del GIF:</span>
                    <img
                      src={formEjercicio.gif}
                      alt="Preview"
                      style={{ maxHeight: '100px', borderRadius: '8px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                )}
              </div>
              <div className="modal-btns">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => {
                    setModalCrearEjercicio(false)
                    setEjercicioEditando(null)
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-guardar"
                  onClick={handleGuardarEjercicio}
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : ejercicioEditando
                      ? 'Actualizar Ejercicio'
                      : 'Guardar Ejercicio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMAR ELIMINAR EJERCICIO */}
        <UsuarioModal
          isOpen={Boolean(confirmEliminarEjercicio)}
          title="¿Eliminar ejercicio del catálogo?"
          onClose={() => setConfirmEliminarEjercicio(null)}
          onSave={handleEliminarEjercicio}
          saveText={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          disabled={eliminando}
          isSmall
        >
          {confirmEliminarEjercicio && (
            <p className="confirm-texto">
              Vas a eliminar <b>{confirmEliminarEjercicio.nombre}</b> del catálogo oficial.
            </p>
          )}
        </UsuarioModal>

        {/* MODAL CREAR O EDITAR RUTINA PREARMADA (ADMIN) */}
        {modalCrearRutina && (
          <div className="overlay">
            <div className="modal" style={{ maxWidth: '440px' }}>
              <h2 className="modal-titulo">
                {rutinaEditando ? 'Editar Rutina Prearmada' : 'Nueva Rutina Prearmada'}
              </h2>
              <div className="modal-grid">
                <div className="form-field-group">
                  <label className="input-label-field">Nombre de la Rutina *</label>
                  <input
                    className="input-modal"
                    placeholder="Nombre de la Rutina (ej. Push - Empuje Hipertrofia)"
                    value={formRutina.nombre}
                    onChange={(e) => setFormRutina({ ...formRutina, nombre: e.target.value })}
                  />
                </div>
                <div className="form-field-group">
                  <label className="input-label-field">Descripción (opcional)</label>
                  <textarea
                    className="input-modal"
                    placeholder="Descripción de la rutina"
                    value={formRutina.descripcion}
                    onChange={(e) => setFormRutina({ ...formRutina, descripcion: e.target.value })}
                    style={{ minHeight: '60px' }}
                  />
                </div>
                <div className="form-field-group">
                  <label className="input-label-field">Día Asignado / Sugerido</label>
                  <select
                    className="input-modal"
                    value={formRutina.dia_asignado}
                    onChange={(e) => setFormRutina({ ...formRutina, dia_asignado: e.target.value })}
                  >
                    <option value="">Día sugerido (opcional)</option>
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div style={{ borderTop: '1px solid rgba(140, 88, 211, 0.3)', paddingTop: '12px', marginTop: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'white', display: 'block', marginBottom: '8px' }}>
                    Agregar ejercicio desde el catálogo:
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      className="input-modal"
                      value={ejercicioSeleccionadoId}
                      onChange={(e) => setEjercicioSeleccionadoId(e.target.value)}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <option value="">Selecciona un ejercicio...</option>
                      {ejerciciosList.map(e => (
                        <option key={e.id_ejercicio} value={e.id_ejercicio}>
                          {e.nombre} ({e.grupo_muscular || 'Gral'})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-guardar"
                      onClick={agregarEjercicioARutinaDraft}
                      style={{ padding: '0 16px', minHeight: '48px', borderRadius: '9px' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Lista de ejercicios agregados en el borrador */}
                {rutinaEjercicios.length > 0 && (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>
                      Ejercicios configurados ({rutinaEjercicios.length}):
                    </span>
                    {rutinaEjercicios.map((ej, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'rgba(20, 14, 55, 0.9)',
                          border: '1px solid rgba(0, 210, 255, 0.5)',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>
                            {ej.nombre}
                          </span>
                          <button
                            type="button"
                            onClick={() => quitarEjercicioRutinaDraft(index)}
                            style={{ background: 'transparent', border: 'none', color: '#ffb2b4', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                          <div>
                            <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Series</label>
                            <input
                              type="number"
                              className="input-modal"
                              style={{ minHeight: '32px', padding: '4px 8px', marginBottom: 0 }}
                              value={ej.series}
                              onChange={(e) => actualizarMetricaRutinaDraft(index, 'series', e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Reps</label>
                            <input
                              type="number"
                              className="input-modal"
                              style={{ minHeight: '32px', padding: '4px 8px', marginBottom: 0 }}
                              value={ej.repeticiones}
                              onChange={(e) => actualizarMetricaRutinaDraft(index, 'repeticiones', e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Peso (kg)</label>
                            <input
                              type="number"
                              className="input-modal"
                              style={{ minHeight: '32px', padding: '4px 8px', marginBottom: 0 }}
                              value={ej.peso}
                              onChange={(e) => actualizarMetricaRutinaDraft(index, 'peso', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-btns">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => {
                    setModalCrearRutina(false)
                    setRutinaEditando(null)
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-guardar"
                  onClick={handleGuardarRutinaPrearmada}
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : rutinaEditando
                      ? 'Actualizar Rutina Prearmada'
                      : 'Guardar Rutina Prearmada'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMAR ELIMINAR RUTINA PREARMADA */}
        <UsuarioModal
          isOpen={Boolean(confirmEliminarRutina)}
          title="¿Eliminar rutina prearmada?"
          onClose={() => setConfirmEliminarRutina(null)}
          onSave={handleEliminarRutina}
          saveText={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          disabled={eliminando}
          isSmall
        >
          {confirmEliminarRutina && (
            <p className="confirm-texto">
              Vas a eliminar la rutina <b>{confirmEliminarRutina.nombre}</b>. Los atletas que la hayan guardado como suya no se verán afectados.
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