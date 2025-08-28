import { supabaseAdmin } from '../supabase-admin'
import { User, UserInsert, UserUpdate } from '@/types/database'

// ⚠️ ATENÇÃO: Este serviço só deve ser usado em Server Components ou API Routes
// NUNCA use em componentes client-side por questões de segurança

export class AdminService {
  // Listar todos os usuários (admin)
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao listar usuários:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao listar usuários:', error)
      return []
    }
  }

  // Buscar usuário por ID (admin)
  static async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar usuário:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
  }

  // Criar usuário (admin)
  static async createUser(userData: UserInsert): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar usuário:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      return null
    }
  }

  // Atualizar usuário (admin)
  static async updateUser(id: string, updates: UserUpdate): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      return null
    }
  }

  // Deletar usuário (admin)
  static async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar usuário:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      return false
    }
  }

  // Buscar estatísticas do sistema (admin)
  static async getSystemStats() {
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id')

      if (usersError) {
        console.error('Erro ao buscar estatísticas:', usersError)
        return null
      }

      return {
        totalUsers: users?.length || 0,
        // Adicione outras estatísticas conforme necessário
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return null
    }
  }
}
