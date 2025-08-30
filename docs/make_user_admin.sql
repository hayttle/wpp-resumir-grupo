-- Script para tornar um usuário admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários existentes
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at;

-- 2. Tornar um usuário específico admin (substitua o email pelo email do usuário)
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- 3. Verificar se foi atualizado
SELECT id, email, name, role, updated_at 
FROM users 
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- 4. Verificar todos os usuários admin
SELECT id, email, name, role, created_at 
FROM users 
WHERE role = 'admin';
