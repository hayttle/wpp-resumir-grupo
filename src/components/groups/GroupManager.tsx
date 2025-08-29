'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RefreshCw, Users, Check, Plus, AlertCircle, Search } from 'lucide-react'
import { GroupService } from '@/lib/services/groupService'
import { useInstanceStatus } from '@/hooks/useInstanceStatus'
import { useAuth } from '@/contexts/AuthContext'
import { WhatsAppGroup, GroupSelection } from '@/types/database'

interface GroupWithSelectionStatus extends WhatsAppGroup {
  isSelected: boolean
}

export default function GroupManager() {
  const { user } = useAuth()
  const { instance, updatingStatus, updateInstanceStatus } = useInstanceStatus()
  const [groups, setGroups] = useState<GroupWithSelectionStatus[]>([])
  const [selectedGroups, setSelectedGroups] = useState<GroupSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingGroups, setFetchingGroups] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    if (user) {
      loadUserGroupSelections()
      // Atualizar status da instância automaticamente ao entrar na página
      updateInstanceStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadUserGroupSelections = useCallback(async () => {
    try {
      const groupSelections = await GroupService.getUserGroupSelections()
      setSelectedGroups(groupSelections)
    } catch (error) {
      console.error('❌ Erro ao carregar seleções de grupos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllGroups = async () => {
    if (!instance?.instance_name) {
      alert('Instância não encontrada')
      return
    }

    try {
      setFetchingGroups(true)
      console.log('🔍 Buscando grupos da instância:', instance.instance_name)

      const fetchedGroups = await GroupService.fetchAllGroups(instance.instance_name)
      // Converter para GroupWithSelectionStatus e marcar grupos já selecionados
      const groupsWithStatus: GroupWithSelectionStatus[] = fetchedGroups.map(group => ({
        ...group,
        isSelected: selectedGroups.some(selection => selection.group_id === group.id)
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

  const deselectGroup = async (groupSelection: GroupSelection) => {
    try {
      console.log('❌ Desselecionando grupo:', groupSelection.group_name)

      const success = await GroupService.removeGroupSelection(groupSelection.group_id)

      if (success) {
        // Remover da lista de grupos selecionados
        setSelectedGroups(prev => prev.filter(gs => gs.id !== groupSelection.id))

        // Atualizar lista de grupos com status de seleção
        setGroups(prevGroups =>
          prevGroups.map(g =>
            g.id === groupSelection.group_id ? { ...g, isSelected: false } : g
          )
        )

        console.log('✅ Grupo desselecionado com sucesso:', groupSelection.group_name)
      } else {
        alert('Erro ao desselecionar grupo. Tente novamente.')
      }
    } catch (error) {
      console.error('❌ Erro ao desselecionar grupo:', error)
      alert('Erro ao desselecionar grupo. Tente novamente.')
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

  // Filtrar grupos baseado no texto de busca
  const filteredGroups = groups.filter(group =>
    group.subject.toLowerCase().includes(filterText.toLowerCase()) ||
    (group.desc && group.desc.toLowerCase().includes(filterText.toLowerCase()))
  )

  // Calcular paginação
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentGroups = filteredGroups.slice(startIndex, endIndex)

  // Resetar para primeira página quando o filtro mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [filterText])

  // Resetar para primeira página quando mudar itens por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Navegar para página específica
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!instance?.instance_name) {
    return (
      <div className="space-y-6">
        {/* Header Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Grupos WhatsApp
            </CardTitle>
            <CardDescription>
              Configure uma instância primeiro para poder buscar e selecionar grupos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Status da Instância</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <span className="text-sm font-medium">Não Configurada</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Ações</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/instances'}
                  >
                    Configurar Instância
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagem de status importante */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  ⚠️ Você precisa criar e configurar uma instância do WhatsApp primeiro
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado vazio */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Para gerenciar grupos, você precisa configurar uma instância do WhatsApp</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (instance.status !== 'open') {
    return (
      <div className="space-y-6">
        {/* Header Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Grupos WhatsApp
            </CardTitle>
            <CardDescription>
              Conecte sua instância primeiro para poder buscar e selecionar grupos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Nome da Instância</div>
                <div className="font-mono text-sm font-medium">{instance?.instance_name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Desconectado</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Ações</div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.location.href = '/instances'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Conectar Instância
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagem de status importante */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  ⚠️ Sua instância precisa estar conectada para buscar e gerenciar grupos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado vazio */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Para gerenciar grupos, sua instância do WhatsApp precisa estar conectada</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Principal */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Nome da Instância</div>
              <div className="font-mono text-sm font-medium">{instance?.instance_name}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Conectado</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Ações</div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchAllGroups}
                  disabled={fetchingGroups}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${fetchingGroups ? 'animate-spin' : ''}`} />
                  {fetchingGroups ? 'Buscando...' : 'Buscar Grupos'}
                </Button>
              </div>
            </div>
          </div>

          {/* Mensagem de status importante */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">
                ✅ Sua instância está conectada e capturando mensagens dos grupos selecionados
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grupos Encontrados */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grupos Encontrados ({filteredGroups.length} de {groups.length})</CardTitle>
            <CardDescription>
              Clique em &quot;Selecionar&quot; para adicionar o grupo à sua lista de resumos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Campo de filtro */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar grupos por nome ou descrição..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              {currentGroups.map((group) => (
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
                      <span>{group.size} membros</span>
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

              {/* Mensagem quando não há resultados no filtro */}
              {filteredGroups.length === 0 && filterText && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum grupo encontrado para &quot;{filterText}&quot;</p>
                  <p className="text-sm">Tente ajustar o filtro</p>
                </div>
              )}
            </div>

            {/* Controles de Paginação */}
            {filteredGroups.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Seletor de itens por página */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mostrar:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border rounded-md px-2 py-1 text-sm bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-muted-foreground">por página</span>
                </div>

                {/* Informações da paginação */}
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, filteredGroups.length)} de {filteredGroups.length} grupos
                </div>

                {/* Navegação entre páginas */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      Anterior
                    </Button>

                    {/* Páginas numeradas */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Mostrar apenas algumas páginas para não poluir a interface
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              onClick={() => goToPage(page)}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <Button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            )}
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
                  <div className="flex items-center gap-3">
                    <Badge className={selection.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selection.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      onClick={() => deselectGroup(selection)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Remover
                    </Button>
                  </div>
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
