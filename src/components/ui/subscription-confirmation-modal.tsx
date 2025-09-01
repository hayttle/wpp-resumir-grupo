'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Users, CreditCard, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  max_groups: number
  features: string[]
}

interface WhatsAppGroup {
  id: string
  subject: string
  size: number
  desc?: string
}

interface SubscriptionConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  plan: Plan
  group: WhatsAppGroup
  loading?: boolean
}

export function SubscriptionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  plan,
  group,
  loading = false
}: SubscriptionConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Confirmar Assinatura
          </CardTitle>
          <CardDescription>
            Você está prestes a criar uma assinatura para este grupo
          </CardDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 h-6 w-6 p-0"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações do Grupo */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Grupo Selecionado</h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{group.subject}</span>
              </div>
              <div className="text-sm text-gray-600">
                {group.size} membros
              </div>
              {group.desc && (
                <div className="text-sm text-gray-500 mt-1">
                  {group.desc}
                </div>
              )}
            </div>
          </div>

          {/* Informações do Plano */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Plano de Assinatura</h3>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{plan.name}</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {formatCurrency(plan.price)}/mês
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {plan.description}
              </p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>Renovação mensal</span>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Resumo</h3>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Grupo:</span>
                  <span className="font-medium">{group.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plano:</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-semibold">Valor mensal:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(plan.price)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Confirmar Assinatura'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
