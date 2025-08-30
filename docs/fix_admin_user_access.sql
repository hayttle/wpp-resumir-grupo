-- 🔧 CORREÇÃO DAS POLÍTICAS RLS PARA PERMITIR ACESSO ADMIN
-- Execute este arquivo no SQL Editor do Supabase

-- 1. Verificar políticas atuais da tabela users
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

-- 2. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view own data or admin can view all" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to view all users" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- 3. Criar políticas corretas sem recursão

-- Política para SELECT: usuários autenticados podem ver todos os usuários
CREATE POLICY "Authenticated users can view all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para INSERT: usuários podem inserir apenas seus próprios dados
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar próprios dados OU apenas admins podem atualizar outros
CREATE POLICY "Users update own data or admin updates any" ON users
  FOR UPDATE USING (
    auth.uid() = id OR 
    (
      SELECT role FROM users WHERE id = auth.uid()
    ) = 'admin'
  );

-- 4. Verificar se a política foi criada corretamente
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'SELECT';

-- 5. Testar a consulta como admin (substitua pelo ID do seu usuário admin)
-- SELECT * FROM users;
