-- Script para ajustar políticas RLS da tabela group_selections
-- Permite que admins vejam e gerenciem todos os grupos
-- Estrutura da tabela: id, user_id, instance_id, group_name, group_id, active, created_at, updated_at

-- 1. Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own groups" ON group_selections;
DROP POLICY IF EXISTS "Users can insert own groups" ON group_selections;
DROP POLICY IF EXISTS "Users can update own groups" ON group_selections;
DROP POLICY IF EXISTS "Users can delete own groups" ON group_selections;
DROP POLICY IF EXISTS "Allow authenticated users to view groups" ON group_selections;
DROP POLICY IF EXISTS "Allow users to insert groups" ON group_selections;
DROP POLICY IF EXISTS "Allow users to update groups" ON group_selections;
DROP POLICY IF EXISTS "Allow users to delete groups" ON group_selections;
DROP POLICY IF EXISTS "Users view own groups or admin views all" ON group_selections;
DROP POLICY IF EXISTS "Users insert own groups or admin inserts any" ON group_selections;
DROP POLICY IF EXISTS "Users update own groups or admin updates any" ON group_selections;
DROP POLICY IF EXISTS "Users delete own groups or admin deletes any" ON group_selections;

-- 2. Verificar se RLS está habilitado (deve estar)
ALTER TABLE group_selections ENABLE ROW LEVEL SECURITY;

-- 3. Criar novas políticas mais específicas

-- Política SELECT: Usuários podem ver seus próprios grupos OU admins podem ver todos
CREATE POLICY "Users view own groups or admin views all" ON group_selections
FOR SELECT
USING (
  auth.uid() = user_id OR 
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Política INSERT: Usuários podem inserir grupos para si mesmos OU admins podem inserir para qualquer um
CREATE POLICY "Users insert own groups or admin inserts any" ON group_selections
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Política UPDATE: Usuários podem atualizar seus próprios grupos OU admins podem atualizar qualquer um
CREATE POLICY "Users update own groups or admin updates any" ON group_selections
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  auth.uid() = user_id OR 
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Política DELETE: Usuários podem deletar seus próprios grupos OU admins podem deletar qualquer um
CREATE POLICY "Users delete own groups or admin deletes any" ON group_selections
FOR DELETE
USING (
  auth.uid() = user_id OR 
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- 4. Verificar se as políticas foram criadas corretamente
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
WHERE tablename IN ('group_selections', 'instances')
ORDER BY tablename, policyname;

-- 6. Verificar se as políticas da tabela instances permitem leitura para admins
-- (Necessário para o JOIN funcionar corretamente)
SELECT 'Verificando políticas da tabela instances...' as info;

-- Testar query que será usada pelo AdminGroupService
SELECT 'Testando query do AdminGroupService...' as info;
/*
-- Query de teste (descomente para testar):
SELECT 
  gs.id,
  gs.group_name,
  gs.group_id,
  gs.user_id,
  gs.instance_id,
  gs.active,
  gs.created_at,
  gs.updated_at,
  u.name as user_name,
  u.email as user_email,
  i.instance_name
FROM group_selections gs
LEFT JOIN users u ON gs.user_id = u.id
LEFT JOIN instances i ON gs.instance_id = i.id
ORDER BY gs.created_at DESC
LIMIT 5;
*/

-- 5. Comentários para documentação
COMMENT ON POLICY "Users view own groups or admin views all" ON group_selections 
IS 'Permite que usuários vejam seus próprios grupos ou admins vejam todos os grupos';

COMMENT ON POLICY "Users insert own groups or admin inserts any" ON group_selections 
IS 'Permite que usuários insiram grupos para si mesmos ou admins insiram para qualquer usuário';

COMMENT ON POLICY "Users update own groups or admin updates any" ON group_selections 
IS 'Permite que usuários atualizem seus próprios grupos ou admins atualizem qualquer grupo';

COMMENT ON POLICY "Users delete own groups or admin deletes any" ON group_selections 
IS 'Permite que usuários deletem seus próprios grupos ou admins deletem qualquer grupo';
