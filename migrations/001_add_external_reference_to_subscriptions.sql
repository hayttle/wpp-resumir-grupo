-- Migração: Adicionar campo external_reference na tabela subscriptions
-- Data: 2024-01-XX
-- Descrição: Adiciona campo para vincular assinatura com grupo via externalReference

-- Adicionar coluna external_reference na tabela subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS external_reference VARCHAR(255);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN subscriptions.external_reference IS 'Referência externa para vincular assinatura e grupo (formato: group_{groupId})';

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_reference 
ON subscriptions(external_reference);

-- Criar índice composto para consultas por usuário e external_reference
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_external_reference 
ON subscriptions(user_id, external_reference);
