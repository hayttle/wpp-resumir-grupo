'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscribeButton } from '@/components/subscription'
import { useAuth } from '@/contexts/AuthContext'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_type: 'MONTHLY' | 'YEARLY'
  features: string[]
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans')
        const data = await response.json()
        
        if (response.ok) {
          setPlans(data.plans || [])
        } else {
          console.error('Erro ao buscar planos:', data.error)
        }
      } catch (error) {
        console.error('Erro ao buscar planos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-primary mx-auto"></div>
          <p className="mt-2 text-whatsapp-text-secondary">Carregando planos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-whatsapp-text mb-4">
            Planos de Assinatura
          </h1>
          <p className="text-whatsapp-text-secondary max-w-2xl mx-auto">
            Escolha o plano ideal para gerenciar seus grupos do WhatsApp. 
            Cada assinatura permite gerenciar 1 grupo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                  <SubscribeButton
                    planId={plan.id}
                    planName={plan.name}
                    planPrice={plan.price}
                    className="w-full bg-whatsapp-primary hover:bg-whatsapp-primary-dark"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-whatsapp-text mb-2">
              Nenhum plano disponível
            </h3>
            <p className="text-whatsapp-text-secondary">
              Entre em contato com o administrador para configurar os planos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
