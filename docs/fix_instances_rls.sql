-- Script para verificar e ajustar políticas RLS da tabela instances
-- Necessário para que o JOIN no AdminGroupService funcione corretamente

-- 1. Verificar políticas existentes da tabela instances
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'instances'
ORDER BY policyname;

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'instances';

-- 3. Se necessário, criar política para permitir que admins vejam todas as instâncias
-- (Descomente as linhas abaixo se houver erro no JOIN)

/*
-- Habilitar RLS se não estiver habilitado
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- Criar política para admins verem todas as instâncias
CREATE POLICY "Admin can view all instances" ON instances
FOR SELECT
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Criar política para usuários verem suas próprias instâncias
CREATE POLICY "Users can view own instances" ON instances
FOR SELECT
USING (auth.uid() = user_id);
*/

-- 4. Testar se a query do AdminGroupService funciona
-- (Execute esta query para verificar se há dados)
SELECT 
  'Teste de JOIN entre group_selections, users e instances' as info,
  COUNT(*) as total_groups,
  COUNT(DISTINCT gs.user_id) as unique_users,
  COUNT(DISTINCT gs.instance_id) as unique_instances
FROM group_selections gs
LEFT JOIN users u ON gs.user_id = u.id
LEFT JOIN instances i ON gs.instance_id = i.id;

-- 5. Mostrar algumas linhas de exemplo
SELECT 
  gs.id,
  gs.group_name,
  gs.group_id,
  u.name as user_name,
  i.instance_name,
  gs.active,
  gs.created_at
FROM group_selections gs
LEFT JOIN users u ON gs.user_id = u.id
LEFT JOIN instances i ON gs.instance_id = i.id
ORDER BY gs.created_at DESC
LIMIT 3;
