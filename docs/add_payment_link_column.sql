-- Script para adicionar coluna payment_link à tabela de assinaturas
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna payment_link para armazenar o link de pagamento do Asaas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_link VARCHAR(500);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_link ON subscriptions(payment_link);

-- Verificar se a coluna foi adicionada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name = 'payment_link';
