-- Script para executar a migração da tabela summaries
-- Execute este script no Supabase SQL Editor

-- =====================================================
-- MIGRAÇÃO 6: Adicionar user_id na tabela summaries
-- =====================================================

-- Adicionar coluna user_id na tabela summaries
ALTER TABLE public.summaries 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON public.summaries(user_id);

-- Criar índice composto para consultas por usuário e grupo
CREATE INDEX IF NOT EXISTS idx_summaries_user_group ON public.summaries(user_id, group_selection_id);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.summaries.user_id IS 'ID do usuário que possui o resumo';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se a coluna foi criada
SELECT 
  'summaries.user_id' as tabela_coluna,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'summaries' 
    AND column_name = 'user_id'
  ) THEN '✅ Criada' ELSE '❌ Não encontrada' END as status;

-- Verificar índices criados
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename = 'summaries'
AND indexname LIKE 'idx_summaries_%'
ORDER BY indexname;

-- Verificar constraint de chave estrangeira
SELECT 
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'summaries'
AND constraint_type = 'FOREIGN KEY'
ORDER BY constraint_name;

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

SELECT '🎉 Migração da tabela summaries executada com sucesso! Coluna user_id adicionada.' as resultado;
