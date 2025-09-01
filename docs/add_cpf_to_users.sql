-- Adicionar campos CPF/CNPJ na tabela users
-- Este script adiciona os campos necessários para integração com Asaas

-- Adicionar colunas CPF/CNPJ na tabela users
ALTER TABLE public.users 
ADD COLUMN cpf_cnpj VARCHAR(18) NULL,
ADD COLUMN person_type VARCHAR(10) DEFAULT 'individual' CHECK (person_type IN ('individual', 'company'));

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.users.cpf_cnpj IS 'CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) do usuário - obrigatório para criar assinaturas no Asaas';
COMMENT ON COLUMN public.users.person_type IS 'Tipo de pessoa: individual (CPF) ou company (CNPJ)';

-- Adicionar índice para busca por CPF/CNPJ (útil para validações)
CREATE INDEX IF NOT EXISTS idx_users_cpf_cnpj ON public.users(cpf_cnpj);

-- Verificar a estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
