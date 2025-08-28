import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    const { action, instanceName, groupSelection } = await request.json()
    
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

    // 2. Buscar seleções de grupos do usuário
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
      `${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}`,
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

    // Para cada grupo, verificar se já foi selecionado pelo usuário
    const groupsWithSelectionStatus = await Promise.all(
      groups.map(async (group: any) => {
        const isSelected = await checkIfGroupIsSelected(group.id, userId, supabase)
        return {
          ...group,
          isSelected
        }
      })
    )

    return NextResponse.json({
      success: true,
      groups: groupsWithSelectionStatus
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
    
    // Verificar se o grupo já foi selecionado
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
      active: true
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
