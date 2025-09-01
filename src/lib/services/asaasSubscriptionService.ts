// Serviço para gerenciamento de assinaturas Asaas - Modelo 1 assinatura = 1 grupo
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AsaasService } from './asaasService'
import type { 
  AsaasCustomer, 
  AsaasSubscription, 
  WebhookEvent,
  CreateSubscriptionRequest 
} from '@/types/subscription'
import type { Subscription, Payment } from '@/types/database'
import { Logger } from '@/lib/utils/logger'
import { formatDateForDB, convertAsaasDateToUTC } from '@/lib/utils/formatters'

export class AsaasSubscriptionService {
  
  // === CUSTOMER MANAGEMENT ===

  // Obter ou criar customer no Asaas
  static async getOrCreateAsaasCustomer(userId: string): Promise<AsaasCustomer> {
    try {
      Logger.info('AsaasSubscriptionService', 'Buscando customer do usuário', { userId })
      
      // Buscar usuário no banco
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, asaas_customer_id, cpf_cnpj, person_type')
        .eq('id', userId)
        .single()

      if (userError) throw userError
      if (!user) throw new Error('Usuário não encontrado')

      // Se já tem customer_id, buscar no Asaas
      if (user.asaas_customer_id) {
        Logger.info('AsaasSubscriptionService', 'Customer já existe, buscando no Asaas', { customerId: user.asaas_customer_id })
        return await AsaasService.getCustomer(user.asaas_customer_id)
      }

      // Criar customer no Asaas
      Logger.info('AsaasSubscriptionService', 'Criando novo customer no Asaas', { 
        name: user.name, 
        email: user.email, 
        cpfCnpj: user.cpf_cnpj 
      })

      const customerData = {
        name: user.name,
        email: user.email,
        cpfCnpj: user.cpf_cnpj,
        personType: user.person_type
      }

      const asaasCustomer = await AsaasService.createCustomer(customerData)
      
      // Atualizar customer_id no banco
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ asaas_customer_id: asaasCustomer.id })
        .eq('id', userId)

      if (updateError) throw updateError

