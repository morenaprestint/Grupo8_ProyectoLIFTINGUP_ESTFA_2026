import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, saveUser, getCurrentUser } from '../features/authService'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      navigate(user.rol === 'admin' ? '/dashboard' : '/home')
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email || !password) {
      setError('Por favor completa todos los campos')
      return
    }

    try {
      const user = await login(email, password)

      if (!user) {
        setError('Email o contraseña inválidos')
        return
      }

      saveUser(user)
      navigate(user.rol === 'admin' ? '/dashboard' : '/home')
    } catch (err) {
      setError('Error al conectar con el servidor')
    }
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
              <span className="input-label">Correo electrónico</span>
              <input
                type="email"
                placeholder="Tu@email.com"
                className="input-field has-label"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div className="input-wrapper">

            <div className="input-inner">
              <span className="input-label">Contraseña</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="...."
                className="input-field has-label"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁' : '👁‍🗨'}
              </span>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="submit-btn">
            COMENZAR AHORA
          </button>
        </form>


      </div>
    </div>
  )
}

export default Login
