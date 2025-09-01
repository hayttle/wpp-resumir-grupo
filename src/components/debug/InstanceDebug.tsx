'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InstanceService } from '@/lib/services/instanceService'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/lib/utils/formatters'

export function InstanceDebug() {
  const { user } = useAuth()
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [authTest, setAuthTest] = useState<any>(null)

  useEffect(() => {
    // Buscar instância do usuário atual
    if (user) {
      loadUserInstance()
    }
  }, [user])

  const loadUserInstance = async () => {
    if (!user) {
      console.log('🔧 InstanceDebug: loadUserInstance - usuário não encontrado')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userInstance = await InstanceService.getCurrentUserInstance()
      console.log('🔧 InstanceDebug: Instância carregada:', userInstance)

      setInstance(userInstance)

      if (!userInstance) {
        setError('Usuário não possui instância')
        setDebugInfo('Nenhuma instância encontrada no banco de dados')
      } else {
        setDebugInfo('Instância encontrada e carregada com sucesso')
      }
    } catch (err) {
      console.error('🔧 InstanceDebug: Erro ao carregar instância:', err)
      setError('Erro ao buscar instância')
      setDebugInfo(`Erro: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const createInstanceManually = async () => {
    if (!user) {
      console.log('🔧 InstanceDebug: createInstanceManually - usuário não encontrado')
      return
    }

    console.log('🔧 InstanceDebug: createInstanceManually iniciado')
    setLoading(true)
    setError(null)
    setDebugInfo('Iniciando criação de instância...')

    try {
      const firstName = user.user_metadata?.name?.split(' ')[0] || 'usuario'
      const phoneNumber = user.user_metadata?.phone_number || '11999999999'

      const instanceName = InstanceService.generateInstanceName(firstName, phoneNumber)

      console.log('🔧 InstanceDebug: Tentando criar instância:', {
        userId: user.id,
        instanceName,
        phoneNumber
      })

      setDebugInfo(`Criando instância: ${instanceName} para usuário ${user.id}`)

      const newInstance = await InstanceService.createInstance(
        user.id,
        instanceName,
        phoneNumber
      )

      if (newInstance) {
        setInstance(newInstance)
        console.log('✅ InstanceDebug: Instância criada com sucesso:', newInstance)
        setError(null)
        setDebugInfo('✅ Instância criada com sucesso!')
      } else {
        setError('Falha ao criar instância')
        setDebugInfo('❌ Falha ao criar instância - retornou null')
      }
    } catch (err) {
      console.error('❌ InstanceDebug: Erro detalhado:', err)
      setError('Erro ao criar instância')
      setDebugInfo(`❌ Erro: ${err}`)
    } finally {
      console.log('🔧 InstanceDebug: createInstanceManually finalizado')
      setLoading(false)
    }
  }

  const checkUserHasInstance = async () => {
    if (!user) {
      console.log('🔧 InstanceDebug: checkUserHasInstance - usuário não encontrado')
      return
    }

    console.log('🔧 InstanceDebug: checkUserHasInstance iniciado')
    setLoading(true)
    setError(null)

    try {
      const hasInstance = await InstanceService.userHasInstance(user.id)
      console.log('🔍 InstanceDebug: Usuário tem instância?', hasInstance)

      if (hasInstance) {
        setError('Usuário possui instância')
        setDebugInfo('✅ Usuário possui instância no banco de dados')
      } else {
        setError('Usuário NÃO possui instância')
        setDebugInfo('❌ Usuário NÃO possui instância no banco de dados')
      }
    } catch (err) {
      console.error('🔧 InstanceDebug: Erro ao verificar instância:', err)
      setError('Erro ao verificar instância')
      setDebugInfo(`❌ Erro: ${err}`)
    } finally {
      console.log('🔧 InstanceDebug: checkUserHasInstance finalizado')
      setLoading(false)
    }
  }

  const testAuth = async () => {
    console.log('🔧 InstanceDebug: Testando autenticação...')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/test-auth')
      const result = await response.json()

      console.log('🔧 InstanceDebug: Resultado do teste de auth:', result)
      setAuthTest(result)
      setDebugInfo('✅ Teste de autenticação concluído')
    } catch (err) {
      console.error('❌ InstanceDebug: Erro no teste de auth:', err)
      setError('Erro no teste de autenticação')
      setDebugInfo(`❌ Erro: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const resetLoading = () => {
    console.log('🔧 InstanceDebug: Resetando loading manualmente')
    setLoading(false)
    setError(null)
    setDebugInfo('Estado resetado manualmente')
  }

  if (!user) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Debug de Instâncias</CardTitle>
          <CardDescription className="text-red-600">
            Usuário não autenticado
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">Debug de Instâncias</CardTitle>
        <CardDescription className="text-blue-600">
          Ferramenta para verificar e testar a criação de instâncias
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do Usuário */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">👤 Usuário Atual:</h3>
          <div className="text-sm space-y-1">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Nome:</strong> {user.user_metadata?.name || 'N/A'}</p>
            <p><strong>Telefone:</strong> {user.user_metadata?.phone_number || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        </div>

        {/* Instância Atual */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">📱 Instância Atual:</h3>
          {loading ? (
            <p className="text-blue-600">Carregando...</p>
          ) : instance ? (
            <div className="text-sm space-y-1">
              <p><strong>ID:</strong> {instance.id}</p>
              <p><strong>Nome:</strong> {instance.instance_name}</p>
              <p><strong>Status:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${instance.status === 'open' ? 'bg-green-100 text-green-800' :
                  instance.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {instance.status}
                </span>
              </p>
              <p><strong>Evolution ID:</strong> {instance.evolution_instance_id}</p>
              <p><strong>Criada em:</strong> {formatDateTime(instance.created_at)}</p>

              {/* QR Code */}
              {instance.qr_code && (
                <div className="mt-3">
                  <p className="font-medium mb-2">🔐 QR Code para Conexão:</p>
                  <div className="bg-gray-50 p-3 rounded border">
                    <img
                      src={instance.qr_code}
                      alt="QR Code WhatsApp"
                      className="mx-auto max-w-48 h-auto"
                    />
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      Escaneie este QR Code com o WhatsApp para conectar
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-600">Nenhuma instância encontrada</p>
          )}
        </div>

        {/* Estado de Loading */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">⚙️ Estado do Sistema:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Loading:</strong> {loading ? '🔄 SIM' : '✅ NÃO'}</p>
            <p><strong>Usuário:</strong> {user ? '✅ Autenticado' : '❌ Não autenticado'}</p>
            <p><strong>Instância:</strong> {instance ? '✅ Carregada' : '❌ Não carregada'}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">⚡ Ações:</h3>
          <div className="space-y-2">
            <Button
              onClick={loadUserInstance}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              🔍 Recarregar Instância
            </Button>

            <Button
              onClick={checkUserHasInstance}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              🔍 Verificar se Usuário Tem Instância
            </Button>

            <Button
              onClick={createInstanceManually}
              disabled={loading}
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🚀 Criar Instância Manualmente
            </Button>

            <Button
              onClick={testAuth}
              disabled={loading}
              variant="outline"
              className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              🔐 Testar Autenticação
            </Button>

            <Button
              onClick={resetLoading}
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              🔄 Resetar Estado (Forçar)
            </Button>
          </div>
        </div>

        {/* Teste de Autenticação */}
        {authTest && (
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold mb-2 text-purple-800">🔐 Teste de Autenticação:</h3>
            <div className="text-sm space-y-1">
              <p><strong>Cookies:</strong> {authTest.cookies?.join(', ') || 'Nenhum'}</p>
              <p><strong>Usuário:</strong> {authTest.user || 'N/A'}</p>
              <p><strong>Sessão:</strong> {authTest.session || 'N/A'}</p>
              <p><strong>Erro Auth:</strong> {authTest.authError || 'Nenhum'}</p>
              <p><strong>Erro Sessão:</strong> {authTest.sessionError || 'Nenhum'}</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-800">📋 Info de Debug:</h3>
            <p className="text-blue-600 text-sm">{debugInfo}</p>
          </div>
        )}

        {/* Mensagens de Erro/Sucesso */}
        {error && (
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold mb-2 text-red-800">📢 Status:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

