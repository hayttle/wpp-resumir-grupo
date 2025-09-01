-- Criação das tabelas para sistema de assinaturas
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar campo asaas_customer_id na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255);

-- 2. Criar tabela de planos de assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billingType VARCHAR(20) NOT NULL CHECK (billingType IN ('MONTHLY', 'YEARLY')),
  features JSONB DEFAULT '[]'::jsonb,
  maxGroups INTEGER NOT NULL DEFAULT 1,
  maxInstances INTEGER NOT NULL DEFAULT 1,
  isActive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planId UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  customer VARCHAR(255) NOT NULL, -- ID do customer no Asaas
  billingType VARCHAR(20) NOT NULL CHECK (billingType IN ('CREDIT_CARD', 'BOLETO', 'PIX')),
  value DECIMAL(10,2) NOT NULL,
  nextDueDate DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED', 'OVERDUE')),
  cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('MONTHLY', 'YEARLY')),
  asaasSubscriptionId VARCHAR(255), -- ID da assinatura no Asaas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_asaas_customer ON users(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(planId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas ON subscriptions(asaasSubscriptionId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(isActive) WHERE isActive = true;

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para subscription_plans
-- Todos podem ver planos ativos
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (isActive = true);

-- Apenas admins podem gerenciar planos
CREATE POLICY "Only admins can manage plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 7. Políticas RLS para subscriptions
-- Usuários podem ver suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (userId = auth.uid());

-- Usuários podem criar suas próprias assinaturas
CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (userId = auth.uid());

-- Usuários podem atualizar suas próprias assinaturas
CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (userId = auth.uid());

-- Admins podem ver todas as assinaturas
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 8. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Criar triggers para atualizar updated_at
CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON subscription_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Inserir planos de exemplo
INSERT INTO subscription_plans (name, description, price, billingType, features, maxGroups, maxInstances, isActive) VALUES
('Básico Mensal', 'Plano básico com recursos essenciais', 29.90, 'MONTHLY', 
 '["Até 3 grupos", "Até 1 instância", "Resumos automáticos", "Suporte básico"]'::jsonb, 
 3, 1, true),
 
('Básico Anual', 'Plano básico anual com desconto', 299.00, 'YEARLY', 
 '["Até 3 grupos", "Até 1 instância", "Resumos automáticos", "Suporte básico", "2 meses grátis"]'::jsonb, 
 3, 1, true),

('Premium Mensal', 'Plano premium com recursos avançados', 79.90, 'MONTHLY', 
 '["Até 10 grupos", "Até 3 instâncias", "Resumos automáticos", "Agendamento personalizado", "Suporte prioritário"]'::jsonb, 
 10, 3, true),
 
('Premium Anual', 'Plano premium anual com desconto', 799.00, 'YEARLY', 
 '["Até 10 grupos", "Até 3 instâncias", "Resumos automáticos", "Agendamento personalizado", "Suporte prioritário", "2 meses grátis"]'::jsonb, 
 10, 3, true),

('Enterprise Mensal', 'Plano empresarial com recursos ilimitados', 199.90, 'MONTHLY', 
 '["Grupos ilimitados", "Até 10 instâncias", "Resumos automáticos", "Agendamento personalizado", "API personalizada", "Suporte 24/7"]'::jsonb, 
 999, 10, true),
 
('Enterprise Anual', 'Plano empresarial anual com desconto', 1999.00, 'YEARLY', 
 '["Grupos ilimitados", "Até 10 instâncias", "Resumos automáticos", "Agendamento personalizado", "API personalizada", "Suporte 24/7", "2 meses grátis"]'::jsonb, 
 999, 10, true);

-- 11. Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas com sucesso!' as status;

-- Verificar planos criados
SELECT name, price, billingType, maxGroups, maxInstances 
FROM subscription_plans 
WHERE isActive = true 
ORDER BY price;

-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('subscription_plans', 'subscriptions');
