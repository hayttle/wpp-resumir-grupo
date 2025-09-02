import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Summary } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

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
