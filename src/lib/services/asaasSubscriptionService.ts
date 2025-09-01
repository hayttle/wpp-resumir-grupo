// Serviço para gerenciamento de assinaturas Asaas - Modelo 1 assinatura = 1 grupo
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AsaasService } from './asaasService'
import type { 
  Subscription,
  Plan
} from '@/types/database'
import type {
  CreateSubscriptionRequest,
  AsaasCustomer,
  AsaasSubscription
} from '@/types/subscription'

export class AsaasSubscriptionService {
  
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
      if (user.asaas_customer_id) {
        try {
          const existingCustomer = await AsaasService.getCustomer(user.asaas_customer_id)
          return existingCustomer
        } catch (error) {
          console.warn('Customer não encontrado no Asaas, criando novo:', error)
        }
      }

      // Verificar se já existe customer com este email
      const existingCustomers = await AsaasService.getCustomerByEmail(user.email)
      
      if (existingCustomers.length > 0) {
        // Atualizar referência no nosso banco
        await supabaseAdmin
          .from('users')
          .update({ asaas_customer_id: existingCustomers[0].id })
          .eq('id', userId)

        return existingCustomers[0]
      }

      // Criar novo customer no Asaas
      const customerData = {
        name: user.name || user.email,
        email: user.email,
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

  // === PLAN MANAGEMENT ===

  // Buscar o plano único (conforme requisito)
  static async getSinglePlan(): Promise<Plan | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.error('Erro ao buscar plano:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
      return null
    }
  }

  // === SUBSCRIPTION MANAGEMENT ===

