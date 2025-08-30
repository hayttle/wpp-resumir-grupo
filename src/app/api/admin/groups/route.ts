import { NextRequest, NextResponse } from 'next/server'
import { AdminGroupService } from '@/lib/services/adminGroupService'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Verificar se o usuário é admin
async function verifyAdminAccess(request: NextRequest) {
  try {
    console.log('🔍 Verificando acesso admin...')
    
    const authHeader = request.headers.get('authorization')
    console.log('📋 Auth header presente:', !!authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Token não fornecido ou formato inválido')
      return { isAdmin: false, error: 'Token não fornecido' }
    }

    const token = authHeader.split(' ')[1]
    console.log('🔑 Token extraído, comprimento:', token?.length || 0)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.log('❌ Erro de autenticação:', authError)
      return { isAdmin: false, error: 'Usuário não autenticado' }
    }
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return { isAdmin: false, error: 'Usuário não autenticado' }
    }

    console.log('✅ Usuário autenticado:', user.id, user.email)

    // Buscar perfil do usuário usando supabaseAdmin para contornar RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('📊 Profile query result:', { profile, profileError })

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError)
      return { isAdmin: false, error: 'Erro ao verificar permissões' }
    }

    if (!profile) {
      console.log('❌ Perfil não encontrado')
      return { isAdmin: false, error: 'Perfil não encontrado' }
    }

    console.log('👤 Role do usuário:', profile.role)

    if (profile.role !== 'admin') {
      console.log('❌ Usuário não é admin, role:', profile.role)
      return { isAdmin: false, error: 'Acesso negado: usuário não é admin' }
    }

    console.log('✅ Acesso admin confirmado')
    return { isAdmin: true, userId: user.id }
  } catch (error) {
    console.log('❌ Erro interno na verificação:', error)
    return { isAdmin: false, error: 'Erro interno de verificação' }
  }
}

// GET - Listar todos os grupos (apenas admins)
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/admin/groups chamado')
    
    // Verificação temporária simplificada
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Token não fornecido')
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.log('❌ Usuário não autenticado:', authError)
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    console.log('✅ Usuário autenticado:', user.email)

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('📊 Profile result:', { profile, profileError })

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 403 })
    }

    if (profile?.role !== 'admin') {
      console.log('❌ Usuário não é admin:', profile?.role)
      return NextResponse.json({ error: 'Acesso negado: usuário não é admin' }, { status: 403 })
    }

    console.log('✅ Admin verificado, buscando grupos...')

    const groups = await AdminGroupService.getAllGroups()
    
    console.log('📊 Grupos encontrados:', groups.length)
    
    return NextResponse.json({
      success: true,
      groups,
      count: groups.length
    })
  } catch (error) {
    console.error('❌ Erro ao buscar grupos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar grupo (apenas admins)
export async function PUT(request: NextRequest) {
  try {
    const { isAdmin, error } = await verifyAdminAccess(request)
    
    if (!isAdmin) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, updates } = body

    if (!groupId) {
      return NextResponse.json(
        { error: 'ID do grupo é obrigatório' },
        { status: 400 }
      )
    }

    const updatedGroup = await AdminGroupService.updateGroup(groupId, updates)
    
    return NextResponse.json({
      success: true,
      group: updatedGroup
    })
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar grupo (apenas admins)
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin, error } = await verifyAdminAccess(request)
    
    if (!isAdmin) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')

    if (!groupId) {
      return NextResponse.json(
        { error: 'ID do grupo é obrigatório' },
        { status: 400 }
      )
    }

    await AdminGroupService.deleteGroup(groupId)
    
    return NextResponse.json({
      success: true,
      message: 'Grupo deletado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
