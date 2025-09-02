'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const [apiTest, setApiTest] = useState<any>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('/api/summaries')
        const data = await response.json()
        setApiTest({ status: response.status, data })
      } catch (error) {
        setApiTest({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    if (!loading && user) {
      testAPI()
    }
  }, [user, loading])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Status da Autenticação:</h2>
          <p>Loading: {loading ? 'Sim' : 'Não'}</p>
          <p>User ID: {user?.id || 'Não autenticado'}</p>
          <p>User Email: {user?.email || 'Não disponível'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Teste da API:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
