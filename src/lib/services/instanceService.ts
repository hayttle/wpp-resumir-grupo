import { supabase } from '../supabase'
import { Instance, InstanceInsert, InstanceUpdate } from '@/types/database'

export class InstanceService {
  // Criar nova instância via API Route (server-side)
  static async createInstance(userId: string, instanceName: string, phoneNumber: string): Promise<Instance | null> {
    try {

      
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName,
          phoneNumber
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao criar instância:', errorData)
        throw new Error(errorData.error || 'Falha ao criar instância')
      }

      const result = await response.json()

      
      return result.instance
    } catch (error) {
      console.error('❌ InstanceService: Erro ao criar instância:', error)
      return null
    }
  }

  // Buscar instância por ID
  static async getInstanceById(id: string): Promise<Instance | null> {
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar instância:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar instância:', error)
      return null
    }
  }

  // Buscar instância do usuário atual via API Route
  static async getCurrentUserInstance(): Promise<Instance | null> {
    try {

      
      const response = await fetch('/api/instances')
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao buscar instância:', errorData)
        return null
      }

      const result = await response.json()

      
      return result.instance
    } catch (error) {
      console.error('❌ InstanceService: Erro ao buscar instância:', error)
      return null
    }
  }

  // Atualizar instância
  static async updateInstance(id: string, updates: InstanceUpdate): Promise<Instance | null> {
    try {
      const { data, error } = await supabase
        .from('instances')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar instância:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar instância:', error)
      return null
    }
  }

  // Deletar instância (usuário e Evolution API) - TODO: Implementar via API Route
  static async deleteInstance(id: string): Promise<boolean> {
    try {
      // TODO: Implementar via API Route para manter segurança
      console.warn('⚠️ deleteInstance: Implementar via API Route para manter segurança')
      
      // Por enquanto, apenas deletar do banco
      const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar instância do banco:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar instância:', error)
      return false
    }
  }

  // Conectar instância (obter novo QR Code)
  static async connectInstance(): Promise<Instance | null> {
    try {

      
      const response = await fetch('/api/instances', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao conectar instância:', errorData)
        throw new Error(errorData.error || 'Falha ao conectar instância')
      }

      const result = await response.json()

      
      return result.instance
    } catch (error) {
      console.error('❌ InstanceService: Erro ao conectar instância:', error)
      throw error
    }
  }

  // Atualizar status da instância via Evolution API
  static async updateInstanceStatus(): Promise<Instance | null> {
    try {
      const response = await fetch('/api/instances', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Se é 404 (instância não encontrada), retornar null sem erro
        if (response.status === 404) {
          console.log('ℹ️ Nenhuma instância encontrada para atualizar status')
          return null
        }
        
        // Para outros erros, lançar exceção
        console.error('❌ Erro ao atualizar status:', errorData)
        throw new Error(errorData.error || 'Falha ao atualizar status')
      }

      const result = await response.json()
      return result.instance
    } catch (error) {
      // Se o erro for "instância não encontrada", retornar null
      if (error instanceof Error && error.message.includes('Instância não encontrada')) {
        console.log('ℹ️ Instância não encontrada - usuário ainda não criou uma instância')
        return null
      }
      
      console.error('❌ InstanceService: Erro ao atualizar status:', error)
      throw error
    }
  }

  // Desconectar instância WhatsApp
  static async disconnectInstance(): Promise<Instance | null> {
    try {

      
      const response = await fetch('/api/instances', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao desconectar instância:', errorData)
        throw new Error(errorData.error || 'Falha ao desconectar instância')
      }

      const result = await response.json()

      
      return result.instance
    } catch (error) {
      console.error('❌ InstanceService: Erro ao desconectar instância:', error)
      throw error
    }
  }

  // Gerar nome da instância (primeiro nome + telefone)
  static generateInstanceName(firstName: string, phoneNumber: string): string {
    // Limpar telefone (remover caracteres especiais)
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    // Pegar primeiro nome (primeira palavra)
    const firstNameClean = firstName.split(' ')[0].toLowerCase()
    
    return `${firstNameClean}_${cleanPhone}`
  }

  // Verificar se usuário já tem instância via API Route
  static async userHasInstance(userId: string): Promise<boolean> {
    try {

      
      const response = await fetch('/api/instances/check')
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro ao verificar instância:', errorData)
        return false
      }

      const result = await response.json()

      
      return result.hasInstance
    } catch (error) {
      console.error('❌ InstanceService: Erro ao verificar instância:', error)
      return false
    }
  }
}
