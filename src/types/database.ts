// Tipos para as tabelas do Supabase baseados no DER do PRD

export interface User {
  id: string
  name: string
  email: string
  phone_number?: string
  cpf_cnpj?: string
  person_type: 'individual' | 'company'
  role: 'user' | 'admin'
  asaas_customer_id?: string
  created_at: string
  updated_at?: string
}

export interface Plan {
  id: string
  name: string
  description: string
  price: number
  max_groups: number
  features: string[]
  created_at: string
  updated_at?: string
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
  created_at: string
  updated_at?: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'inactive' | 'overdue' | 'cancelled'
  start_date: string
  next_billing_date: string
  asaas_subscription_id?: string
  group_id?: string // ID do grupo do WhatsApp vinculado a esta assinatura
  created_at: string
  updated_at?: string
  subscription_plans?: SubscriptionPlan
}

export interface Instance {
  id: string
  user_id: string
  instance_name: string
  qr_code?: string
  status: 'open' | 'close' | 'connecting'
  evolution_instance_id?: string
  created_at: string
  updated_at?: string
}

export interface GroupSelection {
  id: string
  user_id: string
  instance_id: string
  group_name: string
  group_id: string
  active: boolean
  created_at: string
  updated_at?: string
}

// Tipo para grupos retornados pela Evolution API
export interface WhatsAppGroup {
  id: string
  subject: string
  subjectOwner: string
  subjectTime: number
  pictureUrl: string | null
  size: number
  creation: number
  owner: string
  desc: string
  descId: string
  restrict: boolean
  announce: boolean
}

export interface Schedule {
  id: string
  group_selection_id: string
  send_time: string // HH:MM format
  active: boolean
  created_at: string
  updated_at?: string
}

export interface Message {
  id: string
  group_selection_id: string
  content: string
  sender: string
  timestamp: string
  processed: boolean
  created_at: string
}

export interface Summary {
  id: string
  group_selection_id: string
  content: string
  message_count: number
  date: string
  sent: boolean
  created_at: string
}

// Tipos para inserção (sem campos auto-gerados)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type PlanInsert = Omit<Plan, 'id' | 'created_at' | 'updated_at'>
export type SubscriptionPlanInsert = Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>
export type SubscriptionInsert = Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
export type InstanceInsert = Omit<Instance, 'id' | 'created_at' | 'updated_at'>
// Tipo para inserção de seleção de grupo
export type GroupSelectionInsert = Omit<GroupSelection, 'id' | 'created_at' | 'updated_at'>
export type ScheduleInsert = Omit<Schedule, 'id' | 'created_at' | 'updated_at'>
export type MessageInsert = Omit<Message, 'id' | 'created_at'>
export type SummaryInsert = Omit<Summary, 'id' | 'created_at'>

// Tipos para atualização (campos opcionais)
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>
export type PlanUpdate = Partial<Omit<Plan, 'id' | 'created_at'>>
export type SubscriptionPlanUpdate = Partial<Omit<SubscriptionPlan, 'id' | 'created_at'>>
export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'created_at'>>
export type InstanceUpdate = Partial<Omit<Instance, 'id' | 'created_at'>>
// Tipo para atualização de seleção de grupo
export type GroupSelectionUpdate = Partial<Omit<GroupSelection, 'id' | 'created_at'>>
export type ScheduleUpdate = Partial<Omit<Schedule, 'id' | 'created_at'>>
export type MessageUpdate = Partial<Omit<Message, 'id' | 'created_at'>>
export type SummaryUpdate = Partial<Omit<Summary, 'id' | 'created_at'>>
