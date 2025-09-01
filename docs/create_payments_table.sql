-- Script para criar tabela de pagamentos e atualizar estrutura de assinaturas
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  asaas_payment_id VARCHAR(255) NOT NULL UNIQUE, -- ID do pagamento no Asaas
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'CANCELLED', 'RECEIVED', 'RECEIVED_IN_CASH_APP')),
  billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('CREDIT_CARD', 'BOLETO', 'PIX', 'UNDEFINED')),
  due_date DATE NOT NULL,
  payment_date DATE,
  description TEXT,
  external_reference VARCHAR(255),
  invoice_url VARCHAR(500),
  bank_slip_url VARCHAR(500),
  transaction_receipt_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Atualizar tabela de assinaturas para incluir campos do Asaas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS customer VARCHAR(255), -- ID do customer no Asaas
ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) CHECK (billing_type IN ('CREDIT_CARD', 'BOLETO', 'PIX', 'UNDEFINED')),
ADD COLUMN IF NOT EXISTS value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cycle VARCHAR(20) CHECK (cycle IN ('MONTHLY', 'YEARLY')),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS fine_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fine_type VARCHAR(20) DEFAULT 'FIXED',
ADD COLUMN IF NOT EXISTS interest_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS interest_type VARCHAR(20) DEFAULT 'PERCENTAGE';

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_id ON payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_id ON subscriptions(asaas_subscription_id);

-- 4. Configurar RLS (Row Level Security) para payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para payments
-- Usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

-- Usuários podem criar seus próprios pagamentos
CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios pagamentos
CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (user_id = auth.uid());

-- Admins podem ver todos os pagamentos
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 6. Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar se tudo foi criado corretamente
SELECT 'Tabela de pagamentos criada com sucesso!' as status;

-- Verificar estrutura das tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('payments', 'subscriptions')
ORDER BY table_name, ordinal_position;
