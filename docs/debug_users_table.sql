-- Script para debugar a tabela users
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Verificar todos os usuários com suas roles
SELECT 
  id, 
  email, 
  name, 
  role, 
  created_at, 
  updated_at,
  LENGTH(role) as role_length,
  ASCII(SUBSTRING(role, 1, 1)) as first_char_ascii
FROM users 
ORDER BY created_at;

-- 3. Verificar se há usuários com role NULL
SELECT COUNT(*) as users_with_null_role
FROM users 
WHERE role IS NULL;

-- 4. Verificar se há usuários com role vazio
SELECT COUNT(*) as users_with_empty_role
FROM users 
WHERE role = '';

-- 5. Verificar se há usuários com role diferente de 'user' ou 'admin'
SELECT 
  role, 
  COUNT(*) as count
FROM users 
GROUP BY role;

-- 6. Verificar constraints da tabela
SELECT 
  constraint_name, 
  constraint_type, 
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%users%';
