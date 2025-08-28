import { supabase, supabaseAdmin } from '../supabase'
import { Plan, PlanInsert, PlanUpdate } from '@/types/database'

export class PlanService {
  // Criar novo plano (admin)
  static async createPlan(planData: PlanInsert): Promise<Plan | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('plans')
        .insert([planData])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar plano:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao criar plano:', error)
      return null
    }
  }

  // Buscar plano por ID
  static async getPlanById(id: string): Promise<Plan | null> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar plano:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
      return null
    }
  }

  // Listar todos os planos
  static async getAllPlans(): Promise<Plan[]> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true })

      if (error) {
        console.error('Erro ao listar planos:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao listar planos:', error)
      return []
    }
  }

  // Atualizar plano (admin)
  static async updatePlan(id: string, updates: PlanUpdate): Promise<Plan | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar plano:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar plano:', error)
      return null
    }
  }

  // Deletar plano (admin)
  static async deletePlan(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('plans')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar plano:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar plano:', error)
      return false
    }
  }

  // Buscar planos por número máximo de grupos
  static async getPlansByMaxGroups(maxGroups: number): Promise<Plan[]> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .gte('max_groups', maxGroups)
        .order('price', { ascending: true })

      if (error) {
        console.error('Erro ao buscar planos por grupos:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar planos por grupos:', error)
      return []
    }
  }
}
