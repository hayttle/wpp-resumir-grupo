# 🗄️ Configuração do Supabase

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Credenciais de acesso (URL e chaves)

## 🚀 Passos para Configuração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login e clique em "New Project"
3. Escolha sua organização
4. Digite o nome do projeto: `wpp-resumir-grupo`
5. Escolha uma senha forte para o banco
6. Escolha a região mais próxima
7. Clique em "Create new project"

### 2. Obter Credenciais

1. No projeto criado, vá para **Settings** > **API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env.local`
2. Preencha as variáveis com suas credenciais:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 4. Criar Tabelas no Supabase

Execute os seguintes comandos SQL no **SQL Editor** do Supabase:

#### Tabela `users`
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Tabela `plans`
```sql
CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  max_groups INTEGER NOT NULL,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Tabela `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'overdue', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  asaas_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Tabela `instances`
```sql
CREATE TABLE instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL,
  qr_code TEXT,
  status VARCHAR(20) DEFAULT 'close' CHECK (status IN ('close', 'connecting', 'open')),
  evolution_instance_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Tabela `group_selections`
```sql
CREATE TABLE group_selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  group_name VARCHAR(255) NOT NULL,
  group_id VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_group_selections_updated_at BEFORE UPDATE ON group_selections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Tabela `schedules`
```sql
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_selection_id UUID REFERENCES group_selections(id) ON DELETE CASCADE,
  send_time TIME NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Tabela `messages`
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_selection_id UUID REFERENCES group_selections(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela `summaries`
```sql
CREATE TABLE summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_selection_id UUID REFERENCES group_selections(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  date DATE NOT NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Configurar RLS (Row Level Security)

#### Habilitar RLS em todas as tabelas:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
```

#### Políticas para `users`:
```sql
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Usuários podem inserir seus próprios dados
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);
```

#### Políticas para `plans`:
```sql
-- Todos podem ver planos
CREATE POLICY "Anyone can view plans" ON plans
  FOR SELECT USING (true);
```

#### Políticas para `subscriptions`:
```sql
-- Usuários podem ver apenas suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Usuários podem inserir suas próprias assinaturas
CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
```

#### Políticas para `instances`:
```sql
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
```

#### Políticas para `group_selections`:
```sql
-- Usuários podem ver apenas suas próprias seleções de grupo
CREATE POLICY "Users can view own group selections" ON group_selections
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Usuários podem inserir suas próprias seleções de grupo
CREATE POLICY "Users can insert own group selections" ON group_selections
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Usuários podem atualizar suas próprias seleções de grupo
CREATE POLICY "Users can update own group selections" ON group_selections
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Usuários podem deletar suas próprias seleções de grupo
CREATE POLICY "Users can delete own group selections" ON group_selections
  FOR DELETE USING (auth.uid()::text = user_id::text);
```

### 6. Testar Conexão

1. Inicie o servidor: `npm run dev`
2. Abra o console do navegador
3. Verifique se não há erros de conexão
4. Teste as operações CRUD

## 🔧 Solução de Problemas

### Erro de Conexão
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo
- Verifique se as chaves têm as permissões corretas

### Erro de RLS
- Confirme se as políticas estão criadas corretamente
- Verifique se o RLS está habilitado nas tabelas
- Teste com usuário autenticado

### Erro de Tabela
- Execute os comandos SQL na ordem correta
- Verifique se não há conflitos de nomes
- Confirme se as foreign keys estão corretas

## 📚 Próximos Passos

Após configurar o Supabase:
1. Implementar autenticação
2. Criar páginas de usuário
3. Implementar gestão de planos
4. Integrar com Asaas
5. Configurar Evolution API

## 🆘 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [Discord Supabase](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