      Logger.info('AsaasSubscriptionService', 'Customer criado e salvo com sucesso', { customerId: asaasCustomer.id })
      return asaasCustomer

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao obter/criar customer', { error, userId })
      throw error
    }
  }

  // === SUBSCRIPTION MANAGEMENT ===

  // Cancelar assinatura (suspender no Asaas)
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Cancelando assinatura', { subscriptionId })

      // Buscar assinatura para obter o asaas_subscription_id
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('asaas_subscription_id')
        .eq('id', subscriptionId)
        .single()

      if (subError) throw subError
      if (!subscription) throw new Error('Assinatura não encontrada')
      if (!subscription.asaas_subscription_id) throw new Error('Assinatura não possui ID do Asaas')

      // Atualizar status para INACTIVE no Asaas
      await AsaasService.updateSubscription(subscription.asaas_subscription_id, { status: 'INACTIVE' })

      // Atualizar status local para cancelled
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId)

      if (updateError) throw updateError

      Logger.info('AsaasSubscriptionService', 'Assinatura cancelada com sucesso', { subscriptionId })

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao cancelar assinatura', { error, subscriptionId })
      throw error
    }
  }

  // Criar assinatura usando endpoint do Asaas
  static async createSubscription(
    userId: string,
    planId: string,
    groupId?: string
  ): Promise<{ subscription: Subscription, asaasSubscription: AsaasSubscription }> {
    try {
      Logger.info('AsaasSubscriptionService', 'Criando nova assinatura', { userId, planId, groupId })

      // Buscar plano
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) throw planError
      if (!plan) throw new Error('Plano não encontrado')

      // Obter customer do Asaas
      const customer = await this.getOrCreateAsaasCustomer(userId)

      // Preparar dados para criação da assinatura no Asaas
      const subscriptionData: CreateSubscriptionRequest = {
        billingType: 'UNDEFINED' as const,
        cycle: 'MONTHLY', // Por padrão, todos os planos são mensais
        customer: customer.id,
        value: plan.price,
        nextDueDate: formatDateForDB(new Date()), // Data atual no formato YYYY-MM-DD
        description: `WPP - Resumir Grupo - ${plan.name}`
      }

      Logger.info('AsaasSubscriptionService', 'Criando assinatura no Asaas', { subscriptionData })

      // Criar assinatura no Asaas
      const asaasSubscription = await AsaasService.createSubscription(subscriptionData)

      // Criar registro da assinatura no banco
      const subscriptionInsert = {
        user_id: userId,
        plan_id: planId,
        customer: customer.id,
        billing_type: 'UNDEFINED' as const,
        value: plan.price,
        cycle: 'MONTHLY', // Por padrão, todos os planos são mensais
        description: subscriptionData.description,
        status: 'active',
        start_date: formatDateForDB(new Date()),
        next_billing_date: asaasSubscription.nextDueDate,
        asaas_subscription_id: asaasSubscription.id,
        group_id: groupId
      }

      const { data: subscription, error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionInsert)
        .select()
        .single()

      if (insertError) throw insertError

      Logger.info('AsaasSubscriptionService', 'Assinatura criada com sucesso', { 
        subscriptionId: subscription.id, 
        asaasSubscriptionId: asaasSubscription.id 
      })

      return { subscription, asaasSubscription }

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao criar assinatura', { error, userId, planId })
      throw error
    }
  }

  // === WEBHOOK PROCESSING ===

  // Processar webhook do Asaas
  static async processWebhook(event: string, data: WebhookEvent): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Processando webhook', { event, data })

      switch (event) {
        case 'PAYMENT_CREATED':
          await this.handlePaymentCreated(data)
          break
        case 'PAYMENT_CONFIRMED':
          await this.handlePaymentConfirmed(data)
          break
        case 'PAYMENT_RECEIVED':
          await this.handlePaymentReceived(data)
          break
        case 'PAYMENT_OVERDUE':
          await this.handlePaymentOverdue(data)
          break
        case 'SUBSCRIPTION_CREATED':
          await this.handleSubscriptionCreated(data)
          break
        case 'SUBSCRIPTION_UPDATED':
          await this.handleSubscriptionUpdated(data)
          break
        case 'SUBSCRIPTION_DELETED':
          await this.handleSubscriptionDeleted(data)
          break
        default:
          Logger.warn('AsaasSubscriptionService', 'Evento de webhook não tratado', { event })
      }

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao processar webhook', { error, event, data })
      throw error
    }
  }

  // === WEBHOOK HANDLERS ===

  // Handler para PAYMENT_CREATED
  static async handlePaymentCreated(data: WebhookEvent): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Processando PAYMENT_CREATED', { paymentId: data.payment?.id })

      if (!data.payment) {
        throw new Error('Dados do pagamento não encontrados no webhook')
      }

      const payment = data.payment

      // Buscar assinatura pelo subscription_id do Asaas
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('id, user_id')
        .eq('asaas_subscription_id', payment.subscription)
        .single()

      if (subError) throw subError
      if (!subscription) {
        throw new Error(`Assinatura não encontrada para subscription_id: ${payment.subscription}`)
      }

      // Criar registro do pagamento no banco
      const paymentInsert = {
        subscription_id: subscription.id,
        asaas_payment_id: payment.id,
        user_id: subscription.user_id,
        value: payment.value,
        status: payment.status,
        billing_type: payment.billingType,
        due_date: convertAsaasDateToUTC(payment.dueDate),
        payment_date: payment.paymentDate ? convertAsaasDateToUTC(payment.paymentDate) : null,
        description: payment.description,
        external_reference: null, // externalReference não está disponível no webhook
        invoice_url: payment.invoiceUrl,
        bank_slip_url: payment.bankSlipUrl,
        transaction_receipt_url: payment.transactionReceiptUrl
      }

      const { error: insertError } = await supabaseAdmin
        .from('payments')
        .insert(paymentInsert)

      if (insertError) throw insertError

      Logger.info('AsaasSubscriptionService', 'Pagamento criado com sucesso', { 
        paymentId: payment.id, 
        subscriptionId: subscription.id 
      })

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao processar PAYMENT_CREATED', { error, data })
      throw error
    }
  }

  // Handler para PAYMENT_CONFIRMED
  static async handlePaymentConfirmed(data: WebhookEvent): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Processando PAYMENT_CONFIRMED', { paymentId: data.payment?.id })

      if (!data.payment) {
        throw new Error('Dados do pagamento não encontrados no webhook')
      }

      const payment = data.payment

      // Primeiro, verificar se o pagamento já existe no banco
      const { data: existingPayment, error: checkError } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('asaas_payment_id', payment.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError
      }

      if (!existingPayment) {
        // Se o pagamento não existe, criar primeiro (caso o PAYMENT_CREATED não tenha sido processado)
        Logger.info('AsaasSubscriptionService', 'Pagamento não encontrado, criando primeiro', { paymentId: payment.id })
        
        // Buscar assinatura pelo subscription_id do Asaas
        const { data: subscription, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .select('id, user_id')
          .eq('asaas_subscription_id', payment.subscription)
          .single()

        if (subError) throw subError
        if (!subscription) {
          throw new Error(`Assinatura não encontrada para subscription_id: ${payment.subscription}`)
        }

        // Criar registro do pagamento no banco
        const paymentInsert = {
          subscription_id: subscription.id,
          asaas_payment_id: payment.id,
          user_id: subscription.user_id,
          value: payment.value,
          status: 'CONFIRMED', // Já marcar como confirmado
          billing_type: payment.billingType,
          due_date: convertAsaasDateToUTC(payment.dueDate),
          payment_date: payment.paymentDate || payment.clientPaymentDate ? 
            convertAsaasDateToUTC(payment.paymentDate || payment.clientPaymentDate || '') : 
            formatDateForDB(new Date()),
          description: payment.description,
          external_reference: null,
          invoice_url: payment.invoiceUrl,
          bank_slip_url: payment.bankSlipUrl,
          transaction_receipt_url: payment.transactionReceiptUrl
        }

        const { error: insertError } = await supabaseAdmin
          .from('payments')
          .insert(paymentInsert)

        if (insertError) throw insertError

        Logger.info('AsaasSubscriptionService', 'Pagamento criado e confirmado com sucesso', { 
          paymentId: payment.id, 
          subscriptionId: subscription.id 
        })
      } else {
        // Se o pagamento já existe, apenas atualizar o status
        const { error: updateError } = await supabaseAdmin
          .from('payments')
          .update({ 
            status: 'CONFIRMED',
            payment_date: payment.paymentDate || payment.clientPaymentDate ? 
              convertAsaasDateToUTC(payment.paymentDate || payment.clientPaymentDate || '') : 
              formatDateForDB(new Date()),
            transaction_receipt_url: payment.transactionReceiptUrl
          })
          .eq('asaas_payment_id', payment.id)

        if (updateError) throw updateError

        Logger.info('AsaasSubscriptionService', 'Pagamento marcado como confirmado', { paymentId: payment.id })
      }

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao processar PAYMENT_CONFIRMED', { error, data })
      throw error
    }
  }

  // Handler para PAYMENT_RECEIVED
  static async handlePaymentReceived(data: WebhookEvent): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Processando PAYMENT_RECEIVED', { paymentId: data.payment?.id })

      if (!data.payment) {
        throw new Error('Dados do pagamento não encontrados no webhook')
      }

      const payment = data.payment

      // Atualizar status do pagamento para RECEIVED
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({ 
          status: 'RECEIVED',
          payment_date: payment.paymentDate ? convertAsaasDateToUTC(payment.paymentDate) : formatDateForDB(new Date())
        })
        .eq('asaas_payment_id', payment.id)

      if (updateError) throw updateError

      Logger.info('AsaasSubscriptionService', 'Pagamento marcado como recebido', { paymentId: payment.id })

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao processar PAYMENT_RECEIVED', { error, data })
      throw error
    }
  }

  // Handler para PAYMENT_OVERDUE
  static async handlePaymentOverdue(data: WebhookEvent): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Processando PAYMENT_OVERDUE', { paymentId: data.payment?.id })

      if (!data.payment) {
        throw new Error('Dados do pagamento não encontrados no webhook')
      }

      const payment = data.payment

      // Atualizar status do pagamento para OVERDUE
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({ status: 'OVERDUE' })
        .eq('asaas_payment_id', payment.id)

      if (updateError) throw updateError

      // Atualizar status da assinatura para overdue
      const { error: subUpdateError } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'overdue' })
        .eq('asaas_subscription_id', payment.subscription)

      if (subUpdateError) throw subUpdateError

      Logger.info('AsaasSubscriptionService', 'Pagamento marcado como vencido', { paymentId: payment.id })

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao processar PAYMENT_OVERDUE', { error, data })
      throw error
    }
  }

  // Handler para SUBSCRIPTION_CREATED
  static async handleSubscriptionCreated(data: WebhookEvent): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Processando SUBSCRIPTION_CREATED', { subscriptionId: data.subscription?.id })

      if (!data.subscription) {
        throw new Error('Dados da assinatura não encontrados no webhook')
      }

      const subscription = data.subscription

      // Atualizar assinatura existente com dados do Asaas
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: subscription.status.toLowerCase(),
          next_billing_date: convertAsaasDateToUTC(subscription.nextDueDate),
          value: subscription.value,
          billing_type: subscription.billingType,
          cycle: subscription.cycle,
          description: subscription.description,
          payment_link: subscription.paymentLink
        })
        .eq('asaas_subscription_id', subscription.id)

      if (updateError) throw updateError

      Logger.info('AsaasSubscriptionService', 'Assinatura atualizada com dados do Asaas', { subscriptionId: subscription.id })

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao processar SUBSCRIPTION_CREATED', { error, data })
      throw error
    }
  }

  // Handler para SUBSCRIPTION_UPDATED
  static async handleSubscriptionUpdated(data: WebhookEvent): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Processando SUBSCRIPTION_UPDATED', { subscriptionId: data.subscription?.id })

      if (!data.subscription) {
        throw new Error('Dados da assinatura não encontrados no webhook')
      }

      const subscription = data.subscription

      // Atualizar assinatura
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: subscription.status.toLowerCase(),
          next_billing_date: convertAsaasDateToUTC(subscription.nextDueDate),
          value: subscription.value,
          billing_type: subscription.billingType,
          cycle: subscription.cycle,
          description: subscription.description,
          payment_link: subscription.paymentLink
        })
        .eq('asaas_subscription_id', subscription.id)

      if (updateError) throw updateError

      Logger.info('AsaasSubscriptionService', 'Assinatura atualizada', { subscriptionId: subscription.id })

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao processar SUBSCRIPTION_UPDATED', { error, data })
      throw error
    }
  }

  // Handler para SUBSCRIPTION_DELETED
  static async handleSubscriptionDeleted(data: WebhookEvent): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Processando SUBSCRIPTION_DELETED', { subscriptionId: data.subscription?.id })

      if (!data.subscription) {
        throw new Error('Dados da assinatura não encontrados no webhook')
      }

      const subscription = data.subscription

      // Atualizar status da assinatura para cancelled
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('asaas_subscription_id', subscription.id)

      if (updateError) throw updateError

      Logger.info('AsaasSubscriptionService', 'Assinatura cancelada', { subscriptionId: subscription.id })

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao processar SUBSCRIPTION_DELETED', { error, data })
      throw error
    }
  }

  // === UTILITY METHODS ===

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
      Logger.error('AsaasSubscriptionService', 'Erro ao buscar assinaturas do usuário', { error, userId })
      throw error
    }
  }

  // Verificar se usuário pode acessar grupo
  static async canAccessGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .eq('status', 'active')
        .limit(1)

      if (error) throw error
      return (data && data.length > 0)
    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao verificar acesso ao grupo', { error, userId, groupId })
      return false
    }
  }

  // Sincronizar assinaturas do usuário com Asaas
  static async syncUserSubscriptions(userId: string): Promise<void> {
    try {
      Logger.info('AsaasSubscriptionService', 'Sincronizando assinaturas do usuário', { userId })

      // Buscar assinaturas do usuário
      const { data: subscriptions, error } = await supabaseAdmin
        .from('subscriptions')
        .select('asaas_subscription_id')
        .eq('user_id', userId)
        .not('asaas_subscription_id', 'is', null)

      if (error) throw error

      // Sincronizar cada assinatura
      for (const subscription of subscriptions || []) {
        if (subscription.asaas_subscription_id) {
          try {
            const asaasSubscription = await AsaasService.getSubscription(subscription.asaas_subscription_id)
            
            // Atualizar dados da assinatura
            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: asaasSubscription.status.toLowerCase(),
                next_billing_date: convertAsaasDateToUTC(asaasSubscription.nextDueDate),
                value: asaasSubscription.value
              })
              .eq('asaas_subscription_id', subscription.asaas_subscription_id)

          } catch (syncError) {
            Logger.error('AsaasSubscriptionService', 'Erro ao sincronizar assinatura', { 
              error: syncError, 
              subscriptionId: subscription.asaas_subscription_id 
            })
          }
        }
      }

      Logger.info('AsaasSubscriptionService', 'Sincronização concluída', { userId })

    } catch (error) {
      Logger.error('AsaasSubscriptionService', 'Erro ao sincronizar assinaturas', { error, userId })
      throw error
    }
  }
}
