'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function DebugLayoutPage() {
  const { user, loading, error } = useAuth()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Layout</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">AuthContext Status:</h2>
          <p>Loading: {loading ? 'Sim' : 'Não'}</p>
          <p>User: {user ? 'Autenticado' : 'Não autenticado'}</p>
          <p>User ID: {user?.id || 'N/A'}</p>
          <p>Error: {error || 'Nenhum'}</p>
        </div>
      </div>
    </div>
  )
}
