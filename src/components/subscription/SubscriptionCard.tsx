// Componente para exibir e gerenciar assinaturas
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import type { Subscription } from '@/types/database'

interface SubscriptionCardProps {
  subscription: Subscription & {
    plans?: {
      name: string
      description: string
      price: number
    }
  }
  onCancel?: (subscriptionId: string) => Promise<void>
  onSync?: (subscriptionId: string) => Promise<void>
}

export default function SubscriptionCard({
  subscription,
  onCancel,
  onSync
}: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        )
      case 'inactive':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Inativo
          </Badge>
        )
      case 'overdue':
        return (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Em Atraso
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const handleCancel = async () => {
    if (!onCancel) return

    const confirmed = confirm(
      'Tem certeza que deseja cancelar esta assinatura? O acesso ao grupo será removido.'
    )

    if (confirmed) {
      setIsLoading(true)
      try {
        await onCancel(subscription.id)
      } catch (error) {
        console.error('Erro ao cancelar assinatura:', error)
        alert('Erro ao cancelar assinatura. Tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSync = async () => {
    if (!onSync) return

    setIsLoading(true)
    try {
      await onSync(subscription.id)
    } catch (error) {
      console.error('Erro ao sincronizar assinatura:', error)
      alert('Erro ao sincronizar assinatura. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {subscription.plans?.name || 'Plano Básico'}
            </CardTitle>
            <CardDescription>
              Grupo: {subscription.group_id || 'N/A'}
            </CardDescription>
          </div>
          {getStatusBadge(subscription.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do Plano */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="h-4 w-4" />
          <span>
            {subscription.plans?.price
              ? formatPrice(subscription.plans.price)
              : 'R$ 29,90'
            } / mês
          </span>
        </div>

        {/* Datas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Início: {formatDate(subscription.start_date)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Próximo vencimento: {formatDate(subscription.next_billing_date)}</span>
          </div>
        </div>

        {/* Grupo */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>1 grupo incluído</span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4">
          {subscription.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              className="text-red-600 hover:bg-red-50"
            >
              Cancelar
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isLoading}
          >
            {isLoading ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>

        {/* Informações adicionais */}
        {subscription.status === 'inactive' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Esta assinatura está inativa. O pagamento pode estar pendente.
            </p>
          </div>
        )}

        {subscription.status === 'overdue' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              Pagamento em atraso. O acesso ao grupo pode ser suspenso.
            </p>
          </div>
        )}

        {subscription.status === 'cancelled' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              Assinatura cancelada. O acesso ao grupo foi removido.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
