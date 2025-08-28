'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Wifi, WifiOff, Smartphone, QrCode } from 'lucide-react'
import { InstanceService } from '@/lib/services'
import { useAuth } from '@/contexts/AuthContext'
import { Instance } from '@/types/database'

export default function InstanceManager() {
  const { user } = useAuth()
  const [instance, setInstance] = useState<Instance | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserInstance()
    }
  }, [user])

  // Verificação automática de status quando estiver conectando
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    if (instance?.status === 'connecting') {
      console.log('🔄 Iniciando verificação automática de status...')
      
      intervalId = setInterval(async () => {
        console.log('🔄 Verificação automática de status...')
        try {
          const updatedInstance = await InstanceService.updateInstanceStatus()
          if (updatedInstance && updatedInstance.status !== 'connecting') {
            console.log('🔄 Status mudou automaticamente:', updatedInstance.status)
            setInstance(updatedInstance)
            
            if (updatedInstance.status === 'open') {
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
  }, [instance?.status])

  const loadUserInstance = async () => {
    try {
      setLoading(true)
      const userInstance = await InstanceService.getCurrentUserInstance()
      setInstance(userInstance)
    } catch (error) {
      console.error('❌ Erro ao carregar instância:', error)
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

  const updateInstanceStatus = async () => {
    try {
      setUpdatingStatus(true)
      console.log('🔍 Atualizando status da instância...')
      console.log('🔍 Status atual:', instance?.status)
      
      const updatedInstance = await InstanceService.updateInstanceStatus()
      console.log('🔍 Instância retornada da API:', updatedInstance)
      
      if (updatedInstance) {
        setInstance(updatedInstance)
        console.log('✅ Status atualizado no frontend:', updatedInstance.status)
        
        // Verificar se o status mudou
        if (instance && instance.status !== updatedInstance.status) {
          console.log('🔄 Status mudou de', instance.status, 'para', updatedInstance.status)
          
          if (updatedInstance.status === 'open') {
            console.log('🎉 WhatsApp conectado com sucesso!')
          } else if (updatedInstance.status === 'close') {
            console.log('⚠️ WhatsApp desconectado')
          } else if (updatedInstance.status === 'connecting') {
            console.log('⏳ WhatsApp ainda está conectando...')
          }
        } else {
          console.log('ℹ️ Status não mudou:', updatedInstance.status)
        }
      } else {
        console.log('⚠️ Nenhuma instância retornada da API')
      }
      
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      alert('Erro ao atualizar status. Tente novamente.')
    } finally {
      setUpdatingStatus(false)
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
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Instância WhatsApp</CardTitle>
          <CardDescription>
            Nenhuma instância encontrada. Crie uma instância primeiro.
          </CardDescription>
        </CardHeader>
      </Card>
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
