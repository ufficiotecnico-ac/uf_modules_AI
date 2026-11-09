import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './auth-provider'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
