-- Verificar e corrigir políticas RLS da tabela instances
-- Este script resolve o erro 406 (Not Acceptable) nas consultas

-- 1. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'instances';

-- 2. Listar políticas atuais
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
WHERE tablename = 'instances';

-- 3. Remover políticas problemáticas se existirem
DROP POLICY IF EXISTS "Users can view own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can insert own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can update own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can delete own instances" ON public.instances;

-- 4. Criar políticas corretas para instances
CREATE POLICY "Users can view own instances" ON public.instances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instances" ON public.instances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instances" ON public.instances
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instances" ON public.instances
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Garantir que RLS está habilitado
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;

-- 6. Verificar resultado
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'instances'
ORDER BY policyname;
