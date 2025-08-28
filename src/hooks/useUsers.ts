import { useState, useEffect } from 'react'
import { UserService } from '@/lib/services'
import { User, UserInsert, UserUpdate } from '@/types/database'

export function useUsers() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar perfil do usuário atual
  const fetchCurrentUser = async () => {
    setLoading(true)
    setError(null)

    try {
      const user = await UserService.getCurrentUserProfile()
      setCurrentUser(user)
    } catch (err) {
      setError('Erro ao buscar perfil do usuário')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Atualizar perfil do usuário atual
  const updateCurrentUser = async (updates: UserUpdate): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      const updatedUser = await UserService.updateCurrentUserProfile(updates)
      if (updatedUser) {
        setCurrentUser(updatedUser)
      }
      return updatedUser
    } catch (err) {
      setError('Erro ao atualizar perfil')
      console.error(err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Limpar erro
  const clearError = () => setError(null)

  // Carregar usuário atual na inicialização
  useEffect(() => {
    fetchCurrentUser()
  }, [])

  return {
    currentUser,
    loading,
    error,
    updateCurrentUser,
    fetchCurrentUser,
    clearError
  }
}
