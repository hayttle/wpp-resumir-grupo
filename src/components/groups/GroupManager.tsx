'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RefreshCw, Users, Check, Plus, AlertCircle, Search, CreditCard, Calendar, DollarSign, MoreVertical, Eye, EyeOff, Trash2, Pause } from 'lucide-react'
import { GroupService } from '@/lib/services/groupService'
import { useInstanceStatus } from '@/hooks/useInstanceStatus'
import { useAuth } from '@/contexts/AuthContext'
import { WhatsAppGroup, GroupSelection, Plan, Subscription, Payment } from '@/types/database'
import { formatDateTime, formatCurrency, formatDate } from '@/lib/utils/formatters'
import { SubscriptionConfirmationModal } from '@/components/ui/subscription-confirmation-modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'

// Funções helper para traduzir status e ciclos
const translateStatus = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'overdue': 'Vencido',
    'pending': 'Pendente',
    'CONFIRMED': 'Confirmado',
    'RECEIVED': 'Recebido',
    'PENDING': 'Pendente',
    'OVERDUE': 'Vencido',
    'CANCELLED': 'Cancelado'
  }
  return statusMap[status] || status
}

const translateCycle = (cycle: string) => {
  const cycleMap: { [key: string]: string } = {
    'MONTHLY': 'Mensal',
    'WEEKLY': 'Semanal',
    'YEARLY': 'Anual',
    'DAILY': 'Diário'
  }
  return cycleMap[cycle] || cycle
}

interface GroupWithSelectionStatus extends WhatsAppGroup {
  isSelected: boolean
  canSelect: boolean
}

interface GroupWithSubscription extends GroupSelection {
  subscription?: Subscription
  payments?: Payment[]
}

