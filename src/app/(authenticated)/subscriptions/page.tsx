'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CreditCard, Calendar, DollarSign, Search, AlertCircle, CheckCircle, Clock, ExternalLink, Users, CreditCard as PayIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { Payment, Subscription } from '@/types/database'

// Funções helper para traduzir status
const translateStatus = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'PENDING': 'Pendente',
    'CONFIRMED': 'Confirmado',
    'RECEIVED': 'Recebido',
    'OVERDUE': 'Vencido',
    'CANCELLED': 'Cancelado',
    'active': 'Ativo',
    'inactive': 'Inativo',
    'overdue': 'Vencido'
  }
  return statusMap[status] || status
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'CONFIRMED':
    case 'RECEIVED':
      return 'bg-green-100 text-green-800'
    case 'OVERDUE':
      return 'bg-red-100 text-red-800'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />
    case 'CONFIRMED':
    case 'RECEIVED':
      return <CheckCircle className="h-4 w-4" />
    case 'OVERDUE':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

interface SubscriptionWithPayments extends Subscription {
  payments?: Payment[]
  group_name?: string
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPayments[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      loadSubscriptions()
    }
  }, [user])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscriptions')

      if (!response.ok) {
        throw new Error('Erro ao carregar assinaturas')
      }

      const data = await response.json()
      setSubscriptions(data.subscriptions || [])
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível carregar as assinaturas'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayPayment = (payment: Payment) => {
    if (payment.invoice_url) {
      window.open(payment.invoice_url, '_blank')
    } else {
      addToast({
        type: 'warning',
        title: 'Link de pagamento não disponível',
        message: 'Entre em contato com o suporte.'
      })
    }
  }

  const handleViewReceipt = (payment: Payment) => {
    if (payment.transaction_receipt_url) {
      window.open(payment.transaction_receipt_url, '_blank')
    } else {
      addToast({
        type: 'warning',
        title: 'Comprovante não disponível',
        message: 'O comprovante ainda não foi gerado.'
      })
    }
  }

  // Filtrar assinaturas baseado na busca
  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular estatísticas
  const totalSubscriptions = subscriptions.length
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
  const pendingPayments = subscriptions.reduce((acc, sub) =>
    acc + (sub.payments?.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').length || 0), 0
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Minhas Assinaturas
          </CardTitle>
          <CardDescription>
            Gerencie suas assinaturas e pagamentos dos grupos WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total de Assinaturas</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{totalSubscriptions}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Assinaturas Ativas</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{activeSubscriptions}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Pagamentos Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">{pendingPayments}</p>
            </div>
          </div>

          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por grupo ou ID da assinatura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinaturas e Pagamentos
          </CardTitle>
          <CardDescription>
            {filteredSubscriptions.length} de {subscriptions.length} assinaturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma assinatura encontrada</p>
              <p className="text-sm">Vá para a página de grupos para criar uma assinatura</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  {/* Header da Assinatura */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        {subscription.group_name || `Grupo ${subscription.id.slice(0, 8)}`}
                      </h3>

                    </div>
                    <Badge className={getStatusColor(subscription.status)}>
                      {getStatusIcon(subscription.status)}
                      <span className="ml-1">{translateStatus(subscription.status)}</span>
                    </Badge>
                  </div>

                  {/* Pagamentos */}
                  {subscription.payments && subscription.payments.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Pagamentos:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm table-fixed">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 w-24">Valor</th>
                              <th className="text-left py-2 w-28">Vencimento</th>
                              <th className="text-left py-2 w-28">Pagamento</th>
                              <th className="text-left py-2 w-24">Status</th>
                              <th className="text-left py-2 w-32">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subscription.payments.map((payment) => (
                              <tr key={payment.id} className="border-b">
                                <td className="py-2">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">{formatCurrency(payment.value)}</span>
                                  </div>
                                </td>
                                <td className="py-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <span>{formatDate(payment.due_date)}</span>
                                  </div>
                                </td>
                                <td className="py-2">
                                  {payment.payment_date ? (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-green-600" />
                                      <span>{formatDate(payment.payment_date)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                  )}
                                </td>
                                <td className="py-2">
                                  <Badge className={getStatusColor(payment.status)}>
                                    {getStatusIcon(payment.status)}
                                    <span className="ml-1">{translateStatus(payment.status)}</span>
                                  </Badge>
                                </td>
                                <td className="py-2">
                                  {(payment.status === 'PENDING' || payment.status === 'OVERDUE') ? (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handlePayPayment(payment)}
                                      className="text-xs h-7 px-2"
                                    >
                                      <PayIcon className="h-3 w-3 mr-1" />
                                      Pagar
                                    </Button>
                                  ) : (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewReceipt(payment)}
                                      className="text-xs h-7 px-2"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Ver Comprovante
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Nenhum pagamento encontrado para esta assinatura</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
