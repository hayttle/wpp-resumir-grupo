// Hook para gerenciar assinaturas
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Subscription, Plan } from '@/types/database'

interface UseSubscriptionsReturn {
  subscriptions: Subscription[]
  plan: Plan | null
  accessibleGroups: string[]
  totalActiveSubscriptions: number
  isLoading: boolean
  error: string | null
  canAccessGroup: (groupId: string) => boolean
  createSubscription: (groupId: string, billingType?: 'PIX' | 'BOLETO' | 'CREDIT_CARD', creditCardData?: any) => Promise<{ subscription: Subscription; paymentUrl?: string }>
  cancelSubscription: (subscriptionId: string) => Promise<void>
  syncSubscriptions: () => Promise<void>
  refreshSubscriptions: () => Promise<void>
}

export function useSubscriptions(): UseSubscriptionsReturn {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [accessibleGroups, setAccessibleGroups] = useState<string[]>([])
  const [totalActiveSubscriptions, setTotalActiveSubscriptions] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obter token de autenticação
  const getAuthToken = () => {
    // Ajustar conforme seu método de autenticação
    return localStorage.getItem('supabase.auth.token')
  }

  // Buscar plano único
  const fetchPlan = async () => {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()
      
      if (response.ok) {
        setPlan(data.plan)
      }
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
    }
  }

  // Buscar assinaturas do usuário
  const fetchSubscriptions = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const token = getAuthToken()
      const response = await fetch('/api/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setSubscriptions(data.subscriptions)
      } else {
        throw new Error(data.error || 'Erro ao buscar assinaturas')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      console.error('Erro ao buscar assinaturas:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Buscar grupos acessíveis
  const fetchAccessibleGroups = useCallback(async () => {
    if (!user) return

    try {
      const token = getAuthToken()
      const response = await fetch('/api/subscriptions/access', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setAccessibleGroups(data.accessibleGroups)
        setTotalActiveSubscriptions(data.totalActiveSubscriptions)
      }
    } catch (error) {
      console.error('Erro ao buscar grupos acessíveis:', error)
    }
  }, [user])

  // Verificar se usuário pode acessar um grupo
  const canAccessGroup = (groupId: string): boolean => {
    return accessibleGroups.includes(groupId)
  }

  // Criar nova assinatura
  const createSubscription = async (
    groupId: string, 
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' = 'PIX',
    creditCardData?: any
  ): Promise<{ subscription: Subscription; paymentUrl?: string }> => {
    const token = getAuthToken()
    
    const requestBody: any = {
      groupId,
      billingType
    }

    if (billingType === 'CREDIT_CARD' && creditCardData) {
      requestBody.creditCardData = creditCardData
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

    // Atualizar listas
    await refreshSubscriptions()

    return {
      subscription: data.subscription,
      paymentUrl: data.paymentUrl
    }
  }

  // Cancelar assinatura
  const cancelSubscription = async (subscriptionId: string): Promise<void> => {
    const token = getAuthToken()
    
    const response = await fetch('/api/subscriptions', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionId,
        action: 'cancel'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao cancelar assinatura')
    }

    // Atualizar listas
    await refreshSubscriptions()
  }

  // Sincronizar assinaturas
  const syncSubscriptions = async (): Promise<void> => {
    const token = getAuthToken()
    
    const response = await fetch('/api/subscriptions', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionId: 'any', // Não usado na sincronização
        action: 'sync'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao sincronizar assinaturas')
    }

    // Atualizar listas
    await refreshSubscriptions()
  }

  // Atualizar todas as informações
  const refreshSubscriptions = useCallback(async (): Promise<void> => {
    await Promise.all([
      fetchSubscriptions(),
      fetchAccessibleGroups()
    ])
  }, [fetchSubscriptions, fetchAccessibleGroups])

  // Carregar dados iniciais
  useEffect(() => {
    fetchPlan()
  }, [])

  useEffect(() => {
    if (user) {
      refreshSubscriptions()
    } else {
      setSubscriptions([])
      setAccessibleGroups([])
      setTotalActiveSubscriptions(0)
      setIsLoading(false)
    }
  }, [user, refreshSubscriptions])

  return {
    subscriptions,
    plan,
    accessibleGroups,
    totalActiveSubscriptions,
    isLoading,
    error,
    canAccessGroup,
    createSubscription,
    cancelSubscription,
    syncSubscriptions,
    refreshSubscriptions
  }
}
