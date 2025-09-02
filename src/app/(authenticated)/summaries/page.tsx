'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { SummaryService, SummaryWithGroup } from '@/lib/services/summaryService'
import { GroupService } from '@/lib/services/groupService'
import { formatDate, formatDateTime } from '@/lib/utils/formatters'
import {
  Search,
  Calendar,
  MessageSquare,
  Send,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  Trash2
} from 'lucide-react'

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<SummaryWithGroup[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSummaries, setTotalSummaries] = useState(0)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [summaryToDelete, setSummaryToDelete] = useState<SummaryWithGroup | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  const limit = 10

  // Carregar grupos para o filtro
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await GroupService.getUserGroupSelectionsWithSubscription()
        setGroups(response)
      } catch (error) {
        console.error('Erro ao carregar grupos:', error)
      }
    }
    loadGroups()
  }, [])

  // Carregar resumos
  const loadSummaries = async (page: number = 1) => {
    try {
      setLoading(true)
      const filters = {
        groupId: selectedGroup === 'all' ? undefined : selectedGroup,
        dateFilter: selectedDateFilter === 'all' ? undefined : selectedDateFilter as 'today' | 'last_7_days',
        page,
        limit
      }

      const response = await SummaryService.getSummaries(filters)
      setSummaries(response.summaries)
      setTotalPages(response.pagination.totalPages)
      setTotalSummaries(response.pagination.total)
      setCurrentPage(page)
    } catch (error) {
      console.error('Erro ao carregar resumos:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar resumos'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummaries(1)
  }, [selectedGroup, selectedDateFilter])

  // Filtrar resumos por termo de busca
  const filteredSummaries = summaries.filter(summary => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      summary.content.toLowerCase().includes(searchLower) ||
      summary.group_selections.group_name.toLowerCase().includes(searchLower)
    )
  })

  // Função para mudar página
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadSummaries(page)
    }
  }

  // Função para resetar filtros
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedGroup('all')
    setSelectedDateFilter('all')
    setCurrentPage(1)
  }

  // Função para abrir modal de exclusão
  const handleDeleteClick = (summary: SummaryWithGroup) => {
    setSummaryToDelete(summary)
    setDeleteModalOpen(true)
  }

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!summaryToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/summaries/${summaryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir resumo')
      }

      // Remover o resumo da lista local
      setSummaries(prev => prev.filter(s => s.id !== summaryToDelete.id))
      setTotalSummaries(prev => prev - 1)

      addToast({
        type: 'success',
        title: 'Sucesso',
        message: 'Resumo excluído com sucesso'
      })

      // Fechar modal
      setDeleteModalOpen(false)
      setSummaryToDelete(null)

    } catch (error) {
      console.error('Erro ao excluir resumo:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Erro ao excluir resumo'
      })
    } finally {
      setDeleting(false)
    }
  }

  // Função para cancelar exclusão
  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setSummaryToDelete(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resumos dos Grupos</h1>
          <p className="text-gray-600 mt-2">
            Visualize todos os resumos gerados para seus grupos do WhatsApp
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">{totalSummaries}</span>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca por texto */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por conteúdo ou nome do grupo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por grupo */}
            <div className="sm:w-64">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os grupos</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.group_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por data */}
            <div className="sm:w-48">
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as datas</option>
                <option value="today">Hoje</option>
                <option value="last_7_days">Últimos 7 dias</option>
              </select>
            </div>

            {/* Botão resetar */}
            <Button
              variant="outline"
              onClick={resetFilters}
              className="whitespace-nowrap"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Resumos */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSummaries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm || selectedGroup !== 'all' || selectedDateFilter !== 'all'
                  ? 'Nenhum resumo encontrado'
                  : 'Nenhum resumo disponível'
                }
              </h3>
              <p className="text-gray-500 text-center">
                {searchTerm || selectedGroup !== 'all' || selectedDateFilter !== 'all'
                  ? 'Tente ajustar os filtros para encontrar resumos'
                  : 'Os resumos aparecerão aqui quando forem gerados para seus grupos'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSummaries.map((summary) => (
            <Card key={summary.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        {summary.group_selections.group_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateTime(summary.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{summary.message_count} mensagens</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Criado em {formatDateTime(summary.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(summary)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {summary.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} ({totalSummaries} resumos)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Excluir Resumo"
        description={`Tem certeza que deseja excluir o resumo do grupo "${summaryToDelete?.group_selections.group_name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}
