// Componente para exibir e gerenciar assinaturas
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui'
import {
  CreditCard,
  Calendar,
  Users
} from 'lucide-react'
import type { Subscription } from '@/types/database'
import { formatDate, formatCurrency } from '@/lib/utils/formatters'

interface SubscriptionCardProps {
  subscription: Subscription & {
    plans?: {
      name: string
      description: string
      price: number
    }
    payments?: {
      id: string
      invoice_url?: string
      bank_slip_url?: string
      status: string
    }[]
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
          <StatusBadge status={subscription.status} variant="subscription" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do Plano */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="h-4 w-4" />
          <span>
            {subscription.plans?.price
              ? formatCurrency(subscription.plans.price)
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
          {(subscription.status === 'inactive' || subscription.status === 'overdue') && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                const latestPayment = subscription.payments?.[0]
                if (latestPayment?.invoice_url) {
                  window.open(latestPayment.invoice_url, '_blank')
                }
              }}
              disabled={!subscription.payments?.[0]?.invoice_url}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              PAGAR
            </Button>
          )}

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
