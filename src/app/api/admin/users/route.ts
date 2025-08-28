import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/adminService'

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
