import { useState, useEffect, useCallback } from 'react'
import { InstanceService } from '@/lib/services/instanceService'
import { Instance } from '@/types/database'

export function useInstanceStatus() {
  const [instance, setInstance] = useState<Instance | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const loadUserInstance = useCallback(async () => {
    try {
      setLoading(true)
      const userInstance = await InstanceService.getCurrentUserInstance()
      setInstance(userInstance)
    } catch (error) {
      console.error('❌ Erro ao carregar instância:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateInstanceStatus = useCallback(async () => {
    try {
      setUpdatingStatus(true)
      
      const updatedInstance = await InstanceService.updateInstanceStatus()
      if (updatedInstance) {
        setInstance(updatedInstance)
        return updatedInstance
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status da instância:', error)
      throw error
    } finally {
      setUpdatingStatus(false)
    }
  }, [])

  // Atualizar status automaticamente ao montar o hook
  useEffect(() => {
    const initializeInstance = async () => {
      await loadUserInstance()
      // Aguardar um pouco antes de atualizar o status para evitar conflitos
      setTimeout(async () => {
        try {
          await updateInstanceStatus()
        } catch (error) {

        }
      }, 1000)
    }
    
    initializeInstance()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    instance,
    loading,
    updatingStatus,
    updateInstanceStatus,
    loadUserInstance
  }
}
