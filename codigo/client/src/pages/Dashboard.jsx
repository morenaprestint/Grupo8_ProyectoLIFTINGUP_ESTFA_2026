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
  getAsistencias,
  formatearFechaEspanol,
  formatearAFechaISO
} from '../services/api.js'

import UsuariosTable from '../components/UsuariosTable.jsx'
import UsuarioForm from '../components/UsuarioForm.jsx'
import AdminForm from '../components/AdminForm.jsx'
import UsuarioModal from '../components/UsuarioModal.jsx'
import EquipamientoView from '../views/EquipamientoView.jsx'
import PerfilAdminView from '../views/PerfilAdminView.jsx'
import ModalAlerta from '../components/ModalAlerta.jsx'

import '../styles/adminDashboard.css'

const FORM_USUARIO_INICIAL = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  fecha_nacimiento: '',
  peso: '',
  altura: '',
  nivel_entrenamiento: 'Principiante',
  objetivo: 'Ganar masa muscular',
  es_atleta: 1,
  es_admin: 0
}

const FORM_ADMIN_INICIAL = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  fecha_nacimiento: '',
  es_atleta: 0,
  es_admin: 1
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
  'Pierna / Glúteo',
  'Hombro',
  'Bíceps',
  'Tríceps',
  'Abdomen',
  'Glúteos',
  'Cardio',
  'Cuerpo Completo'
]

const formatearGrupoMuscular = (g) => {
  if (!g) return 'General';
  const str = String(g).trim();
  if (['pierna', 'piernas'].includes(str.toLowerCase())) return 'Pierna / Glúteo';
  return str;
};

function Toast({ msg, tipo }) {
  if (!msg) return null

  return (
    <div className={`toast ${tipo}`}>
      {msg}
    </div>
  )
}

