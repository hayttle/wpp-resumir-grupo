'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { User, LogOut, Settings, UserCog, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function UserProfile() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Removido listener de clique fora para evitar problemas de foco

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const getUserInitials = () => {
    if (user?.profile?.name) {
      const names = user.profile.name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const getUserDisplayName = () => {
    return user?.profile?.name || user?.email || 'Usuário'
  }

  const getUserRole = () => {
    return user?.profile?.role === 'admin' ? 'Administrador' : 'Usuário'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do perfil */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDropdown}
        className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2"
      >
        {/* Avatar */}
        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-semibold text-green-600">
            {getUserInitials()}
          </span>
        </div>

        {/* Informações do usuário */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {getUserDisplayName()}
          </div>
          <div className="text-xs text-gray-500">
            {getUserRole()}
          </div>
        </div>

        {/* Ícone de seta */}
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Header do dropdown */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900">
              {getUserDisplayName()}
            </div>
            <div className="text-xs text-gray-500">
              {user?.email}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {getUserRole()}
            </div>
          </div>

          {/* Menu de opções */}
          <div className="py-1">
            {/* Perfil */}
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/profile')
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-left"
            >
              <User className="h-4 w-4" />
              Meu Perfil
            </button>

            {/* Configurações */}
            <button
              onClick={() => {
                setIsOpen(false)
                // TODO: Implementar página de configurações
                // Implementar navegação para configurações
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-left"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </button>

            {/* Admin (se for admin) */}
            {user?.profile?.role === 'admin' && (
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/admin/users')
                }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-left"
              >
                <UserCog className="h-4 w-4" />
                Área Administrativa
              </button>
            )}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 text-left"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
