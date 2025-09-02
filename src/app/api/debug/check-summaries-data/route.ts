import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
              // Ignore
            }
          },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Não autorizado',
        authError: authError?.message,
        user: user?.id 
      }, { status: 401 })
    }

    // Buscar TODOS os resumos na tabela (sem filtro de usuário)
    const { data: allSummaries, error: allError } = await supabase
      .from('summaries')
      .select(`
        *,
        group_selections(
          id,
          group_name,
          group_id,
          user_id
        )
      `)
      .limit(20)

    // Buscar resumos do usuário atual
    const { data: userSummaries, error: userError } = await supabase
      .from('summaries')
      .select(`
        *,
        group_selections(
          id,
          group_name,
          group_id,
          user_id
        )
      `)
      .eq('user_id', user.id)
      .limit(20)

    // Buscar resumos sem user_id (NULL)
    const { data: nullUserSummaries, error: nullError } = await supabase
      .from('summaries')
      .select(`
        *,
        group_selections(
          id,
          group_name,
          group_id,
          user_id
        )
      `)
      .is('user_id', null)
      .limit(20)

    return NextResponse.json({
      debug: {
        currentUser: user.id,
        currentUserEmail: user.email,
        counts: {
          allSummaries: allSummaries?.length || 0,
          userSummaries: userSummaries?.length || 0,
          nullUserSummaries: nullUserSummaries?.length || 0
        },
        errors: {
          allError: allError?.message,
          userError: userError?.message,
          nullError: nullError?.message
        },
        sampleData: {
          allSummaries: allSummaries?.slice(0, 3).map(s => ({
            id: s.id,
            user_id: s.user_id,
            group_selection_id: s.group_selection_id,
            group_name: s.group_selections?.group_name,
            group_user_id: s.group_selections?.user_id,
            date: s.date,
            message_count: s.message_count
          })),
          userSummaries: userSummaries?.slice(0, 3),
          nullUserSummaries: nullUserSummaries?.slice(0, 3).map(s => ({
            id: s.id,
            user_id: s.user_id,
            group_selection_id: s.group_selection_id,
            group_name: s.group_selections?.group_name,
            group_user_id: s.group_selections?.user_id,
            date: s.date
          }))
        }
      }
    })

  } catch (error) {
    console.error('Erro na API de verificação de dados:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
