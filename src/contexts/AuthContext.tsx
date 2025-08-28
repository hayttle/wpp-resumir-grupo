'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { InstanceService } from '@/lib/services'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, userData: { name: string; phone_number?: string }) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: { name?: string; phone_number?: string }) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar se o Supabase está configurado
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('Supabase não está configurado. Verifique as variáveis de ambiente.')
      setLoading(false)
      return
    }

    // Buscar sessão atual
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Erro ao buscar sessão:', sessionError)
          setError('Erro ao conectar com o Supabase')
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar sessão:', err)
        setError('Erro inesperado ao conectar com o Supabase')
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)
          setError(null) // Limpar erros anteriores

          // Se o usuário fez login, criar/atualizar perfil no banco
          if (event === 'SIGNED_IN' && session?.user) {
            await createOrUpdateUserProfile(session.user)
          }
        } catch (err) {
          console.error('Erro ao processar mudança de autenticação:', err)
          setError('Erro ao processar autenticação')
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Criar ou atualizar perfil do usuário no banco
  const createOrUpdateUserProfile = async (user: User) => {
    try {
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao verificar usuário existente:', selectError)
        return
      }

      if (!existingUser) {
        // Criar novo usuário
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.name || 'Usuário',
              phone_number: user.user_metadata?.phone_number
            }
          ])

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError)
          return
        }

        // Criar instância automaticamente para novos usuários
        if (user.user_metadata?.name && user.user_metadata?.phone_number) {
          try {
            const instanceName = InstanceService.generateInstanceName(
              user.user_metadata.name,
              user.user_metadata.phone_number
            )

            await InstanceService.createInstance(
              user.id,
              instanceName,
              user.user_metadata.phone_number
            )

            console.log('✅ Instância criada automaticamente:', instanceName)
          } catch (instanceError) {
            console.error('❌ Erro ao criar instância:', instanceError)
            // Não falhar o cadastro se a instância não puder ser criada
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/criar perfil:', error)
    }
  }

  // Cadastro
  const signUp = async (email: string, password: string, userData: { name: string; phone_number?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            phone_number: userData.phone_number
          }
        }
      })

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Reset de senha
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Atualizar perfil
  const updateProfile = async (updates: { name?: string; phone_number?: string }) => {
    try {
      if (!user) return { error: new Error('Usuário não autenticado') }

      // Atualizar metadados do usuário
      const { error: authError } = await supabase.auth.updateUser({
        data: updates
      })

      if (authError) return { error: authError }

      // Atualizar perfil no banco
      const { error: dbError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (dbError) return { error: dbError }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
