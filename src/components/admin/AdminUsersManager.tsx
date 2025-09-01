'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, UserPlus, Edit, Trash2, Shield, Mail, Calendar } from 'lucide-react'
import { UserService } from '@/lib/services/userService'
import { useAuth } from '@/contexts/AuthContext'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'


interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: string
  updated_at?: string
}

export default function AdminUsersManager() {
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Carregar usuários
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const allUsers = await UserService.getAllUsers()
      setUsers(allUsers || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de confirmação
  const handleDeleteUser = (user: User) => {
    if (user.role === 'admin') {
      addToast({
        type: 'warning',
        title: 'Ação não permitida',
        message: 'Não é possível deletar usuários administradores'
      })
      return
    }

    if (user.id === currentUser?.id) {
      addToast({
        type: 'warning',
        title: 'Ação não permitida',
        message: 'Você não pode deletar sua própria conta'
      })
      return
    }

    setUserToDelete(user)
  }

  // Confirmar deleção
  const confirmDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users?userId=${userToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        // Remover usuário da lista local
        setUsers(users.filter(u => u.id !== userToDelete.id))
        addToast({
          type: 'success',
          title: 'Usuário removido',
          message: `Usuário "${userToDelete.name}" foi removido com sucesso`
        })
        setUserToDelete(null)
      } else {
        addToast({
          type: 'error',
          title: 'Erro ao remover usuário',
          message: data.error || 'Erro desconhecido'
        })
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      addToast({
        type: 'error',
        title: 'Erro interno',
        message: 'Tente novamente em alguns instantes'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancelar deleção
  const cancelDelete = () => {
    setUserToDelete(null)
  }

  // Filtrar usuários por busca
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Editar usuário
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditing(true)
  }

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      setIsEditing(true)
      await UserService.updateUser(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role
      })

      // Atualizar lista local
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id ? editingUser : u
      ))

      setEditingUser(null)
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      addToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: 'Não foi possível atualizar o usuário. Tente novamente.'
      })
    }
  }

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingUser(null)
    setIsEditing(false)
    loadUsers() // Recarregar dados originais
  }

  // Alterar role do usuário
  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await UserService.updateUser(userId, { role: newRole })

      // Atualizar lista local
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ))
    } catch (error) {
      console.error('Erro ao alterar role:', error)
      addToast({
        type: 'error',
        title: 'Erro ao alterar role',
        message: 'Não foi possível alterar o papel do usuário. Tente novamente.'
      })
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <p className="text-gray-600 mt-2">
          Gerencie todos os usuários do sistema, altere roles e monitore atividades
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                <div className="text-sm text-gray-600">Total de Usuários</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-sm text-gray-600">Administradores</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'user').length}
                </div>
                <div className="text-sm text-gray-600">Usuários Comuns</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie permissões e informações dos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Campo de busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar usuários por nome, email ou role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela de usuários */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Usuário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Criado em</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name || 'Sem nome'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => {
                          if (currentUser?.id !== user.id) {
                            const newRole = user.role === 'admin' ? 'user' : 'admin'
                            handleRoleChange(user.id, newRole)
                          }
                        }}
                      >
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                      {currentUser?.id === user.id && (
                        <span className="text-xs text-gray-500 ml-2">(Você)</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={currentUser?.id === user.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={currentUser?.id === user.id || user.role === 'admin'}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mensagem quando não há resultados */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum usuário encontrado para &quot;{searchTerm}&quot;</p>
                <p className="text-sm">Tente ajustar a busca</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Editar Usuário</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'admin' })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveEdit} disabled={isEditing}>
                Salvar
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de remoção */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar Remoção"
        message={`Tem certeza que deseja remover o usuário "${userToDelete?.name}"?

Esta ação irá deletar PERMANENTEMENTE:
• Conta do usuário
• Todas as instâncias do WhatsApp
• Todos os grupos selecionados
• Todas as assinaturas
• Todas as mensagens e resumos
• Todos os agendamentos

Esta ação NÃO PODE ser desfeita!`}
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />
    </div>
  )
}
