-- 🔍 DEBUG: Análise completa da tabela users
-- Para identificar por que getAllUsers() não retorna todos os usuários

-- 1. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Contar total de registros na tabela
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_users,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role_users,
    COUNT(CASE WHEN role NOT IN ('admin', 'user') AND role IS NOT NULL THEN 1 END) as other_role_users
FROM users;

-- 3. Listar todos os usuários com detalhes
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    updated_at,
    phone_number
FROM users 
ORDER BY created_at DESC NULLS LAST;

-- 4. Verificar políticas RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- 6. Testar query sem autenticação (deve funcionar como superuser)
-- Esta é a mesma query que o Supabase executa
SELECT * FROM users ORDER BY id;

-- 7. Verificar se há triggers na tabela
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';
