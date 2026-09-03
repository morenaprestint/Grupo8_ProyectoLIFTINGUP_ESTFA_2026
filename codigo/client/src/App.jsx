import './styles/App.css'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom'

import { getCurrentUser } from './features/authService'

import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import TestDB from './pages/TestDB'
import VerifyEmail from './pages/VerifyEmail'
import AtletaDashboard from './components/AtletaDashboard'

const RequireAuth = ({ children, allowedRoles }) => {
  const user = getCurrentUser()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!allowedRoles.includes(user.rol)) {
    return (
      <Navigate
        to={user.rol === 'admin' ? '/dashboard' : '/home'}
        replace
      />
    )
  }

  // Si es atleta y el email no está verificado,
  // obligarlo a ir a la pantalla de verificación.
  if (
    user.rol === 'atleta' &&
    Number(user.email_verificado) === 0 &&
    location.pathname !== '/verify-email'
  ) {
    return <Navigate to="/verify-email" replace />
  }

  // Si el atleta ya verificó su email,
  // no permitirle volver a la pantalla de verificación.
  if (
    user.rol === 'atleta' &&
    Number(user.email_verificado) === 1 &&
    location.pathname === '/verify-email'
  ) {
    return <Navigate to="/home" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/test-db" element={<TestDB />} />
        <Route 
          path="/asistencia" 
          element={
            <RequireAuth allowedRoles={['atleta']}>
              <AtletaDashboard vista="asistencia" />
            </RequireAuth>
          } 
        />
        <Route 
          path="/rutina" 
          element={
            <RequireAuth allowedRoles={['atleta']}>
              <AtletaDashboard vista="rutina" />
            </RequireAuth>
          } 
        />
        <Route 
          path="/calendario" 
          element={
            <RequireAuth allowedRoles={['atleta']}>
              <AtletaDashboard vista="calendario" />
            </RequireAuth>
          } 
        />

        <Route
          path="/verify-email"
          element={
            <RequireAuth allowedRoles={['atleta']}>
              <VerifyEmail />
            </RequireAuth>
          }
        />

        <Route
          path="/home"
          element={
            <RequireAuth allowedRoles={['atleta']}>
              <Home />
            </RequireAuth>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App