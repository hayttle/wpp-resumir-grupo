-- Remove a constraint que exige prefixo 'group_' no external_reference
-- Migration: 005_remove_group_prefix_constraint.sql

-- Remover a constraint existente
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS check_group_external_reference_consistency;

-- Adicionar uma nova constraint mais flexível (opcional)
-- ALTER TABLE subscriptions ADD CONSTRAINT check_external_reference_format 
-- CHECK (external_reference IS NULL OR external_reference ~ '^[a-f0-9-]{36}$' OR external_reference ~ '^group_[a-f0-9-]{36}$');