  // Criar nova assinatura para um grupo específico
  static async createSubscription(
    userId: string,
    groupId: string,
    billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' = 'PIX',
    creditCardData?: any
  ): Promise<{ subscription: Subscription; paymentUrl?: string }> {
    try {
      // Buscar plano único
      const plan = await this.getSinglePlan()
      if (!plan) {
        throw new Error('Plano não encontrado')
      }

      // Verificar se usuário já tem assinatura ativa para este grupo
      const { data: existingSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .eq('status', 'active')
        .single()

      if (existingSubscription) {
        throw new Error('Usuário já possui assinatura ativa para este grupo')
      }

      // Criar ou obter customer no Asaas
      const asaasCustomer = await this.getOrCreateAsaasCustomer(userId)

      // Calcular próxima data de vencimento (mensal)
      const nextDueDate = new Date()
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)

      // Preparar dados da assinatura para o Asaas
      const subscriptionData: CreateSubscriptionRequest = {
        customer: asaasCustomer.id,
        billingType,
        value: plan.price,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        description: `${plan.name} - Grupo ${groupId}`,
        cycle: 'MONTHLY',
        externalReference: `${userId}-${groupId}`,
        ...creditCardData
      }

      // Criar assinatura no Asaas
      const asaasSubscription = await AsaasService.createSubscription(subscriptionData)

      // Salvar assinatura no nosso banco
      const subscriptionInsert = {
        user_id: userId,
        plan_id: plan.id,
        status: 'inactive' as const, // Inicia como inativo até confirmação de pagamento
        start_date: new Date().toISOString(),
        next_billing_date: asaasSubscription.nextDueDate,
        asaas_subscription_id: asaasSubscription.id,
        group_id: groupId
      }

      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionInsert)
        .select()
        .single()

      if (error) throw error

      return {
        subscription,
        paymentUrl: asaasSubscription.paymentLink
      }
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
          plans (
            name,
            description,
            price,
            max_groups
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

  // Buscar assinaturas ativas do usuário
  static async getActiveSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          plans (
            name,
            description,
            price,
            max_groups
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar assinaturas ativas:', error)
      return []
    }
  }

  // Verificar se usuário pode acessar um grupo específico
  static async canAccessGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .eq('status', 'active')
        .single()

      return !error && data !== null
    } catch (error) {
      return false
    }
  }

  // Contar quantos grupos o usuário tem acesso
  static async getUserGroupCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active')

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erro ao contar grupos do usuário:', error)
      return 0
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
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      throw error
    }
  }

  // === WEBHOOK HANDLING ===

  // Processar webhook do Asaas
  static async processWebhook(event: string, data: any): Promise<void> {
    const timestamp = new Date().toISOString()
    
    try {
      console.log('🔄 [WEBHOOK PROCESSING START]', {
        timestamp,
        event,
        dataKeys: Object.keys(data || {}),
        fullData: data
      })

      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          console.log('💳 [PAYMENT CONFIRMED]', {
            timestamp,
            event,
            paymentId: data.payment?.id,
            subscriptionId: data.payment?.subscription,
            value: data.payment?.value,
            status: data.payment?.status
          })
          await this.handlePaymentReceived(data.payment)
          break
          
        case 'PAYMENT_OVERDUE':
          console.log('⚠️ [PAYMENT OVERDUE]', {
            timestamp,
            event,
            paymentId: data.payment?.id,
            subscriptionId: data.payment?.subscription,
            dueDate: data.payment?.dueDate
          })
          await this.handlePaymentOverdue(data.payment)
          break
          
        case 'SUBSCRIPTION_CREATED':
          console.log('🆕 [SUBSCRIPTION CREATED]', {
            timestamp,
            event,
            subscriptionId: data.subscription?.id,
            customerId: data.subscription?.customer,
            status: data.subscription?.status
          })
          await this.handleSubscriptionCreated(data.subscription)
          break
          
        case 'SUBSCRIPTION_UPDATED':
          console.log('🔄 [SUBSCRIPTION UPDATED]', {
            timestamp,
            event,
            subscriptionId: data.subscription?.id,
            status: data.subscription?.status,
            nextDueDate: data.subscription?.nextDueDate
          })
          await this.handleSubscriptionUpdated(data.subscription)
          break
          
        case 'SUBSCRIPTION_DELETED':
          console.log('🗑️ [SUBSCRIPTION DELETED]', {
            timestamp,
            event,
            subscriptionId: data.subscription?.id
          })
          await this.handleSubscriptionDeleted(data.subscription)
          break
          
        default:
          console.log('❓ [UNKNOWN WEBHOOK EVENT]', {
            timestamp,
            event,
            availableEvents: [
              'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE',
              'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_DELETED'
            ]
          })
      }

      console.log('✅ [WEBHOOK PROCESSING COMPLETE]', {
        timestamp,
        event,
        status: 'success'
      })
    } catch (error) {
      console.error('💥 [WEBHOOK PROCESSING FAILED]', {
        timestamp,
        event,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  // Handlers para eventos específicos
  private static async handlePaymentReceived(payment: any): Promise<void> {
    const timestamp = new Date().toISOString()
    
    console.log('💰 [HANDLE PAYMENT RECEIVED]', {
      timestamp,
      paymentId: payment?.id,
      subscriptionId: payment?.subscription,
      value: payment?.value,
      status: payment?.status,
      fullPayment: payment
    })

    if (payment.subscription) {
      // Buscar assinatura pelo ID do Asaas
      console.log('🔍 [SEARCHING SUBSCRIPTION]', {
        timestamp,
        asaasSubscriptionId: payment.subscription
      })

      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('asaas_subscription_id', payment.subscription)
        .single()

      if (error) {
        console.error('❌ [SUBSCRIPTION NOT FOUND]', {
          timestamp,
          asaasSubscriptionId: payment.subscription,
          error
        })
        return
      }

      if (subscription) {
        console.log('📝 [UPDATING SUBSCRIPTION STATUS]', {
          timestamp,
          subscriptionId: subscription.id,
          groupId: subscription.group_id,
          userId: subscription.user_id,
          oldStatus: subscription.status,
          newStatus: 'active'
        })

        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error('❌ [SUBSCRIPTION UPDATE FAILED]', {
            timestamp,
            subscriptionId: subscription.id,
            error: updateError
          })
        } else {
          console.log('✅ [SUBSCRIPTION ACTIVATED]', {
            timestamp,
            subscriptionId: subscription.id,
            groupId: subscription.group_id,
            userId: subscription.user_id,
            message: 'Pagamento confirmado e assinatura ativada'
          })
        }
      }
    } else {
      console.log('⚠️ [NO SUBSCRIPTION IN PAYMENT]', {
        timestamp,
        paymentId: payment?.id,
        message: 'Pagamento não está vinculado a uma assinatura'
      })
    }
  }

  private static async handlePaymentOverdue(payment: any): Promise<void> {
    const timestamp = new Date().toISOString()
    
    console.log('⏰ [HANDLE PAYMENT OVERDUE]', {
      timestamp,
      paymentId: payment?.id,
      subscriptionId: payment?.subscription,
      dueDate: payment?.dueDate,
      fullPayment: payment
    })

    if (payment.subscription) {
      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('asaas_subscription_id', payment.subscription)
        .single()

      if (error) {
        console.error('❌ [SUBSCRIPTION NOT FOUND - OVERDUE]', {
          timestamp,
          asaasSubscriptionId: payment.subscription,
          error
        })
        return
      }

      if (subscription) {
        console.log('📝 [UPDATING SUBSCRIPTION TO OVERDUE]', {
          timestamp,
          subscriptionId: subscription.id,
          groupId: subscription.group_id,
          oldStatus: subscription.status,
          newStatus: 'overdue'
        })

        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'overdue',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error('❌ [OVERDUE UPDATE FAILED]', {
            timestamp,
            subscriptionId: subscription.id,
            error: updateError
          })
        } else {
          console.log('⚠️ [SUBSCRIPTION MARKED OVERDUE]', {
            timestamp,
            subscriptionId: subscription.id,
            groupId: subscription.group_id,
            message: 'Assinatura marcada como em atraso'
          })
        }
      }
    }
  }

  private static async handleSubscriptionCreated(subscription: AsaasSubscription): Promise<void> {
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
      // Mapear status do Asaas para nosso modelo
      let localStatus: 'active' | 'inactive' | 'overdue' | 'cancelled' = 'inactive'
      
      switch (subscription.status) {
        case 'ACTIVE':
          localStatus = 'active'
          break
        case 'OVERDUE':
          localStatus = 'overdue'
          break
        case 'EXPIRED':
        case 'INACTIVE':
          localStatus = 'inactive'
          break
      }

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: localStatus,
          next_billing_date: subscription.nextDueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', localSubscription.id)

      console.log(`Assinatura ${localSubscription.id} sincronizada - status: ${localStatus}`)
    }
  }

  private static async handleSubscriptionDeleted(subscription: AsaasSubscription): Promise<void> {
    // Marcar assinatura como cancelada
    await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_subscription_id', subscription.id)

    console.log(`Assinatura com ID Asaas ${subscription.id} cancelada`)
  }

  // === UTILITY METHODS ===

  // Verificar se usuário tem pelo menos uma assinatura ativa
  static async hasAnyActiveSubscription(userId: string): Promise<boolean> {
    const count = await this.getUserGroupCount(userId)
    return count > 0
  }

  // Obter lista de grupos que o usuário tem acesso
  static async getUserAccessibleGroups(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('group_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .not('group_id', 'is', null)

      if (error) throw error
      
      return (data || [])
        .map(sub => sub.group_id)
        .filter(groupId => groupId !== null) as string[]
    } catch (error) {
      console.error('Erro ao buscar grupos acessíveis:', error)
      return []
    }
  }

  // Sincronizar todas as assinaturas do usuário com o Asaas
  static async syncUserSubscriptions(userId: string): Promise<void> {
    try {
      const subscriptions = await this.getUserSubscriptions(userId)
      
      for (const subscription of subscriptions) {
        if (subscription.asaas_subscription_id) {
          try {
            const asaasSubscription = await AsaasService.getSubscription(subscription.asaas_subscription_id)
            await this.handleSubscriptionUpdated(asaasSubscription)
          } catch (error) {
            console.error(`Erro ao sincronizar assinatura ${subscription.id}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar assinaturas do usuário:', error)
      throw error
    }
  }
}
