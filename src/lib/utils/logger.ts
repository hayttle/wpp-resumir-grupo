// Utilitário para logs estruturados
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogData {
  [key: string]: any
}

export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString()
  }

  private static log(level: LogLevel, component: string, message: string, data?: LogData): void {
    const logEntry = {
      timestamp: this.formatTimestamp(),
      level,
      component,
      message,
      ...data
    }

    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛'
    }

    const logMessage = `${emoji[level]} [${component.toUpperCase()}] ${message}`

    switch (level) {
      case 'error':
        console.error(logMessage, logEntry)
        break
      case 'warn':
        console.warn(logMessage, logEntry)
        break
      case 'debug':
        console.debug(logMessage, logEntry)
        break
      default:
        console.log(logMessage, logEntry)
    }
  }

  // Logs específicos para ASAAS
  static asaas = {
    request: (method: string, url: string, data?: LogData) => {
      Logger.log('info', 'ASAAS-REQUEST', `${method} ${url}`, data)
    },
    response: (status: number, url: string, data?: LogData) => {
      Logger.log('info', 'ASAAS-RESPONSE', `${status} ${url}`, data)
    },
    error: (url: string, error: any, data?: LogData) => {
      Logger.log('error', 'ASAAS-ERROR', `Failed ${url}`, { error, ...data })
    }
  }

  // Logs específicos para WEBHOOK
  static webhook = {
    received: (event: string, data?: LogData) => {
      Logger.log('info', 'WEBHOOK-RECEIVED', `Event: ${event}`, data)
    },
    processing: (event: string, data?: LogData) => {
      Logger.log('info', 'WEBHOOK-PROCESSING', `Processing: ${event}`, data)
    },
    success: (event: string, data?: LogData) => {
      Logger.log('info', 'WEBHOOK-SUCCESS', `Completed: ${event}`, data)
    },
    error: (event: string, error: any, data?: LogData) => {
      Logger.log('error', 'WEBHOOK-ERROR', `Failed: ${event}`, { error, ...data })
    }
  }

  // Logs específicos para SUBSCRIPTION
  static subscription = {
    creating: (userId: string, groupId: string, data?: LogData) => {
      Logger.log('info', 'SUBSCRIPTION-CREATE', `User ${userId} subscribing to ${groupId}`, data)
    },
    created: (subscriptionId: string, data?: LogData) => {
      Logger.log('info', 'SUBSCRIPTION-CREATED', `Created: ${subscriptionId}`, data)
    },
    activated: (subscriptionId: string, data?: LogData) => {
      Logger.log('info', 'SUBSCRIPTION-ACTIVATED', `Activated: ${subscriptionId}`, data)
    },
    cancelled: (subscriptionId: string, data?: LogData) => {
      Logger.log('info', 'SUBSCRIPTION-CANCELLED', `Cancelled: ${subscriptionId}`, data)
    },
    error: (operation: string, error: any, data?: LogData) => {
      Logger.log('error', 'SUBSCRIPTION-ERROR', `${operation} failed`, { error, ...data })
    }
  }

  // Logs gerais
  static info(component: string, message: string, data?: LogData): void {
    Logger.log('info', component, message, data)
  }

  static warn(component: string, message: string, data?: LogData): void {
    Logger.log('warn', component, message, data)
  }

  static error(component: string, message: string, data?: LogData): void {
    Logger.log('error', component, message, data)
  }

  static debug(component: string, message: string, data?: LogData): void {
    Logger.log('debug', component, message, data)
  }
}

// Função helper para mascarar dados sensíveis
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sensitiveKeys = [
    'password', 'token', 'access_token', 'api_key', 'secret',
    'number', 'ccv', 'cvv', 'creditCard', 'authorization'
  ]

  const masked = { ...data }

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      masked[key] = '***MASKED***'
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key])
    }
  }

  return masked
}

// Função para extrair informações importantes de erro
export function extractErrorInfo(error: any): any {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5) // Apenas primeiras 5 linhas do stack
    }
  }

  return error
}
