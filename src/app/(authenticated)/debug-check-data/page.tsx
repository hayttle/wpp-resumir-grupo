'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'

export default function DebugCheckDataPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const checkSummariesData = async () => {
    try {
      setLoading(true)
      setData(null)

      const response = await fetch('/api/debug/check-summaries-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      setData(result)

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Sucesso',
          message: 'Dados verificados com sucesso!'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erro',
          message: result.error || 'Erro ao verificar dados'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setData({ error: errorMessage })
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
        <h1 className="text-3xl font-bold text-gray-900">Debug - Verificar Dados</h1>
        <p className="text-gray-600 mt-2">
          Esta página permite verificar os dados existentes na tabela summaries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificar Dados da Tabela Summaries</CardTitle>
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
            onClick={checkSummariesData}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Verificando...' : 'Verificar Dados'}
          </Button>

          {data && (
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold">Resultado da Verificação:</h3>

              {data.debug && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">Total de Resumos</h4>
                    <p className="text-2xl font-bold text-green-600">{data.debug.counts.allSummaries}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800">Resumos do Usuário</h4>
                    <p className="text-2xl font-bold text-blue-600">{data.debug.counts.userSummaries}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800">Resumos sem User ID</h4>
                    <p className="text-2xl font-bold text-yellow-600">{data.debug.counts.nullUserSummaries}</p>
                  </div>
                </div>
              )}

              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <strong className="text-green-800">✅ Total de Resumos:</strong> Mostra quantos resumos existem na tabela
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <strong className="text-blue-800">🔍 Resumos do Usuário:</strong> Resumos vinculados ao seu user_id
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <strong className="text-yellow-800">⚠️ Resumos sem User ID:</strong> Resumos que não têm user_id preenchido
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Possíveis Soluções:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Se há resumos sem user_id, precisamos atualizá-los</li>
              <li>Se há resumos com user_id diferente, precisamos verificar a vinculação</li>
              <li>Se não há resumos, a tabela está vazia</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
