import { NextRequest, NextResponse } from 'next/server'
import { AsaasSubscriptionService } from '@/lib/services/asaasSubscriptionService'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, groupId } = await request.json()

    Logger.info('SubscriptionCreateAPI', 'Criando nova assinatura', { userId, planId, groupId })

    // Validar dados de entrada
    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'userId e planId são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, asaas_customer_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      Logger.error('SubscriptionCreateAPI', 'Usuário não encontrado', { userId, error: userError })
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o plano existe
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      Logger.error('SubscriptionCreateAPI', 'Plano não encontrado', { planId, error: planError })
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário já tem asaas_customer_id
    if (!user.asaas_customer_id) {
      Logger.error('SubscriptionCreateAPI', 'Usuário não tem customer_id do Asaas', { userId })
      return NextResponse.json(
        { error: 'Usuário não possui customer_id do Asaas' },
        { status: 400 }
      )
    }

    // Criar assinatura usando o novo serviço
    const { subscription, asaasSubscription } = await AsaasSubscriptionService.createSubscription(
      userId,
      planId,
      groupId
    )

    Logger.info('SubscriptionCreateAPI', 'Assinatura criada com sucesso', {
      subscriptionId: subscription.id,
      asaasSubscriptionId: asaasSubscription.id,
      userId,
      planId
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        asaas_subscription_id: subscription.asaas_subscription_id,
        group_id: subscription.group_id,
        next_billing_date: subscription.next_billing_date,
        value: subscription.value
      },
      asaasSubscription: {
        id: asaasSubscription.id,
        status: asaasSubscription.status,
        nextDueDate: asaasSubscription.nextDueDate,
        value: asaasSubscription.value,
        description: asaasSubscription.description
      },
      message: 'Assinatura criada com sucesso'
    })

  } catch (error) {
    Logger.error('SubscriptionCreateAPI', 'Erro ao criar assinatura', { error })
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
