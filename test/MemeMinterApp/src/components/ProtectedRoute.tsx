import { useUser } from '@/contexts/UserContext'
import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: ('buyer' | 'creator')[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/' }: ProtectedRouteProps) {
  const { userRole, isConnected } = useUser()

  // If not connected, redirect to home
  if (!isConnected) {
    return <Navigate to={redirectTo} replace />
  }

  // If user role is not in allowed roles, redirect
  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

interface RoleBasedComponentProps {
  children: ReactNode
  allowedRoles: ('buyer' | 'creator')[]
  fallback?: ReactNode
}

export function RoleBasedComponent({ children, allowedRoles, fallback = null }: RoleBasedComponentProps) {
  const { userRole, isConnected } = useUser()

  if (!isConnected || !userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
