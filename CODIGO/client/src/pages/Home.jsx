import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../features/authService'

function Home() {
  const user = getCurrentUser()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="page-container">
      <h1>Bienvenido {user?.nombre ?? 'Atleta'}</h1>
      <p>Esta es la vista para el usuario atleta.</p>
      <button className="submit-btn" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  )
}

export default Home
