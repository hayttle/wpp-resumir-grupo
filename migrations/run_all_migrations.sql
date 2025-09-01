-- Script consolidado para executar todas as migrações
-- Execute este arquivo para aplicar todas as mudanças de uma vez

-- =====================================================
-- MIGRAÇÃO 1: Adicionar external_reference
-- =====================================================

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

-- =====================================================
-- MIGRAÇÃO 2: Adicionar subscription_id
-- =====================================================

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

-- =====================================================
-- MIGRAÇÃO 3: Atualizar dados e constraints
-- =====================================================

-- Atualizar registros existentes para consistência
UPDATE subscriptions 
SET external_reference = 'group_' || group_id 
WHERE group_id IS NOT NULL 
AND external_reference IS NULL;

-- Adicionar constraint para garantir consistência
ALTER TABLE subscriptions 
ADD CONSTRAINT check_group_external_reference_consistency 
CHECK (
  (group_id IS NULL AND external_reference IS NULL) OR
  (group_id IS NOT NULL AND external_reference IS NOT NULL AND external_reference LIKE 'group_%')
);

-- Adicionar comentário para documentar a constraint
COMMENT ON CONSTRAINT check_group_external_reference_consistency ON subscriptions 
IS 'Garante que group_id e external_reference sejam consistentes entre si';

-- =====================================================
-- MIGRAÇÃO 4: Constraints de unicidade
-- =====================================================

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

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as colunas foram criadas
SELECT 
  'subscriptions.external_reference' as tabela_coluna,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'external_reference'
  ) THEN '✅ Criada' ELSE '❌ Não encontrada' END as status;

SELECT 
  'group_selections.subscription_id' as tabela_coluna,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_selections' AND column_name = 'subscription_id'
  ) THEN '✅ Criada' ELSE '❌ Não encontrada' END as status;

-- Verificar constraints
SELECT 
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('subscriptions', 'group_selections')
AND constraint_name IN (
  'check_group_external_reference_consistency',
  'unique_user_group_subscription',
  'unique_user_group_selection',
  'unique_external_reference',
  'fk_group_selections_subscription_id'
)
ORDER BY table_name, constraint_name;

-- Verificar índices
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename IN ('subscriptions', 'group_selections')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

SELECT '🎉 Migrações executadas com sucesso! Sistema de assinatura por grupo está pronto.' as resultado;
