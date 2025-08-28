'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Users, Check, Plus, AlertCircle } from 'lucide-react'
import { GroupService } from '@/lib/services'
import { useAuth } from '@/contexts/AuthContext'
import { WhatsAppGroup, GroupSelection } from '@/types/database'
import { InstanceService } from '@/lib/services'

interface GroupWithSelectionStatus extends WhatsAppGroup {
  isSelected: boolean
}

export default function GroupManager() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupWithSelectionStatus[]>([])
  const [selectedGroups, setSelectedGroups] = useState<GroupSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingGroups, setFetchingGroups] = useState(false)
  const [instanceName, setInstanceName] = useState<string | null>(null)
  const [instanceStatus, setInstanceStatus] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadUserInstance()
      loadUserGroupSelections()
    }
  }, [user])

  const loadUserInstance = async () => {
    try {
      const userInstance = await InstanceService.getCurrentUserInstance()
      if (userInstance) {
        setInstanceName(userInstance.instance_name)
        setInstanceStatus(userInstance.status)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar instância:', error)
    }
  }

  const loadUserGroupSelections = async () => {
    try {
      const groupSelections = await GroupService.getUserGroupSelections()
      setSelectedGroups(groupSelections)
    } catch (error) {
      console.error('❌ Erro ao carregar seleções de grupos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllGroups = async () => {
    if (!instanceName) {
      alert('Instância não encontrada')
      return
    }

    try {
      setFetchingGroups(true)
      console.log('🔍 Buscando grupos da instância:', instanceName)
      
      const fetchedGroups = await GroupService.fetchAllGroups(instanceName)
      // Converter para GroupWithSelectionStatus
      const groupsWithStatus: GroupWithSelectionStatus[] = fetchedGroups.map(group => ({
        ...group,
        isSelected: false
      }))
      setGroups(groupsWithStatus)
      
      console.log('✅ Grupos buscados:', groupsWithStatus)
    } catch (error) {
      console.error('❌ Erro ao buscar grupos:', error)
      alert('Erro ao buscar grupos. Verifique se sua instância está conectada.')
    } finally {
      setFetchingGroups(false)
    }
  }

  const selectGroup = async (group: WhatsAppGroup) => {
    try {
      console.log('✅ Selecionando grupo:', group.subject)
      
      const groupSelection = await GroupService.saveGroupSelection({
        user_id: user!.id,
        instance_id: '', // Será preenchido pelo backend
        group_name: group.subject,
        group_id: group.id,
        active: true
      })

      if (groupSelection) {
        // Atualizar lista de grupos com status de seleção
        setGroups(prevGroups => 
          prevGroups.map(g => 
            g.id === group.id ? { ...g, isSelected: true } : g
          )
        )

        // Adicionar à lista de grupos selecionados
        setSelectedGroups(prev => [groupSelection, ...prev])
        
        console.log('✅ Grupo selecionado com sucesso:', groupSelection)
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar grupo:', error)
      if (error instanceof Error && error.message.includes('já foi selecionado')) {
        alert('Este grupo já foi selecionado anteriormente.')
      } else {
        alert('Erro ao selecionar grupo. Tente novamente.')
      }
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!instanceName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Grupos WhatsApp</CardTitle>
          <CardDescription>
            Nenhuma instância encontrada. Crie uma instância primeiro.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (instanceStatus !== 'open') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Grupos WhatsApp</CardTitle>
          <CardDescription>
            Sua instância precisa estar conectada para buscar grupos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span>Status da instância: {instanceStatus}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Grupos WhatsApp
          </CardTitle>
          <CardDescription>
            Busque e selecione os grupos que deseja resumir automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Instância: <span className="font-mono">{instanceName}</span>
            </div>
            <Button 
              onClick={fetchAllGroups} 
              disabled={fetchingGroups}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${fetchingGroups ? 'animate-spin' : ''}`} />
              {fetchingGroups ? 'Buscando...' : 'Buscar Grupos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grupos Encontrados */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grupos Encontrados ({groups.length})</CardTitle>
            <CardDescription>
              Clique em &quot;Selecionar&quot; para adicionar o grupo à sua lista de resumos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groups.map((group) => (
                <div 
                  key={group.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{group.subject}</h3>
                      {group.isSelected && (
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Selecionado
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>ID: {group.id}</span>
                      <span className="mx-2">•</span>
                      <span>{group.size} membros</span>
                      <span className="mx-2">•</span>
                      <span>Criado em {formatDate(group.creation)}</span>
                    </div>
                    {group.desc && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.desc}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    {!group.isSelected ? (
                      <Button
                        onClick={() => selectGroup(group)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Selecionar
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100">
                        Já Selecionado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grupos Selecionados */}
      {selectedGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grupos Selecionados ({selectedGroups.length})</CardTitle>
            <CardDescription>
              Estes grupos serão monitorados para resumos automáticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedGroups.map((selection) => (
                <div 
                  key={selection.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                >
                  <div>
                    <h4 className="font-medium">{selection.group_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Selecionado em {new Date(selection.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge className={selection.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selection.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Vazio */}
      {groups.length === 0 && selectedGroups.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum grupo encontrado ou selecionado</p>
              <p className="text-sm">Clique em &quot;Buscar Grupos&quot; para começar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
