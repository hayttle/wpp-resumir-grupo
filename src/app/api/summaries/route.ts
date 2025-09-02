import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Summary } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Construir query base
    let query = supabase
      .from('summaries')
      .select(`
        *,
        group_selections!inner(
          id,
          group_name,
          group_id
        )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Filtrar por grupo se especificado
    if (groupId) {
      query = query.eq('group_selection_id', groupId)
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    const { data: summaries, error } = await query

    if (error) {
      console.error('Erro ao buscar resumos:', error)
      return NextResponse.json({ error: 'Erro ao buscar resumos' }, { status: 500 })
    }

    // Buscar total de registros para paginação
    let countQuery = supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (groupId) {
      countQuery = countQuery.eq('group_selection_id', groupId)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Erro ao contar resumos:', countError)
      return NextResponse.json({ error: 'Erro ao contar resumos' }, { status: 500 })
    }

    return NextResponse.json({
      summaries: summaries || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Erro na API de resumos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
