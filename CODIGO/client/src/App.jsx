import './styles/App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser } from './features/authService'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import TestDB from './pages/TestDB'

const RequireAuth = ({ children, allowedRoles }) => {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to={user.rol === 'admin' ? '/dashboard' : '/home'} replace />
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