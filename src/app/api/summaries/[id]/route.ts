import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const summaryId = params.id

    if (!summaryId) {
      return NextResponse.json({ error: 'ID do resumo é obrigatório' }, { status: 400 })
    }

    // Verificar se o resumo existe e pertence ao usuário
    const { data: existingSummary, error: fetchError } = await supabase
      .from('summaries')
      .select('id, user_id')
      .eq('id', summaryId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingSummary) {
      return NextResponse.json({ 
        error: 'Resumo não encontrado ou você não tem permissão para excluí-lo' 
      }, { status: 404 })
    }

    // Excluir o resumo
    const { error: deleteError } = await supabase
      .from('summaries')
      .delete()
      .eq('id', summaryId)
      .eq('user_id', user.id) // Dupla verificação de segurança

    if (deleteError) {
      console.error('Erro ao excluir resumo:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir resumo' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Resumo excluído com sucesso',
      deletedId: summaryId 
    })

  } catch (error) {
    console.error('Erro na API de exclusão:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
