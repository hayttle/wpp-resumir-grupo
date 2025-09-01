# Guia de Logs - Integração Asaas

## Visão Geral

O sistema possui logs detalhados em todas as operações relacionadas ao Asaas para facilitar o debug e monitoramento. Os logs estão estruturados com emojis e timestamps para fácil identificação.

## Tipos de Logs

### 🚀 ASAAS REQUEST
Logs de requisições enviadas para a API do Asaas

```javascript
// Exemplo de log
🚀 [ASAAS REQUEST] POST https://api-sandbox.asaas.com/v3/customers
{
  timestamp: "2024-01-15T10:30:00.000Z",
  method: "POST",
  url: "https://api-sandbox.asaas.com/v3/customers",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "WppResumir/1.0",
    "access_token": "***HIDDEN***"
  },
  body: {
    name: "João Silva",
    email: "joao@exemplo.com",
    externalReference: "user-uuid-123"
  }
}
```

### 📥 ASAAS RESPONSE
Logs de respostas da API do Asaas

```javascript
📥 [ASAAS RESPONSE] 200 https://api-sandbox.asaas.com/v3/customers
{
  timestamp: "2024-01-15T10:30:01.000Z",
  status: 200,
  statusText: "OK",
  url: "https://api-sandbox.asaas.com/v3/customers",
  data: {
    object: "customer",
    id: "cus_000005492454",
    dateCreated: "2024-01-15",
    name: "João Silva",
    email: "joao@exemplo.com"
  }
}
```

### ❌ ASAAS ERROR
Logs de erros da API do Asaas

```javascript
❌ [ASAAS ERROR] 400 https://api-sandbox.asaas.com/v3/subscriptions
{
  timestamp: "2024-01-15T10:30:02.000Z",
  status: 400,
  error: {
    errors: [
      {
        code: "invalid_request",
        description: "Customer not found"
      }
    ]
  },
  url: "https://api-sandbox.asaas.com/v3/subscriptions"
}
```

### 🔔 WEBHOOK RECEIVED
Logs de webhooks recebidos do Asaas

```javascript
🔔 [WEBHOOK RECEIVED]
{
  timestamp: "2024-01-15T10:35:00.000Z",
  method: "POST",
  url: "https://meusite.com/api/webhooks/asaas",
  headers: {
    "content-type": "application/json",
    "user-agent": "Asaas-Webhook/1.0"
  },
  bodyRaw: '{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123"}}',
  bodyLength: 58
}
```

### 📋 WEBHOOK PARSED DATA
Dados parseados do webhook

```javascript
📋 [WEBHOOK PARSED DATA]
{
  timestamp: "2024-01-15T10:35:00.100Z",
  event: "PAYMENT_RECEIVED",
  dateCreated: "2024-01-15T10:35:00.000Z",
  fullPayload: {
    event: "PAYMENT_RECEIVED",
    dateCreated: "2024-01-15T10:35:00.000Z",
    payment: {
      id: "pay_123456789",
      customer: "cus_000005492454",
      subscription: "sub_987654321",
      value: 29.90,
      status: "RECEIVED"
    }
  }
}
```

### 💳 PAYMENT CONFIRMED
Logs de pagamentos confirmados

```javascript
💳 [PAYMENT CONFIRMED]
{
  timestamp: "2024-01-15T10:35:00.200Z",
  event: "PAYMENT_RECEIVED",
  paymentId: "pay_123456789",
  subscriptionId: "sub_987654321",
  value: 29.90,
  status: "RECEIVED"
}
```

### 📝 UPDATING SUBSCRIPTION STATUS
Logs de atualização de status de assinatura

```javascript
📝 [UPDATING SUBSCRIPTION STATUS]
{
  timestamp: "2024-01-15T10:35:00.300Z",
  subscriptionId: "uuid-local-subscription",
  groupId: "grupo_whatsapp_123",
  userId: "uuid-user",
  oldStatus: "inactive",
  newStatus: "active"
}
```

### ✅ SUBSCRIPTION ACTIVATED
Confirmação de ativação de assinatura

```javascript
✅ [SUBSCRIPTION ACTIVATED]
{
  timestamp: "2024-01-15T10:35:00.400Z",
  subscriptionId: "uuid-local-subscription",
  groupId: "grupo_whatsapp_123",
  userId: "uuid-user",
  message: "Pagamento confirmado e assinatura ativada"
}
```

## Logs por Fluxo

### Criação de Assinatura

