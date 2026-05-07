import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute() {
  const location = useLocation()
  const access = useSelector((state) => state.auth.access)

  if (!access) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
