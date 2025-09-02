'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  CreditCard,
  UserCog,
  X,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
  description?: string
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Menu para usuários autenticados
  const userMenuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      description: 'Visão geral do sistema'
    },
    {
      label: 'Conexão WhatsApp',
      href: '/instances',
      icon: <MessageCircle className="h-5 w-5" />,
      description: 'Gerenciar instâncias'
    },
    {
      label: 'Meus Grupos',
      href: '/groups',
      icon: <Users className="h-5 w-5" />,
      description: 'Gerenciar grupos e assinaturas'
    }
  ]

  // Menu para administradores (implementar posteriormente)
  const adminMenuItems: MenuItem[] = [
    {
      label: 'Usuários',
      href: '/admin/users',
      icon: <UserCog className="h-5 w-5" />,
      description: 'Gerenciar usuários do sistema'
    },
    {
      label: 'Grupos',
      href: '/admin/groups',
      icon: <Users className="h-5 w-5" />,
      description: 'Gerenciar grupos monitorados'
    }
  ]

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      await logout()

      // Redirecionar para a página de login após logout
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error)
      setIsLoggingOut(false)

      // Mesmo com erro, tentar redirecionar
      alert('Erro no logout, mas você será redirecionado para o login')
      window.location.href = '/auth/login'
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">WPP Resumir</span>
          </div>

          {/* Botão fechar para mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Conteúdo da Sidebar */}
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Menu do Usuário */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Seção do Usuário */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Menu Principal
                </h3>
                <nav className="space-y-1">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActiveLink(item.href)
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      {item.icon}
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 font-normal">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Seção do Admin (implementar posteriormente) */}
              {user?.profile?.role === 'admin' && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Administração
                  </h3>
                  <nav className="space-y-1">
                    {adminMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActiveLink(item.href)
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        {item.icon}
                        <div className="flex-1">
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 font-normal">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>
              )}
            </div>
          </div>

          {/* Footer da Sidebar */}
          <div className="p-4 border-t border-gray-200 bg-white">
            {/* Informações do usuário */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">
                {user?.profile?.name || user?.email || 'Usuário'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </div>
            </div>

            {/* Botão de logout */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
