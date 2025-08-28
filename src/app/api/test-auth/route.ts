import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test Auth: Iniciando teste de autenticação...')
    
    // 1. Verificar todos os cookies recebidos
    const cookieStore = cookies()
    console.log('🔧 Cookies recebidos:', cookieStore.getAll().map(c => ({
      name: c.name,
      value: c.value.substring(0, 20) + '...'
    })))
    
    // 2. Tentar autenticar usuário
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
    
    console.log('🔧 Test Auth: Resultado da autenticação:', { 
      user: user?.id, 
      error: authError?.message,
      hasUser: !!user
    })
    
    // 3. Tentar obter sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('🔧 Test Auth: Resultado da sessão:', { 
      session: session?.user?.id, 
      error: sessionError?.message,
      hasSession: !!session
    })
    
    return NextResponse.json({
      success: true,
      cookies: cookieStore.getAll().map(c => c.name),
      user: user?.id || null,
      session: session?.user?.id || null,
      authError: authError?.message || null,
      sessionError: sessionError?.message || null
    })

  } catch (error) {
    console.error('❌ Test Auth: Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
