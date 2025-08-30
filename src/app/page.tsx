'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Users, Zap, Shield } from 'lucide-react'

export default function Home() {
  const { user, loading, error: authError } = useAuth()
  const [hasError, setHasError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar se há erro de configuração do Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setHasError(true)
    }
  }, [])

  useEffect(() => {
    // Se o usuário estiver autenticado, redirecionar para o dashboard
    if (!loading && user?.id) {
      router.push('/dashboard')
    }
  }, [user?.id, loading, router])

  // Se não há configuração do Supabase, mostrar mensagem de erro
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl text-white">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Configuração Necessária
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Para usar a autenticação, você precisa configurar as variáveis de ambiente do Supabase.
            </p>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 max-w-2xl mx-auto mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Passos para configurar:</h2>
              <ol className="text-left text-gray-600 space-y-2">
                <li>1. Copie o arquivo <code className="bg-gray-100 px-2 py-1 rounded">env.example</code> para <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
                <li>2. Preencha suas credenciais do Supabase</li>
                <li>3. Reinicie o servidor de desenvolvimento</li>
              </ol>
            </div>

            <div className="space-y-4">
              <Link
                href="/debug-env"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4"
              >
                🔧 Debug Variáveis de Ambiente
              </Link>

              <Link
                href="/simple"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4 ml-4"
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl text-white">❌</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Erro de Conexão
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              {authError}
            </p>

            <div className="space-y-4">
              <Link
                href="/debug-env"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4"
              >
                🔧 Debug Variáveis de Ambiente
              </Link>

              <Link
                href="/simple"
                className="inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-8 py-4 ml-4"
              >
                🚀 Ver Página Simplificada
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Se está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Landing page para usuários não autenticados
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">WPP Resumir</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Resumos Automáticos para
            <span className="text-green-600"> Grupos WhatsApp</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Nunca mais perca informações importantes dos seus grupos.
            Receba resumos automáticos e inteligentes das conversas mais relevantes.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Começar Agora
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Conecte WhatsApp</h3>
              <p className="text-gray-600">
                Conecte sua instância do WhatsApp de forma segura e rápida
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Selecione Grupos</h3>
              <p className="text-gray-600">
                Escolha quais grupos deseja monitorar e resumir
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Receba Resumos</h3>
              <p className="text-gray-600">
                Resumos automáticos e inteligentes das conversas importantes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            Junte-se a milhares de usuários que já estão economizando tempo com resumos automáticos
          </p>
          <Link
            href="/auth/register"
            className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Criar Conta Gratuita
          </Link>
        </div>
      </section>
    </div>
  )
}
