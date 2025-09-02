import { NextRequest, NextResponse } from 'next/server'
import { AsaasSubscriptionService } from '@/lib/services/asaasSubscriptionService'
import { Logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    Logger.info('SubscriptionReactivateAPI', 'Iniciando reativação de assinatura', { subscriptionId: params.id })

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se a assinatura pertence ao usuário
    // (implementar validação de segurança se necessário)

    // Reativar assinatura usando o serviço
    await AsaasSubscriptionService.reactivateSubscription(params.id)

    Logger.info('SubscriptionReactivateAPI', 'Assinatura reativada com sucesso', { subscriptionId: params.id })

    return NextResponse.json({ 
      success: true, 
      message: 'Assinatura reativada com sucesso' 
    })

  } catch (error) {
    Logger.error('SubscriptionReactivateAPI', 'Erro ao reativar assinatura', { error, subscriptionId: params.id })
    
    return NextResponse.json(
      { 
        error: 'Erro ao reativar assinatura',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
