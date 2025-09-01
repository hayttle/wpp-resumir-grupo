// API Routes para gerenciar assinaturas - Modelo 1 assinatura = 1 grupo
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Logger } from '@/lib/utils/logger'

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

    Logger.info('SubscriptionsAPI', 'Buscando assinaturas do usuário', { userId })

         const { data: subscriptions, error } = await supabaseAdmin
       .from('subscriptions')
       .select('*')
       .eq('user_id', userId)
       .order('created_at', { ascending: false })

    if (error) {
      Logger.error('SubscriptionsAPI', 'Erro ao buscar assinaturas', { error, userId })
      return NextResponse.json(
        { error: 'Erro ao buscar assinaturas' },
        { status: 500 }
      )
    }

    Logger.info('SubscriptionsAPI', 'Assinaturas encontradas', { 
      userId, 
      count: subscriptions?.length || 0 
    })

    return NextResponse.json({
      subscriptions: subscriptions || []
    })

  } catch (error) {
    Logger.error('SubscriptionsAPI', 'Erro interno ao buscar assinaturas', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


