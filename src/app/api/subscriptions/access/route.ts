// API Route para verificar acesso a grupos
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AsaasSubscriptionService } from '@/lib/services/asaasSubscriptionService'
import { validateServerEnv, serverEnv } from '@/lib/config/server-env'

// Inicializar Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY
)

// Função para obter usuário autenticado
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  return user
}

// POST - Verificar se usuário tem acesso a um grupo específico
export async function POST(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente
    if (!validateServerEnv()) {
      return NextResponse.json(
        { error: 'Configuração do servidor inválida' },
        { status: 500 }
      )
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { groupId } = body

    if (!groupId) {
      return NextResponse.json(
        { error: 'ID do grupo é obrigatório' },
        { status: 400 }
      )
    }

    const hasAccess = await AsaasSubscriptionService.canAccessGroup(user.id, groupId)
    const accessibleGroups = await AsaasSubscriptionService.getUserAccessibleGroups(user.id)
    const groupCount = await AsaasSubscriptionService.getUserGroupCount(user.id)

    return NextResponse.json({
      hasAccess,
      groupId,
      accessibleGroups,
      totalActiveSubscriptions: groupCount
    })

  } catch (error) {
    console.error('Erro ao verificar acesso ao grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar todos os grupos que o usuário tem acesso
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const accessibleGroups = await AsaasSubscriptionService.getUserAccessibleGroups(user.id)
    const activeSubscriptions = await AsaasSubscriptionService.getActiveSubscriptions(user.id)
    const groupCount = await AsaasSubscriptionService.getUserGroupCount(user.id)

    return NextResponse.json({
      accessibleGroups,
      activeSubscriptions,
      totalActiveSubscriptions: groupCount,
      hasAnyAccess: groupCount > 0
    })

  } catch (error) {
    console.error('Erro ao buscar grupos acessíveis:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
