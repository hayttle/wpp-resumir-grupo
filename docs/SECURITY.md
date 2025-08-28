# 🔒 Arquitetura de Segurança

## Visão Geral

Este projeto implementa uma arquitetura de segurança robusta que separa claramente as operações client-side (seguras para o usuário) das operações server-side (administrativas).

## 🏗️ Estrutura de Segurança

### 1. Cliente Supabase (`src/lib/supabase.ts`)
- **Propósito**: Operações do usuário atual
- **Acesso**: Client-side (browser)
- **Segurança**: Usa chave anônima pública
- **Limitações**: Apenas dados do usuário autenticado

### 2. Admin Supabase (`src/lib/supabase-admin.ts`)
- **Propósito**: Operações administrativas
- **Acesso**: Server-side apenas
- **Segurança**: Usa chave service role
- **Limitações**: NUNCA deve ser usado no cliente

## 📁 Serviços

### UserService (`src/lib/services/userService.ts`)
- ✅ **Operações Seguras**:
  - Buscar perfil do usuário atual
  - Atualizar perfil do usuário atual
  - Operações limitadas ao usuário autenticado

- ❌ **NÃO Inclui**:
  - Listar todos os usuários
  - Deletar usuários
  - Acessar dados de outros usuários

### AdminService (`src/lib/services/adminService.ts`)
- ✅ **Operações Administrativas**:
  - Listar todos os usuários
  - Criar/atualizar/deletar usuários
  - Estatísticas do sistema

- ⚠️ **Restrições**:
  - Só pode ser usado em Server Components
  - Só pode ser usado em API Routes
  - NUNCA deve ser importado em componentes client-side

## 🚫 O que NÃO fazer

```typescript
// ❌ ERRADO - Nunca importe AdminService no cliente
import { AdminService } from '@/lib/services/adminService'

// ❌ ERRADO - Nunca use supabaseAdmin no cliente
import { supabaseAdmin } from '@/lib/supabase-admin'

// ❌ ERRADO - Nunca exponha dados sensíveis no cliente
const allUsers = await AdminService.getAllUsers()
```

## ✅ O que fazer

```typescript
// ✅ CORRETO - Use UserService para operações do usuário atual
import { UserService } from '@/lib/services'

const profile = await UserService.getCurrentUserProfile()
const updated = await UserService.updateCurrentUserProfile(updates)

// ✅ CORRETO - Use AdminService apenas em API routes ou Server Components
// (arquivo: src/app/api/admin/users/route.ts)
import { AdminService } from '@/lib/services/adminService'

export async function GET() {
  const users = await AdminService.getAllUsers()
  return NextResponse.json({ users })
}
```

## 🔐 Proteção de Rotas

### API Routes
```typescript
export async function GET(request: NextRequest) {
  // TODO: Implementar verificação de autenticação
  // const { user } = await getAuthenticatedUser(request)
  // if (!user || user.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }
  
  const users = await AdminService.getAllUsers()
  return NextResponse.json({ users })
}
```

### Server Components
```typescript
// Este componente só executa no servidor
export default async function AdminDashboard() {
  const stats = await AdminService.getSystemStats()
  
  return (
    <div>
      <h1>Total de Usuários: {stats?.totalUsers}</h1>
    </div>
  )
}
```

## 🛡️ Políticas de Segurança

1. **Princípio do Menor Privilégio**: Usuários só acessam seus próprios dados
2. **Separação de Responsabilidades**: Cliente vs Admin claramente separados
3. **Validação Server-Side**: Todas as validações críticas no servidor
4. **Autenticação Obrigatória**: Todas as rotas admin requerem autenticação
5. **Auditoria**: Logs de todas as operações administrativas

## 🔍 Monitoramento

- Console logs para operações administrativas
- Tratamento de erros robusto
- Validação de permissões antes de operações sensíveis

## 📚 Recursos Adicionais

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
