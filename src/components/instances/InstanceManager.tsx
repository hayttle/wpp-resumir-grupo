'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, RefreshCw, Trash2, Wifi } from 'lucide-react'
import { useState, useEffect } from 'react'
import { InstanceService } from '@/lib/services'
import { useAuth } from '@/contexts/AuthContext'

export function InstanceManager() {
  const { user } = useAuth()
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserInstance()
    }
  }, [user])

  const loadUserInstance = async () => {
    try {
      setLoading(true)
      const instanceData = await InstanceService.getCurrentUserInstance()
      setInstance(instanceData)
    } catch (error) {
      console.error('Erro ao carregar instância:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectInstance = async () => {
    try {
      setConnecting(true)
      console.log('🔧 Conectando instância...')

      const updatedInstance = await InstanceService.connectInstance()
      setInstance(updatedInstance)

      console.log('✅ Instância conectada:', updatedInstance)
    } catch (error) {
      console.error('❌ Erro ao conectar instância:', error)
      alert('Erro ao conectar instância. Tente novamente.')
    } finally {
      setConnecting(false)
    }
  }

  const deleteInstance = async () => {
    // TODO: Implementar exclusão de instância
    console.log('🗑️ Excluir instância - implementar')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Carregando instância...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!instance) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma instância encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Você ainda não possui uma instância WhatsApp configurada.
            </p>
            <p className="text-sm text-gray-500">
              As instâncias são criadas automaticamente durante o cadastro.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Informações da Instância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wifi className="h-5 w-5 mr-2" />
            Instância WhatsApp
          </CardTitle>
          <CardDescription>
            Gerencie sua conexão WhatsApp e monitore o status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome da Instância</label>
              <p className="text-gray-900">{instance.instance_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <p className={`font-medium ${instance.status === 'open' ? 'text-green-600' :
                  instance.status === 'connecting' ? 'text-yellow-600' :
                    'text-red-600'
                }`}>
                {instance.status === 'open' ? 'Conectado' :
                  instance.status === 'connecting' ? 'Conectando' :
                    'Desconectado'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ID Evolution</label>
              <p className="text-gray-900 text-sm">{instance.evolution_instance_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Criada em</label>
              <p className="text-gray-900 text-sm">
                {new Date(instance.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              onClick={connectInstance}
              disabled={connecting}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${connecting ? 'animate-spin' : ''}`} />
              {connecting ? 'Conectando...' : 'Conectar/Atualizar QR'}
            </Button>

            <Button
              onClick={loadUserInstance}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Status
            </Button>

            <Button
              onClick={deleteInstance}
              variant="destructive"
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Instância
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code para Conexão */}
      {instance.qr_code && instance.status !== 'open' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              Conectar WhatsApp
            </CardTitle>
            <CardDescription>
              Escaneie este QR Code com o WhatsApp para conectar sua instância
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {/* Debug: Mostrar conteúdo do QR Code */}
              <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-left">
                <p><strong>Debug QR Code:</strong></p>
                <p><strong>Tipo:</strong> {typeof instance.qr_code}</p>
                <p><strong>Comprimento:</strong> {instance.qr_code?.length || 0}</p>
                <p><strong>Primeiros 100 chars:</strong> {instance.qr_code?.substring(0, 100)}...</p>
                <p><strong>É base64:</strong> {instance.qr_code?.startsWith('data:image') ? 'SIM' : 'NÃO'}</p>
              </div>

              <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                <img
                  src={instance.qr_code}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 mx-auto"
                  onError={(e) => {
                    console.error('❌ Erro ao carregar imagem QR Code:', e)
                    e.currentTarget.style.display = 'none'
                  }}
                  onLoad={() => console.log('✅ QR Code carregado com sucesso')}
                />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Abra o WhatsApp no seu celular → Menu → WhatsApp Web → Escaneie o código
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Conectado */}
      {instance.status === 'open' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                WhatsApp Conectado!
              </h3>
              <p className="text-green-700">
                Sua instância está conectada e funcionando perfeitamente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
