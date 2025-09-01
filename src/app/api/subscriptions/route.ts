// API Routes para gerenciar assinaturas - Modelo 1 assinatura = 1 grupo
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('SubscriptionsAPI')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    logger.info('Buscando assinaturas do usuário', { userId })

    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          description,
          features,
          maxGroups,
          maxInstances
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Erro ao buscar assinaturas', { error, userId })
      return NextResponse.json(
        { error: 'Erro ao buscar assinaturas' },
        { status: 500 }
      )
    }

    logger.info('Assinaturas encontradas', { 
      userId, 
      count: subscriptions?.length || 0 
    })

    return NextResponse.json({
      subscriptions: subscriptions || []
    })

  } catch (error) {
    logger.error('Erro interno ao buscar assinaturas', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova assinatura
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  try {
    console.log('🚀 [CREATE SUBSCRIPTION REQUEST]', {
      timestamp,
      method: request.method,
      url: request.url
    })

    // Verificar variáveis de ambiente
    if (!validateServerEnv()) {
      console.error('❌ [SERVER ENV INVALID]', { timestamp })
      return NextResponse.json(
        { error: 'Configuração do servidor inválida' },
        { status: 500 }
      )
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      console.error('❌ [UNAUTHORIZED]', { timestamp })
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('👤 [USER AUTHENTICATED]', {
      timestamp,
      userId: user.id,
      userEmail: user.email
    })

    const body = await request.json()
    const { groupId, billingType = 'PIX', creditCardData } = body

    console.log('📋 [REQUEST BODY]', {
      timestamp,
      groupId,
      billingType,
      hasCreditCardData: !!creditCardData,
      creditCardData: creditCardData ? {
        holderName: creditCardData.holderName,
        hasNumber: !!creditCardData.number,
        hasExpiry: !!(creditCardData.expiryMonth && creditCardData.expiryYear),
        hasCcv: !!creditCardData.ccv
      } : undefined
    })

    // Validações básicas
    if (!groupId) {
      console.error('❌ [MISSING GROUP ID]', { timestamp })
      return NextResponse.json(
        { error: 'ID do grupo é obrigatório' },
        { status: 400 }
      )
    }

    if (!['CREDIT_CARD', 'BOLETO', 'PIX'].includes(billingType)) {
      console.error('❌ [INVALID BILLING TYPE]', { timestamp, billingType })
      return NextResponse.json(
        { error: 'Tipo de cobrança inválido' },
        { status: 400 }
      )
    }

    // Verificar se usuário já tem assinatura ativa para este grupo
    console.log('🔍 [CHECKING EXISTING ACCESS]', {
      timestamp,
      userId: user.id,
      groupId
    })

    const canAccess = await AsaasSubscriptionService.canAccessGroup(user.id, groupId)
    if (canAccess) {
      console.error('❌ [ALREADY HAS ACCESS]', {
        timestamp,
        userId: user.id,
        groupId
      })
      return NextResponse.json(
        { error: 'Usuário já possui assinatura ativa para este grupo' },
        { status: 400 }
      )
    }

    console.log('✅ [VALIDATION PASSED]', {
      timestamp,
      userId: user.id,
      groupId,
      billingType
    })

    // Criar assinatura
    console.log('⚙️ [CREATING SUBSCRIPTION]', {
      timestamp,
      userId: user.id,
      groupId,
      billingType
    })

    const result = await AsaasSubscriptionService.createSubscription(
      user.id,
      groupId,
      billingType,
      creditCardData
    )

    console.log('🎉 [SUBSCRIPTION CREATED SUCCESS]', {
      timestamp,
      subscriptionId: result.subscription.id,
      userId: user.id,
      groupId,
      hasPaymentUrl: !!result.paymentUrl,
      subscriptionStatus: result.subscription.status
    })

    return NextResponse.json({
      message: 'Assinatura criada com sucesso',
      subscription: result.subscription,
      paymentUrl: result.paymentUrl
    }, { status: 201 })

  } catch (error) {
    console.error('💥 [CREATE SUBSCRIPTION FAILED]', {
      timestamp,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// PUT - Atualizar assinatura (para cancelamento, principalmente)
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subscriptionId, action } = body

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Verificar se a assinatura pertence ao usuário
    const subscriptions = await AsaasSubscriptionService.getUserSubscriptions(user.id)
    const subscription = subscriptions.find(s => s.id === subscriptionId)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'cancel':
        await AsaasSubscriptionService.cancelSubscription(subscriptionId)
        return NextResponse.json({
          message: 'Assinatura cancelada com sucesso'
        })

      case 'sync':
        await AsaasSubscriptionService.syncUserSubscriptions(user.id)
        return NextResponse.json({
          message: 'Assinaturas sincronizadas com sucesso'
        })

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
