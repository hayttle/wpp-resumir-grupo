'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navigation } from '@/components/layout/Navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-whatsapp-background">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-whatsapp-text mb-2">
              Dashboard
            </h1>
            <p className="text-whatsapp-text-secondary">
              Bem-vindo ao seu painel de controle, {user?.user_metadata?.name || user?.email}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-whatsapp-text-secondary">
                  Grupos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-whatsapp-text">0</div>
                <p className="text-xs text-whatsapp-text-secondary">
                  de 1 disponível
                </p>
              </CardContent>
            </Card>

            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-whatsapp-text-secondary">
                  Resumos Gerados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-whatsapp-text">0</div>
                <p className="text-xs text-whatsapp-text-secondary">
                  este mês
                </p>
              </CardContent>
            </Card>

            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-whatsapp-text-secondary">
                  Status da Instância
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">Desconectado</div>
                <p className="text-xs text-whatsapp-text-secondary">
                  Configure sua instância
                </p>
              </CardContent>
            </Card>

            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-whatsapp-text-secondary">
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-whatsapp-text">Básico</div>
                <p className="text-xs text-whatsapp-text-secondary">
                  R$ 29,90/mês
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader>
                <CardTitle className="text-whatsapp-text">Configurar WhatsApp</CardTitle>
                <CardDescription className="text-whatsapp-text-secondary">
                  Conecte sua instância do WhatsApp para começar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/instances">
                  <Button className="bg-whatsapp-primary hover:bg-whatsapp-primary-dark">
                    Configurar Instância
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-whatsapp-background shadow-lg">
              <CardHeader>
                <CardTitle className="text-whatsapp-text">Selecionar Grupos</CardTitle>
                <CardDescription className="text-whatsapp-text-secondary">
                  Escolha quais grupos serão monitorados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/groups">
                  <Button variant="outline" className="border-whatsapp-primary text-whatsapp-primary hover:bg-whatsapp-primary hover:text-white">
                    Gerenciar Grupos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-whatsapp-background shadow-lg">
            <CardHeader>
              <CardTitle className="text-whatsapp-text">Atividade Recente</CardTitle>
              <CardDescription className="text-whatsapp-text-secondary">
                Últimas ações e resumos gerados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-whatsapp-background rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl text-whatsapp-text-secondary">📊</span>
                </div>
                <p className="text-whatsapp-text-secondary">
                  Nenhuma atividade ainda. Configure sua instância e grupos para começar!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
