# 🔒 Atualização de Segurança - Variáveis de Ambiente

## 🚨 Problema Identificado

**CRÍTICO**: As variáveis de ambiente sensíveis estavam sendo expostas no client-side através de `NEXT_PUBLIC_`, incluindo:

- `NEXT_PUBLIC_EVOLUTION_API_KEY` - Chave da API Evolution
- `NEXT_PUBLIC_N8N_WEBHOOK_URL` - Webhook do n8n
- `NEXT_PUBLIC_EVOLUTION_API_URL` - URL da API Evolution

## ✅ Solução Implementada

### 1. **API Routes Server-Side**
- Criadas rotas `/api/instances` para operações sensíveis
- Todas as chamadas para Evolution API agora são feitas server-side
- Autenticação via cookies do Supabase

### 2. **Variáveis de Ambiente Corrigidas**
```bash
# ❌ ANTES (inseguro - client-side)
NEXT_PUBLIC_EVOLUTION_API_KEY=your_key
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_webhook

# ✅ AGORA (seguro - server-side)
EVOLUTION_API_KEY=your_key
N8N_WEBHOOK_URL=your_webhook
```

### 3. **InstanceService Atualizado**
- Remove acesso direto às variáveis sensíveis
- Usa API Routes para operações seguras
- Mantém funcionalidade, mas com segurança

## 🛡️ Arquitetura de Segurança

```
Client-Side (Browser)
    ↓
API Routes (/api/instances)
    ↓
Server-Side (process.env)
    ↓
Evolution API + Supabase
```

## 📁 Arquivos Modificados

### Criados:
- `src/app/api/instances/route.ts` - CRUD de instâncias
- `src/app/api/instances/check/route.ts` - Verificação de instância
- `docs/SECURITY_UPDATE.md` - Esta documentação

### Modificados:
- `src/lib/services/instanceService.ts` - Remove variáveis sensíveis
- `src/lib/config/env.ts` - Remove variáveis sensíveis
- `src/components/debug/InstanceDebug.tsx` - Remove variáveis sensíveis
- `env.example` - Atualiza para server-side

## 🔧 Como Usar

### 1. **Configurar .env.local**
```bash
# Server-side (seguro)
EVOLUTION_API_URL=https://evolution.hayttle.dev
EVOLUTION_API_KEY=your_actual_key
N8N_WEBHOOK_URL=your_actual_webhook

# Client-side (seguro)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. **Operações de Instância**
```typescript
// ✅ Seguro - via API Route
const instance = await InstanceService.createInstance(userId, name, phone)

// ✅ Seguro - via API Route
const hasInstance = await InstanceService.userHasInstance(userId)
```

## 🚀 Benefícios da Correção

1. **Segurança**: Chaves da API não são expostas no client-side
2. **Controle**: Todas as operações sensíveis passam pelo servidor
3. **Auditoria**: Logs server-side para todas as operações
4. **Escalabilidade**: Fácil de adicionar rate limiting e validações
5. **Manutenibilidade**: Código mais organizado e seguro

## ⚠️ Próximos Passos

1. **Atualizar .env.local** com as novas variáveis
2. **Testar criação de instâncias** via debug
3. **Implementar deleteInstance** via API Route
4. **Adicionar validações** adicionais nas API Routes
5. **Implementar rate limiting** para as APIs

## 🔍 Teste de Segurança

Para verificar se a correção funcionou:

1. Abra o DevTools (F12)
2. Vá para a aba Network
3. Tente criar uma instância
4. Verifique se as requisições vão para `/api/instances`
5. Confirme que não há variáveis sensíveis no client-side

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor
2. Confirme as variáveis de ambiente
3. Teste via debug de instâncias
4. Verifique a autenticação do usuário
