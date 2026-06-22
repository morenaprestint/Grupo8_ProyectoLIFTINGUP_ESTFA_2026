import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveUser } from '../features/authService'

function Register() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // For now we just create a simple user object and save to localStorage
    const user = { id: Date.now(), nombre: nombre || 'Atleta', email, rol: 'atleta' }
    saveUser(user)
    navigate('/home')
  }

  return (
    <div className="login-container">
      <div className="logo-section">
        <img src="/logo.png" alt="Lifting Up" className="logo-img" />
      </div>

      <div className="form-section">
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper blue">
            <div className="input-inner">
              <input
                type="text"
                placeholder="Nombre"
                className="input-field"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </div>

          <div className="input-wrapper blue">
            <div className="input-inner">
              <input
                type="email"
                placeholder="Email Address"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-wrapper">
            <div className="input-inner">
              <input
                type="password"
                placeholder="••••••••"
                className="input-field has-label"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn">Crear cuenta</button>
        </form>

        <p className="signup-text">
          ¿Ya tenés cuenta?
          <a className="signup-link" onClick={() => navigate('/')}>Iniciar sesión</a>
        </p>
      </div>
    </div>
  )
}

export default Register
