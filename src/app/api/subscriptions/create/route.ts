import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AsaasService } from '@/lib/services/asaasService'
import { serverEnv } from '@/lib/config/server-env'

export async function POST(request: NextRequest) {
  try {
    const { userId, planId } = await request.json()

    if (!userId || !planId) {
      return NextResponse.json(
        { error: { message: 'userId e planId são obrigatórios' } },
        { status: 400 }
      )
    }

    // 1. Buscar usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: { message: 'Usuário não encontrado' } },
        { status: 404 }
      )
    }

    // 2. Buscar plano
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: { message: 'Plano não encontrado' } },
        { status: 404 }
      )
    }

    // 3. Verificar se usuário já tem customer no Asaas
    if (!user.asaas_customer_id) {
      return NextResponse.json(
        { error: { message: 'Usuário não possui customer no Asaas' } },
        { status: 400 }
      )
    }

    // 4. Criar assinatura no banco de dados
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: 'pending',
      start_date: new Date().toISOString(),
      next_billing_date: new Date().toISOString(),
      external_reference: `${userId}-${planId}-${Date.now()}`
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (subscriptionError) {
      console.error('❌ Erro ao criar assinatura:', subscriptionError)
      return NextResponse.json(
        { error: { message: 'Erro ao criar assinatura' } },
        { status: 500 }
      )
    }

    console.log('✅ Assinatura criada no banco:', subscription.id)

    // 5. Gerar link de pagamento
    const planUrl = serverEnv.ASAAS_PLAN_URL
    if (!planUrl) {
      return NextResponse.json(
        { error: { message: 'URL do plano não configurada' } },
        { status: 500 }
      )
    }

    // Adicionar parâmetros ao link de pagamento
    const paymentUrl = new URL(planUrl)
    paymentUrl.searchParams.set('customer', user.asaas_customer_id)
    paymentUrl.searchParams.set('subscription_id', subscription.id)
    paymentUrl.searchParams.set('plan_name', plan.name)
    paymentUrl.searchParams.set('amount', plan.price.toString())
    paymentUrl.searchParams.set('external_reference', subscription.external_reference)

    console.log('🔗 Link de pagamento gerado:', paymentUrl.toString())

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        external_reference: subscription.external_reference
      },
      payment_url: paymentUrl.toString(),
      message: 'Assinatura criada com sucesso. Redirecionando para pagamento...'
    })

  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor' } },
      { status: 500 }
    )
  }
}
