'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedAdminRouteProps {
  children: React.ReactNode
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Cache do status de admin no localStorage para evitar perda temporária
  const [cachedAdminStatus, setCachedAdminStatus] = useState<string | null>(null)

  // Inicializar cache do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin-status')
      setCachedAdminStatus(cached)
    }
  }, [])

  // Memorizar o status de admin para evitar recálculos desnecessários
  const adminStatus = useMemo(() => {
    if (loading) return 'loading'
    if (!user) return 'not-authenticated'
    if (!user.profile) {
      // Se ainda não tem perfil mas temos cache de admin, usar o cache temporariamente
      return cachedAdminStatus === 'admin' ? 'admin-cached' : 'no-profile'
    }

    const isAdmin = user.profile.role === 'admin'

    // Atualizar cache quando temos certeza do status
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-status', isAdmin ? 'admin' : 'user')
    }

    return isAdmin ? 'admin' : 'not-admin'
  }, [loading, user?.id, user?.profile?.role, cachedAdminStatus])

  useEffect(() => {
    // Só redirecionar em casos definitivos, nunca em estados temporários
    if (adminStatus === 'not-authenticated') {
      // Aguardar um pouco antes de redirecionar para evitar redirecionamentos prematuros
      const timer = setTimeout(() => {
        router.push('/auth/login')
      }, 100)
      return () => clearTimeout(timer)
    } else if (adminStatus === 'not-admin') {
      // Só redirecionar se temos certeza que não é admin
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [adminStatus, router])

  // Mostrar loading enquanto verifica autenticação e role
  if (adminStatus === 'loading' || adminStatus === 'no-profile') {
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
  if (adminStatus === 'admin' || adminStatus === 'admin-cached') {
    return <>{children}</>
  }

  // Fallback (não deveria chegar aqui)
  return null
}
