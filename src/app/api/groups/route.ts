import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AsaasSubscriptionService } from '@/lib/services/asaasSubscriptionService'

// Configuração server-side (segura)
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY


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
          setAll() {
            // Não precisamos setar cookies aqui
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ API Route Groups: Falha na autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('✅ API Route Groups: Usuário autenticado:', user.id)

    // 2. Verificar variáveis de ambiente
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error('❌ Variáveis de ambiente da Evolution API não configuradas')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // 3. Obter dados do request
    const body = await request.json()
    const { action, instanceName, groupSelection, groupId, groupName, planId, groupSize } = body
    
    if (!action) {
      return NextResponse.json(
        { error: 'Ação é obrigatória' },
        { status: 400 }
      )
    }

    // 4. Buscar instância do usuário
    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (instanceError || !instance) {
      console.error('❌ Erro ao buscar instância:', instanceError)
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // 5. Executar ação solicitada
    if (action === 'fetchAllGroups') {
      return await fetchAllGroups(instance.instance_name, supabase, user.id)
    } else if (action === 'saveGroupSelection') {
      return await saveGroupSelection(groupSelection, instance.id, user.id, supabase)
    } else if (action === 'removeGroupSelection') {
      return await removeGroupSelection(groupSelection, user.id, supabase)
    } else if (action === 'checkPermissions') {
      return await checkUserPermissions(user.id)
    } else if (action === 'createSubscriptionForGroup') {
      return await createSubscriptionForGroup(groupId, groupName, planId, user.id, supabase, groupSize)
    } else if (action === 'suspendGroup') {
      return await suspendGroup(groupId, user.id, supabase)
    } else if (action === 'reactivateGroup') {
      return await reactivateGroup(groupId, user.id, supabase)
    } else {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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
    
    if (authError || !user) {
      console.error('❌ API Route Groups GET: Falha na autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('✅ API Route Groups GET: Usuário autenticado:', user.id)

    // 2. Verificar se deve incluir dados da assinatura
    const { searchParams } = new URL(request.url)
    const withSubscription = searchParams.get('withSubscription') === 'true'

    if (withSubscription) {
      // Buscar grupos com dados da assinatura
      console.log('🔍 Buscando grupos com assinatura para usuário:', user.id)
      
      // Primeiro, buscar todos os grupos selecionados
      const { data: groupSelections, error: selectionError } = await supabase
        .from('group_selections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (selectionError) {
        console.error('❌ Erro ao buscar grupos selecionados:', selectionError)
        return NextResponse.json(
          { error: 'Erro ao buscar grupos' },
          { status: 500 }
        )
      }

      console.log('✅ Grupos selecionados encontrados:', groupSelections)

      // Para cada grupo, buscar a assinatura e pagamentos
      const groupSelectionsWithData = await Promise.all(
        (groupSelections || []).map(async (group) => {
          let subscription = null
          let payments = []

          if (group.subscription_id) {
            // Buscar assinatura
            const { data: subData, error: subError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('id', group.subscription_id)
              .single()

            if (subError) {
              console.error('❌ Erro ao buscar assinatura:', subError)
            } else {
              subscription = subData

              // Buscar pagamentos da assinatura
              const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .eq('subscription_id', group.subscription_id)
                .order('created_at', { ascending: false })

              if (paymentsError) {
                console.error('❌ Erro ao buscar pagamentos:', paymentsError)
              } else {
                payments = paymentsData || []
              }
            }
          }

          return {
            ...group,
            subscription,
            payments
          }
        })
      )

      return NextResponse.json({
        success: true,
        groupSelections: groupSelectionsWithData
      })
    } else {
      // Buscar apenas grupos selecionados (comportamento padrão)
      const { data: groupSelections, error } = await supabase
        .from('group_selections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar seleções de grupos:', error)
        return NextResponse.json(
          { error: 'Erro ao buscar seleções de grupos' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        groupSelections: groupSelections || []
      })
    }

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para buscar todos os grupos da instância
async function fetchAllGroups(instanceName: string, supabase: any, userId: string) {
  try {
    console.log('🔍 Buscando grupos da instância:', instanceName)
    
    const groupsResponse = await fetch(
      `${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`,
      {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY!
        }
      }
    )

    if (!groupsResponse.ok) {
      const errorData = await groupsResponse.json()
      console.error('❌ Erro ao buscar grupos na Evolution API:', errorData)
      return NextResponse.json(
        { error: `Falha ao buscar grupos: ${errorData.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    const groups = await groupsResponse.json()
    console.log('✅ Evolution API: Grupos obtidos:', groups)

    // Verificar se o usuário pode selecionar novos grupos
    const canSelectNewGroups = await AsaasSubscriptionService.canSelectNewGroups(userId)
    
    // Para cada grupo, verificar se já foi selecionado pelo usuário
    const groupsWithSelectionStatus = await Promise.all(
      groups.map(async (group: any) => {
        const isSelected = await checkIfGroupIsSelected(group.id, userId, supabase)
        return {
          ...group,
          isSelected,
          canSelect: canSelectNewGroups.canSelect && !isSelected
        }
      })
    )

    return NextResponse.json({
      success: true,
      groups: groupsWithSelectionStatus,
      canSelectNewGroups: canSelectNewGroups.canSelect,
      reason: canSelectNewGroups.reason
    })

  } catch (error) {
    console.error('❌ Erro interno ao buscar grupos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para salvar seleção de grupo
async function saveGroupSelection(groupSelection: any, instanceId: string, userId: string, supabase: any) {
  try {
    console.log('💾 Salvando seleção de grupo:', groupSelection)
    
    // Verificar se o usuário pode selecionar este grupo
    const canSelect = await AsaasSubscriptionService.canSelectSpecificGroup(userId, groupSelection.group_id)
    
    if (!canSelect.canSelect) {
      console.log('❌ Usuário não pode selecionar grupo:', canSelect.reason)
      return NextResponse.json(
        { error: canSelect.reason || 'Não é possível selecionar este grupo' },
        { status: 403 }
      )
    }
    
    // Verificar se o grupo já foi selecionado (dupla verificação)
    const { data: existingSelection } = await supabase
      .from('group_selections')
      .select('id')
      .eq('group_id', groupSelection.group_id)
      .eq('user_id', userId)
      .single()

    if (existingSelection) {
      return NextResponse.json(
        { error: 'Este grupo já foi selecionado' },
        { status: 400 }
      )
    }

    // Preparar dados para inserção
    const insertData = {
      user_id: userId,
      instance_id: instanceId,
      group_name: groupSelection.group_name,
      group_id: groupSelection.group_id,
      active: true,
      size: groupSelection.size || 0 // Incluir número de membros
    }

    console.log('🔍 Dados para inserção:', insertData)

    const { data: newGroupSelection, error: insertError } = await supabase
      .from('group_selections')
      .insert([insertData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro ao salvar seleção de grupo no banco:', insertError)
      return NextResponse.json(
        { error: 'Falha ao salvar seleção de grupo no banco' },
        { status: 500 }
      )
    }

    console.log('✅ Banco de dados: Seleção de grupo salva:', newGroupSelection)
    
    return NextResponse.json({
      success: true,
      groupSelection: newGroupSelection
    })

  } catch (error) {
    console.error('❌ Erro interno ao salvar seleção de grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para remover seleção de grupo
async function removeGroupSelection(groupSelection: any, userId: string, supabase: any) {
  try {
    console.log('🗑️ Removendo seleção de grupo:', groupSelection)

    const { data: existingSelection, error: deleteError } = await supabase
      .from('group_selections')
      .delete()
      .eq('group_id', groupSelection.group_id)
      .eq('user_id', userId)
      .select()
      .single()

    if (deleteError) {
      console.error('❌ Erro ao remover seleção de grupo no banco:', deleteError)
      return NextResponse.json(
        { error: 'Falha ao remover seleção de grupo no banco' },
        { status: 500 }
      )
    }

    console.log('✅ Banco de dados: Seleção de grupo removida:', existingSelection)

    return NextResponse.json({
      success: true,
      groupSelection: existingSelection
    })

  } catch (error) {
    console.error('❌ Erro interno ao remover seleção de grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para verificar se grupo já foi selecionado
async function checkIfGroupIsSelected(groupId: string, userId: string, supabase: any): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('group_selections')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar se grupo já foi selecionado:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Erro ao verificar se grupo já foi selecionado:', error)
    return false
  }
}

// Função para verificar apenas as permissões do usuário (sem depender da Evolution API)
async function checkUserPermissions(userId: string) {
  try {
    console.log('🔍 Verificando permissões do usuário:', userId)
    
    // Usar o serviço de assinaturas para verificar permissões
    const result = await AsaasSubscriptionService.canSelectNewGroups(userId)
    
    console.log('✅ Resultado da verificação de permissões:', result)
    
    return NextResponse.json({
      success: true,
      canSelectNewGroups: result.canSelect,
      reason: result.reason
    })
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar permissões' },
      { status: 500 }
    )
  }
}

// Função para criar assinatura para um grupo específico
async function createSubscriptionForGroup(groupId: string, groupName: string, planId: string, userId: string, supabase: any, groupSize?: number) {
  try {
    console.log('🔍 Criando assinatura para grupo:', { groupId, groupName, planId, userId })

    // Verificar se o grupo já tem uma assinatura
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') throw checkError

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Este grupo já possui uma assinatura' },
        { status: 400 }
      )
    }

    // Verificar se o grupo já foi selecionado
    const { data: existingSelection, error: selectionError } = await supabase
      .from('group_selections')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (selectionError && selectionError.code !== 'PGRST116') throw selectionError

    if (existingSelection) {
      return NextResponse.json(
        { error: 'Este grupo já foi selecionado' },
        { status: 400 }
      )
    }

    // Buscar instância do usuário para criar o group_selection
    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // Usar o nome do grupo enviado pelo frontend
    console.log('🔍 Usando nome do grupo enviado pelo frontend:', groupName)

    // Criar grupo selecionado no banco primeiro para obter o UUID
    console.log('🔍 Criando grupo selecionado no banco...')
    
    const groupSelectionData = {
      user_id: userId,
      instance_id: instance.id,
      group_name: groupName, // Nome do grupo enviado pelo frontend
      group_id: groupId,
      subscription_id: null, // Será preenchido pelo webhook
      active: true,
      size: groupSize || 0 // Usar número de membros recebido do frontend
    }

    console.log('🔍 Dados do grupo selecionado para salvar:', groupSelectionData)

    const { data: newGroupSelection, error: insertError } = await supabase
      .from('group_selections')
      .insert(groupSelectionData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro ao criar grupo selecionado:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar seleção de grupo' },
        { status: 500 }
      )
    }

    console.log('✅ Grupo selecionado criado no banco:', newGroupSelection)

    // Criar assinatura no Asaas usando o UUID do grupo como externalReference
    console.log('🔍 Criando assinatura no Asaas...', { userId, planId, groupId, groupSelectionId: newGroupSelection.id })
    
    const { subscription, asaasSubscription } = await AsaasSubscriptionService.createSubscriptionForGroup(
      userId,
      planId,
      newGroupSelection.id // Usar UUID do grupo selecionado como externalReference
    )

    console.log('✅ Assinatura criada no Asaas:', { 
      subscriptionId: subscription.id, 
      asaasId: asaasSubscription.id,
      externalReference: asaasSubscription.externalReference
    })

    // Criar assinatura local imediatamente após response do Asaas
    console.log('🔍 Criando assinatura local no banco...')
    
    const subscriptionInsert = {
      user_id: userId,
      plan_id: planId,
      asaas_subscription_id: asaasSubscription.id,
      group_id: groupId,
      external_reference: asaasSubscription.externalReference,
      customer: asaasSubscription.customer, // ID do cliente Asaas
      status: asaasSubscription.status.toLowerCase(),
      start_date: new Date().toISOString(),
      next_billing_date: asaasSubscription.nextDueDate ? new Date(asaasSubscription.nextDueDate).toISOString() : null,
      value: asaasSubscription.value,
      billing_type: asaasSubscription.billingType,
      cycle: asaasSubscription.cycle,
      description: asaasSubscription.description
    }

    const { data: newSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptionInsert)
      .select('id')
      .single()

    if (subscriptionError) {
      console.error('❌ Erro ao criar assinatura local:', subscriptionError)
      return NextResponse.json(
        { error: 'Erro ao criar assinatura local' },
        { status: 500 }
      )
    }

    console.log('✅ Assinatura local criada:', newSubscription)

    // Atualizar group_selection com o subscription_id local
    console.log('🔍 Atualizando group_selection com subscription_id local...')
    
    const { error: updateError } = await supabase
      .from('group_selections')
      .update({ subscription_id: newSubscription.id })
      .eq('id', newGroupSelection.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar group_selection:', updateError)
      return NextResponse.json(
        { error: 'Erro ao vincular assinatura ao grupo' },
        { status: 500 }
      )
    }

    console.log('✅ Group_selection atualizado com subscription_id local')

    // Retornar dados da assinatura e grupo selecionado
    return NextResponse.json({
      success: true,
      subscription: newSubscription,
      asaasSubscription,
      groupSelection: newGroupSelection,
      message: 'Assinatura criada no Asaas e vinculada ao grupo com sucesso.'
    })

  } catch (error) {
    console.error('❌ Erro ao criar assinatura para grupo:', error)
    return NextResponse.json(
      { error: 'Erro ao criar assinatura para o grupo' },
      { status: 500 }
    )
  }
}

// Função para suspender um grupo (alterar status para inativo)
async function suspendGroup(groupId: string, userId: string, supabase: any) {
  try {
    console.log('⏸️ Suspendo grupo:', { groupId, userId })

    // Buscar o grupo selecionado
    const { data: groupSelection, error: findError } = await supabase
      .from('group_selections')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (findError) {
      console.error('❌ Erro ao buscar grupo selecionado:', findError)
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar status do grupo para inativo
    const { data: updatedGroup, error: updateError } = await supabase
      .from('group_selections')
      .update({ active: false })
      .eq('id', groupSelection.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao suspender grupo:', updateError)
      return NextResponse.json(
        { error: 'Erro ao suspender grupo' },
        { status: 500 }
      )
    }

    console.log('✅ Grupo suspenso com sucesso:', updatedGroup)

    return NextResponse.json({
      success: true,
      groupSelection: updatedGroup,
      message: 'Grupo suspenso com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro interno ao suspender grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para reativar um grupo (alterar status para ativo)
async function reactivateGroup(groupId: string, userId: string, supabase: any) {
  try {
    console.log('▶️ Reativando grupo:', { groupId, userId })

    // Buscar o grupo selecionado
    const { data: groupSelection, error: findError } = await supabase
      .from('group_selections')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (findError) {
      console.error('❌ Erro ao buscar grupo selecionado:', findError)
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar status do grupo para ativo
    const { data: updatedGroup, error: updateError } = await supabase
      .from('group_selections')
      .update({ active: true })
      .eq('id', groupSelection.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao reativar grupo:', updateError)
      return NextResponse.json(
        { error: 'Erro ao reativar grupo' },
        { status: 500 }
      )
    }

    console.log('✅ Grupo reativado com sucesso:', updatedGroup)

    return NextResponse.json({
      success: true,
      groupSelection: updatedGroup,
      message: 'Grupo reativado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro interno ao reativar grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
