// Types para sistema de assinaturas e integração com Asaas

export interface Customer {
  id: string
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  postalCode?: string
  externalReference?: string
  notificationDisabled?: boolean
  additionalEmails?: string
  municipalInscription?: string
  stateInscription?: string
  observations?: string
}

export interface AsaasCustomer {
  object: string
  id: string
  dateCreated: string
  name: string
  email: string
  phone?: string
  mobilePhone?: string
  cpfCnpj?: string
  personType: 'FISICA' | 'JURIDICA'
  deleted: boolean
  additionalEmails?: string
  externalReference?: string
  notificationDisabled: boolean
  city?: string
  state?: string
  country?: string
  observations?: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  billingType: 'MONTHLY' | 'YEARLY'
  features: string[]
  maxGroups: number
  maxInstances: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  customer: string // ID do customer no Asaas
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX'
  value: number
  nextDueDate: string
  description: string
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'OVERDUE'
  cycle: 'MONTHLY' | 'YEARLY'
  planId: string
  userId: string // ID do usuário no nosso sistema
  asaasSubscriptionId?: string // ID da assinatura no Asaas
  createdAt: string
  updatedAt: string
}

export interface AsaasSubscription {
  object: string
  id: string
  dateCreated: string
  customer: string
  paymentLink?: string
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX'
  value: number
  nextDueDate: string
  cycle: 'MONTHLY' | 'YEARLY'
  description: string
  endDate?: string
  maxPayments?: number
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'OVERDUE'
  deleted: boolean
  creditCard?: {
    creditCardNumber: string
    creditCardBrand: string
    creditCardToken: string
  }
  fine?: {
    value: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  interest?: {
    value: number
    type: 'PERCENTAGE'
  }
  split?: any[]
}

export interface Payment {
  id: string
  customer: string
  subscription?: string
  installment?: string
  paymentLink?: string
  value: number
  netValue: number
  originalValue?: number
  interestValue?: number
  description: string
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX'
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL'
  pixTransaction?: string
  dueDate: string
  originalDueDate: string
  paymentDate?: string
  clientPaymentDate?: string
  installmentNumber?: number
  invoiceUrl: string
  bankSlipUrl?: string
  transactionReceiptUrl?: string
  invoiceNumber: string
  deleted: boolean
  anticipated: boolean
  anticipable: boolean
}

export interface CreateCustomerRequest {
  name: string
  email: string
  cpfCnpj?: string
  personType?: 'FISICA' | 'JURIDICA'
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  postalCode?: string
  externalReference?: string
  notificationDisabled?: boolean
  additionalEmails?: string
  municipalInscription?: string
  stateInscription?: string
  observations?: string
}

export interface CreateSubscriptionRequest {
  customer: string
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED'
  value: number
  nextDueDate: string
  description: string
  cycle: 'MONTHLY' | 'YEARLY'
  endDate?: string
  maxPayments?: number
  externalReference?: string
  split?: any[]
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    addressComplement?: string
    phone: string
  }
  fine?: {
    value: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  interest?: {
    value: number
    type: 'PERCENTAGE'
  }
  discount?: {
    value: number
    dueDateLimitDays: number
    type: 'FIXED' | 'PERCENTAGE'
  }
}

export interface WebhookEvent {
  event: string
  payment?: Payment
  subscription?: AsaasSubscription
  customer?: AsaasCustomer
  dateCreated: string
}

// Enum para status de pagamento
export enum PaymentStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED', 
  CONFIRMED = 'CONFIRMED',
  OVERDUE = 'OVERDUE',
  REFUNDED = 'REFUNDED',
  RECEIVED_IN_CASH = 'RECEIVED_IN_CASH',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  CHARGEBACK_REQUESTED = 'CHARGEBACK_REQUESTED',
  CHARGEBACK_DISPUTE = 'CHARGEBACK_DISPUTE',
  AWAITING_CHARGEBACK_REVERSAL = 'AWAITING_CHARGEBACK_REVERSAL'
}

// Enum para status de assinatura
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE', 
  EXPIRED = 'EXPIRED',
  OVERDUE = 'OVERDUE'
}

// Enum para tipo de cobrança
export enum BillingType {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
  PIX = 'PIX'
}

// Enum para ciclo de cobrança
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}
