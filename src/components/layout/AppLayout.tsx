'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { ToastProvider } from '@/components/ui/toast'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        
        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header onToggleSidebar={toggleSidebar} />
          
          {/* Área de conteúdo */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
