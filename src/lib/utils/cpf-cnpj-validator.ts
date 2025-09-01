// Utilitários para validação e formatação de CPF/CNPJ

/**
 * Remove caracteres não numéricos de uma string
 */
export function onlyNumbers(str: string): string {
  return str.replace(/\D/g, '')
}

/**
 * Formatar CPF (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const numbers = onlyNumbers(cpf)
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formatar CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
  const numbers = onlyNumbers(cnpj)
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Validar CPF
 */
export function isValidCPF(cpf: string): boolean {
  const numbers = onlyNumbers(cpf)
  
  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false
  
  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i)
  }
  let digit1 = 11 - (sum % 11)
  if (digit1 > 9) digit1 = 0
  
  if (parseInt(numbers[9]) !== digit1) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i)
  }
  let digit2 = 11 - (sum % 11)
  if (digit2 > 9) digit2 = 0
  
  return parseInt(numbers[10]) === digit2
}

/**
 * Validar CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const numbers = onlyNumbers(cnpj)
  
  // Verifica se tem 14 dígitos
  if (numbers.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i]
  }
  let digit1 = sum % 11
  digit1 = digit1 < 2 ? 0 : 11 - digit1
  
  if (parseInt(numbers[12]) !== digit1) return false
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i]
  }
  let digit2 = sum % 11
  digit2 = digit2 < 2 ? 0 : 11 - digit2
  
  return parseInt(numbers[13]) === digit2
}

/**
 * Detectar se é CPF ou CNPJ baseado no comprimento
 */
export function detectDocumentType(document: string): 'cpf' | 'cnpj' | 'invalid' {
  const numbers = onlyNumbers(document)
  
  if (numbers.length === 11) return 'cpf'
  if (numbers.length === 14) return 'cnpj'
  return 'invalid'
}

/**
 * Validar CPF ou CNPJ automaticamente
 */
export function isValidCPFOrCNPJ(document: string): boolean {
  const type = detectDocumentType(document)
  
  if (type === 'cpf') return isValidCPF(document)
  if (type === 'cnpj') return isValidCNPJ(document)
  return false
}

/**
 * Formatar CPF ou CNPJ automaticamente
 */
export function formatCPFOrCNPJ(document: string): string {
  const type = detectDocumentType(document)
  
  if (type === 'cpf') return formatCPF(document)
  if (type === 'cnpj') return formatCNPJ(document)
  return document
}

/**
 * Máscara de input que aceita CPF ou CNPJ
 */
export function applyCPFCNPJMask(value: string): string {
  const numbers = onlyNumbers(value)
  
  // Se tem até 11 dígitos, aplica máscara de CPF
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
  }
  
  // Se tem mais de 11 dígitos, aplica máscara de CNPJ
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
}
