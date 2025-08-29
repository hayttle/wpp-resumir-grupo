-- Adicionar coluna role na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Atualizar usuários existentes para ter role 'user' por padrão
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Criar índice para melhorar performance de consultas por role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Comentário na coluna
COMMENT ON COLUMN users.role IS 'Role do usuário: user, admin, moderator';
