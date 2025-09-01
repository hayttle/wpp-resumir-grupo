'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Plus, Edit, Trash2, MessageSquare, Calendar, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils/formatters'

interface AdminGroup {
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

export default function AdminGroupsManager() {
  const { user: currentUser } = useAuth()
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Carregar grupos
  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch('/api/admin/groups', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar grupos')
      }

      const result = await response.json()
      setGroups(result.groups || [])
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
      // Em caso de erro, definir lista vazia
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar grupos por busca
  const filteredGroups = groups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.group_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.instance_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Atualizar grupo
  const handleSaveGroup = async () => {
    if (!editingGroup) return

    try {
      setLoading(true)

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch('/api/admin/groups', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupId: editingGroup.id,
          updates: editingGroup
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar grupo')
      }

      const result = await response.json()

      if (result.group) {
        // Atualizar lista local
        setGroups(prev => prev.map(g =>
          g.id === editingGroup.id ? result.group : g
        ))
      }

      setEditingGroup(null)
      setIsEditing(false)


    } catch (error) {
      console.error('Erro ao atualizar grupo:', error)
      alert('Erro ao atualizar grupo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Deletar grupo
  const handleDeleteGroup = async (group: AdminGroup) => {
    if (!confirm(`Tem certeza que deseja deletar o grupo "${group.group_name}"?`)) {
      return
    }

    try {
      setLoading(true)

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(`/api/admin/groups?id=${group.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar grupo')
      }

      // Remover da lista local
      setGroups(prev => prev.filter(g => g.id !== group.id))


    } catch (error) {
      console.error('Erro ao deletar grupo:', error)
      alert('Erro ao deletar grupo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Alternar status ativo/inativo
  const handleToggleActive = async (group: AdminGroup) => {
    try {
      setLoading(true)

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch('/api/admin/groups', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupId: group.id,
          updates: { active: !group.active }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao alterar status')
      }

      const result = await response.json()

      if (result.group) {
        // Atualizar lista local
        setGroups(prev => prev.map(g =>
          g.id === group.id ? result.group : g
        ))


      }
    } catch (error) {
      console.error('Erro ao alterar status do grupo:', error)
      alert('Erro ao alterar status do grupo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }



  // Estatísticas dos grupos
  const totalGroups = groups.length
  const activeGroups = groups.filter(g => g.active).length
  const inactiveGroups = totalGroups - activeGroups
  const groupsByUser = [...new Set(groups.map(g => g.user_id))].length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Grupos</h1>
        <p className="text-gray-600 mt-2">
          Gerencie todos os grupos do WhatsApp monitorados no sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total de Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalGroups}</div>
            <p className="text-xs text-gray-500">grupos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              Grupos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeGroups}</div>
            <p className="text-xs text-gray-500">sendo monitorados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-red-600" />
              Grupos Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveGroups}</div>
            <p className="text-xs text-gray-500">pausados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários com Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{groupsByUser}</div>
            <p className="text-xs text-gray-500">usuários únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Grupos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, ID, usuário, instância..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={() => setSearchTerm('')}
              variant="outline"
              className="whitespace-nowrap"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Grupos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Grupos ({filteredGroups.length})</CardTitle>
          <CardDescription>
            Gerencie os grupos do WhatsApp cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando grupos...</p>
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum grupo encontrado</p>
              <p className="text-sm">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Não há grupos cadastrados no sistema'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        <h3 className="font-medium text-gray-900">{group.group_name}</h3>
                        <Badge variant={group.active ? "default" : "secondary"}>
                          {group.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">ID:</span> {group.group_id}
                        {group.instance_name && (
                          <span className="ml-4">
                            <span className="font-medium">Instância:</span> {group.instance_name}
                          </span>
                        )}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{group.user_name || 'Usuário não identificado'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Criado em {formatDate(group.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant={group.active ? "secondary" : "default"}
                        onClick={() => handleToggleActive(group)}
                        className="whitespace-nowrap"
                      >
                        {group.active ? 'Desativar' : 'Ativar'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingGroup(group)
                          setIsEditing(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteGroup(group)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {isEditing && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Grupo</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Grupo
                </label>
                <Input
                  value={editingGroup.group_name}
                  onChange={(e) => setEditingGroup({
                    ...editingGroup,
                    group_name: e.target.value
                  })}
                  placeholder="Nome do grupo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID do Grupo
                </label>
                <Input
                  value={editingGroup.group_id}
                  onChange={(e) => setEditingGroup({
                    ...editingGroup,
                    group_id: e.target.value
                  })}
                  placeholder="ID do grupo no WhatsApp"
                  disabled
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingGroup.active}
                  onChange={(e) => setEditingGroup({
                    ...editingGroup,
                    active: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Grupo ativo
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSaveGroup}
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setEditingGroup(null)
                }}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
