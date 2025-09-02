import { Summary } from '@/types/database'

export interface SummaryWithGroup extends Summary {
  group_selections: {
    id: string
    group_name: string
    group_id: string
  }
}

export interface SummariesResponse {
  summaries: SummaryWithGroup[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SummaryFilters {
  groupId?: string
  page?: number
  limit?: number
}

export class SummaryService {
  static async getSummaries(filters: SummaryFilters = {}): Promise<SummariesResponse> {
    const params = new URLSearchParams()
    
    if (filters.groupId) {
      params.append('group_id', filters.groupId)
    }
    if (filters.page) {
      params.append('page', filters.page.toString())
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString())
    }

    const response = await fetch(`/api/summaries?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao buscar resumos')
    }

    return response.json()
  }

  static async getSummariesByGroup(groupId: string, page: number = 1, limit: number = 10): Promise<SummariesResponse> {
    return this.getSummaries({ groupId, page, limit })
  }

  static async getAllSummaries(page: number = 1, limit: number = 10): Promise<SummariesResponse> {
    return this.getSummaries({ page, limit })
  }
}
