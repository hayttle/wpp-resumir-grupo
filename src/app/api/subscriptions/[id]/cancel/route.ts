import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AsaasService } from '@/lib/services/asaasService'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('CancelSubscriptionAPI')

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json()
    const subscriptionId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      )
    }

    logger.info('Cancelando assinatura', { subscriptionId, userId })

    // Buscar assinatura
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !subscription) {
      logger.error('Assinatura não encontrada', { subscriptionId, userId, error: fetchError })
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a assinatura pertence ao usuário
    if (subscription.user_id !== userId) {
      logger.error('Usuário não autorizado a cancelar esta assinatura', { subscriptionId, userId })
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Cancelar no Asaas se tiver ID
    if (subscription.asaas_subscription_id) {
      try {
        await AsaasService.cancelSubscription(subscription.asaas_subscription_id)
        logger.info('Assinatura cancelada no Asaas', { asaasSubscriptionId: subscription.asaas_subscription_id })
      } catch (asaasError) {
        logger.error('Erro ao cancelar no Asaas', { 
          asaasSubscriptionId: subscription.asaas_subscription_id, 
          error: asaasError 
        })
        // Continuar mesmo se falhar no Asaas
      }
    }

    // Atualizar status no banco
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (updateError) {
      logger.error('Erro ao atualizar status da assinatura', { subscriptionId, error: updateError })
      return NextResponse.json(
        { error: 'Erro ao cancelar assinatura' },
        { status: 500 }
      )
    }

    logger.info('Assinatura cancelada com sucesso', { subscriptionId, userId })

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso'
    })

  } catch (error) {
    logger.error('Erro interno ao cancelar assinatura', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
