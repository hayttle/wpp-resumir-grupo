-- Script para verificar se a coluna size foi adicionada corretamente
-- Execute este script no Supabase SQL Editor

-- Verificar se a coluna size existe na tabela group_selections
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'group_selections' 
AND column_name = 'size';

-- Verificar se há registros com size NULL
SELECT COUNT(*) as registros_com_size_null
FROM public.group_selections 
WHERE size IS NULL;

-- Verificar alguns registros para ver o valor atual do campo size
SELECT id, group_name, group_id, size, created_at
FROM public.group_selections 
ORDER BY created_at DESC 
LIMIT 5;
