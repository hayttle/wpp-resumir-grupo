-- 🔧 ATUALIZAÇÃO DA TABELA INSTANCES
-- Execute este arquivo no SQL Editor do Supabase para corrigir os status

-- 1. Atualizar a constraint de status para usar os valores corretos da Evolution API
ALTER TABLE instances DROP CONSTRAINT IF EXISTS instances_status_check;

-- 2. Adicionar nova constraint com os status corretos
ALTER TABLE instances ADD CONSTRAINT instances_status_check 
  CHECK (status IN ('close', 'connecting', 'open'));

-- 3. Atualizar o valor padrão
ALTER TABLE instances ALTER COLUMN status SET DEFAULT 'close';

-- 4. Atualizar registros existentes para usar o status correto
UPDATE instances 
SET status = 'close' 
WHERE status NOT IN ('close', 'connecting', 'open');

-- 5. Verificar a estrutura atualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  constraint_name,
  check_clause
FROM information_schema.columns c
LEFT JOIN information_schema.check_constraints cc 
  ON c.table_name = cc.table_name
WHERE c.table_name = 'instances' 
  AND c.column_name = 'status';

-- 6. Verificar registros existentes
SELECT id, instance_name, status, qr_code, evolution_instance_id 
FROM instances;
