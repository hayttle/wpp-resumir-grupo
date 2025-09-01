-- Script para configurar o modelo de assinatura Asaas
-- Modelo: 1 assinatura = 1 grupo
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela subscriptions já existe e tem a estrutura correta
-- Se não existir, criar conforme a especificação fornecida
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  plan_id uuid NULL,
  status character varying(20) NULL DEFAULT 'inactive'::character varying,
  start_date timestamp with time zone NULL DEFAULT now(),
  next_billing_date timestamp with time zone NOT NULL,
  asaas_subscription_id character varying(255) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_status_check CHECK (
    (status)::text = ANY (
      ARRAY[
        'active'::character varying,
        'inactive'::character varying,
        'overdue'::character varying,
        'cancelled'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- 2. Adicionar campo asaas_customer_id na tabela users se não existir
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255);

-- 3. Adicionar campo group_id na tabela subscriptions para vincular 1 assinatura = 1 grupo
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS group_id VARCHAR(255); -- ID do grupo do WhatsApp

-- 4. Verificar se existe apenas um plano (conforme requisito)
-- Primeiro, limpar planos existentes se houver múltiplos
DELETE FROM plans WHERE id NOT IN (
  SELECT id FROM plans LIMIT 1
);

-- Se não existe nenhum plano, criar o plano único
INSERT INTO plans (name, description, price, max_groups, features) 
SELECT 
  'Plano Básico',
  'Acesso a 1 grupo do WhatsApp com resumos automáticos',
  29.90,
  1,
  ARRAY['1 grupo', 'Resumos automáticos', 'Suporte técnico']
WHERE NOT EXISTS (SELECT 1 FROM plans);

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_asaas_customer ON users(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas ON subscriptions(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group ON subscriptions(group_id);

-- 6. Configurar RLS (Row Level Security) se não estiver configurado
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;

-- 8. Criar políticas RLS para subscriptions
-- Usuários podem ver suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Usuários podem criar suas próprias assinaturas
CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar suas próprias assinaturas
CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Admins podem ver todas as assinaturas
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 9. Criar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Criar função para verificar limite de grupos por usuário
CREATE OR REPLACE FUNCTION check_user_group_limit(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  active_subscriptions INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_subscriptions
  FROM subscriptions 
  WHERE user_id = user_uuid 
  AND status = 'active';
  
  RETURN active_subscriptions;
END;
$$ LANGUAGE plpgsql;

-- 11. Criar função para liberar grupo quando assinatura é cancelada
CREATE OR REPLACE FUNCTION handle_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a assinatura foi cancelada ou ficou inativa
  IF NEW.status IN ('cancelled', 'inactive', 'overdue') AND OLD.status = 'active' THEN
    -- Desativar grupo_selections relacionados a este grupo
    UPDATE group_selections 
    SET active = false
    WHERE group_id = NEW.group_id 
    AND user_id = NEW.user_id;
    
    -- Log da mudança
    RAISE NOTICE 'Grupo % foi desativado devido ao cancelamento da assinatura %', NEW.group_id, NEW.id;
  END IF;
  
  -- Se a assinatura foi ativada
  IF NEW.status = 'active' AND OLD.status IN ('inactive', 'overdue') THEN
    -- Reativar grupo_selections relacionados a este grupo
    UPDATE group_selections 
    SET active = true
    WHERE group_id = NEW.group_id 
    AND user_id = NEW.user_id;
    
    -- Log da mudança
    RAISE NOTICE 'Grupo % foi reativado devido à ativação da assinatura %', NEW.group_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Criar trigger para gerenciar status de grupos automaticamente
DROP TRIGGER IF EXISTS subscription_status_change_trigger ON subscriptions;
CREATE TRIGGER subscription_status_change_trigger
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_status_change();

-- 13. Verificar configuração
SELECT 'Configuração do modelo Asaas concluída!' as status;

-- Verificar plano único
SELECT 'Plano configurado:' as info, name, price, max_groups 
FROM plans;

-- Verificar estrutura da tabela subscriptions
SELECT 'Colunas da tabela subscriptions:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 'Políticas RLS configuradas:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'subscriptions';
