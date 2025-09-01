// API Routes para gerenciar plano único de assinatura
import { NextRequest, NextResponse } from 'next/server'
import { AsaasSubscriptionService } from '@/lib/services/asaasSubscriptionService'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - Buscar o plano único disponível
export async function GET(request: NextRequest) {
  try {
    let plan = await AsaasSubscriptionService.getSinglePlan()

    // Se não há plano, criar um plano padrão
    if (!plan) {
      console.log('📋 Criando plano padrão...')
      
      const defaultPlan = {
        name: 'Plano Básico',
        description: 'Acesso a 1 grupo do WhatsApp',
        price: 29.90,
        billing_type: 'MONTHLY' as const,
        features: [
          'Monitoramento de 1 grupo',
          'Resumos automáticos diários',
          'Histórico de 30 dias',
          'Suporte por email'
        ]
      }

      const { data: newPlan, error } = await supabaseAdmin
        .from('subscription_plans')
        .insert([defaultPlan])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao criar plano padrão:', error)
        return NextResponse.json(
          { error: 'Erro ao criar plano padrão' },
          { status: 500 }
        )
      }

      plan = newPlan
      console.log('✅ Plano padrão criado:', plan?.id)
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Não foi possível criar ou encontrar plano' },
        { status: 500 }
      )
    }

    return NextResponse.json({ plans: [plan] })

  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
