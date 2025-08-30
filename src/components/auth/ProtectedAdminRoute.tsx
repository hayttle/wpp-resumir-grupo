'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedAdminRouteProps {
  children: React.ReactNode
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Usuário não autenticado, redirecionar para login
        router.push('/auth/login')
        return
      }

      // Verificar se o usuário é admin
      if (user.profile?.role !== 'admin') {
        // Usuário não é admin, redirecionar para dashboard
        router.push('/dashboard')
        return
      }

      // Usuário é admin, permitir acesso
      setCheckingRole(false)
    }
  }, [user, loading, router])

  // Mostrar loading enquanto verifica autenticação e role
  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Se chegou aqui, o usuário é admin e pode acessar
  return <>{children}</>
}
