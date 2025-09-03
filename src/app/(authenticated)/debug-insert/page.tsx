'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'

export default function DebugInsertPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const insertTestSummary = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch('/api/debug/insert-test-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Sucesso',
          message: 'Resumo de teste inserido com sucesso!'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erro',
          message: data.error || 'Erro ao inserir resumo de teste'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setResult({ error: errorMessage })
      addToast({
        type: 'error',
        title: 'Erro',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Debug - Inserir Dados de Teste</h1>
        <p className="text-gray-600 mt-2">
          Esta página permite inserir dados de teste para verificar a funcionalidade
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inserir Resumo de Teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Usuário atual:</strong> {user?.id || 'Não autenticado'}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Email:</strong> {user?.email || 'Não disponível'}
            </p>
          </div>

          <Button
            onClick={insertTestSummary}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Inserindo...' : 'Inserir Resumo de Teste'}
          </Button>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Clique em &quot;Inserir Resumo de Teste&quot; para criar dados de teste</li>
            <li>Após inserir, acesse a página <code className="bg-gray-100 px-2 py-1 rounded">/summaries</code></li>
            <li>Verifique se o resumo aparece na lista</li>
            <li>Teste os filtros e funcionalidades da página</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
