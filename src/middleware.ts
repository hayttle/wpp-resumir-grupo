import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Apenas para rotas da API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('🔧 Middleware: Interceptando rota:', request.nextUrl.pathname)
    
    // Criar cliente Supabase para verificar cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Não precisamos setar cookies aqui
          }
        }
      }
    )

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('🔧 Middleware: Status da autenticação:', { 
        user: user?.id, 
        error: error?.message,
        cookies: request.cookies.getAll().map(c => c.name)
      })
    } catch (err) {
      console.error('❌ Middleware: Erro ao verificar autenticação:', err)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*'
  ]
}
