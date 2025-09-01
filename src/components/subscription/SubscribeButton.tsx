'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'

interface SubscribeButtonProps {
  planId: string
  planName: string
  planPrice: number
  className?: string
}

export function SubscribeButton({ planId, planName, planPrice, className }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { addToast } = useToast()

  const handleSubscribe = async () => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Você precisa estar logado para assinar um plano'
      })
      return
    }

    setLoading(true)

    try {
      console.log('🔄 Criando assinatura para usuário:', user.id)

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

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao criar assinatura')
      }

      console.log('✅ Assinatura criada:', result.subscription)

      // Abrir link de pagamento em nova janela
      if (result.payment_url) {
        window.open(result.payment_url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
        
        addToast({
          type: 'success',
          title: 'Assinatura Criada',
          message: 'Redirecionando para pagamento...'
        })
      } else {
        throw new Error('Link de pagamento não foi gerado')
      }

    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error)
      
      addToast({
        type: 'error',
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Erro ao criar assinatura'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={loading}
      className={className}
    >
      {loading ? 'Criando assinatura...' : `Assinar ${planName} - R$ ${planPrice.toFixed(2)}`}
    </Button>
  )
}
