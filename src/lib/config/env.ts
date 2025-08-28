// Configuração de variáveis de ambiente (APENAS client-side seguras)
export const env = {
  // Supabase (seguro para client-side)
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}

// Função para verificar se as variáveis necessárias estão configuradas
export const validateEnv = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ]
  
  const missing = required.filter(key => !env[key as keyof typeof env])
  
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não configuradas:', missing)
    return false
  }
  
  console.log('✅ Todas as variáveis de ambiente obrigatórias estão configuradas')
  return true
}

// Função para obter variável de ambiente com fallback
export const getEnvVar = (key: keyof typeof env, fallback: string = ''): string => {
  return env[key] || fallback
}
