import { NextRequest, NextResponse } from 'next/server'
import { AsaasSubscriptionService } from '@/lib/services/asaasSubscriptionService'
import { Logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    Logger.info('SubscriptionCancelAPI', 'Iniciando cancelamento de assinatura', { subscriptionId: params.id })

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se a assinatura pertence ao usuário
    // (implementar validação de segurança se necessário)

    // Cancelar assinatura usando o serviço
    await AsaasSubscriptionService.cancelSubscription(params.id)

    Logger.info('SubscriptionCancelAPI', 'Assinatura cancelada com sucesso', { subscriptionId: params.id })

    return NextResponse.json({ 
      success: true, 
      message: 'Assinatura cancelada com sucesso' 
    })

  } catch (error) {
    Logger.error('SubscriptionCancelAPI', 'Erro ao cancelar assinatura', { error, subscriptionId: params.id })
    
    return NextResponse.json(
      { 
        error: 'Erro ao cancelar assinatura',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
