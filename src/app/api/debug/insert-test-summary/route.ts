import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

    // Buscar um group_selection do usuário para usar como referência
    const { data: groupSelections, error: groupError } = await supabase
      .from('group_selections')
      .select('id, group_name')
      .eq('user_id', user.id)
      .limit(1)

    if (groupError || !groupSelections || groupSelections.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum grupo encontrado para o usuário',
        groupError: groupError?.message
      }, { status: 400 })
    }

    const groupSelection = groupSelections[0]

    // Inserir resumo de teste
    const { data: newSummary, error: insertError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        group_selection_id: groupSelection.id,
        content: `Este é um resumo de teste para o grupo "${groupSelection.group_name}". 

O resumo foi gerado automaticamente para testar a funcionalidade de visualização de resumos.

Conteúdo do resumo:
- Discussão sobre automação de processos
- Implementação de novas funcionalidades
- Feedback dos usuários sobre melhorias
- Próximos passos para desenvolvimento

Este resumo contém 4 mensagens processadas e foi criado em ${new Date().toLocaleDateString('pt-BR')}.`,
        message_count: 4,
        date: new Date().toISOString().split('T')[0], // Data de hoje
        sent: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir resumo de teste:', insertError)
      return NextResponse.json({ 
        error: 'Erro ao inserir resumo de teste',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Resumo de teste inserido com sucesso',
      summary: newSummary
    })

  } catch (error) {
    console.error('Erro na API de inserção de teste:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
