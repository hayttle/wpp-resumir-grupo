import { InstanceDebug } from '@/components/debug/InstanceDebug'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navigation } from '@/components/layout/Navigation'

export default function DebugInstancesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-whatsapp-background">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-whatsapp-text mb-2">
              🔧 Debug de Instâncias
            </h1>
            <p className="text-whatsapp-text-secondary">
              Ferramenta para verificar e testar a criação de instâncias
            </p>
          </div>

          <InstanceDebug />
        </div>
      </div>
    </ProtectedRoute>
  )
}
