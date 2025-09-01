# Utilitários de Formatação

Este módulo contém funções utilitárias para formatação de dados, especialmente datas com suporte a timezone.

## Funções de Data

### `formatDate(dateString: string): string`
Formata uma data para o formato brasileiro (DD/MM/YYYY).

```typescript
import { formatDate } from '@/lib/utils/formatters'

// Data no formato YYYY-MM-DD (formatação direta)
formatDate('2025-09-01') // Retorna: "01/09/2025"

// Data UTC do banco (conversão com timezone)
formatDate('2024-01-15T10:30:00Z') // Retorna: "15/01/2024"
```

**Nota**: Para datas no formato `YYYY-MM-DD`, a função faz formatação direta sem conversão de timezone. Para outros formatos, usa conversão com timezone `America/Sao_Paulo`.

### `formatDateTime(dateString: string): string`
Formata uma data com hora para o formato brasileiro (DD/MM/YYYY HH:MM) considerando o timezone `America/Sao_Paulo`.

```typescript
import { formatDateTime } from '@/lib/utils/formatters'

formatDateTime('2024-01-15T10:30:00Z') // Retorna: "15/01/2024 07:30"
```

### `formatDateWithTimezone(dateString: string, timezone?: string, format?: 'date' | 'datetime' | 'time'): string`
Formata uma data com timezone específico e formato personalizado.

```typescript
import { formatDateWithTimezone } from '@/lib/utils/formatters'

// Formato de data
formatDateWithTimezone('2024-01-15T10:30:00Z', 'America/Sao_Paulo', 'date')
// Retorna: "15/01/2024"

// Formato de data e hora
formatDateWithTimezone('2024-01-15T10:30:00Z', 'America/Sao_Paulo', 'datetime')
// Retorna: "15/01/2024 07:30"

// Formato de hora apenas
formatDateWithTimezone('2024-01-15T10:30:00Z', 'America/Sao_Paulo', 'time')
// Retorna: "07:30"

// Com outros timezones
formatDateWithTimezone('2024-01-15T10:30:00Z', 'UTC', 'datetime')
// Retorna: "15/01/2024 10:30"
```

### `formatDateForDB(dateInput: string | Date): string`
Formata uma data para o formato YYYY-MM-DD para armazenamento no banco de dados.

```typescript
import { formatDateForDB } from '@/lib/utils/formatters'

formatDateForDB(new Date()) // Retorna: "2024-01-15"
formatDateForDB('2024-01-15T10:30:00Z') // Retorna: "2024-01-15"
```

### `convertAsaasDateToUTC(asaasDateString: string): string`
Processa data do webhook Asaas para armazenamento no banco.

```typescript
import { convertAsaasDateToUTC } from '@/lib/utils/formatters'

// Data do webhook Asaas em formato brasileiro
convertAsaasDateToUTC('01/09/2025') // Retorna: "2025-09-01"

// Data do webhook Asaas em formato ISO
convertAsaasDateToUTC('2025-09-01') // Retorna: "2025-09-01"
```

**Nota**: A função aceita tanto datas no formato brasileiro (`DD/MM/YYYY`) quanto no formato ISO (`YYYY-MM-DD`) e sempre retorna no formato `YYYY-MM-DD` para armazenamento no banco.

## Funções de Formatação

### `formatCurrency(value: number, currency?: string): string`
Formata um valor monetário para o formato brasileiro.

```typescript
import { formatCurrency } from '@/lib/utils/formatters'

formatCurrency(59.90) // Retorna: "R$ 59,90"
formatCurrency(1000, 'USD') // Retorna: "$ 1.000,00"
```

### `formatNumber(value: number, decimals?: number): string`
Formata um número para o formato brasileiro.

```typescript
import { formatNumber } from '@/lib/utils/formatters'

formatNumber(1234.56) // Retorna: "1.234,56"
formatNumber(1234.56, 3) // Retorna: "1.234,560"
```

## Exemplo de Uso no Frontend

```typescript
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils/formatters'

// Em um componente React
function SubscriptionCard({ subscription }) {
  return (
    <div>
      <p>Início: {formatDate(subscription.start_date)}</p>
      <p>Próximo vencimento: {formatDate(subscription.next_billing_date)}</p>
      <p>Valor: {formatCurrency(subscription.value)}</p>
      <p>Criado em: {formatDateTime(subscription.created_at)}</p>
    </div>
  )
}
```

## Timezone

Todas as funções de data consideram o timezone `America/Sao_Paulo` por padrão, que é o timezone do Brasil. Isso significa que:

- Datas UTC do banco de dados são automaticamente convertidas para o horário de Brasília
- O horário de verão é automaticamente considerado quando aplicável
- As datas são exibidas no formato brasileiro (DD/MM/YYYY)

### Tratamento Especial para Webhooks Asaas

O Asaas pode enviar datas em diferentes formatos:
- **Formato brasileiro**: `DD/MM/YYYY` (ex: `01/09/2025`)
- **Formato ISO**: `YYYY-MM-DD` (ex: `2025-09-01`)

Para armazenar corretamente no banco:

- **`convertAsaasDateToUTC()`**: Converte qualquer formato para `YYYY-MM-DD` antes de salvar
- **`formatDate()`**: Exibe datas do banco no formato brasileiro (DD/MM/YYYY)
- **Resultado**: Datas são sempre armazenadas como `YYYY-MM-DD` e exibidas corretamente no formato brasileiro

## Compatibilidade

- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Node.js 14+
- ✅ React/Next.js
- ✅ TypeScript