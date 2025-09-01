'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_type: 'MONTHLY' | 'YEARLY'
  features: string[]
}

interface Subscription {
  id: string
  status: 'active' | 'inactive' | 'overdue' | 'cancelled'
  start_date: string
  next_billing_date: string
  value: number
  cycle: 'MONTHLY' | 'YEARLY'
  description: string
  group_id?: string
  asaas_subscription_id?: string
  subscription_plans?: {
    name: string
    description: string
    features: string[]
  }
}

interface Payment {
  id: string
  value: number
  status: 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED' | 'RECEIVED' | 'RECEIVED_IN_CASH_APP'
  due_date: string
  payment_date?: string
  description?: string
  invoice_url?: string
  bank_slip_url?: string
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingSubscription, setCreatingSubscription] = useState(false)
  const [cancellingSubscription, setCancellingSubscription] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)

  // Buscar planos disponíveis
  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()

      if (response.ok) {
        setPlans(data.plans || [])
      } else {
        console.error('Erro ao buscar planos:', data.error)
        addToast({
          title: 'Erro',
          message: 'Não foi possível carregar os planos disponíveis',
          type: 'error'
        })
      }
          } catch (error) {
        console.error('Erro ao buscar planos:', error)
        addToast({
          title: 'Erro',
          message: 'Erro ao conectar com o servidor',
          type: 'error'
        })
      }
    }

    // Buscar assinaturas do usuário
    const fetchSubscriptions = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/subscriptions?userId=${user.id}`)
        const data = await response.json()

        if (response.ok) {
          setSubscriptions(data.subscriptions || [])
        } else {
          console.error('Erro ao buscar assinaturas:', data.error)
          addToast({
            title: 'Erro',
            message: 'Não foi possível carregar suas assinaturas',
            type: 'error'
          })
        }
      } catch (error) {
        console.error('Erro ao buscar assinaturas:', error)
        addToast({
          title: 'Erro',
          message: 'Erro ao conectar com o servidor',
          type: 'error'
        })
      }
    }

  // Buscar pagamentos do usuário
  const fetchPayments = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/payments?userId=${user.id}`)
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments || [])
      } else {
        console.error('Erro ao buscar pagamentos:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchPlans(),
        fetchSubscriptions(),
        fetchPayments()
      ])
      setLoading(false)
    }

    loadData()
  }, [user?.id])

  // Criar nova assinatura
  const createSubscription = async (planId: string) => {
    if (!user?.id) return

    setCreatingSubscription(true)
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planId: planId
        })
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          title: 'Sucesso',
          message: 'Assinatura criada com sucesso!',
          type: 'success'
        })
        
        // Recarregar assinaturas
        await fetchSubscriptions()
        await fetchPayments()
      } else {
        addToast({
          title: 'Erro',
          message: data.error || 'Erro ao criar assinatura',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
      addToast({
        title: 'Erro',
        message: 'Erro ao conectar com o servidor',
        type: 'error'
      })
    } finally {
      setCreatingSubscription(false)
    }
  }

  // Cancelar assinatura
  const cancelSubscription = async (subscriptionId: string) => {
    if (!user?.id) return

    setCancellingSubscription(subscriptionId)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          title: 'Sucesso',
          message: 'Assinatura cancelada com sucesso!',
          type: 'success'
        })
        
        // Recarregar assinaturas
        await fetchSubscriptions()
      } else {
        addToast({
          title: 'Erro',
          message: data.error || 'Erro ao cancelar assinatura',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      addToast({
        title: 'Erro',
        message: 'Erro ao conectar com o servidor',
        type: 'error'
      })
    } finally {
      setCancellingSubscription(null)
      setShowCancelModal(false)
      setSelectedSubscription(null)
    }
  }

  // Abrir modal de cancelamento
  const handleCancelClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setShowCancelModal(true)
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Formatar status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativa', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inativa', color: 'bg-gray-100 text-gray-800' },
      overdue: { label: 'Vencida', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  // Formatar status do pagamento
  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      RECEIVED: { label: 'Recebido', color: 'bg-green-100 text-green-800' },
      OVERDUE: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
      CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-primary mx-auto"></div>
          <p className="mt-2 text-whatsapp-text-secondary">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-whatsapp-text mb-4">
            Gerenciar Assinaturas
          </h1>
          <p className="text-whatsapp-text-secondary max-w-2xl mx-auto">
            Gerencie suas assinaturas e visualize o histórico de pagamentos.
            Cada assinatura permite gerenciar 1 grupo do WhatsApp.
          </p>
        </div>

        {/* Assinaturas Ativas */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-whatsapp-text mb-4">
            Suas Assinaturas ({subscriptions.length})
          </h2>
          
          {subscriptions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="border-whatsapp-background shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-whatsapp-text">
                          {subscription.subscription_plans?.name || 'Plano'}
                        </CardTitle>
                        <CardDescription className="text-whatsapp-text-secondary">
                          {subscription.description}
                        </CardDescription>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-whatsapp-text-secondary">Valor:</span>
                      <span className="text-sm font-medium text-whatsapp-text">
                        R$ {subscription.value.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-whatsapp-text-secondary">Ciclo:</span>
                      <span className="text-sm font-medium text-whatsapp-text">
                        {subscription.cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-whatsapp-text-secondary">Próximo vencimento:</span>
                      <span className="text-sm font-medium text-whatsapp-text">
                        {formatDate(subscription.next_billing_date)}
                      </span>
                    </div>
                    
                    {subscription.group_id && (
                      <div className="flex justify-between">
                        <span className="text-sm text-whatsapp-text-secondary">Grupo:</span>
                        <span className="text-sm font-medium text-whatsapp-text">
                          {subscription.group_id}
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t">
                      {subscription.status === 'active' && (
                        <Button
                          onClick={() => handleCancelClick(subscription)}
                          variant="outline"
                          className="w-full text-red-600 border-red-600 hover:bg-red-50"
                          disabled={cancellingSubscription === subscription.id}
                        >
                          {cancellingSubscription === subscription.id ? 'Cancelando...' : 'Cancelar Assinatura'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-whatsapp-background shadow-lg">
              <CardContent className="text-center py-8">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-whatsapp-text mb-2">
                  Nenhuma assinatura ativa
                </h3>
                <p className="text-whatsapp-text-secondary mb-4">
                  Você ainda não possui assinaturas ativas.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Planos Disponíveis */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-whatsapp-text mb-4">
            Planos Disponíveis
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-whatsapp-background shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-whatsapp-text">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-whatsapp-text-secondary">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-whatsapp-primary">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    <span className="text-whatsapp-text-secondary ml-2">
                      /{plan.billing_type === 'MONTHLY' ? 'mês' : 'ano'}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-whatsapp-text">
                        <span className="text-whatsapp-primary mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    <Button
                      onClick={() => createSubscription(plan.id)}
                      className="w-full bg-whatsapp-primary hover:bg-whatsapp-primary-dark"
                      disabled={creatingSubscription}
                    >
                      {creatingSubscription ? 'Criando...' : `Assinar ${plan.name}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Histórico de Pagamentos */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-whatsapp-text mb-4">
            Histórico de Pagamentos ({payments.length})
          </h2>
          
          {payments.length > 0 ? (
            <Card className="border-whatsapp-background shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vencimento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pagamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-whatsapp-text">
                            {payment.description || 'Pagamento'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-whatsapp-text">
                            R$ {payment.value.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPaymentStatusBadge(payment.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-whatsapp-text">
                            {formatDate(payment.due_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-whatsapp-text">
                            {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {payment.invoice_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(payment.invoice_url, '_blank')}
                                >
                                  Fatura
                                </Button>
                              )}
                              {payment.bank_slip_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(payment.bank_slip_url, '_blank')}
                                >
                                  Boleto
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-whatsapp-background shadow-lg">
              <CardContent className="text-center py-8">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-whatsapp-text mb-2">
                  Nenhum pagamento encontrado
                </h3>
                <p className="text-whatsapp-text-secondary">
                  Você ainda não possui histórico de pagamentos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Cancelamento */}
             <ConfirmModal
         isOpen={showCancelModal}
         onClose={() => {
           setShowCancelModal(false)
           setSelectedSubscription(null)
         }}
         onConfirm={() => {
           if (selectedSubscription) {
             cancelSubscription(selectedSubscription.id)
           }
         }}
         title="Cancelar Assinatura"
         message={`Tem certeza que deseja cancelar a assinatura "${selectedSubscription?.subscription_plans?.name}"? Esta ação não pode ser desfeita.`}
         confirmText="Cancelar Assinatura"
         cancelText="Manter Assinatura"
       />
    </div>
  )
}
