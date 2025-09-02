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

    // Buscar todos os resumos (sem filtro de usuário primeiro)
    const { data: allSummaries, error: allError } = await supabase
      .from('summaries')
      .select('*')
      .limit(10)

    // Buscar resumos do usuário atual
    const { data: userSummaries, error: userError } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', user.id)
      .limit(10)

    // Buscar resumos com join para group_selections
    const { data: summariesWithGroups, error: joinError } = await supabase
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
      .limit(10)

    return NextResponse.json({
      debug: {
        currentUser: user.id,
        allSummariesCount: allSummaries?.length || 0,
        userSummariesCount: userSummaries?.length || 0,
        summariesWithGroupsCount: summariesWithGroups?.length || 0,
        errors: {
          allError: allError?.message,
          userError: userError?.message,
          joinError: joinError?.message
        },
        sampleData: {
          allSummaries: allSummaries?.slice(0, 3),
          userSummaries: userSummaries?.slice(0, 3),
          summariesWithGroups: summariesWithGroups?.slice(0, 3)
        }
      }
    })

  } catch (error) {
    console.error('Erro na API de debug:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
