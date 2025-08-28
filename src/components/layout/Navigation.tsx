'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

export function Navigation() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  return (
    <nav className="bg-whatsapp-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-whatsapp-primary text-lg font-bold">📱</span>
              </div>
              <span className="text-xl font-bold">WhatsApp Resumir</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-white hover:bg-whatsapp-primary-dark">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/groups">
                  <Button variant="ghost" className="text-white hover:bg-whatsapp-primary-dark">
                    Grupos
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" className="text-white hover:bg-whatsapp-primary-dark">
                    Configurações
                  </Button>
                </Link>
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-whatsapp-primary-dark"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    {user.user_metadata?.name || user.email}
                  </Button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link href="/profile">
                        <Button variant="ghost" className="w-full justify-start text-whatsapp-text hover:bg-gray-100">
                          Perfil
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        Sair
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-white hover:bg-whatsapp-primary-dark">
                    Entrar
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline" className="text-white border-white hover:bg-white hover:text-whatsapp-primary">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Abrir menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-whatsapp-primary-dark rounded-lg mt-2">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-whatsapp-primary">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/groups">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-whatsapp-primary">
                      Grupos
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-whatsapp-primary">
                      Configurações
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-whatsapp-primary">
                      Perfil
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-200 hover:bg-red-600"
                    onClick={handleSignOut}
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-whatsapp-primary">
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="outline" className="w-full justify-start text-white border-white hover:bg-white hover:text-whatsapp-primary">
                      Cadastrar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
