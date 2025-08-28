// Tipos para as tabelas do Supabase baseados no DER do PRD

export interface User {
  id: string
  name: string
  email: string
  phone_number?: string
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

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'inactive' | 'overdue' | 'cancelled'
  start_date: string
  next_billing_date: string
  asaas_subscription_id?: string
  created_at: string
  updated_at?: string
}

export interface Instance {
  id: string
  user_id: string
  instance_name: string
  qr_code?: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
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
export type SubscriptionInsert = Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
export type InstanceInsert = Omit<Instance, 'id' | 'created_at' | 'updated_at'>
export type GroupSelectionInsert = Omit<GroupSelection, 'id' | 'created_at' | 'updated_at'>
export type ScheduleInsert = Omit<Schedule, 'id' | 'created_at' | 'updated_at'>
export type MessageInsert = Omit<Message, 'id' | 'created_at'>
export type SummaryInsert = Omit<Summary, 'id' | 'created_at'>

// Tipos para atualização (campos opcionais)
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>
export type PlanUpdate = Partial<Omit<Plan, 'id' | 'created_at'>>
export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'created_at'>>
export type InstanceUpdate = Partial<Omit<Instance, 'id' | 'created_at'>>
export type GroupSelectionUpdate = Partial<Omit<GroupSelection, 'id' | 'created_at'>>
export type ScheduleUpdate = Partial<Omit<Schedule, 'id' | 'created_at'>>
export type MessageUpdate = Partial<Omit<Message, 'id' | 'created_at'>>
export type SummaryUpdate = Partial<Omit<Summary, 'id' | 'created_at'>>
