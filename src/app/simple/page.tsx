'use client'

import Link from 'next/link'

export default function HomeSimple() {
  return (
    <div className="min-h-screen bg-whatsapp-background">
      {/* Header simples sem navegação */}
      <header className="bg-whatsapp-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-whatsapp-primary text-lg font-bold">📱</span>
              </div>
              <span className="text-xl font-bold">WhatsApp Resumir</span>
            </div>
            
            <div className="flex space-x-4">
              <Link href="/auth/login" className="text-white hover:text-gray-200">
                Entrar
              </Link>
              <Link href="/auth/register" className="text-white hover:text-gray-200">
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <div className="w-24 h-24 bg-whatsapp-primary rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">📱</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-whatsapp-text mb-6">
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
