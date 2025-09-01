import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/adminService'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ⚠️ ATENÇÃO: Esta é uma API route que deve ser protegida por autenticação
// e verificação de permissões de admin

export async function GET(request: NextRequest) {
  try {
    // TODO: Implementar verificação de autenticação e permissões
    // const { user } = await getAuthenticatedUser(request)
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const users = await AdminService.getAllUsers()
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implementar verificação de autenticação e permissões
    // const { user } = await getAuthenticatedUser(request)
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const userData = await request.json()
    const newUser = await AdminService.createUser(userData)
    
    if (!newUser) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' }, 
        { status: 400 }
      )
    }
    
    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Implementar verificação de autenticação e permissões
    // const { user } = await getAuthenticatedUser(request)
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' }, 
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' }, 
        { status: 404 }
      )
    }

    // Não permitir deletar admins
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Não é possível deletar usuários administradores' }, 
        { status: 403 }
      )
    }

    // Remoção em cascata - Começar pelas tabelas que referenciam o usuário
    console.log(`Iniciando remoção em cascata para usuário ${userId} (${user.name})`)

    // 1. Primeiro buscar os IDs das seleções de grupo do usuário
    const { data: groupSelections } = await supabaseAdmin
      .from('group_selections')
      .select('id')
      .eq('user_id', userId)

    const groupSelectionIds = groupSelections?.map(gs => gs.id) || []

    // 2. Deletar mensagens relacionadas às seleções de grupo do usuário
    if (groupSelectionIds.length > 0) {
      const { error: messagesError } = await supabaseAdmin
        .from('messages')
        .delete()
        .in('group_selection_id', groupSelectionIds)

      if (messagesError) {
        console.error('Erro ao deletar mensagens:', messagesError)
      }

      // 3. Deletar resumos relacionados às seleções de grupo do usuário
      const { error: summariesError } = await supabaseAdmin
        .from('summaries')
        .delete()
        .in('group_selection_id', groupSelectionIds)

      if (summariesError) {
        console.error('Erro ao deletar resumos:', summariesError)
      }

      // 4. Deletar agendamentos relacionados às seleções de grupo do usuário
      const { error: schedulesError } = await supabaseAdmin
        .from('schedules')
        .delete()
        .in('group_selection_id', groupSelectionIds)

      if (schedulesError) {
        console.error('Erro ao deletar agendamentos:', schedulesError)
      }
    }

    // 5. Deletar seleções de grupo do usuário
    const { error: groupSelectionsError } = await supabaseAdmin
      .from('group_selections')
      .delete()
      .eq('user_id', userId)

    if (groupSelectionsError) {
      console.error('Erro ao deletar seleções de grupo:', groupSelectionsError)
    }

    // 6. Deletar assinaturas do usuário
    const { error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    if (subscriptionsError) {
      console.error('Erro ao deletar assinaturas:', subscriptionsError)
    }

    // 7. Buscar instâncias do usuário para deletar na Evolution API
    const { data: userInstances, error: fetchInstancesError } = await supabaseAdmin
      .from('instances')
      .select('instance_name, evolution_instance_id')
      .eq('user_id', userId)

    if (fetchInstancesError) {
      console.error('Erro ao buscar instâncias do usuário:', fetchInstancesError)
    }

    // 8. Deletar instâncias na Evolution API
    if (userInstances && userInstances.length > 0) {
      const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
      const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

      if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        console.error('❌ Variáveis de ambiente da Evolution API não configuradas')
      } else {
        for (const instance of userInstances) {
          try {
            console.log(`🗑️ Deletando instância ${instance.instance_name} na Evolution API...`)
            
            const evolutionResponse = await fetch(
              `${EVOLUTION_API_URL}/instance/delete/${instance.instance_name}`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': EVOLUTION_API_KEY
                }
              }
            )

            if (!evolutionResponse.ok) {
              const errorData = await evolutionResponse.json()
              console.error(`❌ Erro ao deletar instância ${instance.instance_name} na Evolution API:`, errorData)
            } else {
              const deleteData = await evolutionResponse.json()
              console.log(`✅ Evolution API: Instância ${instance.instance_name} deletada:`, deleteData)
            }
          } catch (error) {
            console.error(`❌ Erro ao deletar instância ${instance.instance_name} na Evolution API:`, error)
          }
        }
      }
    }

    // 9. Deletar instâncias do usuário do banco de dados
    const { error: instancesError } = await supabaseAdmin
      .from('instances')
      .delete()
      .eq('user_id', userId)

    if (instancesError) {
      console.error('Erro ao deletar instâncias:', instancesError)
    }

    // 10. Deletar do sistema de autenticação do Supabase
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Erro ao deletar usuário do auth:', deleteAuthError)
      return NextResponse.json(
        { error: 'Erro ao deletar usuário do sistema de autenticação' }, 
        { status: 500 }
      )
    }

    // 11. Por último, deletar da tabela users
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteUserError) {
      console.error('Erro ao deletar usuário da tabela:', deleteUserError)
      return NextResponse.json(
        { error: 'Erro ao deletar usuário da tabela' }, 
        { status: 500 }
      )
    }

    console.log(`Usuário ${userId} (${user.name}) removido com sucesso do auth e banco de dados, incluindo todos os dados relacionados`)

    return NextResponse.json({ 
      message: 'Usuário e todos os dados relacionados foram removidos com sucesso',
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}
