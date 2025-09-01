// Serviço para gerenciamento de assinaturas integrando Asaas com nosso sistema
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AsaasService } from './asaasService'
import type { 
  SubscriptionPlan, 
  CreateSubscriptionRequest,
  AsaasCustomer,
  AsaasSubscription
} from '@/types/subscription'
import type { Subscription } from '@/types/database'
import { formatDateForDB } from '@/lib/utils/formatters'

export class SubscriptionService {
  
  // === PLANS MANAGEMENT ===

  // Buscar todos os planos disponíveis
  static async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('isActive', true)
        .order('price', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
      throw error
    }
  }

  // Buscar plano por ID
  static async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
      return null
    }
  }

  // === CUSTOMER MANAGEMENT ===

  // Criar ou obter cliente no Asaas
  static async getOrCreateAsaasCustomer(userId: string): Promise<AsaasCustomer> {
    try {
      // Buscar dados do usuário no nosso sistema
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        throw new Error('Usuário não encontrado')
      }

      // Verificar se já existe customer no Asaas
      const existingCustomers = await AsaasService.getCustomerByEmail(user.email)
      
      if (existingCustomers.length > 0) {
        return existingCustomers[0]
      }

      // Criar novo customer no Asaas
      const customerData = {
        name: user.name || user.email,
        email: user.email,
        cpfCnpj: user.cpf_cnpj,
        personType: (user.person_type === 'company' ? 'JURIDICA' : 'FISICA') as 'FISICA' | 'JURIDICA',
        externalReference: userId,
        notificationDisabled: false
      }

      const asaasCustomer = await AsaasService.createCustomer(customerData)

      // Salvar referência do customer no nosso banco
      await supabaseAdmin
        .from('users')
        .update({ asaas_customer_id: asaasCustomer.id })
        .eq('id', userId)

      return asaasCustomer
    } catch (error) {
      console.error('Erro ao criar/obter customer:', error)
      throw error
    }
  }

  // === SUBSCRIPTION MANAGEMENT ===

  // Criar nova assinatura
  static async createSubscription(
    userId: string,
    planId: string,
    billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX',
    creditCardData?: any
  ): Promise<Subscription> {
    try {
      // Buscar plano
      const plan = await this.getPlan(planId)
      if (!plan) {
        throw new Error('Plano não encontrado')
      }

      // Criar ou obter customer no Asaas
      const asaasCustomer = await this.getOrCreateAsaasCustomer(userId)

      // Calcular próxima data de vencimento
      const nextDueDate = new Date()
      if (plan.billingType === 'MONTHLY') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1)
      } else {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
      }

      // Preparar dados da assinatura para o Asaas
      const subscriptionData: CreateSubscriptionRequest = {
        customer: asaasCustomer.id,
        billingType,
        value: plan.price,
        nextDueDate: formatDateForDB(nextDueDate),
        description: `Assinatura ${plan.name}`,
        cycle: plan.billingType,
        externalReference: `${userId}-${planId}`,
        ...creditCardData
      }

      // Criar assinatura no Asaas
      const asaasSubscription = await AsaasService.createSubscription(subscriptionData)

      // Salvar assinatura no nosso banco
      const subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        plan_id: planId,
        status: asaasSubscription.status.toLowerCase() as 'active' | 'inactive' | 'overdue' | 'cancelled',
        start_date: formatDateForDB(new Date()),
        next_billing_date: asaasSubscription.nextDueDate,
        asaas_subscription_id: asaasSubscription.id,
        group_id: undefined // será definido quando o usuário vincular a um grupo
      }

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscription)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
      throw error
    }
  }

  // Buscar assinaturas do usuário
  static async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            description,
            features,
            maxGroups,
            maxInstances
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar assinaturas do usuário:', error)
      throw error
    }
  }

  // Buscar assinatura ativa do usuário
  static async getActiveSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            description,
            features,
            maxGroups,
            maxInstances
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('Erro ao buscar assinatura ativa:', error)
      return null
    }
  }

  // Cancelar assinatura
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      // Buscar assinatura no nosso banco
      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (error || !subscription) {
        throw new Error('Assinatura não encontrada')
      }

      // Cancelar no Asaas se tiver ID
      if (subscription.asaas_subscription_id) {
        await AsaasService.cancelSubscription(subscription.asaas_subscription_id)
      }

      // Atualizar status no nosso banco
      await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'INACTIVE',
          updatedAt: new Date().toISOString()
        })
        .eq('id', subscriptionId)

    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      throw error
    }
  }

  // Sincronizar assinatura com Asaas
  static async syncSubscriptionWithAsaas(subscriptionId: string): Promise<void> {
    try {
      // Buscar assinatura no nosso banco
      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (error || !subscription || !subscription.asaas_subscription_id) {
        throw new Error('Assinatura não encontrada')
      }

      // Buscar status atual no Asaas
      const asaasSubscription = await AsaasService.getSubscription(subscription.asaas_subscription_id)

      // Atualizar dados no nosso banco
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: asaasSubscription.status.toLowerCase() as 'active' | 'inactive' | 'overdue' | 'cancelled',
          next_billing_date: asaasSubscription.nextDueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

    } catch (error) {
      console.error('Erro ao sincronizar assinatura:', error)
      throw error
    }
  }

  // === WEBHOOK HANDLING ===

  // Processar webhook do Asaas
  static async processWebhook(event: string, data: any): Promise<void> {
    try {
      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          await this.handlePaymentReceived(data.payment)
          break
          
        case 'PAYMENT_OVERDUE':
          await this.handlePaymentOverdue(data.payment)
          break
          
        case 'SUBSCRIPTION_CREATED':
          await this.handleSubscriptionCreated(data.subscription)
          break
          
        case 'SUBSCRIPTION_UPDATED':
          await this.handleSubscriptionUpdated(data.subscription)
          break
          
        case 'SUBSCRIPTION_DELETED':
          await this.handleSubscriptionDeleted(data.subscription)
          break
          
        default:
          console.log('Evento de webhook não processado:', event)
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error)
      throw error
    }
  }

  // Handlers para eventos específicos
  private static async handlePaymentReceived(payment: any): Promise<void> {
    if (payment.subscription) {
      // Buscar assinatura pelo ID do Asaas
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('asaas_subscription_id', payment.subscription)
        .single()

      if (subscription) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)
      }
    }
  }

  private static async handlePaymentOverdue(payment: any): Promise<void> {
    if (payment.subscription) {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('asaas_subscription_id', payment.subscription)
        .single()

      if (subscription) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'overdue',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)
      }
    }
  }

  private static async handleSubscriptionCreated(subscription: AsaasSubscription): Promise<void> {
    // Lógica para quando uma assinatura é criada via webhook
    console.log('Assinatura criada via webhook:', subscription.id)
  }

  private static async handleSubscriptionUpdated(subscription: AsaasSubscription): Promise<void> {
    // Sincronizar status da assinatura
    const { data: localSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
              .eq('asaas_subscription_id', subscription.id)
      .single()

    if (localSubscription) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: subscription.status.toLowerCase() as 'active' | 'inactive' | 'overdue' | 'cancelled',
          next_billing_date: subscription.nextDueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', localSubscription.id)
    }
  }

  private static async handleSubscriptionDeleted(subscription: AsaasSubscription): Promise<void> {
    // Marcar assinatura como inativa
    await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
              .eq('asaas_subscription_id', subscription.id)
  }

  // === UTILITY METHODS ===

  // Verificar se usuário tem assinatura ativa
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(userId)
    return subscription !== null && subscription.status === 'active'
  }

  // Obter limites do usuário baseado na assinatura
  static async getUserLimits(userId: string): Promise<{ maxGroups: number; maxInstances: number }> {
    const subscription = await this.getActiveSubscription(userId)
    
    if (subscription && subscription.subscription_plans) {
      return {
        maxGroups: subscription.subscription_plans.maxGroups,
        maxInstances: subscription.subscription_plans.maxInstances
      }
    }

    // Limites padrão para usuários sem assinatura
    return {
      maxGroups: 1,
      maxInstances: 1
    }
  }
}
