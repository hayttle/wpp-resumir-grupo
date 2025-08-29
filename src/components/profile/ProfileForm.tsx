'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Shield, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { UserService } from '@/lib/services/userService'

interface ProfileData {
  name: string
  email: string
  role: string
}

export default function ProfileForm() {
  const { user, updateUserProfile } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    role: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Carregar dados do perfil
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.profile?.name || '',
        email: user.email || '',
        role: user.profile?.role || 'user'
      })
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      setMessage({ type: 'error', text: 'Usuário não autenticado' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // Atualizar perfil no contexto
      await updateUserProfile({
        name: profileData.name,
        role: profileData.role as 'user' | 'admin'
      })

      // Atualizar no banco de dados
      await UserService.updateUser(user.id, {
        name: profileData.name,
        role: profileData.role as 'user' | 'admin'
      })

      setMessage({
        type: 'success',
        text: 'Perfil atualizado com sucesso!'
      })

      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      setMessage({
        type: 'error',
        text: 'Erro ao atualizar perfil. Tente novamente.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary'
  }

  const getRoleDisplayName = (role: string) => {
    return role === 'admin' ? 'Administrador' : 'Usuário'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-2">
          Atualize suas informações pessoais e configurações da conta
        </p>
      </div>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Suas informações básicas de identificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <Input
                id="name"
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            {/* Email (somente leitura) */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                O email não pode ser alterado por questões de segurança
              </p>
            </div>

            {/* Role (somente leitura para usuários normais) */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-gray-700">
                Tipo de Conta
              </label>
              <div className="flex items-center gap-3">
                <Badge variant={getRoleBadgeVariant(profileData.role)}>
                  {getRoleDisplayName(profileData.role)}
                </Badge>
                <p className="text-xs text-gray-500">
                  {user?.profile?.role === 'admin'
                    ? 'Administradores podem alterar o tipo de conta'
                    : 'Apenas administradores podem alterar o tipo de conta'
                  }
                </p>
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Mensagens de Feedback */}
      {message && (
        <Card className={`border-l-4 ${message.type === 'success'
            ? 'border-l-green-500 bg-green-50'
            : 'border-l-red-500 bg-red-50'
          }`}>
          <CardContent className="pt-6">
            <div className={`flex items-center gap-3 ${message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança da Conta
          </CardTitle>
          <CardDescription>
            Informações sobre a segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Autenticação</div>
                <div className="text-xs text-gray-500">Login via Supabase Auth</div>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Ativo
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Última Atualização</div>
                <div className="text-xs text-gray-500">
                  {user?.profile?.updated_at
                    ? new Date(user.profile.updated_at).toLocaleDateString('pt-BR')
                    : 'Nunca'
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
