-- Migração: Adicionar campo subscription_id na tabela group_selections
-- Data: 2024-01-XX
-- Descrição: Adiciona campo para vincular seleção de grupo com sua assinatura

-- Adicionar coluna subscription_id na tabela group_selections
ALTER TABLE group_selections 
ADD COLUMN IF NOT EXISTS subscription_id UUID;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN group_selections.subscription_id IS 'ID da assinatura vinculada ao grupo';

-- Criar chave estrangeira para garantir integridade referencial
ALTER TABLE group_selections 
ADD CONSTRAINT fk_group_selections_subscription_id 
FOREIGN KEY (subscription_id) 
REFERENCES subscriptions(id) 
ON DELETE CASCADE;

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_group_selections_subscription_id 
ON group_selections(subscription_id);

-- Criar índice composto para consultas por usuário e subscription_id
CREATE INDEX IF NOT EXISTS idx_group_selections_user_subscription_id 
ON group_selections(user_id, subscription_id);
