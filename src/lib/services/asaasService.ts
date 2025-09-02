// Serviço para integração com a API do Asaas
import { asaasConfig } from '@/lib/config/server-env'
import type { 
  AsaasCustomer, 
  AsaasSubscription, 
  Payment,
  CreateCustomerRequest,
  CreateSubscriptionRequest
} from '@/types/subscription'

export class AsaasService {
  private static baseUrl = asaasConfig.baseUrl
  private static headers = asaasConfig.getHeaders()

  // Método para fazer requisições HTTP
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        ...this.headers,
        ...options.headers,
      },
      ...options,
    }

    // Log da requisição
    console.log('🚀 [ASAAS REQUEST]', {
      method: config.method || 'GET',
      url,
      headers: {
        ...config.headers,
        access_token: (config.headers as any)?.access_token ? '***HIDDEN***' : undefined
      },
      body: config.body ? JSON.parse(config.body as string) : undefined,
      timestamp: new Date().toISOString()
    })

    try {
      const response = await fetch(url, config)
      const responseData = await response.json()
      
      // Log da resposta
      console.log('📥 [ASAAS RESPONSE]', {
        status: response.status,
        statusText: response.statusText,
        url,
        data: responseData,
        timestamp: new Date().toISOString()
      })
      
      if (!response.ok) {
        console.error('❌ [ASAAS ERROR]', {
          status: response.status,
          error: responseData,
          url,
          timestamp: new Date().toISOString()
        })
        throw new Error(`Asaas API Error: ${response.status} - ${responseData.message || response.statusText}`)
      }

      return responseData
    } catch (error) {
      console.error('💥 [ASAAS REQUEST FAILED]', {
        url,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  // === CUSTOMER METHODS ===

  // Criar cliente
  static async createCustomer(customerData: CreateCustomerRequest): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/v3/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    })
  }

  // Buscar cliente por ID
  static async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(`/v3/customers/${customerId}`)
  }

  // Buscar cliente por email
  static async getCustomerByEmail(email: string): Promise<AsaasCustomer[]> {
    const params = new URLSearchParams({ email })
    const response = await this.request<{ data: AsaasCustomer[] }>(`/v3/customers?${params}`)
    return response.data
  }

  // Atualizar cliente
  static async updateCustomer(
    customerId: string, 
    customerData: Partial<CreateCustomerRequest>
  ): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(`/v3/customers/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(customerData),
    })
  }

  // Deletar cliente
  static async deleteCustomer(customerId: string): Promise<void> {
    await this.request(`/v3/customers/${customerId}`, {
      method: 'DELETE',
    })
  }

  // === SUBSCRIPTION METHODS ===

  // Criar assinatura
  static async createSubscription(subscriptionData: CreateSubscriptionRequest): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('/v3/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    })
  }

  // Buscar assinatura por ID
  static async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(`/v3/subscriptions/${subscriptionId}`)
  }

  // Listar assinaturas de um cliente
  static async getCustomerSubscriptions(customerId: string): Promise<AsaasSubscription[]> {
    const params = new URLSearchParams({ customer: customerId })
    const response = await this.request<{ data: AsaasSubscription[] }>(`/v3/subscriptions?${params}`)
    return response.data
  }

  // Atualizar assinatura existente
  static async updateSubscription(subscriptionId: string, updateData: { 
    status?: string
    nextDueDate?: string
    billingType?: string
  }): Promise<any> {
    try {
      const url = `${this.baseUrl}/v3/subscriptions/${subscriptionId}`
      const body = JSON.stringify(updateData)
      
      console.log('🚀 [ASAAS REQUEST] Atualizando assinatura:')
      console.log('📍 URL:', url)
      console.log('📦 Body:', body)
      console.log('🔑 Headers:', {
        'Content-Type': 'application/json',
        'access_token': '***HIDDEN***'
      })
      
      // Gerar comando curl para debug
      const curlCommand = `curl --request PUT \\
     --url ${url} \\
     --header 'accept: application/json' \\
     --header 'access_token: $ASAAS_ACCESS_TOKEN' \\
     --header 'content-type: application/json' \\
     --data '${body}'`
      
      console.log('🔧 [CURL COMMAND]:')
      console.log(curlCommand)
      
      return this.request<any>(`/v3/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        body: body
      })
    } catch (error) {
      console.error('❌ [ASAAS ERROR] Erro ao atualizar assinatura:', error)
      throw error
    }
  }

  // Cancelar assinatura
  static async cancelSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(`/v3/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })
  }

  // === PAYMENT METHODS ===

  // Buscar cobrança por ID
  static async getPayment(paymentId: string): Promise<Payment> {
    return this.request<Payment>(`/v3/payments/${paymentId}`)
  }

  // Listar cobranças de uma assinatura
  static async getSubscriptionPayments(subscriptionId: string): Promise<Payment[]> {
    const params = new URLSearchParams({ subscription: subscriptionId })
    const response = await this.request<{ data: Payment[] }>(`/v3/payments?${params}`)
    return response.data
  }

  // Listar cobranças de um cliente
  static async getCustomerPayments(customerId: string): Promise<Payment[]> {
    const params = new URLSearchParams({ customer: customerId })
    const response = await this.request<{ data: Payment[] }>(`/v3/payments?${params}`)
    return response.data
  }

  // === UTILITY METHODS ===

  // Verificar status da API
  static async healthCheck(): Promise<boolean> {
    try {
      await this.request('/v3/finance/balance')
      return true
    } catch (error) {
      console.error('Asaas API health check failed:', error)
      return false
    }
  }

  // Obter saldo da conta
  static async getBalance(): Promise<{ totalBalance: number }> {
    return this.request<{ totalBalance: number }>('/v3/finance/balance')
  }

  // Validar webhook
  static validateWebhook(payload: string, signature: string): boolean {
    // TODO: Implementar validação de webhook se o Asaas fornecer
    // Por enquanto, retorna true
    return true
  }

  // === HELPER METHODS ===

  // Formatar CPF/CNPJ (remover caracteres especiais)
  static formatCpfCnpj(cpfCnpj: string): string {
    return cpfCnpj.replace(/[^\d]/g, '')
  }

  // Validar CPF simples
  static isValidCpf(cpf: string): boolean {
    const cleanCpf = this.formatCpfCnpj(cpf)
    return cleanCpf.length === 11 && /^\d{11}$/.test(cleanCpf)
  }

  // Validar CNPJ simples
  static isValidCnpj(cnpj: string): boolean {
    const cleanCnpj = this.formatCpfCnpj(cnpj)
    return cleanCnpj.length === 14 && /^\d{14}$/.test(cleanCnpj)
  }

  // Determinar tipo de pessoa
  static getPersonType(cpfCnpj: string): 'FISICA' | 'JURIDICA' {
    const clean = this.formatCpfCnpj(cpfCnpj)
    return clean.length === 11 ? 'FISICA' : 'JURIDICA'
  }
}
