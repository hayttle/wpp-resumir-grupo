-- 🔧 CORREÇÃO DAS POLÍTICAS RLS PARA TABELA INSTANCES
-- Execute este arquivo no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'instances';

-- 2. Habilitar RLS se não estiver
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas se existirem (opcional)
DROP POLICY IF EXISTS "Users can view own instances" ON instances;
DROP POLICY IF EXISTS "Users can insert own instances" ON instances;
DROP POLICY IF EXISTS "Users can update own instances" ON instances;
DROP POLICY IF EXISTS "Users can delete own instances" ON instances;

-- 4. Criar políticas corretas
-- Usuários podem ver apenas suas próprias instâncias
CREATE POLICY "Users can view own instances" ON instances
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Usuários podem inserir suas próprias instâncias
CREATE POLICY "Users can insert own instances" ON instances
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Usuários podem atualizar suas próprias instâncias
CREATE POLICY "Users can update own instances" ON instances
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Usuários podem deletar suas próprias instâncias
CREATE POLICY "Users can delete own instances" ON instances
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 5. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'instances';

-- 6. Testar com usuário autenticado (opcional)
-- SELECT * FROM instances WHERE user_id = auth.uid()::text;
