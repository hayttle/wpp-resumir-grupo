import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  totalGroups: number
  activeGroups: number
  totalSummaries: number
  summariesThisMonth: number
  instanceStatus: 'open' | 'close' | 'connecting' | null
  instanceName: string | null
  lastSummaryDate: string | null
}

export class DashboardService {
  // Buscar estatísticas do dashboard para um usuário específico
  static async getUserDashboardStats(userId: string): Promise<DashboardStats | null> {
    try {
      // Buscar grupos do usuário
      const { data: groups, error: groupsError } = await supabase
        .from('group_selections')
        .select('id, active, created_at')
        .eq('user_id', userId)

      if (groupsError) {
        console.error('Erro ao buscar grupos:', groupsError)
        return null
      }

      // Buscar instância do usuário
      const { data: instances, error: instanceError } = await supabase
        .from('instances')
        .select('status, instance_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (instanceError) {
        console.error('Erro ao buscar instância:', instanceError)
      }

      const instance = instances && instances.length > 0 ? instances[0] : null

      // Calcular estatísticas básicas
      const totalGroups = groups?.length || 0
      const activeGroups = groups?.filter(g => g.active).length || 0
      
      let totalSummaries = 0
      let summariesThisMonth = 0
      let lastSummaryDate: string | null = null

      // Buscar resumos apenas se houver grupos
      if (totalGroups > 0) {
        const groupIds = groups!.map(g => g.id).filter(id => id)
        
        if (groupIds.length > 0) {
          const { data: summaries, error: summariesError } = await supabase
            .from('summaries')
            .select('created_at')
            .in('group_selection_id', groupIds)
            .order('created_at', { ascending: false })

          if (summariesError) {
            console.error('Erro ao buscar resumos:', summariesError)
            // Não falhar se houver erro nos resumos
          } else {
            totalSummaries = summaries?.length || 0

            // Calcular resumos deste mês
            if (totalSummaries > 0) {
              const now = new Date()
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
              summariesThisMonth = summaries!.filter(s => 
                new Date(s.created_at) >= startOfMonth
              ).length

              // Última data de resumo
              lastSummaryDate = summaries![0].created_at
            }
          }
        }
      }

      return {
        totalGroups,
        activeGroups,
        totalSummaries,
        summariesThisMonth,
        instanceStatus: instance?.status || null,
        instanceName: instance?.instance_name || null,
        lastSummaryDate
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error)
      return null
    }
  }



  // Buscar status da instância em tempo real
  static async getInstanceStatus(userId: string) {
    try {
      const { data: instances, error } = await supabase
        .from('instances')
        .select('status, instance_name, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Erro ao buscar status da instância:', error)
        return null
      }

      const instance = instances && instances.length > 0 ? instances[0] : null
      if (!instance) {
        return null
      }

      return instance
    } catch (error) {
      console.error('Erro ao buscar status da instância:', error)
      return null
    }
  }
}
