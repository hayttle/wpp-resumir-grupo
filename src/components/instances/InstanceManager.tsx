'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Wifi, WifiOff, Smartphone, QrCode } from 'lucide-react'
import { InstanceService } from '@/lib/services'
import { useAuth } from '@/contexts/AuthContext'
import { Instance } from '@/types/database'
import { useInstanceStatus } from '@/hooks/useInstanceStatus'

export default function InstanceManager() {
  const { user } = useAuth()
  const { instance, loading, updatingStatus, updateInstanceStatus } = useInstanceStatus()
  const [connecting, setConnecting] = useState(false)
  const [creatingInstance, setCreatingInstance] = useState(false)



  // Verificação automática de status quando estiver conectando
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (instance?.status === 'connecting') {
      console.log('🔄 Iniciando verificação automática de status...')

      intervalId = setInterval(async () => {
        console.log('🔄 Verificação automática de status...')
        try {
          await updateInstanceStatus()
          if (instance && instance.status !== 'connecting') {
            console.log('🔄 Status mudou automaticamente:', instance.status)

            if (instance.status === 'open') {
              console.log('🎉 WhatsApp conectado automaticamente!')
            }
          }
        } catch (error) {
          console.error('❌ Erro na verificação automática:', error)
        }
      }, 5000) // Verificar a cada 5 segundos
    }

    return () => {
      if (intervalId) {
        console.log('🔄 Parando verificação automática de status...')
        clearInterval(intervalId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance?.status, updateInstanceStatus])



  const connectInstance = async () => {
    try {
      setConnecting(true)
      console.log('🔧 Conectando instância...')

      const updatedInstance = await InstanceService.connectInstance()
      // Recarregar a instância após conectar
      await updateInstanceStatus()

      console.log('✅ Instância conectada:', updatedInstance)
    } catch (error) {
      console.error('❌ Erro ao conectar instância:', error)
      alert('Erro ao conectar instância. Tente novamente.')
    } finally {
      setConnecting(false)
    }
  }

  const disconnectInstance = async () => {
    try {
      setConnecting(true)
      console.log('🔌 Desconectando instância...')

      const updatedInstance = await InstanceService.disconnectInstance()
      // Recarregar a instância após desconectar
      await updateInstanceStatus()

      console.log('✅ Instância desconectada:', updatedInstance)
    } catch (error) {
      console.error('❌ Erro ao desconectar instância:', error)
      alert('Erro ao desconectar instância. Tente novamente.')
    } finally {
      setConnecting(false)
    }
  }

  const createInstance = async () => {
    try {
      setCreatingInstance(true)
      console.log('🔧 Criando instância...')

      if (!user?.user_metadata?.name || !user?.user_metadata?.phone_number) {
        alert('Nome e telefone são necessários para criar a instância. Atualize seu perfil primeiro.')
        return
      }

      const instanceName = InstanceService.generateInstanceName(
        user.user_metadata.name,
        user.user_metadata.phone_number
      )

      const newInstance = await InstanceService.createInstance(
        user.id,
        instanceName,
        user.user_metadata.phone_number
      )

      if (newInstance) {
        // Recarregar a instância após criar
        await updateInstanceStatus()
        console.log('✅ Instância criada com sucesso:', newInstance)
      } else {
        alert('Erro ao criar instância. Tente novamente.')
      }
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error)
      alert('Erro ao criar instância. Tente novamente.')
    } finally {
      setCreatingInstance(false)
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Instância WhatsApp
            </CardTitle>
            <CardDescription>
              Você ainda não tem uma instância configurada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <Smartphone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma Instância Configurada</h3>
              <p className="text-muted-foreground mb-6">
                Para começar a usar o sistema de resumos automáticos, você precisa criar uma instância do WhatsApp.
              </p>

              {user?.user_metadata?.name && user?.user_metadata?.phone_number ? (
                <Button
                  onClick={createInstance}
                  disabled={creatingInstance}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-5 w-5" />
                  {creatingInstance ? 'Criando Instância...' : 'Criar Instância WhatsApp'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-amber-600">
                    ⚠️ Nome e telefone são necessários para criar a instância
                  </p>
                  <Button
                    onClick={() => window.location.href = '/dashboard'}
                    variant="outline"
                    size="lg"
                  >
                    Atualizar Perfil
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return { label: 'Conectado', icon: Wifi, color: 'bg-green-100 text-green-800' }
      case 'connecting':
        return { label: 'Conectando...', icon: RefreshCw, color: 'bg-yellow-100 text-yellow-800' }
      case 'close':
        return { label: 'Desconectado', icon: WifiOff, color: 'bg-red-100 text-red-800' }
      default:
        return { label: status, icon: Smartphone, color: 'bg-gray-100 text-gray-800' }
    }
  }

  const statusInfo = getStatusInfo(instance.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Instância WhatsApp
          </CardTitle>
          <CardDescription>
            Gerencie sua instância do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status e Informações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">Status</p>
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Instância</p>
              <p className="font-mono text-sm">{instance.instance_name}</p>
            </div>
          </div>

          {/* QR Code */}
          {instance.qr_code && instance.status === 'connecting' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Escaneie o QR Code com seu WhatsApp
              </p>
              <div className="inline-block border-2 border-dashed border-gray-300 rounded-lg p-2">
                <img
                  src={instance.qr_code}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 mx-auto"
                  onError={(e) => {
                    console.error('❌ Erro ao carregar imagem QR Code:', e)
                  }}
                />
              </div>
            </div>
          )}

          {/* WhatsApp Conectado */}
          {instance.status === 'open' && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-800">
                  <Wifi className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">WhatsApp Conectado!</p>
                    <p className="text-sm">Sua instância está funcionando perfeitamente.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3">
            {instance.status === 'open' ? (
              // Botão de Desconectar quando conectado
              <Button
                onClick={disconnectInstance}
                disabled={connecting}
                variant="destructive"
                className="flex items-center"
              >
                <WifiOff className={`h-4 w-4 mr-2 ${connecting ? 'animate-spin' : ''}`} />
                {connecting ? 'Desconectando...' : 'Desconectar WhatsApp'}
              </Button>
            ) : (
              // Botão de Conectar quando desconectado ou conectando
              <Button
                onClick={connectInstance}
                disabled={connecting}
                variant="outline"
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${connecting ? 'animate-spin' : ''}`} />
                {connecting ? 'Conectando...' : 'Conectar/Atualizar QR'}
              </Button>
            )}

            <Button
              onClick={updateInstanceStatus}
              disabled={updatingStatus}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updatingStatus ? 'animate-spin' : ''}`} />
              {updatingStatus ? 'Atualizando...' : 'Atualizar Status'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
