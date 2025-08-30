'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Estabilizar verificação de autenticação
  const isAuthenticated = useMemo(() => {
    return !loading && !!user
  }, [loading, user?.id])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-whatsapp-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-whatsapp-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-whatsapp-text">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen bg-whatsapp-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-whatsapp-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl text-white">🔒</span>
          </div>
          <p className="text-whatsapp-text">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
