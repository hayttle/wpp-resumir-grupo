'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Smartphone, Users, FileText, Wifi, WifiOff, Clock, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DashboardService, DashboardStats } from '@/lib/services/dashboardService'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Buscar estatísticas do dashboard
      const dashboardStats = await DashboardService.getUserDashboardStats(user!.id)
      setStats(dashboardStats)

      // Buscar atividade recente
      const activity = await DashboardService.getUserRecentActivity(user!.id, 5)
      setRecentActivity(activity)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInstanceStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'open':
        return 'text-green-600'
      case 'connecting':
        return 'text-yellow-600'
      case 'close':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getInstanceStatusText = (status: string | null | undefined) => {
    switch (status) {
      case 'open':
        return 'Conectado'
      case 'connecting':
        return 'Conectando...'
      case 'close':
        return 'Desconectado'
      default:
        return 'Não configurado'
    }
  }

  const getInstanceStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case 'open':
        return <Wifi className="h-5 w-5 text-green-600" />
      case 'connecting':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'close':
        return <WifiOff className="h-5 w-5 text-red-600" />
      default:
        return <WifiOff className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600">Carregando dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Grupos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.activeGroups || 0}
              </div>
              <p className="text-xs text-gray-500">
                de {stats?.totalGroups || 0} configurados
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumos Gerados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.summariesThisMonth || 0}
              </div>
              <p className="text-xs text-gray-500">
                este mês ({stats?.totalSummaries || 0} total)
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Status da Instância
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getInstanceStatusIcon(stats?.instanceStatus)}
                <div className={`text-lg font-bold ${getInstanceStatusColor(stats?.instanceStatus)}`}>
                  {getInstanceStatusText(stats?.instanceStatus)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.instanceName || 'Configure sua instância'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Último Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-gray-900">
                {stats?.lastSummaryDate ? formatDate(stats.lastSummaryDate) : 'Nunca'}
              </div>
              <p className="text-xs text-gray-500">
                {stats?.lastSummaryDate ? 'Última atividade' : 'Nenhum resumo gerado'}
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
                {stats?.instanceStatus === 'open'
                  ? 'Sua instância está conectada e funcionando'
                  : 'Conecte sua instância do WhatsApp para começar'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/instances">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Smartphone className="h-4 w-4 mr-2" />
                  {stats?.instanceStatus === 'open' ? 'Gerenciar Instância' : 'Configurar Instância'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Gerenciar Grupos</CardTitle>
              <CardDescription className="text-gray-600">
                {stats && stats.totalGroups > 0
                  ? `Você tem ${stats.totalGroups} grupo(s) configurado(s)`
                  : 'Selecione e configure os grupos para monitoramento'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/groups">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
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
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{activity.title}</div>
                      <div className="text-sm text-gray-600">{activity.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma atividade recente</p>
                <p className="text-sm">Configure sua instância e grupos para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
