-- Migração: Criar constraints de unicidade para evitar duplicatas
-- Data: 2024-01-XX
-- Descrição: Garante que cada grupo tenha apenas uma assinatura por usuário

-- Constraint para garantir que um usuário não pode ter múltiplas assinaturas para o mesmo grupo
ALTER TABLE subscriptions 
ADD CONSTRAINT unique_user_group_subscription 
UNIQUE (user_id, group_id);

-- Constraint para garantir que um usuário não pode ter múltiplas seleções para o mesmo grupo
ALTER TABLE group_selections 
ADD CONSTRAINT unique_user_group_selection 
UNIQUE (user_id, group_id);

-- Constraint para garantir que cada external_reference seja único
ALTER TABLE subscriptions 
ADD CONSTRAINT unique_external_reference 
UNIQUE (external_reference);

-- Adicionar comentários para documentar as constraints
COMMENT ON CONSTRAINT unique_user_group_subscription ON subscriptions 
IS 'Garante que cada usuário tenha apenas uma assinatura por grupo';

COMMENT ON CONSTRAINT unique_user_group_selection ON group_selections 
IS 'Garante que cada usuário tenha apenas uma seleção por grupo';

COMMENT ON CONSTRAINT unique_external_reference ON subscriptions 
IS 'Garante que cada external_reference seja único no sistema';
