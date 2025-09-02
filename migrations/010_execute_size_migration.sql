-- Script para executar a migração 009_add_size_to_group_selections.sql
-- Execute este script no Supabase SQL Editor

-- Adicionar campo size (número de membros) na tabela group_selections
ALTER TABLE public.group_selections 
ADD COLUMN IF NOT EXISTS size INTEGER DEFAULT 0;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.group_selections.size IS 'Número de membros do grupo WhatsApp';

-- Criar índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_group_selections_size ON public.group_selections USING btree (size);

-- Atualizar registros existentes com valor padrão (será atualizado quando os grupos forem recarregados)
UPDATE public.group_selections 
SET size = 0 
WHERE size IS NULL;

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'group_selections' 
AND column_name = 'size';