export default function GroupManager() {
  const { user } = useAuth()
  const { instance, updateInstanceStatus } = useInstanceStatus()
  const { addToast } = useToast()
  const [groups, setGroups] = useState<GroupWithSelectionStatus[]>([])
  const [selectedGroups, setSelectedGroups] = useState<GroupWithSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingGroups, setFetchingGroups] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    if (user) {
      loadUserGroupSelections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadUserGroupSelections = useCallback(async () => {
    try {
      // Tentar primeiro com dados de assinatura
      try {
        const groupSelections = await GroupService.getUserGroupSelectionsWithSubscription()
        setSelectedGroups(groupSelections)
      } catch (error) {
        // Fallback: carregar apenas grupos selecionados
        const groupSelections = await GroupService.getUserGroupSelections()
        setSelectedGroups(groupSelections)
      }
    } catch (error) {
      // Erro silencioso - não mostrar toast para erro de carregamento inicial
    } finally {
      setLoading(false)
    }
  }, [])

  const [canSelectNewGroups, setCanSelectNewGroups] = useState(true)
  const [selectionReason, setSelectionReason] = useState<string>()
  const [hasUpdatedInstanceStatus, setHasUpdatedInstanceStatus] = useState(false)

  // Estados para o modal de confirmação
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedGroupForSubscription, setSelectedGroupForSubscription] = useState<WhatsAppGroup | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [creatingSubscription, setCreatingSubscription] = useState(false)

  // Estados para o modal de cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<string | null>(null)
  const [cancellingSubscription, setCancellingSubscription] = useState(false)

  // Estados para o modal de reativação
  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [subscriptionToReactivate, setSubscriptionToReactivate] = useState<string | null>(null)
  const [reactivatingSubscription, setReactivatingSubscription] = useState(false)

  // Estados para o modal de remoção de grupo
  const [showRemoveGroupModal, setShowRemoveGroupModal] = useState(false)
  const [groupToRemove, setGroupToRemove] = useState<GroupSelection | null>(null)
  const [removingGroup, setRemovingGroup] = useState(false)

  // Estados para o modal de reativação de grupo
  const [showReactivateGroupModal, setShowReactivateGroupModal] = useState(false)
  const [groupToReactivate, setGroupToReactivate] = useState<GroupSelection | null>(null)
  const [reactivatingGroup, setReactivatingGroup] = useState(false)

  // Estado para controlar quais assinaturas têm pagamentos visíveis
  const [visiblePayments, setVisiblePayments] = useState<Set<string>>(new Set())

  // Estados para filtros dos grupos selecionados
  const [selectedGroupsFilter, setSelectedGroupsFilter] = useState('all') // 'all', 'active', 'inactive'
  const [selectedGroupsSearch, setSelectedGroupsSearch] = useState('')

  // Função para recalcular a capacidade de seleção de grupos baseada no estado local
  const recalculateSelectionCapability = useCallback(() => {
    if (!user) return

    // Com o sistema de assinatura por grupo, não há mais limite global
    // A capacidade é sempre true, a menos que haja problemas de pagamento
    setCanSelectNewGroups(true)
    setSelectionReason(undefined)
  }, [user])

  // Atualizar status da instância apenas uma vez no carregamento da página
  useEffect(() => {
    if (instance && user && !hasUpdatedInstanceStatus) {
      setHasUpdatedInstanceStatus(true)
      updateInstanceStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, user, hasUpdatedInstanceStatus])

  // Recalcular capacidade de seleção sempre que o usuário mudar
  useEffect(() => {
    recalculateSelectionCapability()
  }, [recalculateSelectionCapability])

  // Checagem inicial de capacidade de acesso aos grupos (sem depender da Evolution API)
  useEffect(() => {
    const checkInitialAccess = async () => {
      if (!user) return

      try {
        // Fazer uma checagem simples apenas das permissões de assinatura
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'checkPermissions'
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (!result.canSelectNewGroups) {
          setCanSelectNewGroups(false)
          setSelectionReason(result.reason)
        }
      } catch (error) {
        // Erro silencioso na checagem inicial
      }
    }

    checkInitialAccess()
  }, [user])

  const fetchAllGroups = async () => {
    if (!instance?.instance_name) {
      alert('Instância não encontrada')
      return
    }

    try {
      setFetchingGroups(true)

      const result = await GroupService.fetchAllGroups(instance.instance_name)

      // Atualizar estado de capacidade de seleção
      setCanSelectNewGroups(result.canSelectNewGroups)
      setSelectionReason(result.reason)

      // Converter para GroupWithSelectionStatus e marcar grupos já selecionados
      // Sempre mostrar todos os grupos, independente do status da assinatura
      const groupsWithStatus: GroupWithSelectionStatus[] = result.groups.map(group => ({
        ...group,
        isSelected: selectedGroups.some(selection => selection.group_id === group.id),
        canSelect: result.canSelectNewGroups // Apenas para controlar se pode selecionar novos
      }))
      setGroups(groupsWithStatus)


    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao buscar grupos',
        message: 'Verifique se sua instância está conectada.'
      })
    } finally {
      setFetchingGroups(false)
    }
  }

  // Buscar plano disponível
  const fetchPlan = async () => {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()

      if (response.ok && data.plans && data.plans.length > 0) {
        setPlan(data.plans[0]) // Usar o primeiro plano disponível
      }
    } catch (error) {
      // Erro silencioso ao buscar plano
    }
  }

  // Função para abrir modal de confirmação
  const handleSelectGroup = async (group: WhatsAppGroup) => {
    if (!plan) {
      await fetchPlan()
    }
    setSelectedGroupForSubscription(group)
    setShowSubscriptionModal(true)
  }

  // Função para confirmar criação da assinatura
  const handleConfirmSubscription = async () => {
    if (!selectedGroupForSubscription || !plan || !user) return

    try {
      setCreatingSubscription(true)

      // Criar assinatura para o grupo
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSubscriptionForGroup',
          groupId: selectedGroupForSubscription.id,
          groupName: selectedGroupForSubscription.subject, // Enviar nome do grupo
          planId: plan.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar assinatura')
      }

      const result = await response.json()

      if (result.success) {
        // Fechar modal
        setShowSubscriptionModal(false)
        setSelectedGroupForSubscription(null)

        // Recarregar seleções de grupos imediatamente
        await loadUserGroupSelections()
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao criar assinatura. Tente novamente.'

      addToast({
        type: 'error',
        title: 'Erro ao criar assinatura',
        message: errorMessage
      })
    } finally {
      setCreatingSubscription(false)
    }
  }

  const selectGroup = async (group: WhatsAppGroup) => {
    // Esta função agora só abre o modal
    await handleSelectGroup(group)
  }

  const handleRemoveGroup = (groupSelection: GroupSelection) => {
    setGroupToRemove(groupSelection)
    setShowRemoveGroupModal(true)
  }

  const handleReactivateGroup = (groupSelection: GroupSelection) => {
    setGroupToReactivate(groupSelection)
    setShowReactivateGroupModal(true)
  }

  const confirmRemoveGroup = async () => {
    if (!groupToRemove) return

    try {
      setRemovingGroup(true)

      // 1. Cancelar assinatura se existir
      if (groupToRemove.subscription_id) {
        try {
          const cancelResponse = await fetch(`/api/subscriptions/${groupToRemove.subscription_id}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user?.id
            })
          })

          if (!cancelResponse.ok) {
            throw new Error('Erro ao cancelar assinatura')
          }
        } catch (error) {
          console.error('Erro ao cancelar assinatura:', error)
          // Continuar mesmo se falhar o cancelamento da assinatura
        }
      }

      // 2. Suspender o grupo (alterar status para inativo)
      const suspendResponse = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'suspendGroup',
          groupId: groupToRemove.group_id
        })
      })

      if (!suspendResponse.ok) {
        throw new Error('Erro ao suspender grupo')
      }

      // 3. Recarregar lista de grupos selecionados para atualizar status
      await loadUserGroupSelections()

      // Fechar modal e limpar estado
      setShowRemoveGroupModal(false)
      setGroupToRemove(null)

      // Mostrar toast de sucesso
      addToast({
        type: 'success',
        title: 'Grupo suspenso!',
        message: 'O grupo foi suspenso e a assinatura cancelada com sucesso.'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao suspender grupo',
        message: 'Tente novamente.'
      })
    } finally {
      setRemovingGroup(false)
    }
  }

  const confirmReactivateGroup = async () => {
    if (!groupToReactivate) return

    try {
      setReactivatingGroup(true)

      // 1. Reativar assinatura se existir
      if (groupToReactivate.subscription_id) {
        try {
          const reactivateResponse = await fetch(`/api/subscriptions/${groupToReactivate.subscription_id}/reactivate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user?.id
            })
          })

          if (!reactivateResponse.ok) {
            throw new Error('Erro ao reativar assinatura')
          }
        } catch (error) {
          console.error('Erro ao reativar assinatura:', error)
          // Continuar mesmo se falhar a reativação da assinatura
        }
      }

      // 2. Reativar o grupo (alterar status para ativo)
      const reactivateResponse = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reactivateGroup',
          groupId: groupToReactivate.group_id
        })
      })

      if (!reactivateResponse.ok) {
        throw new Error('Erro ao reativar grupo')
      }

      // 3. Recarregar lista de grupos selecionados para atualizar status
      await loadUserGroupSelections()

      // Fechar modal e limpar estado
      setShowReactivateGroupModal(false)
      setGroupToReactivate(null)

      // Mostrar toast de sucesso
      addToast({
        type: 'success',
        title: 'Grupo reativado!',
        message: 'O grupo foi reativado e a assinatura reativada com sucesso.'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao reativar grupo',
        message: 'Tente novamente.'
      })
    } finally {
      setReactivatingGroup(false)
    }
  }

  const handleCancelSubscription = (subscriptionId: string) => {
    setSubscriptionToCancel(subscriptionId)
    setShowCancelModal(true)
  }

  const handleReactivateSubscription = (subscriptionId: string) => {
    setSubscriptionToReactivate(subscriptionId)
    setShowReactivateModal(true)
  }

  const confirmCancelSubscription = async () => {
    if (!subscriptionToCancel) return

    try {
      setCancellingSubscription(true)

      const response = await fetch(`/api/subscriptions/${subscriptionToCancel}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao cancelar assinatura')
      }

      // Fechar modal e limpar estado
      setShowCancelModal(false)
      setSubscriptionToCancel(null)

      // Recarregar lista de grupos selecionados para atualizar status
      await loadUserGroupSelections()

      // Mostrar toast de sucesso
      addToast({
        type: 'success',
        title: 'Assinatura cancelada!',
        message: 'A assinatura foi cancelada com sucesso.'
      })
    } catch (error) {
      // Mostrar toast de erro
      addToast({
        type: 'error',
        title: 'Erro ao cancelar assinatura',
        message: (error as Error).message
      })
    } finally {
      setCancellingSubscription(false)
    }
  }

  const confirmReactivateSubscription = async () => {
    if (!subscriptionToReactivate) return

    try {
      setReactivatingSubscription(true)

      const response = await fetch(`/api/subscriptions/${subscriptionToReactivate}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao reativar assinatura')
      }

      // Fechar modal e limpar estado
      setShowReactivateModal(false)
      setSubscriptionToReactivate(null)

      // Recarregar lista de grupos selecionados para atualizar status
      await loadUserGroupSelections()

      // Mostrar toast de sucesso
      addToast({
        type: 'success',
        title: 'Assinatura reativada!',
        message: 'A assinatura foi reativada com sucesso.'
      })
    } catch (error) {
      // Mostrar toast de erro
      addToast({
        type: 'error',
        title: 'Erro ao reativar assinatura',
        message: (error as Error).message
      })
    } finally {
      setReactivatingSubscription(false)
    }
  }

  const handleTogglePayments = (subscriptionId: string) => {
    setVisiblePayments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subscriptionId)) {
        newSet.delete(subscriptionId)
      } else {
        newSet.add(subscriptionId)
      }
      return newSet
    })
  }

  const handlePayPayment = (payment: Payment) => {
    // Verificar se o pagamento tem invoice_url
    if (payment.invoice_url) {
      // Abrir link de pagamento em nova aba
      window.open(payment.invoice_url, '_blank')
    } else {
      // TODO: Implementar geração de link de pagamento
      addToast({
        type: 'warning',
        title: 'Link de pagamento não disponível',
        message: 'Entre em contato com o suporte.'
      })
    }
  }



  // Filtrar grupos baseado no texto de busca
  const filteredGroups = groups.filter(group =>
    group.subject.toLowerCase().includes(filterText.toLowerCase()) ||
    (group.desc && group.desc.toLowerCase().includes(filterText.toLowerCase()))
  )

  // Filtrar grupos selecionados baseado no status e texto de busca
  const filteredSelectedGroups = selectedGroups.filter(group => {
    // Filtro por status
    const statusMatch = selectedGroupsFilter === 'all' ||
      (selectedGroupsFilter === 'active' && group.active) ||
      (selectedGroupsFilter === 'inactive' && !group.active)

    // Filtro por texto de busca
    const searchMatch = selectedGroupsSearch === '' ||
      (group.group_name && group.group_name.toLowerCase().includes(selectedGroupsSearch.toLowerCase()))

    return statusMatch && searchMatch
  })

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
                ✅ Sua instância Whatsapp está conectada e pronta para uso.
              </span>
            </div>
          </div>

          {/* Banner para pagamento vencido */}
          {!canSelectNewGroups && selectionReason === 'Existe pagamento vencido' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    ⚠️ Existe pagamento vencido
                  </span>
                  <p className="text-xs text-red-600 mt-1">
                    Para acessar os grupos, regularize sua situação de pagamento
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/groups'}
                  className="ml-2 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Ver Grupos
                </Button>
              </div>
            </div>
          )}




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

                  </div>
                  <div className="ml-4">
                    {!group.isSelected ? (
                      canSelectNewGroups ? (
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
                        <div className="text-center">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                            Indisponível
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            Verifique assinaturas
                          </p>
                        </div>
                      )
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Grupos Selecionados ({filteredSelectedGroups.length} de {selectedGroups.length})
                </CardTitle>
                <CardDescription>
                  Estes grupos serão monitorados para resumos automáticos
                </CardDescription>
              </div>
              {/* Resumo dos Status dos Grupos */}
              <div className="flex items-center gap-4">
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">
                      {selectedGroups.filter(g => g.active).length}
                    </div>
                    <div className="text-gray-500">Ativos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-600">
                      {selectedGroups.filter(g => !g.active).length}
                    </div>
                    <div className="text-gray-500">Inativos</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUserGroupSelections}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros para grupos selecionados */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Campo de busca */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar grupos por nome..."
                  value={selectedGroupsSearch}
                  onChange={(e) => setSelectedGroupsSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro por status */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedGroupsFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGroupsFilter('all')}
                  className={selectedGroupsFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}
                >
                  Todos ({selectedGroups.length})
                </Button>
                <Button
                  variant={selectedGroupsFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGroupsFilter('active')}
                  className={selectedGroupsFilter === 'active' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-green-600 border-green-300 hover:bg-green-50'}
                >
                  Ativos ({selectedGroups.filter(g => g.active).length})
                </Button>
                <Button
                  variant={selectedGroupsFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGroupsFilter('inactive')}
                  className={selectedGroupsFilter === 'inactive' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}
                >
                  Inativos ({selectedGroups.filter(g => !g.active).length})
                </Button>
              </div>
            </div>

            {/* Mensagem quando não há resultados no filtro */}
            {filteredSelectedGroups.length === 0 && (selectedGroupsSearch || selectedGroupsFilter !== 'all') ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum grupo encontrado com os filtros aplicados</p>
                <p className="text-sm">Tente ajustar os filtros ou limpar a busca</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSelectedGroupsSearch('')
                    setSelectedGroupsFilter('all')
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredSelectedGroups.map((selection) => (
                  <Card key={selection.id} className="overflow-hidden">
                    {/* Header do Grupo */}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-600" />
                            {selection.group_name || 'Nome não disponível'}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={selection.active ? "default" : "secondary"}
                            className={selection.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {selection.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {selection.active ? (
                            <Button
                              onClick={() => handleRemoveGroup(selection)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-300"
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Suspender
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleReactivateGroup(selection)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reativar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Status da Assinatura */}
                      {selection.subscription ? (
                        <div className="space-y-4">
                          {/* Card de Status da Assinatura */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Assinatura Ativa
                              </h4>
                              <Badge
                                className={`${selection.subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                                  selection.subscription.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                    selection.subscription.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                      'bg-yellow-100 text-yellow-800'
                                  }`}
                              >
                                {translateStatus(selection.subscription.status)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-sm text-gray-600">Valor</p>
                                  <p className="font-semibold text-lg">
                                    {formatCurrency(selection.subscription.value || 0)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-sm text-gray-600">Ciclo</p>
                                  <p className="font-semibold">{translateCycle(selection.subscription.cycle || 'N/A')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-sm text-gray-600">Próximo Vencimento</p>
                                  <p className="font-semibold text-sm">
                                    {selection.subscription.next_billing_date ?
                                      formatDate(selection.subscription.next_billing_date) :
                                      'N/A'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Ações da Assinatura */}
                          <div className="flex flex-wrap gap-2">
                            {selection.subscription.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-300"
                                onClick={() => handleCancelSubscription(selection.subscription!.id)}
                              >
                                <Pause className="h-4 w-4 mr-1" />
                                Suspender Assinatura
                              </Button>
                            )}
                            {selection.subscription.status === 'inactive' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleReactivateSubscription(selection.subscription!.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reativar Assinatura
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              className="px-3 py-1"
                              onClick={() => handleTogglePayments(selection.subscription!.id)}
                            >
                              {visiblePayments.has(selection.subscription!.id) ? (
                                <EyeOff className="h-4 w-4 mr-1" />
                              ) : (
                                <Eye className="h-4 w-4 mr-1" />
                              )}
                              {visiblePayments.has(selection.subscription!.id) ? 'Ocultar Cobranças' : 'Ver Cobranças'}
                            </Button>
                          </div>

                          {/* Cobranças - Toggle */}
                          {selection.payments && selection.payments.length > 0 && visiblePayments.has(selection.subscription!.id) && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Cobranças ({selection.payments.length})
                              </h5>

                              {/* Cabeçalho da tabela */}
                              <div className="bg-white rounded-lg border overflow-hidden">
                                <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 border-b text-xs font-semibold text-gray-600">
                                  <div className="col-span-2">Data</div>
                                  <div className="col-span-3">Descrição</div>
                                  <div className="col-span-2">Valor</div>
                                  <div className="col-span-2">Status</div>
                                  <div className="col-span-3">Ações</div>
                                </div>

                                {/* Linhas dos pagamentos */}
                                <div className="divide-y">
                                  {selection.payments.map((payment) => (
                                    <div key={payment.id} className="grid grid-cols-12 gap-4 p-3 items-center">
                                      {/* Data */}
                                      <div className="col-span-2">
                                        <p className="text-sm font-medium">
                                          {payment.payment_date ?
                                            formatDate(payment.payment_date) :
                                            formatDate(payment.due_date)
                                          }
                                        </p>
                                      </div>

                                      {/* Descrição */}
                                      <div className="col-span-3">
                                        <p className="text-sm text-gray-700">
                                          {payment.description || 'Pagamento da assinatura'}
                                        </p>
                                      </div>

                                      {/* Valor */}
                                      <div className="col-span-2">
                                        <span className="font-semibold text-base">{formatCurrency(payment.value)}</span>
                                      </div>

                                      {/* Status */}
                                      <div className="col-span-2">
                                        <Badge
                                          className={`text-xs ${payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                            payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                              payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                          {translateStatus(payment.status)}
                                        </Badge>
                                      </div>

                                      {/* Ações */}
                                      <div className="col-span-3">
                                        {(payment.status === 'PENDING' || payment.status === 'OVERDUE') ? (
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            className="text-xs px-3 py-1 h-7"
                                            onClick={() => handlePayPayment(payment)}
                                          >
                                            PAGAR
                                          </Button>
                                        ) : (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') && payment.transaction_receipt_url ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-300 text-xs px-3 py-1 h-7"
                                            onClick={() => window.open(payment.transaction_receipt_url, '_blank')}
                                          >
                                            Ver comprovante
                                          </Button>
                                        ) : (
                                          <span className="text-xs text-gray-400">-</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Sem Assinatura */
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Sem assinatura ativa</span>
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">
                            Este grupo não possui uma assinatura vinculada. Remova e selecione novamente para criar uma nova assinatura.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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

      {/* Modal de Confirmação de Assinatura */}
      {plan && selectedGroupForSubscription && (
        <SubscriptionConfirmationModal
          isOpen={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false)
            setSelectedGroupForSubscription(null)
          }}
          onConfirm={handleConfirmSubscription}
          plan={plan}
          group={selectedGroupForSubscription}
          loading={creatingSubscription}
        />
      )}

      {/* Modal de Confirmação de Cancelamento */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setSubscriptionToCancel(null)
        }}
        onConfirm={confirmCancelSubscription}
        title="Cancelar Assinatura"
        message={`Tem certeza que deseja cancelar esta assinatura?

Ao cancelar:
• A assinatura será suspensa
• Não serão gerados novos pagamentos
• O grupo continuará ativo até o próximo vencimento`}
        confirmText="Sim, Cancelar"
        cancelText="Manter Ativa"
        isLoading={cancellingSubscription}
      />

      {/* Modal de Confirmação de Reativação */}
      <ConfirmModal
        isOpen={showReactivateModal}
        onClose={() => {
          setShowReactivateModal(false)
          setSubscriptionToReactivate(null)
        }}
        onConfirm={confirmReactivateSubscription}
        title="Reativar Assinatura"
        message={`Tem certeza que deseja reativar esta assinatura?

Ao reativar:
• A assinatura voltará a gerar pagamentos
• O próximo vencimento será hoje
• O grupo continuará ativo normalmente`}
        confirmText="Sim, Reativar"
        cancelText="Manter Cancelada"
        isLoading={reactivatingSubscription}
      />

      {/* Modal de Confirmação de Remoção de Grupo */}
      <ConfirmModal
        isOpen={showRemoveGroupModal}
        onClose={() => {
          setShowRemoveGroupModal(false)
          setGroupToRemove(null)
        }}
        onConfirm={confirmRemoveGroup}
        title="Suspender Grupo"
        message={`Tem certeza que deseja suspender este grupo?

Ao suspender:
• O grupo será marcado como inativo
• A assinatura vinculada será suspensa
• Não será mais gerado resumos automáticos`}
        confirmText="Sim, Suspender"
        cancelText="Manter Ativo"
        isLoading={removingGroup}
      />

      {/* Modal de Confirmação de Reativação de Grupo */}
      <ConfirmModal
        isOpen={showReactivateGroupModal}
        onClose={() => {
          setShowReactivateGroupModal(false)
          setGroupToReactivate(null)
        }}
        onConfirm={confirmReactivateGroup}
        title="Reativar Grupo"
        message={`Tem certeza que deseja reativar este grupo?

Ao reativar:
• O grupo será marcado como ativo
• A assinatura vinculada será reativada
• Serão gerados resumos automáticos novamente`}
        confirmText="Sim, Reativar"
        cancelText="Manter Inativo"
        isLoading={reactivatingGroup}
      />
    </div>
  )
}

