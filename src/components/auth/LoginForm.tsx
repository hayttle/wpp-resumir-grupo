'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { signIn, resetPassword, user } = useAuth()
  const router = useRouter()

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        setError(error.message)
      } else {
        setMessage('Login realizado com sucesso! Redirecionando...')

        // Aguardar 1 segundo para mostrar a mensagem de sucesso
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (err) {
      setError('Erro inesperado ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Digite seu email para redefinir a senha')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        setError(error.message)
      } else {
        setMessage('Email de redefinição enviado! Verifique sua caixa de entrada.')
      }
    } catch (err) {
      setError('Erro ao enviar email de redefinição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-whatsapp-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-whatsapp-background shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-whatsapp-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl text-white">🔐</span>
          </div>
          <CardTitle className="text-2xl text-whatsapp-text">Login</CardTitle>
          <CardDescription className="text-whatsapp-text-secondary">
            Acesse sua conta para continuar
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
              <label htmlFor="email" className="block text-sm font-medium text-whatsapp-text mb-2">
                Email
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
              <label htmlFor="password" className="block text-sm font-medium text-whatsapp-text mb-2">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                className="border-whatsapp-background"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-whatsapp-primary hover:bg-whatsapp-primary-dark"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="text-sm text-whatsapp-primary hover:text-whatsapp-primary-dark underline"
              >
                Esqueceu sua senha?
              </button>

              <div className="text-sm text-whatsapp-text-secondary">
                Não tem uma conta?{' '}
                <Link href="/auth/register" className="text-whatsapp-primary hover:text-whatsapp-primary-dark underline">
                  Cadastre-se
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
