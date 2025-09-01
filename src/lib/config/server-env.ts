// Configuração de variáveis de ambiente SERVER-SIDE
// NUNCA usar essas variáveis no client-side!

export const serverEnv = {
  // Supabase Service Role (server-side apenas)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Evolution API
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || '',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
  
  // n8n Webhook
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || '',
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // Asaas Payment Gateway
  ASAAS_API_KEY: process.env.ASAAS_API_KEY || '',
  ASAAS_BASE_URL: process.env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com',
  ASAAS_SANDBOX: process.env.ASAAS_SANDBOX === 'true' || true,
  ASAAS_PLAN_URL: process.env.ASAAS_PLAN_URL || '',
}

// Função para verificar variáveis de ambiente do servidor
export const validateServerEnv = () => {
  const required = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'ASAAS_API_KEY'
  ]
  
  const missing = required.filter(key => !serverEnv[key as keyof typeof serverEnv])
  
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente SERVER-SIDE obrigatórias não configuradas:', missing)
    return false
  }
  
  console.log('✅ Variáveis de ambiente do servidor configuradas corretamente')
  return true
}

// Função para obter variável de ambiente do servidor com fallback
export const getServerEnvVar = (key: keyof typeof serverEnv, fallback: string = ''): string => {
  const value = serverEnv[key]
  return typeof value === 'string' ? value : fallback
}

// Configuração específica do Asaas
export const asaasConfig = {
  apiKey: serverEnv.ASAAS_API_KEY,
  baseUrl: serverEnv.ASAAS_BASE_URL,
  isSandbox: serverEnv.ASAAS_SANDBOX,
  
  // Headers padrão para requisições
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'access_token': serverEnv.ASAAS_API_KEY,
    'User-Agent': 'WppResumir/1.0'
  })
}
