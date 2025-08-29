import InstanceManager from '@/components/instances/InstanceManager'

export default function InstancesPage() {
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gerenciar Instância WhatsApp
            </h1>
            <p className="text-gray-600">
              Gerencie sua instância WhatsApp, conecte dispositivos e monitore o status
            </p>
          </div>

          <InstanceManager />
        </div>
      </div>
    </div>
  )
}
