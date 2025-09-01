import { supabase } from '../supabase'
import { WhatsAppGroup, GroupSelection, GroupSelectionInsert, GroupSelectionUpdate } from '@/types/database'

interface GroupWithSelectionStatus extends WhatsAppGroup {
  isSelected: boolean
  canSelect: boolean
}

interface FetchGroupsResult {
  groups: GroupWithSelectionStatus[]
  canSelectNewGroups: boolean
  reason?: string
  maxGroups?: number
}

export class GroupService {
  // Buscar todos os grupos da instância conectada
  static async fetchAllGroups(instanceName: string): Promise<FetchGroupsResult> {
    try {

      
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetchAllGroups',
          instanceName
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao buscar grupos:', errorData)
        throw new Error(errorData.error || 'Falha ao buscar grupos')
      }

      const result = await response.json()

      
      return {
        groups: result.groups || [],
        canSelectNewGroups: result.canSelectNewGroups || false,
        reason: result.reason,
        maxGroups: result.maxGroups
      }
    } catch (error) {
      console.error('❌ GroupService: Erro ao buscar grupos:', error)
      throw error
    }
  }

  // Salvar seleção de grupo no banco de dados
  static async saveGroupSelection(groupSelection: GroupSelectionInsert): Promise<GroupSelection | null> {
    try {

      
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveGroupSelection',
          groupSelection
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao salvar seleção de grupo:', errorData)
        throw new Error(errorData.error || 'Falha ao salvar seleção de grupo')
      }

      const result = await response.json()

      
      return result.groupSelection
    } catch (error) {
      console.error('❌ GroupService: Erro ao salvar seleção de grupo:', error)
      throw error
    }
  }

  // Buscar seleções de grupos do usuário
  static async getUserGroupSelections(): Promise<GroupSelection[]> {
    try {

      
      const response = await fetch('/api/groups')
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao buscar seleções de grupos:', errorData)
        return []
      }

      const result = await response.json()

      
      return result.groupSelections || []
    } catch (error) {
      console.error('❌ GroupService: Erro ao buscar seleções de grupos:', error)
      return []
    }
  }

  // Atualizar seleção de grupo
  static async updateGroupSelection(id: string, updates: GroupSelectionUpdate): Promise<GroupSelection | null> {
    try {
      const { data, error } = await supabase
        .from('group_selections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar seleção de grupo:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar seleção de grupo:', error)
      return null
    }
  }

  // Deletar seleção de grupo
  static async deleteGroupSelection(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('group_selections')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar seleção de grupo:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar seleção de grupo:', error)
      return false
    }
  }

  // Remover seleção de grupo via API (método preferido)
  static async removeGroupSelection(groupId: string): Promise<boolean> {
    try {

      
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeGroupSelection',
          groupSelection: { group_id: groupId }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao remover seleção de grupo:', errorData)
        throw new Error(errorData.error || 'Falha ao remover seleção de grupo')
      }

      const result = await response.json()

      
      return true
    } catch (error) {
      console.error('❌ GroupService: Erro ao remover seleção de grupo:', error)
      throw error
    }
  }

  // Verificar se grupo já foi selecionado
  static async isGroupAlreadySelected(groupId: string, userId: string): Promise<boolean> {
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
}
