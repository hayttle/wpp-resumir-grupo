-- Script para verificar a estrutura da tabela group_selections
-- e garantir que ela está configurada corretamente para as operações admin

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'group_selections'
ORDER BY ordinal_position;

-- 2. Verificar se existe relacionamento com users
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='group_selections';

-- 3. Verificar dados existentes na tabela
SELECT 
    COUNT(*) as total_groups,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN active = true THEN 1 END) as active_groups,
    COUNT(CASE WHEN active = false THEN 1 END) as inactive_groups
FROM group_selections;

-- 4. Verificar alguns registros de exemplo (primeiros 5)
SELECT 
    gs.id,
    gs.name,
    gs.description,
    gs.user_id,
    u.name as user_name,
    u.email as user_email,
    gs.active,
    gs.created_at
FROM group_selections gs
LEFT JOIN users u ON gs.user_id = u.id
ORDER BY gs.created_at DESC
LIMIT 5;

-- 5. Verificar se há registros órfãos (grupos sem usuário válido)
SELECT 
    gs.id,
    gs.name,
    gs.user_id,
    'Usuário não encontrado' as issue
FROM group_selections gs
LEFT JOIN users u ON gs.user_id = u.id
WHERE u.id IS NULL;

-- 6. Verificar políticas RLS ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'group_selections'
ORDER BY cmd, policyname;
