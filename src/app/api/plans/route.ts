// API Routes para gerenciar plano único de assinatura
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    Logger.info('PlansAPI', 'Buscando planos disponíveis')

    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      Logger.error('PlansAPI', 'Erro ao buscar planos', { error })
      return NextResponse.json(
        { error: 'Erro ao buscar planos' },
        { status: 500 }
      )
    }

    Logger.info('PlansAPI', 'Planos encontrados', { count: plans?.length || 0 })

    return NextResponse.json({
      plans: plans || []
    })

  } catch (error) {
    Logger.error('PlansAPI', 'Erro interno ao buscar planos', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
