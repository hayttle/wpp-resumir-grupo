# Migrações do Banco de Dados

Este diretório contém as migrações necessárias para implementar o sistema de assinatura por grupo.

## Ordem de Execução

Execute as migrações na seguinte ordem:

### 1. `001_add_external_reference_to_subscriptions.sql`
- Adiciona campo `external_reference` na tabela `subscriptions`
- Cria índices para melhor performance
- **Impacto**: Baixo - apenas adiciona nova coluna

### 2. `002_add_subscription_id_to_group_selections.sql`
- Adiciona campo `subscription_id` na tabela `group_selections`
- Cria chave estrangeira para integridade referencial
- **Impacto**: Baixo - apenas adiciona nova coluna

### 3. `003_update_subscriptions_group_id_constraint.sql`
- Atualiza dados existentes para consistência
- Adiciona constraint para garantir consistência entre `group_id` e `external_reference`
- **Impacto**: Médio - pode atualizar dados existentes

### 4. `004_create_unique_constraints.sql`
- Cria constraints de unicidade para evitar duplicatas
- **Impacto**: Médio - pode falhar se houver dados duplicados

## Como Executar

### Via Supabase Dashboard:
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute cada arquivo na ordem numerada
4. Verifique se não há erros

### Via CLI (se configurado):
```bash
# Execute cada migração na ordem
psql -h your-host -U your-user -d your-database -f migrations/001_add_external_reference_to_subscriptions.sql
psql -h your-host -U your-user -d your-database -f migrations/002_add_subscription_id_to_group_selections.sql
psql -h your-host -U your-user -d your-database -f migrations/003_update_subscriptions_group_id_constraint.sql
psql -h your-host -U your-user -d your-database -f migrations/004_create_unique_constraints.sql
```

## Verificação Pós-Migração

Após executar todas as migrações, verifique se:

1. **Campo `external_reference` existe em `subscriptions`**:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'subscriptions' AND column_name = 'external_reference';
   ```

2. **Campo `subscription_id` existe em `group_selections`**:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'group_selections' AND column_name = 'subscription_id';
   ```

3. **Constraints foram criadas**:
   ```sql
   SELECT constraint_name, constraint_type 
   FROM information_schema.table_constraints 
   WHERE table_name IN ('subscriptions', 'group_selections')
   AND constraint_name LIKE '%group%' OR constraint_name LIKE '%external%';
   ```

## Rollback (se necessário)

Se precisar reverter as mudanças:

```sql
-- Remover constraints
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS check_group_external_reference_consistency;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS unique_user_group_subscription;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS unique_external_reference;
ALTER TABLE group_selections DROP CONSTRAINT IF EXISTS unique_user_group_selection;
ALTER TABLE group_selections DROP CONSTRAINT IF EXISTS fk_group_selections_subscription_id;

-- Remover colunas
ALTER TABLE subscriptions DROP COLUMN IF EXISTS external_reference;
ALTER TABLE group_selections DROP COLUMN IF EXISTS subscription_id;

-- Remover índices
DROP INDEX IF EXISTS idx_subscriptions_external_reference;
DROP INDEX IF EXISTS idx_subscriptions_user_external_reference;
DROP INDEX IF EXISTS idx_group_selections_subscription_id;
DROP INDEX IF EXISTS idx_group_selections_user_subscription_id;
```

## Notas Importantes

- ⚠️ **Backup**: Sempre faça backup do banco antes de executar migrações
- 🔄 **Ordem**: Execute as migrações na ordem numerada
- ✅ **Teste**: Teste em ambiente de desenvolvimento primeiro
- 📊 **Dados**: As migrações são seguras para dados existentes