1. **🚀 CREATE SUBSCRIPTION REQUEST** - Início da requisição
2. **👤 USER AUTHENTICATED** - Usuário autenticado
3. **📋 REQUEST BODY** - Dados da requisição
4. **🔍 CHECKING EXISTING ACCESS** - Verificando acesso existente
5. **✅ VALIDATION PASSED** - Validações passaram
6. **⚙️ CREATING SUBSCRIPTION** - Criando assinatura
7. **🚀 ASAAS REQUEST** - Criando customer/subscription no Asaas
8. **📥 ASAAS RESPONSE** - Resposta do Asaas
9. **🎉 SUBSCRIPTION CREATED SUCCESS** - Sucesso

### Processamento de Webhook

1. **🔔 WEBHOOK RECEIVED** - Webhook recebido
2. **📋 WEBHOOK PARSED DATA** - Dados parseados
3. **⚙️ WEBHOOK PROCESSING** - Iniciando processamento
4. **💳 PAYMENT CONFIRMED** - Pagamento confirmado (se aplicável)
5. **🔍 SEARCHING SUBSCRIPTION** - Buscando assinatura local
6. **📝 UPDATING SUBSCRIPTION STATUS** - Atualizando status
7. **✅ SUBSCRIPTION ACTIVATED** - Assinatura ativada
8. **✅ WEBHOOK SUCCESS** - Webhook processado com sucesso

## Como Usar os Logs

### Durante Desenvolvimento

Todos os logs aparecem no console do servidor. Para acompanhar:

```bash
# Se usando Next.js dev
npm run dev

# Ou verificar logs do servidor
tail -f /var/log/application.log
```

### Em Produção

Configure um sistema de logging como:

1. **Winston** para logs estruturados
2. **LogRocket** para debugging frontend
3. **DataDog** para monitoramento
4. **Sentry** para tracking de erros

### Filtrando Logs

Use grep para filtrar logs específicos:

```bash
# Apenas logs do Asaas
grep "ASAAS" application.log

# Apenas webhooks
grep "WEBHOOK" application.log

# Apenas erros
grep "❌\|💥" application.log

# Log específico de uma assinatura
grep "sub_987654321" application.log
```

## Estrutura dos Logs

Todos os logs seguem a estrutura:

```javascript
{
  timestamp: "ISO 8601 timestamp",
  level: "info|warn|error|debug",
  component: "ASAAS|WEBHOOK|SUBSCRIPTION",
  message: "Descrição da ação",
  // ... dados específicos
}
```

## Dados Sensíveis

Os seguintes dados são automaticamente mascarados nos logs:

- `access_token` → `***HIDDEN***`
- `authorization` → `***HIDDEN***`
- `password` → `***MASKED***`
- `number` (cartão) → `***MASKED***`
- `ccv` → `***MASKED***`

## Monitoramento Recomendado

### Alertas Importantes

Configure alertas para:

1. **Muitos erros de API** - `grep "❌ ASAAS ERROR"`
2. **Falhas de webhook** - `grep "💥 WEBHOOK ERROR"`
3. **Assinaturas não ativadas** - Assinaturas criadas mas não ativadas em 10 min
4. **Pagamentos pendentes** - Status `OVERDUE`

### Métricas para Dashboard

- Número de assinaturas criadas por hora
- Taxa de sucesso de webhooks
- Tempo médio de processamento
- Erros por endpoint da API Asaas

### Exemplo de Query para Análise

```javascript
// Contar sucessos vs erros por hora
const logs = await getLogs('last_24h')
const hourlyStats = logs.reduce((acc, log) => {
  const hour = log.timestamp.substring(0, 13) // YYYY-MM-DDTHH
  if (!acc[hour]) acc[hour] = { success: 0, error: 0 }
  
  if (log.message.includes('SUCCESS') || log.message.includes('✅')) {
    acc[hour].success++
  } else if (log.message.includes('ERROR') || log.message.includes('❌')) {
    acc[hour].error++
  }
  
  return acc
}, {})
```

## Debug Tips

### Problema: Webhook não está sendo processado

1. Verificar logs `🔔 WEBHOOK RECEIVED`
2. Verificar se JSON está válido
3. Verificar logs `📋 WEBHOOK PARSED DATA`
4. Verificar se evento é reconhecido

### Problema: Assinatura não ativa após pagamento

1. Verificar logs `💳 PAYMENT CONFIRMED`
2. Verificar se `subscriptionId` está correto
3. Verificar logs `🔍 SEARCHING SUBSCRIPTION`
4. Verificar se update foi bem-sucedido

### Problema: Erro na criação de assinatura

1. Verificar logs `🚀 ASAAS REQUEST`
2. Verificar response `📥 ASAAS RESPONSE`
3. Verificar se customer existe
4. Verificar dados do cartão (se aplicável)
