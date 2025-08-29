import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WPP Resumir - Sistema de Resumos Automáticos para WhatsApp',
  description: 'Sistema inteligente para resumir automaticamente conversas de grupos do WhatsApp',
  keywords: 'WhatsApp, resumo automático, grupos, IA, chatbot',
  authors: [{ name: 'WPP Resumir Team' }],
  viewport: 'width=device-width, initial-scale=1',
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
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
