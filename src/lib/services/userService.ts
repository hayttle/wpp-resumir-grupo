import { supabase } from '../supabase'
import { User, UserInsert, UserUpdate } from '@/types/database'

export class UserService {
  // Criar novo usuário (apenas para o usuário atual)
  static async createUser(userData: UserInsert): Promise<User | null> {
    try {
      const { data, error } = await supabase
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

  // Buscar usuário por ID (apenas se for o usuário atual)
  static async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
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

  // Buscar usuário por email (apenas se for o usuário atual)
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        console.error('Erro ao buscar usuário por email:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error)
      return null
    }
  }

  // Atualizar usuário (apenas se for o usuário atual)
  static async updateUser(id: string, updates: UserUpdate): Promise<User | null> {
    try {
      const { data, error } = await supabase
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

  // Buscar perfil do usuário atual
  static async getCurrentUserProfile(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      return null
    }
  }

  // Atualizar perfil do usuário atual
  static async updateCurrentUserProfile(updates: UserUpdate): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      return null
    }
  }
}
