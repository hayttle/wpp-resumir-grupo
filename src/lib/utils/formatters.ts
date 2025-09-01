/**
 * Utilitários para formatação de dados
 */

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param dateString - String da data (aceita YYYY-MM-DD ou outros formatos)
 * @returns Data formatada no padrão brasileiro ou '-' se inválida
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  
  try {
    // Se a data já está no formato YYYY-MM-DD, formatar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Para outros formatos, usar conversão com timezone
    const date = new Date(dateString)
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '-'
    }
    
    // Usar Intl.DateTimeFormat para formatação com timezone
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    
    return formatter.format(date)
  } catch (error) {
    console.warn('Erro ao formatar data:', dateString, error)
    return '-'
  }
}

/**
 * Formata uma data para o formato YYYY-MM-DD para armazenamento no banco
 * @param dateInput - String da data ou objeto Date
 * @returns Data formatada no formato YYYY-MM-DD ou string vazia se inválida
 */
export const formatDateForDB = (dateInput: string | Date): string => {
  if (!dateInput) return ''
  
  try {
    const date = new Date(dateInput)
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return ''
    }
    
    // Extrair ano, mês e dia
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch (error) {
    console.warn('Erro ao formatar data para DB:', dateInput, error)
    return ''
  }
}

/**
 * Processa data do webhook Asaas para armazenamento no banco
 * @param asaasDateString - Data do Asaas (aceita YYYY-MM-DD ou DD/MM/YYYY)
 * @returns Data no formato YYYY-MM-DD para armazenamento no banco
 */
export const convertAsaasDateToUTC = (asaasDateString: string): string => {
  if (!asaasDateString) return ''
  
  try {
    // Verificar se é formato brasileiro (DD/MM/YYYY)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(asaasDateString)) {
      const [day, month, year] = asaasDateString.split('/')
      return `${year}-${month}-${day}`
    }
    
    // Verificar se é formato ISO (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(asaasDateString)) {
      return asaasDateString
    }
    
    console.warn('Formato de data não reconhecido do Asaas:', asaasDateString)
    return ''
    
  } catch (error) {
    console.warn('Erro ao processar data do Asaas:', asaasDateString, error)
    return ''
  }
}

/**
 * Formata uma data com hora para o formato brasileiro (DD/MM/YYYY HH:MM)
 * @param dateString - String da data
 * @returns Data e hora formatada no padrão brasileiro ou '-' se inválida
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-'
  
  try {
    // Criar objeto Date a partir da string
    const date = new Date(dateString)
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '-'
    }
    
    // Usar Intl.DateTimeFormat para formatação com timezone
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return formatter.format(date)
  } catch (error) {
    console.warn('Erro ao formatar data/hora:', dateString, error)
    return '-'
  }
}

/**
 * Formata um valor monetário para o formato brasileiro
 * @param value - Valor numérico
 * @param currency - Moeda (padrão: BRL)
 * @returns Valor formatado no padrão brasileiro
 */
export const formatCurrency = (value: number, currency: string = 'BRL'): string => {
  try {
    // Garantir que o valor seja tratado como número
    const numericValue = Number(value)
    
    if (isNaN(numericValue)) {
      return 'R$ 0,00'
    }
    
    // Tentar usar Intl.NumberFormat primeiro
    try {
      const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      
      const formatted = formatter.format(numericValue)
      
      // Verificar se a formatação está correta (deve ter vírgula)
      if (formatted.includes(',')) {
        return formatted
      }
    } catch (intlError) {
      console.warn('Intl.NumberFormat falhou, usando fallback manual:', intlError)
    }
    
    // Fallback manual para garantir formato brasileiro
    console.warn('Usando fallback manual para formatação de moeda')
    const formattedValue = numericValue.toFixed(2)
    const [integerPart, decimalPart] = formattedValue.split('.')
    
    // Adicionar separadores de milhares
    const integerWithSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    
    return `R$ ${integerWithSeparators},${decimalPart}`
    
  } catch (error) {
    console.warn('Erro ao formatar moeda:', value, error)
    // Fallback final para garantir formato brasileiro
    const numericValue = Number(value) || 0
    const formattedValue = numericValue.toFixed(2)
    const [integerPart, decimalPart] = formattedValue.split('.')
    return `R$ ${integerPart},${decimalPart}`
  }
}

/**
 * Função de teste para verificar formatação da moeda
 * @param value - Valor para testar
 * @returns Informações sobre a formatação
 */
export const testCurrencyFormatting = (value: number) => {
  const result = {
    input: value,
    inputType: typeof value,
    formatted: formatCurrency(value),
    locale: Intl.NumberFormat().resolvedOptions().locale,
    numberFormat: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  
  console.log('Teste de formatação de moeda:', result)
  return result
}

/**
 * Formata um número para o formato brasileiro
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns Número formatado no padrão brasileiro
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * Formata uma data considerando timezone específico
 * @param dateString - String da data
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @param format - Formato desejado ('date', 'datetime', 'time')
 * @returns Data formatada no padrão brasileiro ou '-' se inválida
 */
export const formatDateWithTimezone = (
  dateString: string, 
  timezone: string = 'America/Sao_Paulo',
  format: 'date' | 'datetime' | 'time' = 'date'
): string => {
  if (!dateString) return '-'
  
  try {
    // Criar objeto Date a partir da string
    const date = new Date(dateString)
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '-'
    }
    
    // Configurar opções de formatação baseadas no formato desejado
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone
    }
    
    switch (format) {
      case 'date':
        options.day = '2-digit'
        options.month = '2-digit'
        options.year = 'numeric'
        break
        
      case 'datetime':
        options.day = '2-digit'
        options.month = '2-digit'
        options.year = 'numeric'
        options.hour = '2-digit'
        options.minute = '2-digit'
        break
        
      case 'time':
        options.hour = '2-digit'
        options.minute = '2-digit'
        break
        
      default:
        return '-'
    }
    
    // Usar Intl.DateTimeFormat para formatação com timezone
    const formatter = new Intl.DateTimeFormat('pt-BR', options)
    return formatter.format(date)
    
  } catch (error) {
    console.warn('Erro ao formatar data com timezone:', dateString, error)
    return '-'
  }
}
