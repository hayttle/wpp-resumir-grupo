// API Routes para gerenciar plano único de assinatura
import { NextRequest, NextResponse } from 'next/server'
import { AsaasSubscriptionService } from '@/lib/services/asaasSubscriptionService'

// GET - Buscar o plano único disponível
export async function GET(request: NextRequest) {
  try {
    const plan = await AsaasSubscriptionService.getSinglePlan()

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plan })

  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
