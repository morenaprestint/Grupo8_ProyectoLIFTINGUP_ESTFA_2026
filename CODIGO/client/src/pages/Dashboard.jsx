import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../features/authService.js'
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../services/api.js'
import UsuariosTable from '../components/UsuariosTable.jsx'
import UsuarioForm from '../components/UsuarioForm.jsx'
import UsuarioModal from '../components/UsuarioModal.jsx'
import '../styles/adminDashboard.css'

const formInicial = {
  nombre: '', apellido: '', email: '', password: '',
  fecha_nacimiento: '', edad: '', peso: '', altura: '',
  nivel_entrenamiento: 'Principiante',
  objetivo: 'Ganar masa muscular'
}

function AdminDashboard() {
  const navigate = useNavigate()
  const admin = getCurrentUser()

  const [usuarios, setUsuarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalVer, setModalVer] = useState(null)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  
  const [form, setForm] = useState(formInicial)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      const response = await getUsuarios()
      if (response && response.success && response.data) {
        setUsuarios(response.data)
      } else if (Array.isArray(response)) {
        setUsuarios(response)
      } else {
        // Fallback for API structure variation
        setUsuarios(response || [])
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const generarPassword = (nombre, apellido) => {
    if (!nombre || !apellido) return ''
    return (nombre.toLowerCase() + apellido.toLowerCase().charAt(0) + '123').replace(/\s/g, '')
  }

  const abrirModalNuevo = () => {
    setUsuarioEditando(null)
    setForm(formInicial)
    setModalAbierto(true)
  }

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario)
    setForm({ ...usuario, password: '' })
    setModalAbierto(true)
  }

  const guardarUsuario = async () => {
    if (!form.nombre || !form.apellido || !form.email) {
      alert("Por favor completa los campos obligatorios (Nombre, Apellido, Email).");
      return;
    }

    try {
      const dataToSave = { ...form }
      if (!usuarioEditando && !dataToSave.password) {
        dataToSave.password = generarPassword(form.nombre, form.apellido)
      }

      if (usuarioEditando) {
        await updateUsuario(usuarioEditando.id, dataToSave)
        // Actualización optimista por si el backend aún no lo soporta
        setUsuarios(usuarios.map(u => u.id === usuarioEditando.id ? { ...u, ...dataToSave } : u))
      } else {
        await createUsuario(dataToSave)
        // Recargar de la API (si funciona el POST)
        await cargarUsuarios()
      }
      
      setModalAbierto(false)
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      alert("La solicitud falló (posiblemente el endpoint aún no exista). Se actualizará localmente por ahora.")
      
      // Actualización optimista si el backend falla (ya que el user pidió preparar los botones)
      if (usuarioEditando) {
        setUsuarios(usuarios.map(u => u.id === usuarioEditando.id ? { ...u, ...form } : u))
      } else {
        setUsuarios([...usuarios, { ...form, id: Date.now() }])
      }
      setModalAbierto(false)
    }
  }

  const handleEliminarUsuario = async () => {
    if (!confirmEliminar) return;
    try {
      await deleteUsuario(confirmEliminar.id)
      cargarUsuarios()
      setConfirmEliminar(null)
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      alert("La solicitud falló (posiblemente el endpoint aún no exista). Se eliminará localmente por ahora.")
      
      // Actualización optimista
      setUsuarios(usuarios.filter(u => u.id !== confirmEliminar.id))
      setConfirmEliminar(null)
    }
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.apellido?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="admin-page">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="LU" />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item-activo">👥 Usuarios</div>
          <div className="nav-item">📋 Rutinas</div>
          <div className="nav-item">📊 Estadísticas</div>
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
            <p className="admin-subtitulo">Bienvenido, {admin?.nombre || 'Admin'}</p>
          </div>
          <button className="btn-nuevo" onClick={abrirModalNuevo}>
            + Nuevo Usuario
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="buscador"
        />

        <UsuariosTable 
          usuarios={usuariosFiltrados} 
          onVer={setModalVer} 
          onEdit={abrirModalEditar} 
          onDelete={setConfirmEliminar} 
        />
      </div>

      {/* MODAL CREAR / EDITAR */}
      <UsuarioModal 
        isOpen={modalAbierto} 
        title={usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
        onClose={() => setModalAbierto(false)}
        onSave={guardarUsuario}
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
              ['Nombre completo', `${modalVer.nombre} ${modalVer.apellido}`],
              ['Email', modalVer.email],
              ['Contraseña', modalVer.password || '*****'],
              ['Fecha de nacimiento', modalVer.fecha_nacimiento || '—'],
              ['Edad', modalVer.edad || '—'],
              ['Peso', modalVer.peso ? `${modalVer.peso} kg` : '—'],
              ['Altura', modalVer.altura ? `${modalVer.altura} cm` : '—'],
              ['Nivel de entrenamiento', modalVer.nivel_entrenamiento || modalVer.experiencia || '—'],
              ['Objetivo', modalVer.objetivo || '—'],
              ['Estado', modalVer.estado || 'Activo']
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
        saveText="Sí, eliminar"
        isSmall={true}
      >
        {confirmEliminar && (
          <p className="confirm-texto">
            Vas a eliminar a <b>{confirmEliminar.nombre} {confirmEliminar.apellido}</b>. Esta acción no se puede deshacer.
          </p>
        )}
      </UsuarioModal>

    </div>
  )
}

export default AdminDashboard