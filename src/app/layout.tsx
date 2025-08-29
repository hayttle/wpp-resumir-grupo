import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WPP Resumir - Sistema de Resumos Automáticos para WhatsApp',
  description: 'Sistema inteligente para resumir automaticamente conversas de grupos do WhatsApp',
  keywords: 'WhatsApp, resumo automático, grupos, IA, chatbot',
  authors: [{ name: 'WPP Resumir Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
