# Guia de Integração com Asaas - Modelo 1 Assinatura = 1 Grupo

## Visão Geral

Este sistema implementa um modelo específico onde **cada assinatura dá direito a apenas 1 grupo**. O usuário pode contratar quantas assinaturas quiser para ter acesso a mais grupos.

### Modelo de Dados

- **1 assinatura = 1 grupo**
- **1 usuário = N assinaturas**
- **1 usuário = N grupos** (através de múltiplas assinaturas)

## Configuração

### 1. Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
# Asaas Payment Gateway (server-side - NÃO usar NEXT_PUBLIC_)
ASAAS_API_KEY=your_asaas_api_key
ASAAS_BASE_URL=https://api-sandbox.asaas.com
ASAAS_SANDBOX=true
```

### 2. Banco de Dados

Execute o script SQL no Supabase:

```bash
# Execute no SQL Editor do Supabase
docs/setup_asaas_subscription_model.sql
```

## APIs Disponíveis

### 1. Buscar Plano Único

```http
GET /api/plans
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "plan": {
    "id": "uuid",
    "name": "Plano Básico",
    "description": "Acesso a 1 grupo do WhatsApp",
    "price": 29.90,
    "max_groups": 1
  }
}
```

### 2. Criar Assinatura para um Grupo

```http
POST /api/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "groupId": "grupo_whatsapp_123",
  "billingType": "PIX", // ou "CREDIT_CARD", "BOLETO"
  "creditCardData": { // apenas para CREDIT_CARD
    "holderName": "João Silva",
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "ccv": "123"
  }
}
```

**Resposta:**
```json
{
  "message": "Assinatura criada com sucesso",
  "subscription": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_id": "uuid",
    "status": "inactive",
    "group_id": "grupo_whatsapp_123",
    "asaas_subscription_id": "asaas_id",
    "next_billing_date": "2024-02-01"
  },
  "paymentUrl": "https://asaas.com/pay/abc123"
}
```

### 3. Listar Assinaturas do Usuário

```http
GET /api/subscriptions
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "subscriptions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "plan_id": "uuid",
      "status": "active",
      "group_id": "grupo_whatsapp_123",
      "start_date": "2024-01-01",
      "next_billing_date": "2024-02-01",
      "plans": {
        "name": "Plano Básico",
        "price": 29.90
      }
    }
  ],
  "count": 1
}
```

### 4. Verificar Acesso a Grupo

```http
POST /api/subscriptions/access
Authorization: Bearer <token>
Content-Type: application/json

{
  "groupId": "grupo_whatsapp_123"
}
```

**Resposta:**
```json
{
  "hasAccess": true,
  "groupId": "grupo_whatsapp_123",
  "accessibleGroups": ["grupo_whatsapp_123", "grupo_whatsapp_456"],
  "totalActiveSubscriptions": 2
}
```

### 5. Listar Grupos Acessíveis

```http
GET /api/subscriptions/access
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "accessibleGroups": ["grupo_whatsapp_123", "grupo_whatsapp_456"],
  "activeSubscriptions": [
    {
      "id": "uuid",
      "group_id": "grupo_whatsapp_123",
      "status": "active"
    }
  ],
  "totalActiveSubscriptions": 2,
  "hasAnyAccess": true
}
```

### 6. Cancelar Assinatura

```http
PUT /api/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscriptionId": "uuid",
  "action": "cancel"
}
```

### 7. Sincronizar Assinaturas

```http
PUT /api/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscriptionId": "uuid",
  "action": "sync"
}
```

## Webhooks do Asaas

### Configuração

Configure no painel do Asaas o webhook para:
```
URL: https://seu-dominio.com/api/webhooks/asaas
```

### Eventos Processados

- `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED`: Ativa a assinatura
- `PAYMENT_OVERDUE`: Marca assinatura como em atraso
- `SUBSCRIPTION_UPDATED`: Sincroniza status
- `SUBSCRIPTION_DELETED`: Cancela assinatura

## Fluxo de Funcionamento

### 1. Criar Assinatura

1. Usuário seleciona um grupo
2. Sistema verifica se já tem assinatura ativa para este grupo
3. Cria customer no Asaas (se não existir)
4. Cria assinatura no Asaas
5. Salva assinatura no banco com status "inactive"
6. Retorna URL de pagamento

### 2. Confirmação de Pagamento

1. Asaas envia webhook `PAYMENT_RECEIVED`
2. Sistema atualiza status para "active"
3. Trigger do banco ativa group_selections relacionados

### 3. Cancelamento

1. Usuário cancela assinatura
2. Sistema cancela no Asaas
3. Atualiza status para "cancelled"
4. Trigger do banco desativa group_selections relacionados

## Funções Auxiliares no Banco

### Verificar Limite de Grupos

```sql
SELECT check_user_group_limit('user_uuid');
```

### Trigger Automático

O sistema possui trigger que automaticamente:
- Ativa grupos quando assinatura fica "active"
- Desativa grupos quando assinatura é cancelada/inativa

## Exemplos de Uso no Frontend

### Verificar se pode criar nova assinatura

```typescript
// Verificar acesso antes de permitir seleção
const checkGroupAccess = async (groupId: string) => {
  const response = await fetch('/api/subscriptions/access', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ groupId })
  })
  
  const data = await response.json()
  return data.hasAccess
}
```

### Criar assinatura

```typescript
const createSubscription = async (groupId: string) => {
  const response = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      groupId,
      billingType: 'PIX'
    })
  })
  
  const data = await response.json()
  
  if (data.paymentUrl) {
    // Redirecionar para pagamento
    window.open(data.paymentUrl, '_blank')
  }
}
```

### Listar grupos acessíveis

```typescript
const getUserGroups = async () => {
  const response = await fetch('/api/subscriptions/access', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  const data = await response.json()
  return data.accessibleGroups
}
```

## Segurança

- Todas as APIs exigem autenticação Bearer Token
- RLS configurado no Supabase
- Usuários só podem ver/modificar suas próprias assinaturas
- Admins têm acesso completo

## Monitoramento

### Logs importantes:

- Criação de assinaturas
- Webhooks recebidos
- Ativação/desativação de grupos
- Erros de sincronização

### Métricas sugeridas:

- Número de assinaturas ativas por usuário
- Taxa de conversão de pagamentos
- Grupos mais populares
- Churn rate por grupo
