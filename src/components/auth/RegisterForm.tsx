'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { signUp } = useAuth()
  const router = useRouter()

  // Traduzir mensagens de erro do Supabase
  const translateError = (errorMessage: string): string => {
    const translations: { [key: string]: string } = {
      'Invalid login credentials': 'Credenciais de login inválidas',
      'Email not confirmed': 'Email não confirmado',
      'User not found': 'Usuário não encontrado',
      'Too many requests': 'Muitas tentativas. Tente novamente mais tarde',
      'Invalid email': 'Email inválido',
      'Password is too short': 'Senha muito curta',
      'Email already registered': 'Email já está cadastrado',
      'Weak password': 'Senha muito fraca',
      'User already registered': 'Usuário já está cadastrado'
    }

    return translations[errorMessage] || errorMessage
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password, {
        name,
        phone_number: phoneNumber || undefined
      })

      if (error) {
        setError(translateError(error.message))
      } else {
        setMessage('Cadastro realizado com sucesso! Redirecionando para login...')

        // Limpar formulário
        setName('')
        setEmail('')
        setPhoneNumber('')
        setPassword('')
        setConfirmPassword('')

        // Aguardar 2 segundos para mostrar a mensagem de sucesso
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (err) {
      setError('Erro inesperado ao fazer cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-whatsapp-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-whatsapp-background shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-whatsapp-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl text-white">📝</span>
          </div>
          <CardTitle className="text-2xl text-whatsapp-text">Cadastro</CardTitle>
          <CardDescription className="text-whatsapp-text-secondary">
            Crie sua conta para começar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-whatsapp-text mb-2">
                Nome Completo *
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
                className="border-whatsapp-background"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-whatsapp-text mb-2">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="border-whatsapp-background"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-whatsapp-text mb-2">
                Telefone (opcional)
              </label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(11) 99999-9999"
                className="border-whatsapp-background"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-whatsapp-text mb-2">
                Senha *
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="border-whatsapp-background"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-whatsapp-text mb-2">
                Confirmar Senha *
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                required
                className="border-whatsapp-background"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-whatsapp-primary hover:bg-whatsapp-primary-dark"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <div className="text-center">
              <div className="text-sm text-whatsapp-text-secondary">
                Já tem uma conta?{' '}
                <Link href="/auth/login" className="text-whatsapp-primary hover:text-whatsapp-primary-dark underline">
                  Faça login
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
