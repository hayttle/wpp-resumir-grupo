-- 🔧 CORREÇÃO CORRETA DA TABELA INSTANCES
-- Execute este arquivo no SQL Editor do Supabase

-- 1. PRIMEIRO: Verificar registros existentes e seus status
SELECT id, instance_name, status, qr_code, evolution_instance_id 
FROM instances;

-- 2. SEGUNDO: Atualizar TODOS os registros para usar status válidos
-- Converter status antigos para os novos valores da Evolution API
UPDATE instances 
SET status = CASE 
  WHEN status = 'disconnected' THEN 'close'
  WHEN status = 'connected' THEN 'open'
  WHEN status = 'error' THEN 'close'
  WHEN status = 'connecting' THEN 'connecting'
  ELSE 'close'  -- Para qualquer outro valor desconhecido
END;

-- 3. TERCEIRO: Verificar se a atualização funcionou
SELECT id, instance_name, status, qr_code, evolution_instance_id 
FROM instances;

-- 4. QUARTO: Agora sim, remover a constraint antiga
ALTER TABLE instances DROP CONSTRAINT IF EXISTS instances_status_check;

-- 5. QUINTO: Adicionar nova constraint com os status corretos
ALTER TABLE instances ADD CONSTRAINT instances_status_check 
  CHECK (status IN ('close', 'connecting', 'open'));

-- 6. SEXTO: Atualizar o valor padrão
ALTER TABLE instances ALTER COLUMN status SET DEFAULT 'close';

-- 7. SÉTIMO: Verificar a estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'instances' 
  AND column_name = 'status';

-- 8. OITAVO: Verificar a constraint criada
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'instances_status_check';

-- 9. NONO: Teste final - verificar se tudo está funcionando
SELECT id, instance_name, status, qr_code, evolution_instance_id 
FROM instances;
