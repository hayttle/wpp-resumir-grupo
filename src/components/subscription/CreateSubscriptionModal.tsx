// Modal para criar nova assinatura
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  CreditCard,
  Users,
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import type { Plan } from '@/types/database'
import { formatCurrency } from '@/lib/utils/formatters'

interface CreateSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan | null
  groupId: string
  groupName?: string
  onSuccess?: (subscription: any) => void
}

export default function CreateSubscriptionModal({
  isOpen,
  onClose,
  plan,
  groupId,
  groupName,
  onSuccess
}: CreateSubscriptionModalProps) {
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [creditCardData, setCreditCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  })

  const formatPrice = (price: number) => {
    console.log('Formatando preço:', { price, type: typeof price })
    const formatted = formatCurrency(price)
    console.log('Preço formatado:', formatted)
    return formatted
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem('supabase.auth.token') // Ajustar conforme seu método de auth

      const requestBody: any = {
        groupId,
        billingType
      }

      // Adicionar dados do cartão se for cartão de crédito
      if (billingType === 'CREDIT_CARD') {
        requestBody.creditCardData = {
          holderName: creditCardData.holderName,
          number: creditCardData.number.replace(/\s/g, ''),
          expiryMonth: creditCardData.expiryMonth,
          expiryYear: creditCardData.expiryYear,
          ccv: creditCardData.ccv
        }
      }

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      // Se recebeu URL de pagamento, mostrar
      if (data.paymentUrl) {
        setPaymentUrl(data.paymentUrl)
      }

      // Chamar callback de sucesso
      if (onSuccess) {
        onSuccess(data.subscription)
      }

    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar assinatura')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentRedirect = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank')
      onClose()
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  if (!isOpen) return null

  // Se já tem URL de pagamento, mostrar tela de sucesso
  if (paymentUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Assinatura Criada!
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Sua assinatura foi criada com sucesso. Complete o pagamento para ativar o acesso ao grupo.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                Grupo: {groupName || groupId}
              </p>
              <p className="text-sm text-blue-600">
                Valor: {plan ? formatPrice(plan.price) : 'R$ 29,90'} / mês
              </p>
            </div>

            <Button onClick={handlePaymentRedirect} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para Pagamento
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Nova Assinatura</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Assine para ter acesso ao grupo {groupName || groupId}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informações do Plano */}
            {plan && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {plan.name}
                </h4>
                <p className="text-sm text-gray-600">{plan.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {formatPrice(plan.price)} / mês
                  </Badge>
                  <Badge variant="secondary">
                    {plan.max_groups} grupo
                  </Badge>
                </div>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Forma de Pagamento</label>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={billingType === 'PIX' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBillingType('PIX')}
                >
                  PIX
                </Button>
                <Button
                  type="button"
                  variant={billingType === 'BOLETO' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBillingType('BOLETO')}
                >
                  Boleto
                </Button>
                <Button
                  type="button"
                  variant={billingType === 'CREDIT_CARD' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBillingType('CREDIT_CARD')}
                >
                  Cartão
                </Button>
              </div>
            </div>

            {/* Dados do Cartão de Crédito */}
            {billingType === 'CREDIT_CARD' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Nome no Cartão</label>
                  <Input
                    value={creditCardData.holderName}
                    onChange={(e) => setCreditCardData(prev => ({
                      ...prev,
                      holderName: e.target.value
                    }))}
                    placeholder="João Silva"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Número do Cartão</label>
                  <Input
                    value={creditCardData.number}
                    onChange={(e) => setCreditCardData(prev => ({
                      ...prev,
                      number: formatCardNumber(e.target.value)
                    }))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-sm font-medium">Mês</label>
                    <Input
                      value={creditCardData.expiryMonth}
                      onChange={(e) => setCreditCardData(prev => ({
                        ...prev,
                        expiryMonth: e.target.value
                      }))}
                      placeholder="12"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ano</label>
                    <Input
                      value={creditCardData.expiryYear}
                      onChange={(e) => setCreditCardData(prev => ({
                        ...prev,
                        expiryYear: e.target.value
                      }))}
                      placeholder="2025"
                      maxLength={4}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CCV</label>
                    <Input
                      value={creditCardData.ccv}
                      onChange={(e) => setCreditCardData(prev => ({
                        ...prev,
                        ccv: e.target.value
                      }))}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resumo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total mensal:</span>
                <span className="text-lg font-bold text-blue-600">
                  {plan ? formatPrice(plan.price) : 'R$ 29,90'}
                </span>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Assinar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
