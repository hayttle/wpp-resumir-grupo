'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Smartphone } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Bem-vindo ao seu painel de controle, {user?.profile?.name || user?.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Grupos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <p className="text-xs text-gray-500">
                de 1 disponível
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Resumos Gerados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <p className="text-xs text-gray-500">
                este mês
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Status da Instância
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">Desconectado</div>
              <p className="text-xs text-gray-500">
                Configure sua instância
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">Básico</div>
              <p className="text-xs text-gray-500">
                R$ 29,90/mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Configurar WhatsApp</CardTitle>
              <CardDescription className="text-gray-600">
                Conecte sua instância do WhatsApp para começar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/instances">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Configurar Instância
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Gerenciar Grupos</CardTitle>
              <CardDescription className="text-gray-600">
                Selecione e configure os grupos para monitoramento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/groups">
                <Button variant="outline">
                  Gerenciar Grupos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Atividade Recente</CardTitle>
            <CardDescription className="text-gray-600">
              Suas últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma atividade recente</p>
              <p className="text-sm">Configure sua instância e grupos para começar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
