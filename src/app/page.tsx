'use client'

import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function Home() {
  const { user, loading, error: authError } = useAuth()
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Verificar se há erro de configuração do Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setHasError(true)
    }
  }, [])

  // Se não há configuração do Supabase, mostrar mensagem de erro
  if (hasError) {
    return (
      <div className="min-h-screen bg-whatsapp-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl text-white">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold text-whatsapp-text mb-6">
              Configuração Necessária
            </h1>
            <p className="text-xl text-whatsapp-text-secondary max-w-3xl mx-auto leading-relaxed mb-8">
              Para usar a autenticação, você precisa configurar as variáveis de ambiente do Supabase.
            </p>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-whatsapp-background max-w-2xl mx-auto mb-8">
              <h2 className="text-xl font-bold text-whatsapp-text mb-4">Passos para configurar:</h2>
              <ol className="text-left text-whatsapp-text-secondary space-y-2">
                <li>1. Copie o arquivo <code className="bg-gray-100 px-2 py-1 rounded">env.example</code> para <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
                <li>2. Preencha suas credenciais do Supabase</li>
                <li>3. Reinicie o servidor de desenvolvimento</li>
              </ol>
            </div>

            <div className="space-y-4">
              <Link
                href="/debug-env"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp-primary focus-visible:ring-offset-2 bg-whatsapp-primary text-white hover:bg-whatsapp-primary-dark shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4"
              >
                🔧 Debug Variáveis de Ambiente
              </Link>

              <Link
                href="/simple"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp-primary focus-visible:ring-offset-2 bg-whatsapp-primary text-white hover:bg-whatsapp-primary-dark shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4 ml-4"
              >
                🚀 Ver Página Simplificada
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Se há erro de autenticação, mostrar mensagem
  if (authError) {
    return (
      <div className="min-h-screen bg-whatsapp-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl text-white">❌</span>
            </div>
            <h1 className="text-3xl font-bold text-whatsapp-text mb-6">
              Erro de Conexão
            </h1>
            <p className="text-xl text-whatsapp-text-secondary max-w-3xl mx-auto leading-relaxed mb-8">
              {authError}
            </p>

            <div className="space-y-4">
              <Link
                href="/debug-env"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp-primary focus-visible:ring-offset-2 bg-whatsapp-primary text-white hover:bg-whatsapp-primary-dark shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4"
              >
                🔧 Debug Variáveis de Ambiente
              </Link>

              <Link
                href="/simple"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp-primary focus-visible:ring-offset-2 bg-whatsapp-primary text-white hover:bg-whatsapp-primary-dark shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4 ml-4"
              >
                🚀 Ver Página Simplificada
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-whatsapp-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <div className="w-24 h-24 bg-whatsapp-primary rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">📱</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-whatsapp-text mb-6">
            WhatsApp Resumir Grupo
          </h1>
          <p className="text-xl text-whatsapp-text-secondary max-w-3xl mx-auto leading-relaxed">
            SaaS para geração automática de resumos de grupos do WhatsApp via integração com Evolution API
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-whatsapp-background">
            <div className="w-16 h-16 bg-whatsapp-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl text-white">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-whatsapp-text mb-2">IA Inteligente</h3>
            <p className="text-whatsapp-text-secondary">Resumos gerados automaticamente com OpenAI</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-whatsapp-background">
            <div className="w-16 h-16 bg-whatsapp-primary-dark rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl text-white">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-whatsapp-text mb-2">Automação Total</h3>
            <p className="text-whatsapp-text-secondary">n8n gerencia todo o processo automaticamente</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-whatsapp-background">
            <div className="w-16 h-16 bg-whatsapp-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl text-white">🔒</span>
            </div>
            <h3 className="text-xl font-bold text-whatsapp-text mb-2">Privacidade</h3>
            <p className="text-whatsapp-text-secondary">Dados processados temporariamente e descartados</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          {loading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-whatsapp-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-whatsapp-text-secondary">Carregando...</p>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp-primary focus-visible:ring-offset-2 bg-whatsapp-primary text-white hover:bg-whatsapp-primary-dark shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4"
              >
                🚀 Acessar Dashboard
              </Link>
              <p className="text-whatsapp-text-secondary">
                Bem-vindo de volta, {user.user_metadata?.name || user.email}!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp-primary focus-visible:ring-offset-2 bg-whatsapp-primary text-white hover:bg-whatsapp-primary-dark shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4"
              >
                🚀 Começar Agora
              </Link>
              <p className="text-whatsapp-text-secondary">
                Crie sua conta gratuita e comece a usar
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-whatsapp-background">
          <p className="text-whatsapp-text-secondary">
            🚀 FASE 2: Sistema de Usuários com Autenticação - CONCLUÍDA
          </p>
          <p className="text-sm text-whatsapp-text-secondary mt-2">
            Próximo: Sistema de Planos e Assinaturas (Asaas)
          </p>
        </footer>
      </div>
    </div>
  )
}
