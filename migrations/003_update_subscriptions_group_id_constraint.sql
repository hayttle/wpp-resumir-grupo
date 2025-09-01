-- Migração: Atualizar constraint do campo group_id na tabela subscriptions
-- Data: 2024-01-XX
-- Descrição: Torna o campo group_id obrigatório quando external_reference está presente

-- Primeiro, vamos verificar se existem registros órfãos
-- (subscriptions com group_id mas sem external_reference)
UPDATE subscriptions 
SET external_reference = 'group_' || group_id 
WHERE group_id IS NOT NULL 
AND external_reference IS NULL;

-- Agora vamos adicionar uma constraint para garantir que:
-- Se group_id está presente, external_reference também deve estar
-- E vice-versa
ALTER TABLE subscriptions 
ADD CONSTRAINT check_group_external_reference_consistency 
CHECK (
  (group_id IS NULL AND external_reference IS NULL) OR
  (group_id IS NOT NULL AND external_reference IS NOT NULL AND external_reference LIKE 'group_%')
);

-- Adicionar comentário para documentar a constraint
COMMENT ON CONSTRAINT check_group_external_reference_consistency ON subscriptions 
IS 'Garante que group_id e external_reference sejam consistentes entre si';
