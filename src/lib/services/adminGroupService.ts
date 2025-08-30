import { supabaseAdmin } from '../supabase-admin'

// Este serviço só deve ser usado em contexto server-side
// No client-side, deve ser chamado via API routes

export interface AdminGroup {
  id: string
  group_name: string
  group_id: string
  user_id: string
  instance_id?: string
  user_name?: string
  user_email?: string
  instance_name?: string
  active: boolean
  created_at: string
  updated_at?: string
}

export class AdminGroupService {
  // Buscar todos os grupos do sistema (apenas para admins)
  static async getAllGroups(): Promise<AdminGroup[]> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Acesso administrativo não disponível')
      }

      // Buscar grupos com informações do usuário e instância
      const { data: groups, error } = await supabaseAdmin
        .from('group_selections')
        .select(`
          id,
          group_name,
          group_id,
          user_id,
          instance_id,
          active,
          created_at,
          updated_at,
          users!inner (
            name,
            email
          ),
          instances (
            instance_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar grupos:', error)
        throw new Error('Falha ao buscar grupos do sistema')
      }

      // Mapear dados para o formato esperado
      const adminGroups: AdminGroup[] = groups?.map(group => ({
        id: group.id,
        group_name: group.group_name,
        group_id: group.group_id,
        user_id: group.user_id,
        instance_id: group.instance_id,
        user_name: (group.users as any)?.name,
        user_email: (group.users as any)?.email,
        instance_name: (group.instances as any)?.instance_name,
        active: group.active,
        created_at: group.created_at,
        updated_at: group.updated_at
      })) || []

      return adminGroups
    } catch (error) {
      console.error('Erro ao buscar grupos administrativos:', error)
      throw error
    }
  }

  // Atualizar grupo (apenas para admins)
  static async updateGroup(groupId: string, updates: Partial<AdminGroup>): Promise<AdminGroup | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Acesso administrativo não disponível')
      }

      const { data: updatedGroup, error } = await supabaseAdmin
        .from('group_selections')
        .update({
          group_name: updates.group_name,
          active: updates.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
        .select(`
          id,
          group_name,
          group_id,
          user_id,
          instance_id,
          active,
          created_at,
          updated_at,
          users!inner (
            name,
            email
          ),
          instances (
            instance_name
          )
        `)
        .single()

      if (error) {
        console.error('Erro ao atualizar grupo:', error)
        throw new Error('Falha ao atualizar grupo')
      }

      if (!updatedGroup) {
        throw new Error('Grupo não encontrado')
      }

      // Mapear dados para o formato esperado
      const adminGroup: AdminGroup = {
        id: updatedGroup.id,
        group_name: updatedGroup.group_name,
        group_id: updatedGroup.group_id,
        user_id: updatedGroup.user_id,
        instance_id: updatedGroup.instance_id,
        user_name: (updatedGroup.users as any)?.name,
        user_email: (updatedGroup.users as any)?.email,
        instance_name: (updatedGroup.instances as any)?.name,
        active: updatedGroup.active,
        created_at: updatedGroup.created_at,
        updated_at: updatedGroup.updated_at
      }

      return adminGroup
    } catch (error) {
      console.error('Erro ao atualizar grupo administrativo:', error)
      throw error
    }
  }

  // Deletar grupo (apenas para admins)
  static async deleteGroup(groupId: string): Promise<boolean> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Acesso administrativo não disponível')
      }

      const { error } = await supabaseAdmin
        .from('group_selections')
        .delete()
        .eq('id', groupId)

      if (error) {
        console.error('Erro ao deletar grupo:', error)
        throw new Error('Falha ao deletar grupo')
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar grupo administrativo:', error)
      throw error
    }
  }

  // Alternar status ativo/inativo (apenas para admins)
  static async toggleGroupStatus(groupId: string, active: boolean): Promise<AdminGroup | null> {
    try {
      return await this.updateGroup(groupId, { active })
    } catch (error) {
      console.error('Erro ao alterar status do grupo:', error)
      throw error
    }
  }

  // Buscar estatísticas dos grupos (apenas para admins)
  static async getGroupStats(): Promise<{
    totalGroups: number
    activeGroups: number
    inactiveGroups: number
    groupsByUser: number
  }> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Acesso administrativo não disponível')
      }

      // Contar grupos totais
      const { count: totalGroups, error: totalError } = await supabaseAdmin
        .from('group_selections')
        .select('*', { count: 'exact', head: true })

      if (totalError) {
        console.error('Erro ao contar grupos totais:', totalError)
        throw new Error('Falha ao buscar estatísticas')
      }

      // Contar grupos ativos
      const { count: activeGroups, error: activeError } = await supabaseAdmin
        .from('group_selections')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      if (activeError) {
        console.error('Erro ao contar grupos ativos:', activeError)
        throw new Error('Falha ao buscar estatísticas')
      }

      // Contar usuários únicos com grupos
      const { data: uniqueUsers, error: usersError } = await supabaseAdmin
        .from('group_selections')
        .select('user_id')

      if (usersError) {
        console.error('Erro ao buscar usuários únicos:', usersError)
        throw new Error('Falha ao buscar estatísticas')
      }

      const groupsByUser = [...new Set(uniqueUsers?.map(g => g.user_id) || [])].length

      return {
        totalGroups: totalGroups || 0,
        activeGroups: activeGroups || 0,
        inactiveGroups: (totalGroups || 0) - (activeGroups || 0),
        groupsByUser
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos grupos:', error)
      throw error
    }
  }
}
