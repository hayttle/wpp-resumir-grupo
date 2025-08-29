'use client'

import { Button } from '@/components/ui/button'
import { Menu, Bell, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        {/* Lado esquerdo - Botão toggle e título */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">
              WPP Resumir
            </h1>
          </div>
        </div>

        {/* Lado direito - Ações do usuário */}
        <div className="flex items-center gap-3">
          {/* Notificações */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              0
            </span>
          </Button>

          {/* Avatar do usuário */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-green-600" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900">
                {user?.profile?.name || user?.email || 'Usuário'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
