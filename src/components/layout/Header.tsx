'use client'

import { Button } from '@/components/ui/button'
import { Menu, Bell } from 'lucide-react'
import UserProfile from './UserProfile'

interface HeaderProps {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 flex-shrink-0">
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

          {/* Perfil do usuário */}
          <UserProfile />
        </div>
      </div>
    </header>
  )
}
