-- Adicionar campo size (número de membros) na tabela group_selections
-- Migration: 009_add_size_to_group_selections.sql

-- Adicionar coluna size
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
