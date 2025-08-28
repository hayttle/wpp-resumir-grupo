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
          setAll() {
            // Não precisamos setar cookies aqui
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔧 API Route Check: Tentativa de autenticação:', { user: user?.id, error: authError })
    
    if (authError || !user) {
      console.error('❌ API Route Check: Falha na autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('✅ API Route Check: Usuário autenticado:', user.id)

    // 2. Verificar se usuário tem instância
    const { data, error } = await supabase
      .from('instances')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (error) {
      console.error('❌ Erro ao verificar instância do usuário:', error)
      return NextResponse.json(
        { error: 'Erro ao verificar instância' },
        { status: 500 }
      )
    }

    const hasInstance = data && data.length > 0

    return NextResponse.json({
      success: true,
      hasInstance,
      userId: user.id
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
