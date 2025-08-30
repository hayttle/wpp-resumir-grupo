import { createBrowserClient } from '@supabase/ssr'

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined'
  )
}

// Cliente para o browser com cookies automáticos - configuração menos agressiva
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desabilitar detecção automática de sessão na URL
    flowType: 'pkce' // Usar PKCE flow que é mais estável
  }
})

// Cliente para operações server-side (com service role) - apenas no servidor
export const supabaseAdmin = (() => {
  // Só criar o cliente admin se estivermos no servidor
  if (typeof window === 'undefined') {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY must be defined')
    }
    
    return createBrowserClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  // No cliente, retornar null para evitar erros
  return null
})()
