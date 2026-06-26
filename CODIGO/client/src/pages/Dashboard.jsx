import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../features/authService.js'
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../services/api.js'
import UsuariosTable from '../components/UsuariosTable.jsx'
import UsuarioForm from '../components/UsuarioForm.jsx'
import UsuarioModal from '../components/UsuarioModal.jsx'
import '../styles/adminDashboard.css'

const FORM_INICIAL = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  peso: '',
  altura: '',
  nivel_entrenamiento: 'Principiante',
  objetivo: 'Ganar masa muscular'
}

// ── Toast helper ────────────────────────────────────────────────────────────
function Toast({ msg, tipo }) {
  if (!msg) return null
  return <div className={`toast ${tipo}`}>{msg}</div>
}

function AdminDashboard() {
  const navigate = useNavigate()
  const admin = getCurrentUser()

  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalVer, setModalVer] = useState(null)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const [form, setForm] = useState(FORM_INICIAL)

  // Toast
  const [toast, setToast] = useState({ msg: '', tipo: 'success' })
  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3500)
  }

  // ── Cargar usuarios ─────────────────────────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getUsuarios()
      if (response?.success && Array.isArray(response.data)) {
        setUsuarios(response.data)
      } else if (Array.isArray(response)) {
        setUsuarios(response)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      mostrarToast('No se pudieron cargar los usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarUsuarios() }, [cargarUsuarios])

  // ── Formulario ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const generarPassword = (nombre, apellido) => {
    if (!nombre || !apellido) return ''
    return (nombre.toLowerCase() + apellido.toLowerCase().charAt(0) + '123').replace(/\s/g, '')
  }

  // ── Abrir modales ───────────────────────────────────────────────────────
  const abrirModalNuevo = () => {
    setUsuarioEditando(null)
    setForm(FORM_INICIAL)
    setModalAbierto(true)
  }

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario)
    setForm({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      password: '',
      peso: usuario.peso || '',
      altura: usuario.altura || '',
      nivel_entrenamiento: usuario.nivel_entrenamiento || 'Principiante',
      objetivo: usuario.objetivo || 'Ganar masa muscular',
    })
    setModalAbierto(true)
  }

  // ── Guardar (crear o editar) ─────────────────────────────────────────────
  const guardarUsuario = async () => {
    if (!form.nombre || !form.apellido || !form.email) {
      mostrarToast('Completá los campos obligatorios: Nombre, Apellido y Email', 'error')
      return
    }

    setGuardando(true)
    try {
      const dataToSave = { ...form }

      if (usuarioEditando) {
        // Si no se ingresó nueva contraseña, no la enviamos
        if (!dataToSave.password) delete dataToSave.password

        const res = await updateUsuario(usuarioEditando.id, dataToSave)
        if (res?.success) {
          // Actualizar localmente con datos devueltos por el backend
          const updated = res.data || { ...usuarioEditando, ...dataToSave }
          setUsuarios(prev => prev.map(u => u.id === usuarioEditando.id ? updated : u))
          mostrarToast('Usuario actualizado correctamente', 'success')
        }
      } else {
        if (!dataToSave.password) {
          dataToSave.password = generarPassword(form.nombre, form.apellido)
        }
        const res = await createUsuario(dataToSave)
        if (res?.success) {
          // Agregar el nuevo usuario con los datos del servidor
          if (res.data) {
            setUsuarios(prev => [...prev, res.data])
          } else {
            await cargarUsuarios()
          }
          mostrarToast('Usuario creado correctamente', 'success')
        }
      }

      setModalAbierto(false)
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      mostrarToast(error.message || 'Error al guardar el usuario', 'error')
    } finally {
      setGuardando(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const handleEliminarUsuario = async () => {
    if (!confirmEliminar) return
    setEliminando(true)
    try {
      const res = await deleteUsuario(confirmEliminar.id)
      if (res?.success) {
        setUsuarios(prev => prev.filter(u => u.id !== confirmEliminar.id))
        mostrarToast(`${confirmEliminar.nombre} ${confirmEliminar.apellido} fue eliminado`, 'success')
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      mostrarToast(error.message || 'Error al eliminar el usuario', 'error')
    } finally {
      setEliminando(false)
      setConfirmEliminar(null)
    }
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────
  const usuariosFiltrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase()
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.apellido?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  })

  const handleLogout = () => { logout(); navigate('/') }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Lifting Up" />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item-activo">👥 Usuarios</div>
          <div className="nav-item">📋 Rutinas</div>
          <div className="nav-item">📊 Estadísticas</div>
          <div className="nav-item">🏋️ Equipamiento</div>
          <div className="nav-item">⚙️ Configuración</div>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h1 className="admin-titulo">Gestión de Usuarios</h1>
            <p className="admin-subtitulo">Bienvenido, {admin?.nombre || 'Administrador'}</p>
          </div>
          <button className="btn-nuevo" onClick={abrirModalNuevo}>
            + Nuevo Usuario
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre, apellido o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="buscador"
        />

        {loading ? (
          <p style={{ color: 'var(--text-muted)', padding: '32px 0' }}>Cargando usuarios...</p>
        ) : (
          <UsuariosTable
            usuarios={usuariosFiltrados}
            onVer={setModalVer}
            onEdit={abrirModalEditar}
            onDelete={setConfirmEliminar}
          />
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      <UsuarioModal
        isOpen={modalAbierto}
        title={usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
        onClose={() => setModalAbierto(false)}
        onSave={guardarUsuario}
        saveText={guardando ? 'Guardando...' : 'Guardar'}
        disabled={guardando}
      >
        <UsuarioForm
          form={form}
          handleChange={handleChange}
          generarPassword={generarPassword}
          isEdit={!!usuarioEditando}
        />
      </UsuarioModal>

      {/* MODAL VER DETALLE */}
      <UsuarioModal
        isOpen={!!modalVer}
        title="Detalle del Usuario"
        onClose={() => setModalVer(null)}
        saveText="Cerrar"
        onSave={() => setModalVer(null)}
        cancelText={null}
      >
        {modalVer && (
          <div className="detalle-container">
            {[
              ['ID', modalVer.id || modalVer.id_usuario],
              ['Nombre completo', `${modalVer.nombre} ${modalVer.apellido}`],
              ['Email', modalVer.email],
              ['Contraseña', modalVer.password ? '••••••' : '—'],
              ['Peso', modalVer.peso ? `${modalVer.peso} kg` : '—'],
              ['Altura', modalVer.altura ? `${modalVer.altura} cm` : '—'],
              ['Nivel de entrenamiento', modalVer.nivel_entrenamiento || '—'],
              ['Objetivo', modalVer.objetivo || '—'],
              ['Estado', modalVer.estado || 'Activo'],
            ].map(([label, valor]) => (
              <div key={label} className="detalle-row">
                <span className="detalle-label">{label}:</span>
                <span className="detalle-valor">{valor}</span>
              </div>
            ))}
          </div>
        )}
      </UsuarioModal>

      {/* MODAL CONFIRMAR ELIMINAR */}
      <UsuarioModal
        isOpen={!!confirmEliminar}
        title="¿Eliminar usuario?"
        onClose={() => setConfirmEliminar(null)}
        onSave={handleEliminarUsuario}
        saveText={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
        disabled={eliminando}
        isSmall={true}
      >
        {confirmEliminar && (
          <p className="confirm-texto">
            Vas a eliminar a <b>{confirmEliminar.nombre} {confirmEliminar.apellido}</b>.
            Esta acción no se puede deshacer.
          </p>
        )}
      </UsuarioModal>

      {/* TOAST */}
      <Toast msg={toast.msg} tipo={toast.tipo} />

    </div>
  )
}

export default AdminDashboard