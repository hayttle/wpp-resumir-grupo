'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { formatDate, formatCurrency } from '@/lib/utils/formatters'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  max_groups: number
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
  plan_id?: string
}

interface Payment {
  id: string
  subscription_id: string
  value: number
  status: 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED' | 'RECEIVED' | 'RECEIVED_IN_CASH_APP'
  due_date: string
  payment_date?: string
  description?: string
  invoice_url?: string
  bank_slip_url?: string
  transaction_receipt_url?: string
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
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set())

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
      console.log('Buscando pagamentos para usuário:', user.id)
      const response = await fetch(`/api/payments?userId=${user.id}`)
      const data = await response.json()

      if (response.ok) {
        console.log('Pagamentos recebidos:', data.payments)
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

      // Teste de formatação de moeda
      if (plans.length > 0) {
        console.log('🧪 Teste de formatação de moeda:', {
          planPrice: plans[0].price,
          planPriceType: typeof plans[0].price,
          formatted: formatCurrency(plans[0].price)
        })
      }
    }

    loadData()
  }, [user?.id])

  // Atualizar dados a cada 30 segundos para pegar mudanças dos webhooks
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      console.log('Atualizando dados automaticamente...')
      fetchSubscriptions()
      fetchPayments()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
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
          message: 'Assinatura cancelada com sucesso! Ela não gerará mais cobranças.',
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

  // Alternar expansão dos pagamentos
  const togglePaymentsExpansion = (subscriptionId: string) => {
    const newExpanded = new Set(expandedPayments)
    if (newExpanded.has(subscriptionId)) {
      newExpanded.delete(subscriptionId)
    } else {
      newExpanded.add(subscriptionId)
    }
    setExpandedPayments(newExpanded)
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
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-whatsapp-text-secondary ml-2">
                      /mês
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

        {/* Assinaturas Ativas */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-whatsapp-text mb-4">
            Suas Assinaturas ({subscriptions.length})
          </h2>

          {subscriptions.length > 0 ? (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="border-whatsapp-background shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-whatsapp-text">
                            {subscription.description || 'Plano'}
                          </h3>
                          <StatusBadge status={subscription.status} variant="subscription" />
                        </div>
                        <p className="text-whatsapp-text-secondary">
                          {subscription.cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-whatsapp-text-secondary">Valor:</span>
                        <span className="text-sm font-medium text-whatsapp-text">
                          {formatCurrency(subscription.value)}
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
                    </div>

                    {/* Pagamentos da Assinatura */}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-whatsapp-text">Histórico de Pagamentos</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-whatsapp-text-secondary">
                            {payments.filter(p => p.subscription_id === subscription.id).length} pagamento(s)
                          </span>
                          {payments.filter(p => p.subscription_id === subscription.id).length > 0 && (
                            <div className="flex space-x-1">
                              {payments.filter(p => p.subscription_id === subscription.id).some(p => p.status === 'CONFIRMED') && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" title="Pagamentos confirmados"></div>
                              )}
                              {payments.filter(p => p.subscription_id === subscription.id).some(p => p.status === 'RECEIVED') && (
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="Pagamentos recebidos"></div>
                              )}
                              {payments.filter(p => p.subscription_id === subscription.id).some(p => p.status === 'PENDING') && (
                                <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Pagamentos pendentes"></div>
                              )}
                              {payments.filter(p => p.subscription_id === subscription.id).some(p => p.status === 'OVERDUE') && (
                                <div className="w-2 h-2 bg-red-500 rounded-full" title="Pagamentos vencidos"></div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {payments.filter(p => p.subscription_id === subscription.id).length > 0 ? (
                        <div className="space-y-2">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-2 py-1 text-left text-gray-600">Vencimento</th>
                                  <th className="px-2 py-1 text-left text-gray-600">Valor</th>
                                  <th className="px-2 py-1 text-left text-gray-600">Status</th>
                                  <th className="px-2 py-1 text-left text-gray-600">Pagamento</th>
                                  <th className="px-2 py-1 text-left text-gray-600">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {payments
                                  .filter(p => p.subscription_id === subscription.id)
                                  .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
                                  .slice(0, expandedPayments.has(subscription.id) ? undefined : 3)
                                  .map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                      <td className="px-2 py-2 text-whatsapp-text-secondary">
                                        {formatDate(payment.due_date)}
                                      </td>
                                      <td className="px-2 py-2 font-medium text-whatsapp-text">
                                        {formatCurrency(payment.value)}
                                      </td>
                                      <td className="px-2 py-2">
                                        <StatusBadge status={payment.status} variant="payment" />
                                      </td>
                                      <td className="px-2 py-2 text-whatsapp-text-secondary">
                                        {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                                      </td>
                                      <td className="px-2 py-2">
                                        <div className="flex space-x-1">
                                          {/* Botão PAGAR para pagamentos pendentes apenas em assinaturas ativas */}
                                          {payment.invoice_url && payment.status === 'PENDING' && subscription.status === 'active' && (
                                            <button
                                              onClick={() => window.open(payment.invoice_url, '_blank')}
                                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                              title="Pagar"
                                            >
                                              PAGAR
                                            </button>
                                          )}

                                          {/* Botão Ver Comprovante para pagamentos confirmados */}
                                          {payment.transaction_receipt_url && payment.status === 'CONFIRMED' && (
                                            <button
                                              onClick={() => window.open(payment.transaction_receipt_url, '_blank')}
                                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                              title="Ver Comprovante"
                                            >
                                              Ver Comprovante
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>

                          {payments.filter(p => p.subscription_id === subscription.id).length > 3 && !expandedPayments.has(subscription.id) && (
                            <div className="text-center pt-2">
                              <button
                                onClick={() => togglePaymentsExpansion(subscription.id)}
                                className="text-xs text-whatsapp-primary hover:underline"
                              >
                                Ver todos os {payments.filter(p => p.subscription_id === subscription.id).length} pagamentos
                              </button>
                            </div>
                          )}
                          {expandedPayments.has(subscription.id) && (
                            <div className="text-center pt-2">
                              <button
                                onClick={() => togglePaymentsExpansion(subscription.id)}
                                className="text-xs text-whatsapp-primary hover:underline"
                              >
                                Mostrar menos
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <span className="text-xs text-whatsapp-text-secondary">
                            Nenhum pagamento registrado
                          </span>
                        </div>
                      )}
                    </div>

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
        message={`Tem certeza que deseja cancelar a assinatura "${selectedSubscription?.description || 'Plano'}"? Ela não gerará mais cobranças.`}
        confirmText="Cancelar Assinatura"
        cancelText="Manter Assinatura"
      />
    </div>
  )
}
