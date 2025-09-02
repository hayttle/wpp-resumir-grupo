'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Smartphone, Users, FileText, Wifi, WifiOff, Clock, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DashboardService, DashboardStats } from '@/lib/services/dashboardService'
import { formatDate } from '@/lib/utils/formatters'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    // Se já temos o usuário, carregar dados
    if (user?.id) {
      loadDashboardData()
    }
    // Se não há usuário, parar loading
    else {
      setLoading(false)
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Buscar estatísticas do dashboard
      const dashboardStats = await DashboardService.getUserDashboardStats(user.id)
      setStats(dashboardStats || {
        totalGroups: 0,
        activeGroups: 0,
        totalSummaries: 0,
        summariesThisMonth: 0,
        instanceStatus: null,
        instanceName: null,
        lastSummaryDate: null
      })


    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      // Em caso de erro, definir dados padrão
      setStats({
        totalGroups: 0,
        activeGroups: 0,
        totalSummaries: 0,
        summariesThisMonth: 0,
        instanceStatus: null,
        instanceName: null,
        lastSummaryDate: null
      })

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



  // Se não há dados, mostrar dashboard vazio
  const displayStats = stats || {
    totalGroups: 0,
    activeGroups: 0,
    totalSummaries: 0,
    summariesThisMonth: 0,
    instanceStatus: null,
    instanceName: null,
    lastSummaryDate: null
  }

  // Mostrar loading apenas se ainda está carregando e não há usuário
  if (loading && !user) {
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
                {displayStats.activeGroups || 0}
              </div>
              <p className="text-xs text-gray-500">
                de {displayStats.totalGroups || 0} configurados
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
                {displayStats.summariesThisMonth || 0}
              </div>
              <p className="text-xs text-gray-500">
                este mês ({displayStats.totalSummaries || 0} total)
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
                {getInstanceStatusIcon(displayStats.instanceStatus)}
                <div className={`text-lg font-bold ${getInstanceStatusColor(displayStats.instanceStatus)}`}>
                  {getInstanceStatusText(displayStats.instanceStatus)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {displayStats.instanceName || 'Configure sua instância'}
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
                {displayStats.lastSummaryDate ? formatDate(displayStats.lastSummaryDate) : 'Nunca'}
              </div>
              <p className="text-xs text-gray-500">
                {displayStats.lastSummaryDate ? 'Última atividade' : 'Nenhum resumo gerado'}
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
                {displayStats.instanceStatus === 'open'
                  ? 'Sua instância está conectada e funcionando'
                  : 'Conecte sua instância do WhatsApp para começar'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/instances">
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700">
                  <Smartphone className="h-4 w-4 mr-2" />
                  {displayStats.instanceStatus === 'open' ? 'Gerenciar Instância' : 'Configurar Instância'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Gerenciar Grupos</CardTitle>
              <CardDescription className="text-gray-600">
                {displayStats.totalGroups > 0
                  ? `Você tem ${displayStats.totalGroups} grupo(s) configurado(s)`
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

      </div>
    </div>
  )
}
