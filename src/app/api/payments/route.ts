import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('PaymentsAPI')

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

    logger.info('Buscando pagamentos do usuário', { userId })

    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Erro ao buscar pagamentos', { error, userId })
      return NextResponse.json(
        { error: 'Erro ao buscar pagamentos' },
        { status: 500 }
      )
    }

    logger.info('Pagamentos encontrados', { 
      userId, 
      count: payments?.length || 0 
    })

    return NextResponse.json({
      payments: payments || []
    })

  } catch (error) {
    logger.error('Erro interno ao buscar pagamentos', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