function AdminDashboard({ vistaInicial = 'home' }) {
  const navigate = useNavigate()
  const admin = getCurrentUser()

  const [vista, setVista] = useState(vistaInicial)

  useEffect(() => {
    if (vistaInicial) {
      setVista(vistaInicial)
    }
  }, [vistaInicial])

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
  const [backupAtleta, setBackupAtleta] = useState({
    peso: '',
    altura: '',
    nivel_entrenamiento: 'Principiante',
    objetivo: 'Ganar masa muscular'
  })

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

  // Modal Popup de validación y errores con estilo neón oscuro
  const [alertaModal, setAlertaModal] = useState({ isOpen: false, titulo: '', mensaje: '' })
  const mostrarModalError = (mensaje, titulo = 'Acción no permitida') => {
    setAlertaModal({ isOpen: true, titulo, mensaje })
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
    if (name === 'es_atleta') {
      const nuevoEsAtleta = Number(value) === 1 || value === true
      if (!nuevoEsAtleta) {
        // Desmarcó Atleta: respaldar métricas físicas actuales y limpiarlas en el formulario
        setBackupAtleta({
          peso: formUsuario.peso ?? '',
          altura: formUsuario.altura ?? '',
          nivel_entrenamiento: formUsuario.nivel_entrenamiento || 'Principiante',
          objetivo: formUsuario.objetivo || 'Ganar masa muscular'
        })
        setFormUsuario(prev => ({
          ...prev,
          es_atleta: 0,
          peso: '',
          altura: '',
          nivel_entrenamiento: '',
          objetivo: ''
        }))
        return
      } else {
        // Volvió a marcar Atleta: restaurar métricas físicas previamente respaldadas
        setFormUsuario(prev => ({
          ...prev,
          es_atleta: 1,
          peso: backupAtleta.peso !== '' ? backupAtleta.peso : (prev.peso || ''),
          altura: backupAtleta.altura !== '' ? backupAtleta.altura : (prev.altura || ''),
          nivel_entrenamiento: backupAtleta.nivel_entrenamiento || prev.nivel_entrenamiento || 'Principiante',
          objetivo: backupAtleta.objetivo || prev.objetivo || 'Ganar masa muscular'
        }))
        return
      }
    }

    let valorAjustado = value;
    if (name === 'peso' && typeof value === 'string') {
      valorAjustado = value.replace(',', '.');
    }

    setFormUsuario(prev => {
      const updated = {
        ...prev,
        [name]: valorAjustado
      }
      if (['peso', 'altura', 'nivel_entrenamiento', 'objetivo'].includes(name)) {
        setBackupAtleta(b => ({ ...b, [name]: valorAjustado }))
      }
      return updated
    })
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
    setBackupAtleta({
      peso: '',
      altura: '',
      nivel_entrenamiento: 'Principiante',
      objetivo: 'Ganar masa muscular'
    })
    setVista('crear')
  }

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario)
    setBackupAtleta({
      peso: usuario.peso ?? '',
      altura: usuario.altura ?? '',
      nivel_entrenamiento: usuario.nivel_entrenamiento || 'Principiante',
      objetivo: usuario.objetivo || 'Ganar masa muscular'
    })
    setFormUsuario({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      password: '',
      peso: usuario.peso ?? '',
      altura: usuario.altura ?? '',
      nivel_entrenamiento:
        usuario.nivel_entrenamiento ||
        'Principiante',
      objetivo:
        usuario.objetivo ||
        'Ganar masa muscular',
      fecha_nacimiento: formatearAFechaISO(usuario.fecha_nacimiento),
      es_admin: Number(usuario.es_admin) === 1 ? 1 : 0,
      es_atleta: Number(usuario.es_atleta) === 1 ? 1 : 0,
      activo: usuario.activo ?? 1
    })
    setModalEditarAbierto(true)
  }

  const guardarNuevoRegistro = async () => {
    setGuardando(true)
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    try {
      if (tipoAlta === 'admin') {
        if (!formAdmin.nombre || !formAdmin.apellido || !formAdmin.email || !formAdmin.password) {
          mostrarModalError('Por favor completa todos los campos del Administrador')
          setGuardando(false)
          return
        }
        if (!EMAIL_REGEX.test(formAdmin.email.trim())) {
          mostrarModalError('El correo electrónico debe ser una cuenta válida de Gmail (@gmail.com)')
          setGuardando(false)
          return
        }
        if (!PASSWORD_REGEX.test(formAdmin.password)) {
          mostrarToast('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número', 'error')
          return
        }
        if (formAdmin.fecha_nacimiento) {
          const fecha = new Date(formAdmin.fecha_nacimiento);
          const hoy = new Date();
          let edad = hoy.getFullYear() - fecha.getFullYear();
          const diffMeses = hoy.getMonth() - fecha.getMonth();
          if (diffMeses < 0 || (diffMeses === 0 && hoy.getDate() < fecha.getDate())) {
            edad--;
          }
          if (edad < 14) {
            mostrarToast('La edad mínima permitida es de 14 años cumplidos', 'error');
            return;
          }
          if (edad > 100) {
            mostrarToast('La fecha de nacimiento no es válida (edad máxima 100 años)', 'error');
            return;
          }
        }
        await createAdmin(formAdmin)
        mostrarToast('Administrador creado con éxito', 'success')
      } else {
        if (!formUsuario.nombre || !formUsuario.apellido || !formUsuario.email) {
          mostrarModalError('Nombre, apellido y email son requeridos')
          setGuardando(false)
          return
        }

        if (!EMAIL_REGEX.test(formUsuario.email.trim())) {
          mostrarModalError('El correo electrónico debe ser una cuenta válida de Gmail (@gmail.com)')
          setGuardando(false)
          return
        }

        if (formUsuario.password && formUsuario.password.trim()) {
          if (!PASSWORD_REGEX.test(formUsuario.password)) {
            mostrarToast('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número', 'error')
            return
          }
        }

        // Validación obligatoria de edad mínima (14 años)
        if (formUsuario.fecha_nacimiento) {
          const fecha = new Date(formUsuario.fecha_nacimiento);
          const hoy = new Date();
          let edad = hoy.getFullYear() - fecha.getFullYear();
          const diffMeses = hoy.getMonth() - fecha.getMonth();
          if (diffMeses < 0 || (diffMeses === 0 && hoy.getDate() < fecha.getDate())) {
            edad--;
          }
          if (edad < 14) {
            mostrarToast('La edad mínima permitida es de 14 años cumplidos', 'error');
            return;
          }
          if (edad > 100) {
            mostrarToast('La fecha de nacimiento no es válida (edad máxima 100 años)', 'error');
            return;
          }
        }

        // Validación obligatoria de campos físicos al asignar rol Atleta
        const esAtletaNuevo = formUsuario.es_atleta === 1 || formUsuario.es_atleta === true || formUsuario.es_atleta === '1';
        if (esAtletaNuevo) {
          if (
            formUsuario.peso === undefined || formUsuario.peso === null || String(formUsuario.peso).trim() === '' ||
            formUsuario.altura === undefined || formUsuario.altura === null || String(formUsuario.altura).trim() === '' ||
            !formUsuario.nivel_entrenamiento || String(formUsuario.nivel_entrenamiento).trim() === '' ||
            !formUsuario.objetivo || String(formUsuario.objetivo).trim() === ''
          ) {
            mostrarToast('Debe completar los datos físicos del atleta (peso, altura, nivel y objetivo)', 'error');
            return;
          }
        }

        // Validación estricta de altura (1.00 - 2.50) y peso (40 - 200 kg)
        if (formUsuario.altura !== undefined && formUsuario.altura !== null && formUsuario.altura !== '') {
          const alt = Number(formUsuario.altura);
          if (isNaN(alt) || alt < 1.00 || alt > 2.50) {
            mostrarToast('La altura debe estar estrictamente entre 1.00 y 2.50 metros', 'error');
            return;
          }
        }
        if (formUsuario.peso !== undefined && formUsuario.peso !== null && formUsuario.peso !== '') {
          const pesStr = String(formUsuario.peso).replace(',', '.');
          const pes = Number(pesStr);
          if (isNaN(pes) || pes < 40 || pes > 200) {
            mostrarToast('Error: Ingrese un peso válido (el peso corporal debe estar estrictamente entre 40 kg y 200 kg)', 'error');
            return;
          }
        }

        const payload = {
          ...formUsuario,
          peso: formUsuario.peso ? Number(String(formUsuario.peso).replace(',', '.')) : null,
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
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/

    if (formUsuario.email && !EMAIL_REGEX.test(formUsuario.email.trim())) {
      mostrarModalError('El correo electrónico debe ser una cuenta válida de Gmail (@gmail.com)')
      return
    }

    if (formUsuario.password && formUsuario.password.trim()) {
      if (!PASSWORD_REGEX.test(formUsuario.password)) {
        mostrarToast('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número', 'error')
        return
      }
    }

    // Validación obligatoria de edad mínima (14 años)
    if (formUsuario.fecha_nacimiento) {
      const fecha = new Date(formUsuario.fecha_nacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - fecha.getFullYear();
      const diffMeses = hoy.getMonth() - fecha.getMonth();
      if (diffMeses < 0 || (diffMeses === 0 && hoy.getDate() < fecha.getDate())) {
        edad--;
      }
      if (edad < 14) {
        mostrarToast('La edad mínima permitida es de 14 años cumplidos', 'error');
        return;
      }
      if (edad > 100) {
        mostrarToast('La fecha de nacimiento no es válida (edad máxima 100 años)', 'error');
        return;
      }
    }

    // Validación obligatoria de campos físicos al asignar rol Atleta
    const esAtleta = formUsuario.es_atleta === 1 || formUsuario.es_atleta === true || formUsuario.es_atleta === '1';
    if (esAtleta) {
      if (
        formUsuario.peso === undefined || formUsuario.peso === null || String(formUsuario.peso).trim() === '' ||
        formUsuario.altura === undefined || formUsuario.altura === null || String(formUsuario.altura).trim() === '' ||
        !formUsuario.nivel_entrenamiento || String(formUsuario.nivel_entrenamiento).trim() === '' ||
        !formUsuario.objetivo || String(formUsuario.objetivo).trim() === ''
      ) {
        mostrarToast('Debe completar los datos físicos del atleta (peso, altura, nivel y objetivo)', 'error');
        return;
      }

      const alt = Number(formUsuario.altura);
      if (isNaN(alt) || alt < 1.00 || alt > 2.50) {
        mostrarToast('La altura debe estar estrictamente entre 1.00 y 2.50 metros', 'error');
        return;
      }

      const pesStr = String(formUsuario.peso).replace(',', '.');
      const pes = Number(pesStr);
      if (isNaN(pes) || pes < 40 || pes > 200) {
        mostrarToast('Error: Ingrese un peso válido (el peso corporal debe estar estrictamente entre 40 kg y 200 kg)', 'error');
        return;
      }
    }

    setGuardando(true)
    try {
      const idUsuario = usuarioEditando.id ?? usuarioEditando.id_usuario
      // Persistir fecha de nacimiento previa si no se modificó explícitamente
      const fechaNacFinal = formatearAFechaISO(formUsuario.fecha_nacimiento) || formatearAFechaISO(usuarioEditando.fecha_nacimiento)
      const payload = {
        ...formUsuario,
        peso: esAtleta && formUsuario.peso ? Number(String(formUsuario.peso).replace(',', '.')) : null,
        fecha_nacimiento: fechaNacFinal
      }

      const res = await updateUsuario(idUsuario, payload, admin?.id, admin?.email)
      if (res?.requiereRevalidarSesion) {
        mostrarToast('Has solicitado cambiar tu correo electrónico. Por seguridad tu sesión se cerrará. Verifica tu nuevo correo e inicia sesión nuevamente.', 'info')
        setTimeout(() => {
          logout()
          localStorage.clear()
          navigate('/login')
        }, 2000)
        return
      }

      if (res?.emailPendiente) {
        mostrarToast('Se envió un código de verificación de 6 dígitos al nuevo correo. El cambio se aplicará al confirmarlo.', 'info')
      } else if (res?.emailPendienteCancelado) {
        mostrarToast('Solicitud de cambio de correo cancelada. Se mantiene el correo actual.', 'info')
      } else {
        mostrarToast('Usuario actualizado correctamente', 'success')
      }
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
    const idUsuario = confirmEliminar.id ?? confirmEliminar.id_usuario
    if (String(idUsuario) === String(admin?.id) || (admin?.email && confirmEliminar.email?.toLowerCase() === admin.email.toLowerCase())) {
      mostrarToast('Por seguridad, no puedes eliminar tu propia cuenta de administrador.', 'error')
      setConfirmEliminar(null)
      return
    }
    setEliminando(true)
    try {
      await deleteUsuario(idUsuario, admin?.id, admin?.email)
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

    // Validación estricta de URL web en GIF demostrativo
    if (formEjercicio.gif && formEjercicio.gif.trim()) {
      try {
        const parsed = new URL(formEjercicio.gif.trim())
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return mostrarToast('El enlace del GIF demostrativo debe comenzar con http:// o https://', 'error')
        }
      } catch {
        return mostrarToast('El enlace del GIF demostrativo debe ser una URL web válida (ej. https://ejemplo.com/ejercicio.gif)', 'error')
      }
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
    if (value === '') {
      setRutinaEjercicios(prev => {
        const copy = [...prev]
        copy[index][field] = ''
        return copy
      })
      return
    }

    const numVal = Number(value)
    if (isNaN(numVal) || numVal < 0) {
      mostrarModalError('Acción no permitida: el valor ingresado es inválido. Ingrese un valor numérico mayor o igual a 0.')
      return
    }

    if (field === 'series') {
      if (numVal < 1 || numVal > 5) {
        mostrarModalError('Acción no permitida: el valor ingresado es inválido. Las series deben estar estrictamente entre 1 y 5.')
        return
      }
    }

    if (field === 'repeticiones') {
      if (numVal < 1 || numVal > 15) {
        mostrarModalError('Acción no permitida: el valor ingresado es inválido. Las repeticiones deben estar estrictamente entre 1 y 15.')
        return
      }
    }

    if (field === 'peso' && numVal > 350) {
      mostrarModalError('Acción no permitida: el valor ingresado es inválido. El peso máximo permitido es de 350 kg.')
      return
    }

    setRutinaEjercicios(prev => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const handleGuardarRutinaPrearmada = async () => {
    if (!formRutina.nombre.trim()) {
      return mostrarModalError('El nombre de la rutina es obligatorio', 'Campo requerido')
    }
    if (rutinaEjercicios.length === 0) {
      return mostrarModalError('Agrega al menos un ejercicio a la rutina', 'Ejercicios requeridos')
    }

    const tieneMetricaInvalida = rutinaEjercicios.some(e => {
      const p = Number(e.peso)
      const s = Number(e.series)
      const r = Number(e.repeticiones)
      return isNaN(p) || p < 0 || p > 350 || isNaN(s) || s < 1 || s > 5 || isNaN(r) || r < 1 || r > 15
    })

    if (tieneMetricaInvalida) {
      mostrarModalError('Acción no permitida: el valor ingresado es inválido. Verifique que los valores cumplan: Series (1-5), Repeticiones (1-15) y Peso (0-350 kg).')
      return
    }
    // ...

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
          id_ejercicio: e.id_ejercicio || e.id,
          series: Number(e.series) || 3,
          repeticiones: Number(e.repeticiones) || 10,
          peso: Number(e.peso) || 0
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
    const nombreCompleto = (a.nombre_completo || `${a.nombre || ''} ${a.apellido || ''}`).toLowerCase()
    return nombreCompleto.includes(texto) || a.email?.toLowerCase().includes(texto)
  })

  const ejerciciosFiltrados = ejerciciosList.filter(e => {
    const texto = busquedaEjercicio.trim().toLowerCase()
    const coincideTexto = !texto || e.nombre?.toLowerCase().includes(texto) || e.descripcion?.toLowerCase().includes(texto)
    const coincideGrupo = !filtroGrupoEjercicio || 
      e.grupo_muscular === filtroGrupoEjercicio ||
      (filtroGrupoEjercicio === 'Pierna / Glúteo' && ['pierna', 'piernas'].includes((e.grupo_muscular || '').toLowerCase()))
    return coincideTexto && coincideGrupo
  })

  const rutinasFiltradas = rutinasList.filter(r => {
    const texto = busquedaRutina.trim().toLowerCase()
    if (!texto) return true
    return r.nombre?.toLowerCase().includes(texto) || r.descripcion?.toLowerCase().includes(texto) || r.dia_asignado?.toLowerCase().includes(texto)
  })

  // Formateador de Fecha y Hora legible (DD/MM/YYYY HH:mm)
  const formatearFechaHora = (fechaInput) => {
    if (!fechaInput) return { fecha: '-', hora: '-' }

    // Parseo directo si viene como string SQL 'YYYY-MM-DD HH:mm:ss' para evitar desfases de zona horaria
    if (typeof fechaInput === 'string' && fechaInput.includes('-')) {
      const parts = fechaInput.replace('T', ' ').split(' ')
      const datePart = parts[0]
      const timePart = parts[1] ? parts[1].slice(0, 5) : ''

      const [anio, mes, dia] = datePart.split('-')
      if (anio && mes && dia) {
        return {
          fecha: `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`,
          hora: timePart ? `${timePart} hs` : 'Registrada'
        }
      }
    }

    const d = new Date(fechaInput)
    if (isNaN(d.getTime())) return { fecha: String(fechaInput), hora: '-' }
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
              className={`sidebar-item ${vista === 'equipamiento' ? 'activo' : ''}`}
              onClick={() => cambiarVista('equipamiento')}
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
              {(vista === 'usuarios' || vista === 'asistencia' || vista === 'ejercicios' || vista === 'rutinas' || vista === 'equipamiento' || vista === 'perfil') && (
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
              {(vista === 'home' || vista === 'equipamiento' || vista === 'perfil') && (
                <button
                  type="button"
                  className={`topbar-action perfil-admin-topbar ${vista === 'perfil' ? 'activo' : ''}`}
                  onClick={() => cambiarVista('perfil')}
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
                    currentUserId={admin?.id}
                    currentUserEmail={admin?.email}
                    onVer={setModalVer}
                    onEdit={abrirModalEditar}
                    onDelete={(u) => {
                      const idUsuario = u.id ?? u.id_usuario
                      if (String(idUsuario) === String(admin?.id) || (admin?.email && u.email?.toLowerCase() === admin.email.toLowerCase())) {
                        mostrarToast('Por seguridad, no puedes eliminar tu propia cuenta de administrador.', 'error')
                        return
                      }
                      setConfirmEliminar(u)
                    }}
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
                    min="2025-01-01"
                    max="2027-12-31"
                    value={filtroFechaAsistencia}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) {
                        const anio = parseInt(val.slice(0, 4), 10)
                        if (anio < 2025 || anio > 2027) {
                          mostrarToast('Rango de fecha permitido: 2025 a 2027', 'error')
                          return
                        }
                      }
                      setFiltroFechaAsistencia(val)
                    }}
                    className="input-filtro-fecha"
                    title="Filtrar por fecha específica (2025 a 2027)"
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
                    const dt = formatearFechaHora(a.fecha_formateada || a.fecha)
                    const nombreMostrar = a.nombre_completo || (a.nombre ? `${a.nombre} ${a.apellido || ''}`.trim() : (a.email || 'Usuario'))
                    return (
                      <div key={a.id_asistencia} className="asistencia-card">
                        <div className="asistencia-header">
                          <div>
                            <h3 className="asistencia-alumno-nombre">
                              {nombreMostrar}
                            </h3>
                            {a.email && <p className="asistencia-alumno-email">{a.email}</p>}
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
                          <span className="ejercicio-grupo">{formatearGrupoMuscular(ej.grupo_muscular)}</span>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                {ej.gif ? (
                                  <img
                                    src={ej.gif}
                                    alt={ej.nombre}
                                    className="rutina-ejercicio-mini-gif"
                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                  />
                                ) : (
                                  <div className="rutina-ejercicio-mini-placeholder">💪</div>
                                )}
                                <div className="rutina-ejercicio-info">
                                  <span className="rutina-ejercicio-nombre-text">{ej.nombre}</span>
                                  <span className="rutina-ejercicio-grupo">{formatearGrupoMuscular(ej.grupo_muscular)}</span>
                                </div>
                              </div>
                              <span className="ejercicio-row-metricas">
                                {ej.series}s × {ej.repeticiones}r {Number(ej.peso) > 0 ? `(${ej.peso} kg)` : ''}
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
                    esMismoAdmin={false}
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

          {/* VISTA EQUIPAMIENTO */}
          {vista === 'equipamiento' && (
            <main className="admin-content dashboard-content">
              <EquipamientoView />
            </main>
          )}

          {/* VISTA PERFIL ADMIN */}
          {vista === 'perfil' && (
            <main className="admin-content dashboard-content">
              <PerfilAdminView />
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
            esMismoAdmin={Boolean(
              usuarioEditando && (
                String(usuarioEditando.id ?? usuarioEditando.id_usuario) === String(admin?.id) ||
                (admin?.email && usuarioEditando.email?.toLowerCase() === admin.email.toLowerCase())
              )
            )}
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
              {(() => {
                const esAdminPuro = (Number(modalVer.es_admin) === 1 || modalVer.rol === 'admin') && !(Number(modalVer.es_atleta) === 1);
                const rolTexto = esAdminPuro
                  ? 'Administrador'
                  : (Number(modalVer.es_admin) === 1 && Number(modalVer.es_atleta) === 1 ? 'Doble Rol (Admin y Atleta)' : 'Atleta');

                const filas = [
                  ['ID', modalVer.id ?? modalVer.id_usuario],
                  ['Nombre completo', `${modalVer.nombre || ''} ${modalVer.apellido || ''}`.trim() || 'No especificado'],
                  ['Email', modalVer.email || 'No especificado'],
                  ...(modalVer.email_pendiente ? [['Email pendiente de confirmación', modalVer.email_pendiente]] : []),
                  ['Rol en el sistema', rolTexto],
                  ['Estado de la cuenta', modalVer.estado || (modalVer.activo === 0 ? 'Inactivo' : 'Activo')],
                  ['Estado Email', Number(modalVer.email_verificado) === 1 ? 'Verificado' : 'Pendiente']
                ];

                if (!esAdminPuro) {
                  filas.push(
                    ['Fecha de Nacimiento', formatearFechaEspanol(modalVer.fecha_nacimiento)],
                    ['Peso corporal', modalVer.peso != null && modalVer.peso !== '' ? `${modalVer.peso} kg` : 'No especificado'],
                    ['Altura', modalVer.altura != null && modalVer.altura !== '' ? `${modalVer.altura} m` : 'No especificado'],
                    ['Nivel', modalVer.nivel_entrenamiento || 'No especificado'],
                    ['Objetivo', modalVer.objetivo || 'No especificado']
                  );
                } else {
                  filas.push(
                    ['Fecha de Nacimiento', formatearFechaEspanol(modalVer.fecha_nacimiento)],
                    ['Peso corporal', 'No especificado'],
                    ['Altura', 'No especificado'],
                    ['Nivel', 'No especificado'],
                    ['Objetivo', 'No especificado']
                  );
                }

                return filas.map(([label, valor]) => (
                  <div key={label} className="detalle-row">
                    <span className="detalle-label">{label}:</span>
                    <span className="detalle-valor">{valor}</span>
                  </div>
                ));
              })()}
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
                  disabled={guardando}
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
            <div className="modal modal-rutina">
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
                          {e.nombre} ({formatearGrupoMuscular(e.grupo_muscular)})
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
                        className="rutina-modal-draft-item"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            {ej.gif ? (
                              <img
                                src={ej.gif}
                                alt={ej.nombre}
                                className="rutina-ejercicio-mini-gif"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : (
                              <div className="rutina-ejercicio-mini-placeholder">💪</div>
                            )}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <span style={{ color: 'white', fontWeight: '600', fontSize: '13px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ej.nombre}
                              </span>
                              <span style={{ color: '#a0a0a0', fontSize: '11px' }}>{formatearGrupoMuscular(ej.grupo_muscular)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => quitarEjercicioRutinaDraft(index)}
                            style={{ background: 'transparent', border: 'none', color: '#ffb2b4', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
                            title="Quitar"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="rutina-draft-metrics-grid">
                          <div>
                            <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Series (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              className="input-modal"
                              style={{ minHeight: '32px', padding: '4px 8px', marginBottom: 0 }}
                              value={ej.series}
                              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                              onChange={(e) => actualizarMetricaRutinaDraft(index, 'series', e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Reps (1-15)</label>
                            <input
                              type="number"
                              min="1"
                              max="15"
                              className="input-modal"
                              style={{ minHeight: '32px', padding: '4px 8px', marginBottom: 0 }}
                              value={ej.repeticiones}
                              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                              onChange={(e) => actualizarMetricaRutinaDraft(index, 'repeticiones', e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Peso (0-350 kg)</label>
                            <input
                              type="number"
                              min="0"
                              max="350"
                              step="any"
                              className="input-modal"
                              style={{ minHeight: '32px', padding: '4px 8px', marginBottom: 0 }}
                              value={ej.peso}
                              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
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
                  disabled={guardando}
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

        <ModalAlerta
          isOpen={alertaModal.isOpen}
          titulo={alertaModal.titulo}
          mensaje={alertaModal.mensaje}
          onClose={() => setAlertaModal({ isOpen: false, titulo: '', mensaje: '' })}
        />

      </div>
    </div>
  )
}

export default AdminDashboard