import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--clr-bg)' }}>
      <div className="spinner" style={{ width:40, height:40 }} />
    </div>
  )
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
